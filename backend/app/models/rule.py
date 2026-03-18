import uuid
from sqlalchemy import Column, String, Integer, DateTime, func, ForeignKey, Uuid
from app.database.session import Base
from sqlalchemy.orm import relationship

class Rule(Base):
    __tablename__ = "rules"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    step_id = Column(Uuid(as_uuid=True), ForeignKey("steps.id", ondelete="CASCADE"), nullable=False)
    condition = Column(String, nullable=False)
    next_step_id = Column(Uuid(as_uuid=True), ForeignKey("steps.id", ondelete="SET NULL"), nullable=True)
    priority = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    step = relationship("Step", back_populates="rules", foreign_keys=[step_id])
    next_step = relationship("Step", foreign_keys=[next_step_id])
