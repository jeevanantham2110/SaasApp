import uuid
import enum
from sqlalchemy import Column, String, Integer, DateTime, func, ForeignKey, Enum, JSON, Uuid
from app.database.session import Base
from sqlalchemy.orm import relationship

class StepType(str, enum.Enum):
    task = "task"
    approval = "approval"
    notification = "notification"

class Step(Base):
    __tablename__ = "steps"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(Uuid(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    step_type = Column(Enum(StepType), nullable=False)
    order = Column(Integer, default=0, nullable=False)
    metadata_col = Column("metadata", JSON, default={}, nullable=False) # 'metadata' is reserved in SQLAlchemy
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    workflow = relationship("Workflow", back_populates="steps")
    rules = relationship("Rule", back_populates="step", cascade="all, delete-orphan", foreign_keys="[Rule.step_id]")
