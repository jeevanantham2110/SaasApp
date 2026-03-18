import uuid
import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database.session import get_db
from app.models.workflow import Workflow
from app.models.step import Step
from app.models.execution import Execution, ExecutionStatus
from app.models.execution_log import ExecutionLog
from app.schemas.all import ExecutionCreate, ExecutionResponse, ExecutionLogResponse
from app.workflow_engine.engine import start_execution

router = APIRouter()

@router.post("/workflows/{workflow_id}/execute", response_model=ExecutionResponse, status_code=status.HTTP_201_CREATED)
async def execute_workflow(workflow_id: uuid.UUID, execution_in: ExecutionCreate, db: AsyncSession = Depends(get_db)):
    try:
        wf_stmt = select(Workflow).where(Workflow.id == workflow_id)
        wf_res = await db.execute(wf_stmt)
        workflow = wf_res.scalar_one_or_none()
        if not workflow:
             raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Verify workflow has steps
        step_stmt = select(func.count(Step.id)).where(Step.workflow_id == workflow_id)
        step_res = await db.execute(step_stmt)
        step_count = step_res.scalar()
        if step_count == 0:
            raise HTTPException(status_code=400, detail="Workflow has no steps")

        # Create Execution record
        execution = Execution(
            workflow_id=workflow_id,
            workflow_version=workflow.version,
            status=ExecutionStatus.pending,
            data=execution_in.data,
            triggered_by=execution_in.triggered_by
        )
        db.add(execution)
        await db.commit()
        await db.refresh(execution)

        asyncio.create_task(run_execution_background(execution.id))
        return execution
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to execute workflow: {str(e)}")


async def run_execution_background(execution_id: uuid.UUID):
    # We create a new DB session for the background task to isolate it
    from app.database.session import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        try:
            await start_execution(session, execution_id)
        except Exception as e:
            # Errors are meant to be caught within engine and status marked to failed.
            print(f"Background execution error: {e}")


@router.get("/executions", response_model=List[ExecutionResponse])
async def list_all_executions(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    try:
        stmt = select(Execution).offset(skip).limit(limit).order_by(Execution.started_at.desc())
        result = await db.execute(stmt)
        return result.scalars().all()
    except Exception:
        return []

@router.get("/executions/{id}", response_model=ExecutionResponse)
async def get_execution(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Execution).where(Execution.id == id)
    result = await db.execute(stmt)
    execution = result.scalar_one_or_none()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution

@router.post("/executions/{id}/cancel", response_model=ExecutionResponse)
async def cancel_execution(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Execution).where(Execution.id == id)
    result = await db.execute(stmt)
    execution = result.scalar_one_or_none()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    if execution.status in [ExecutionStatus.completed, ExecutionStatus.failed, ExecutionStatus.canceled]:
        raise HTTPException(status_code=400, detail="Execution cannot be canceled in its current state")
    
    execution.status = ExecutionStatus.canceled
    execution.ended_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(execution)
    return execution

@router.post("/executions/{id}/retry", response_model=ExecutionResponse)
async def retry_execution(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Execution).where(Execution.id == id)
    result = await db.execute(stmt)
    execution = result.scalar_one_or_none()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    if execution.status != ExecutionStatus.failed:
        raise HTTPException(status_code=400, detail="Only failed executions can be retried")
    
    execution.status = ExecutionStatus.in_progress
    execution.retries += 1
    execution.ended_at = None
    await db.commit()
    await db.refresh(execution)

    asyncio.create_task(run_execution_background(execution.id))
    
    return execution

@router.get("/executions/{id}/logs", response_model=List[ExecutionLogResponse])
async def list_execution_logs(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(ExecutionLog).where(ExecutionLog.execution_id == id).order_by(ExecutionLog.timestamp)
    result = await db.execute(stmt)
    return result.scalars().all()
