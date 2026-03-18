"""
Workflow Execution Engine
=========================
Executes a workflow by traversing its steps in sequence, evaluating
rules against the input data, and logging every step's outcome.

Execution loop
--------------
1. Load the Execution record (with its Workflow).
2. Resolve the starting step → workflow.start_step_id, or fallback to
   the step with the lowest `order` value.
3. For each step:
   a. Load the step and its rules (sorted by priority ASC).
   b. Evaluate each rule's condition against execution.data.
      - "DEFAULT" always matches.
      - First match wins (priority order).
   c. Record evaluated_rules, selected_next_step, status in the log.
   d. Advance execution.current_step_id = rule.next_step_id.
   e. If next_step_id is None → workflow is done (status = completed).
4. Commit after every step so partial progress is visible.
"""

import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.step import Step
from app.models.execution import Execution, ExecutionStatus
from app.models.execution_log import ExecutionLog
from app.workflow_engine.evaluator import safe_eval_condition

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────

async def start_execution(db: AsyncSession, execution_id) -> Execution:
    """
    Start or resume a workflow execution.
    Called from a background asyncio task so it owns its own session lifecycle.
    """
    # Load execution + its parent workflow in one query
    exec_stmt = (
        select(Execution)
        .options(selectinload(Execution.workflow))
        .where(Execution.id == execution_id)
    )
    result = await db.execute(exec_stmt)
    execution = result.scalar_one_or_none()

    if not execution:
        logger.error(f"Execution {execution_id} not found — aborting.")
        return None

    # Only process pending or previously-failed executions
    if execution.status not in (ExecutionStatus.pending, ExecutionStatus.failed):
        logger.info(f"Execution {execution_id} is already {execution.status} — skipping.")
        return execution

    workflow = execution.workflow

    # ── Resolve start step ───────────────────────────────────────────────
    if execution.status == ExecutionStatus.pending:
        execution.status = ExecutionStatus.in_progress

        start_step_id = workflow.start_step_id

        if not start_step_id:
            # Fallback: pick the step with the smallest `order` value
            fallback = await db.execute(
                select(Step.id)
                .where(Step.workflow_id == workflow.id)
                .order_by(Step.order.asc())
                .limit(1)
            )
            start_step_id = fallback.scalar()

        if not start_step_id:
            # Workflow has no steps at all
            execution.status = ExecutionStatus.failed
            execution.ended_at = _now()
            await _log(db, execution.id, None, {
                "error": "Workflow has no steps",
                "status": "failed",
                "started_at": _now_iso(),
                "ended_at": _now_iso(),
            })
            await db.commit()
            return execution

        execution.current_step_id = start_step_id
        await db.commit()

    # ── Step traversal loop ──────────────────────────────────────────────
    max_iterations = 500   # safety cap to prevent infinite loops
    iteration = 0

    while (
        execution.current_step_id is not None
        and execution.status == ExecutionStatus.in_progress
        and iteration < max_iterations
    ):
        iteration += 1
        await _execute_step(db, execution)

    if iteration >= max_iterations:
        execution.status = ExecutionStatus.failed
        execution.ended_at = _now()
        await db.commit()
        logger.error(f"Execution {execution_id} hit the iteration cap — possible infinite loop.")

    return execution


# ─────────────────────────────────────────────
# Single-step execution
# ─────────────────────────────────────────────

async def _execute_step(db: AsyncSession, execution: Execution) -> None:
    """Execute one step and advance the execution pointer."""
    step_id = execution.current_step_id
    started_at = _now()

    # Load step WITH its rules eagerly
    step_result = await db.execute(
        select(Step)
        .options(selectinload(Step.rules))
        .where(Step.id == step_id)
    )
    step = step_result.scalar_one_or_none()

    if not step:
        execution.status = ExecutionStatus.failed
        execution.ended_at = _now()
        await _log(db, execution.id, step_id, {
            "error": f"Step {step_id} not found",
            "status": "failed",
            "started_at": started_at.isoformat(),
            "ended_at": _now_iso(),
        })
        await db.commit()
        return

    log_data: dict = {
        "step_name": step.name,
        "step_type": step.step_type.value if hasattr(step.step_type, "value") else str(step.step_type),
        "evaluated_rules": [],
        "selected_next_step": None,
        "selected_rule_condition": None,
        "status": "in_progress",
        "error_message": None,
        "started_at": started_at.isoformat(),
        "ended_at": None,
    }

    try:
        # ── Step-type pre-processing ─────────────────────────────────
        # For 'task'         → execute immediately, evaluate rules.
        # For 'notification' → execute immediately, evaluate rules.
        # For 'approval'     → in a real system this would PAUSE and wait
        #                      for external input. Here we auto-approve by
        #                      evaluating rules against current data.
        logger.info(
            f"[{execution.id}] Executing step '{step.name}' (type={step.step_type.value})"
        )

        # ── Rule evaluation (priority ASC, first match wins) ─────────
        rules = sorted(step.rules, key=lambda r: r.priority)

        next_step_id: Optional[UUID] = None
        rule_matched = False

        for rule in rules:
            condition = rule.condition.strip()
            is_default = condition.upper() == "DEFAULT"

            if is_default:
                is_match = True
            else:
                is_match = safe_eval_condition(condition, execution.data or {})

            log_data["evaluated_rules"].append({
                "condition": condition,
                "is_default": is_default,
                "matched": is_match,
                "next_step_id": str(rule.next_step_id) if rule.next_step_id else None,
                "priority": rule.priority,
            })

            if is_match and not rule_matched:
                # First matching rule wins
                next_step_id = rule.next_step_id
                rule_matched = True
                log_data["selected_rule_condition"] = condition

        if not rule_matched:
            raise ValueError(
                f"No rule matched for step '{step.name}'. "
                "Add a DEFAULT rule to ensure the workflow can always progress."
            )

        # ── Resolve next step name for logging ───────────────────────
        if next_step_id:
            ns_result = await db.execute(select(Step).where(Step.id == next_step_id))
            next_step = ns_result.scalar_one_or_none()
            log_data["selected_next_step"] = next_step.name if next_step else str(next_step_id)
        else:
            log_data["selected_next_step"] = None  # Terminal step

        # ── Advance execution pointer ────────────────────────────────
        ended_at = _now()
        log_data["status"] = "completed"
        log_data["ended_at"] = ended_at.isoformat()

        execution.current_step_id = next_step_id

        if next_step_id is None:
            execution.status = ExecutionStatus.completed
            execution.ended_at = ended_at
            logger.info(f"[{execution.id}] Workflow completed after step '{step.name}'.")
        else:
            logger.info(
                f"[{execution.id}] Step '{step.name}' done → next: '{log_data['selected_next_step']}'"
            )

        await _log(db, execution.id, step.id, log_data)
        await db.commit()

    except Exception as exc:
        ended_at = _now()
        logger.exception(
            f"[{execution.id}] Step '{step.name}' failed: {exc}"
        )
        log_data["status"] = "failed"
        log_data["error_message"] = str(exc)
        log_data["ended_at"] = ended_at.isoformat()

        execution.status = ExecutionStatus.failed
        execution.ended_at = ended_at

        await _log(db, execution.id, step.id, log_data)
        await db.commit()


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

async def _log(
    db: AsyncSession,
    execution_id,
    step_id,
    log_data: dict,
) -> None:
    """Append an ExecutionLog row (not committed yet — caller must commit)."""
    entry = ExecutionLog(
        execution_id=execution_id,
        step_id=step_id,
        log=log_data,
    )
    db.add(entry)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _now_iso() -> str:
    return _now().isoformat()
