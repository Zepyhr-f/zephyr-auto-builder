import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PlanStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUPERSEDED = "superseded"


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    plan_text: Mapped[str] = mapped_column(Text, nullable=False)
    plan_structured_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    risk_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    expected_outputs: Mapped[list | None] = mapped_column(JSON, nullable=True)
    status: Mapped[PlanStatus] = mapped_column(Enum(PlanStatus), default=PlanStatus.DRAFT, nullable=False)
    created_by: Mapped[str] = mapped_column(String(32), nullable=False, default="hermes")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
