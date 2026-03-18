import uuid
from sqlalchemy import Column, DateTime, func, ForeignKey, JSON, Uuid
from app.database.session import Base
from sqlalchemy.orm import relationship

class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_id = Column(Uuid(as_uuid=True), ForeignKey("executions.id", ondelete="CASCADE"), nullable=False)
    step_id = Column(Uuid(as_uuid=True), ForeignKey("steps.id", ondelete="SET NULL"), nullable=True)
    log = Column(JSON, default={}, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    execution = relationship("Execution", back_populates="logs")
