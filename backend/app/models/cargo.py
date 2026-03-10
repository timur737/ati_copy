import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, DateTime, Enum, Float, ForeignKey,
    Index, Integer, Numeric, String, Text, Date
)
from sqlalchemy.orm import relationship

from app.db.session import Base


class CargoStatus(str, enum.Enum):
    open = "open"
    assigned = "assigned"
    completed = "completed"
    cancelled = "cancelled"


class Cargo(Base):
    __tablename__ = "cargo"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    origin = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    weight = Column(Float, nullable=False)          # kg
    volume = Column(Float, nullable=True)           # m³
    price = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(10), default="USD")
    loading_date = Column(Date, nullable=False)
    status = Column(Enum(CargoStatus), default=CargoStatus.open, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    creator = relationship("User", back_populates="cargo_posts", foreign_keys=[created_by])
    bids = relationship("Bid", back_populates="cargo", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="cargo")

    # Composite indexes for fast search
    __table_args__ = (
        Index("ix_cargo_origin_destination", "origin", "destination"),
        Index("ix_cargo_loading_date", "loading_date"),
        Index("ix_cargo_status_price", "status", "price"),
        Index("ix_cargo_weight", "weight"),
    )
