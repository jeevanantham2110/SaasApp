import uuid
import enum
from sqlalchemy import Column, String, Integer, DateTime, func, ForeignKey, Enum, JSON, Uuid
from app.database.session import Base
from sqlalchemy.orm import relationship

class ExecutionStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"
    canceled = "canceled"

class Execution(Base):
    __tablename__ = "executions"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(Uuid(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    workflow_version = Column(Integer, nullable=False)
    status = Column(Enum(ExecutionStatus), default=ExecutionStatus.pending, nullable=False)
    data = Column(JSON, default={}, nullable=False)
    current_step_id = Column(Uuid(as_uuid=True), ForeignKey("steps.id", ondelete="SET NULL"), nullable=True)
    retries = Column(Integer, default=0, nullable=False)
    triggered_by = Column(String, nullable=True) # Could be UUID, assuming string for simple username/id
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)

    workflow = relationship("Workflow", back_populates="executions")
    logs = relationship("ExecutionLog", back_populates="execution", cascade="all, delete-orphan")
