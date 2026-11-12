"""Add volunteer and notes columns to pickups

Revision ID: 003
Revises: 002
Create Date: 2026-09-19 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use native PostgreSQL 'ADD COLUMN IF NOT EXISTS' to ensure safe execution inside transactions
    op.execute("ALTER TABLE pickups ADD COLUMN IF NOT EXISTS volunteer VARCHAR")
    op.execute("ALTER TABLE pickups ADD COLUMN IF NOT EXISTS notes TEXT")


def downgrade() -> None:
    op.drop_column('pickups', 'notes')
    op.drop_column('pickups', 'volunteer')
