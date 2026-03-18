import asyncio
import traceback
import sys

# Redirect output to a file
log_file = open("step_test_log.txt", "w")

def log(*args):
    msg = " ".join(str(a) for a in args)
    print(msg)
    log_file.write(msg + "\n")
    log_file.flush()

async def run_test():
    try:
        from app.database.session import AsyncSessionLocal, engine, Base
        from app.models import Workflow, Step
        from app.models.step import StepType
        from app.schemas.all import StepCreate, StepResponse
        from sqlalchemy.future import select

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with AsyncSessionLocal() as db:
            wf = Workflow(name="APITest2", is_active=True, input_schema={})
            db.add(wf)
            await db.commit()
            await db.refresh(wf)
            log(f"WF created: {wf.id}")

            step_body = {"name": "Step 1", "step_type": "task", "order": 1, "metadata": {}}
            try:
                step_in = StepCreate.model_validate(step_body)
                log(f"StepCreate parsed OK: metadata_col={step_in.metadata_col}")
            except Exception as e:
                log(f"StepCreate FAIL: {e}")
                traceback.print_exc(file=log_file)
                return

            step = Step(
                workflow_id=wf.id,
                name=step_in.name,
                step_type=step_in.step_type,
                order=step_in.order,
                metadata_col=step_in.metadata_col
            )
            db.add(step)
            await db.flush()

            if wf.start_step_id is None or step.order == 1:
                wf.start_step_id = step.id

            await db.commit()
            await db.refresh(step)
            log(f"Step saved: {step.id}")
            log(f"  step.step_type={step.step_type}")
            log(f"  step.metadata_col={step.metadata_col}")
            log(f"  step.updated_at={step.updated_at}")

            try:
                resp = StepResponse.model_validate(step)
                log(f"StepResponse OK: id={resp.id}")
            except Exception as e:
                log(f"StepResponse FAIL: {e}")
                traceback.print_exc(file=log_file)

    except Exception as e:
        log(f"TOP LEVEL ERROR: {e}")
        traceback.print_exc(file=log_file)
    finally:
        log_file.close()

asyncio.run(run_test())
