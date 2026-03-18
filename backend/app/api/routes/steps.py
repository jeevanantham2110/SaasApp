import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.models.step import Step
from app.models.workflow import Workflow
from app.schemas.all import StepCreate, StepResponse, StepUpdate

# Reusing same router namespace conceptually, but mapping to distinct paths in main app
router = APIRouter()

@router.post("/workflows/{workflow_id}/steps", response_model=StepResponse, status_code=status.HTTP_201_CREATED)
async def create_step(workflow_id: uuid.UUID, step_in: StepCreate, db: AsyncSession = Depends(get_db)):
    try:
        # Verify workflow exists
        wf_stmt = select(Workflow).where(Workflow.id == workflow_id)
        wf_res = await db.execute(wf_stmt)
        if not wf_res.scalar_one_or_none():
             raise HTTPException(status_code=404, detail="Workflow not found")

        step = Step(
            workflow_id=workflow_id,
            name=step_in.name,
            step_type=step_in.step_type,
            order=step_in.order,
            metadata_col=step_in.metadata_col
        )
        db.add(step)
        await db.flush() # Flush to get the step ID

        # Auto-assign start_step_id if not set or if this is the first step (order=1)
        wf_stmt = select(Workflow).where(Workflow.id == workflow_id)
        wf_res = await db.execute(wf_stmt)
        workflow = wf_res.scalar_one()

        if workflow.start_step_id is None or step.order == 1:
            workflow.start_step_id = step.id
        
        await db.commit()
        await db.refresh(step)
        return step
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create step: {str(e)}")

@router.get("/workflows/{workflow_id}/steps", response_model=List[StepResponse])
async def list_steps(workflow_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    try:
        stmt = select(Step).where(Step.workflow_id == workflow_id).order_by(Step.order)
        result = await db.execute(stmt)
        return result.scalars().all()
    except Exception:
        return []

@router.put("/steps/{id}", response_model=StepResponse)
async def update_step(id: uuid.UUID, step_in: StepUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Step).where(Step.id == id)
    result = await db.execute(stmt)
    step = result.scalar_one_or_none()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    update_data = step_in.model_dump(exclude_unset=True)
    if 'metadata' in update_data:
        update_data['metadata_col'] = update_data.pop('metadata')
        
    for field, value in update_data.items():
        setattr(step, field, value)

    await db.commit()
    await db.refresh(step)
    return step

@router.delete("/steps/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_step(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Step).where(Step.id == id)
    result = await db.execute(stmt)
    step = result.scalar_one_or_none()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    await db.delete(step)
    await db.commit()
