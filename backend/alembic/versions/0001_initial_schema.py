"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-03-10
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("shipper", "carrier", "dispatcher", name="userrole"), nullable=False),
        sa.Column("company_name", sa.String(255)),
        sa.Column("phone", sa.String(50)),
        sa.Column("rating", sa.Float, default=0.0),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # Companies
    op.create_table(
        "companies",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("country", sa.String(100)),
        sa.Column("verification_status", sa.Enum("pending", "verified", "rejected", name="verificationstatus"), nullable=False, server_default="pending"),
        sa.Column("owner_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Cargo
    op.create_table(
        "cargo",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("origin", sa.String(255), nullable=False),
        sa.Column("destination", sa.String(255), nullable=False),
        sa.Column("weight", sa.Float, nullable=False),
        sa.Column("volume", sa.Float),
        sa.Column("price", sa.Numeric(12, 2)),
        sa.Column("currency", sa.String(10), server_default="USD"),
        sa.Column("loading_date", sa.Date, nullable=False),
        sa.Column("status", sa.Enum("open", "assigned", "completed", "cancelled", name="cargostatus"), nullable=False, server_default="open"),
        sa.Column("created_by", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_cargo_origin_destination", "cargo", ["origin", "destination"])
    op.create_index("ix_cargo_loading_date", "cargo", ["loading_date"])
    op.create_index("ix_cargo_status_price", "cargo", ["status", "price"])
    op.create_index("ix_cargo_weight", "cargo", ["weight"])

    # Trucks
    op.create_table(
        "trucks",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("owner_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", sa.String(100), nullable=False),
        sa.Column("capacity", sa.Float, nullable=False),
        sa.Column("location", sa.String(255)),
        sa.Column("availability", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Bids
    op.create_table(
        "bids",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("cargo_id", sa.Integer, sa.ForeignKey("cargo.id", ondelete="CASCADE"), nullable=False),
        sa.Column("carrier_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("message", sa.Text),
        sa.Column("status", sa.Enum("pending", "accepted", "rejected", "withdrawn", name="bidstatus"), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_bids_cargo_id", "bids", ["cargo_id"])
    op.create_index("ix_bids_carrier_id", "bids", ["carrier_id"])

    # Messages
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("sender_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("receiver_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("is_read", sa.Integer, default=0),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_messages_sender_receiver", "messages", ["sender_id", "receiver_id"])

    # Reviews
    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("reviewer_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reviewee_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("cargo_id", sa.Integer, sa.ForeignKey("cargo.id")),
        sa.Column("rating", sa.Float, nullable=False),
        sa.Column("comment", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="ck_reviews_rating_range"),
    )


def downgrade() -> None:
    op.drop_table("reviews")
    op.drop_table("messages")
    op.drop_table("bids")
    op.drop_table("trucks")
    op.drop_table("cargo")
    op.drop_table("companies")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS verificationstatus")
    op.execute("DROP TYPE IF EXISTS cargostatus")
    op.execute("DROP TYPE IF EXISTS bidstatus")
