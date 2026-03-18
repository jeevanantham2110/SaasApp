from pydantic import BaseModel, UUID4, Field, field_validator, model_validator
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
import json as _json

from app.models.step import StepType


# ──────────────────────────────────────────────
# Workflows
# ──────────────────────────────────────────────

class WorkflowBase(BaseModel):
    name: str
    is_active: bool = True
    input_schema: Dict[str, Any] = {}


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    input_schema: Optional[Dict[str, Any]] = None
    start_step_id: Optional[UUID4] = None


class WorkflowResponse(WorkflowBase):
    id: UUID4
    version: int
    start_step_id: Optional[UUID4] = None
    step_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# Steps
# ──────────────────────────────────────────────

def _coerce_json(v: Any) -> Dict[str, Any]:
    """Ensure JSON-column values are always returned as dicts, not raw strings."""
    if v is None:
        return {}
    if isinstance(v, dict):
        return v
    if isinstance(v, str):
        try:
            result = _json.loads(v)
            return result if isinstance(result, dict) else {}
        except Exception:
            return {}
    return {}


class StepBase(BaseModel):
    name: str
    step_type: StepType
    order: int = 0
    # The DB column is named `metadata_col`; JSON body / response uses `metadata`.
    metadata_col: Dict[str, Any] = Field(default_factory=dict, alias="metadata")

    @field_validator("metadata_col", mode="before")
    @classmethod
    def coerce_metadata(cls, v: Any) -> Dict[str, Any]:
        return _coerce_json(v)

    class Config:
        populate_by_name = True   # Accept both "metadata" (alias) and "metadata_col"


class StepCreate(StepBase):
    pass


class StepUpdate(BaseModel):
    name: Optional[str] = None
    step_type: Optional[StepType] = None
    order: Optional[int] = None
    metadata_col: Optional[Dict[str, Any]] = Field(None, alias="metadata")

    @field_validator("metadata_col", mode="before")
    @classmethod
    def coerce_metadata(cls, v: Any) -> Optional[Dict[str, Any]]:
        if v is None:
            return None
        return _coerce_json(v)

    class Config:
        populate_by_name = True


class StepResponse(BaseModel):
    id: UUID4
    workflow_id: UUID4
    name: str
    step_type: StepType
    order: int
    metadata_col: Dict[str, Any] = Field(default_factory=dict, alias="metadata")
    created_at: datetime
    updated_at: Optional[datetime] = None

    @field_validator("metadata_col", mode="before")
    @classmethod
    def coerce_metadata(cls, v: Any) -> Dict[str, Any]:
        return _coerce_json(v)

    class Config:
        from_attributes = True
        populate_by_name = True


# ──────────────────────────────────────────────
# Rules
# ──────────────────────────────────────────────

class RuleBase(BaseModel):
    condition: str
    next_step_id: Optional[UUID4] = None
    priority: int = 0


class RuleCreate(RuleBase):
    pass


class RuleUpdate(BaseModel):
    condition: Optional[str] = None
    next_step_id: Optional[UUID4] = None
    priority: Optional[int] = None


class RuleResponse(RuleBase):
    id: UUID4
    step_id: UUID4
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# Executions
# ──────────────────────────────────────────────
from app.models.execution import ExecutionStatus


class ExecutionCreate(BaseModel):
    """
    Request body for POST /workflows/{workflow_id}/execute.
    workflow_id is taken from the URL, not the body.
    """
    data: Dict[str, Any] = {}
    triggered_by: Optional[str] = None


class ExecutionResponse(BaseModel):
    id: UUID4
    workflow_id: UUID4
    workflow_version: int
    status: ExecutionStatus
    data: Dict[str, Any] = {}
    triggered_by: Optional[str] = None
    current_step_id: Optional[UUID4] = None
    retries: int = 0
    started_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExecutionLogResponse(BaseModel):
    id: UUID4
    execution_id: UUID4
    step_id: Optional[UUID4] = None
    log: Dict[str, Any] = {}
    timestamp: datetime

    @field_validator("log", mode="before")
    @classmethod
    def coerce_log(cls, v: Any) -> Dict[str, Any]:
        return _coerce_json(v)

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────
# Composite
# ──────────────────────────────────────────────

class WorkflowWithStepsResponse(WorkflowResponse):
    steps: List[StepResponse] = []
