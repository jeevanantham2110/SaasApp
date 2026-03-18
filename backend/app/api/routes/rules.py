import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database.session import get_db
from app.models.rule import Rule
from app.models.step import Step
from app.schemas.all import RuleCreate, RuleResponse, RuleUpdate

router = APIRouter()

@router.post("/steps/{step_id}/rules", response_model=RuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(step_id: uuid.UUID, rule_in: RuleCreate, db: AsyncSession = Depends(get_db)):
    try:
        # Verify step exists
        st_stmt = select(Step).where(Step.id == step_id)
        st_res = await db.execute(st_stmt)
        if not st_res.scalar_one_or_none():
             raise HTTPException(status_code=404, detail="Step not found")

        rule = Rule(
            step_id=step_id,
            condition=rule_in.condition,
            next_step_id=rule_in.next_step_id,
            priority=rule_in.priority
        )
        db.add(rule)
        await db.commit()
        await db.refresh(rule)
        return rule
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create rule: {str(e)}")

@router.get("/steps/{step_id}/rules", response_model=List[RuleResponse])
async def list_rules(step_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    try:
        stmt = select(Rule).where(Rule.step_id == step_id).order_by(Rule.priority)
        result = await db.execute(stmt)
        return result.scalars().all()
    except Exception:
        return []

@router.put("/rules/{id}", response_model=RuleResponse)
async def update_rule(id: uuid.UUID, rule_in: RuleUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Rule).where(Rule.id == id)
    result = await db.execute(stmt)
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    update_data = rule_in.model_dump(exclude_unset=True)
        
    for field, value in update_data.items():
        setattr(rule, field, value)

    await db.commit()
    await db.refresh(rule)
    return rule

@router.delete("/rules/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Rule).where(Rule.id == id)
    result = await db.execute(stmt)
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    await db.delete(rule)
    await db.commit()
