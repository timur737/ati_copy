import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, ForeignKey,
    Integer, String, Text
)
from sqlalchemy.orm import relationship

from app.db.session import Base


class ModerationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    full_name = Column(String(255), nullable=False)
    license_number = Column(String(100), nullable=False)

    # Passport document URLs/paths (stored as text to accommodate long paths or base64)
    passport_front_url = Column(Text, nullable=False)
    passport_back_url = Column(Text, nullable=False)

    moderation_status = Column(
        Enum(ModerationStatus),
        default=ModerationStatus.pending,
        nullable=False,
    )
    rejection_reason = Column(Text, nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="driver_profile")
