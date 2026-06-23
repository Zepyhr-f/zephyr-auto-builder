from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    source_type: str = Field(default="human", max_length=50)
    task_type: str = Field(default="requirement", max_length=50)
    source_payload: str = Field(default="", max_length=5000)


class TaskOut(BaseModel):
    id: UUID
    title: str
    source_type: str
    source_payload: str = ""
    task_type: str
    status: str
    priority: int
    current_plan_id: UUID | None = None
    approved_plan_id: UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PlanOut(BaseModel):
    id: UUID
    task_id: UUID
    version: int
    plan_text: str
    plan_structured: dict = {}
    risk_summary: str
    expected_outputs: str
    status: str
    created_by: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ApprovalCreate(BaseModel):
    plan_id: UUID
    decision: str = Field(pattern="^(approve|reject|revise)$")
    review_comment: str = Field(default="", max_length=5000)
