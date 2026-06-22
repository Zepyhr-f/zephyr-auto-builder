import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RemoteJobKind(str, enum.Enum):
    PLANNING = "planning"
    EXECUTION = "execution"


class RemoteJobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class RemoteJob(Base):
    __tablename__ = "remote_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    plan_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("plans.id"), nullable=True)
    job_kind: Mapped[RemoteJobKind] = mapped_column(Enum(RemoteJobKind), nullable=False)
    hermes_job_id: Mapped[str] = mapped_column(String(128), nullable=False)
    request_payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    remote_status: Mapped[RemoteJobStatus] = mapped_column(Enum(RemoteJobStatus), nullable=False, default=RemoteJobStatus.PENDING)
    last_polled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    poll_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
