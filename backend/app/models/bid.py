import enum
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class BidStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    withdrawn = "withdrawn"


class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    cargo_id = Column(Integer, ForeignKey("cargo.id", ondelete="CASCADE"), nullable=False, index=True)
    carrier_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    price = Column(Numeric(12, 2), nullable=False)
    message = Column(Text, nullable=True)
    status = Column(Enum(BidStatus), default=BidStatus.pending, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    cargo = relationship("Cargo", back_populates="bids")
    carrier = relationship("User", back_populates="bids", foreign_keys=[carrier_id])
