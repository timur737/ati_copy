import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float,
    Integer, String, Text, ForeignKey
)
from sqlalchemy.orm import relationship

from app.db.session import Base


class UserRole(str, enum.Enum):
    shipper = "shipper"
    carrier = "carrier"
    dispatcher = "dispatcher"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.shipper)
    company_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    rating = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    cargo_posts = relationship("Cargo", back_populates="creator", foreign_keys="Cargo.created_by")
    trucks = relationship("Truck", back_populates="owner")
    bids = relationship("Bid", back_populates="carrier", foreign_keys="Bid.carrier_id")
    sent_messages = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")
    received_messages = relationship("Message", back_populates="receiver", foreign_keys="Message.receiver_id")
    reviews_given = relationship("Review", back_populates="reviewer", foreign_keys="Review.reviewer_id")
    reviews_received = relationship("Review", back_populates="reviewee", foreign_keys="Review.reviewee_id")
    company = relationship("Company", back_populates="owner", uselist=False)
