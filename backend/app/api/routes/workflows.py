import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.models.workflow import Workflow
from app.schemas.all import WorkflowCreate, WorkflowResponse, WorkflowUpdate, WorkflowWithStepsResponse

router = APIRouter()

@router.post("/", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(workflow_in: WorkflowCreate, db: AsyncSession = Depends(get_db)):
    try:
        workflow = Workflow(
            name=workflow_in.name,
            is_active=workflow_in.is_active,
            input_schema=workflow_in.input_schema
        )
        db.add(workflow)
        await db.commit()
        await db.refresh(workflow)
        return workflow
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create workflow: {str(e)}"
        )

@router.get("/", response_model=List[WorkflowResponse])
async def list_workflows(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    try:
        stmt = select(Workflow).options(selectinload(Workflow.steps)).offset(skip).limit(limit).order_by(Workflow.created_at.desc())
        result = await db.execute(stmt)
        workflows = result.scalars().all()
        for wf in workflows:
            wf.step_count = len(wf.steps)
        return workflows
    except Exception as e:
        return []

@router.get("/{id}", response_model=WorkflowWithStepsResponse)
async def get_workflow(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Workflow).options(selectinload(Workflow.steps)).where(Workflow.id == id)
    result = await db.execute(stmt)
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    workflow.step_count = len(workflow.steps)
    return workflow

@router.put("/{id}", response_model=WorkflowResponse)
async def update_workflow(id: uuid.UUID, workflow_in: WorkflowUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Workflow).where(Workflow.id == id)
    result = await db.execute(stmt)
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    update_data = workflow_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workflow, field, value)

    # Note: If start_step_id or is_active is changed, we might want to bump version
    
    await db.commit()
    await db.refresh(workflow)
    return workflow

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Workflow).where(Workflow.id == id)
    result = await db.execute(stmt)
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    await db.delete(workflow)
    await db.commit()
