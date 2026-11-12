"""Add subcategory column to ai_detections, donation_items, and demands

Revision ID: 002
Revises: 001
Create Date: 2026-09-16 19:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use native PostgreSQL 'ADD COLUMN IF NOT EXISTS' to ensure safe execution inside transactions
    op.execute(sa.text("ALTER TABLE ai_detections ADD COLUMN IF NOT EXISTS subcategory VARCHAR"))
    op.execute(sa.text("ALTER TABLE donation_items ADD COLUMN IF NOT EXISTS subcategory VARCHAR"))
    op.execute(sa.text("ALTER TABLE demands ADD COLUMN IF NOT EXISTS subcategory VARCHAR"))
    op.execute(sa.text("ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS subcategory VARCHAR"))

    # Safely create index on subcategory columns if not existing
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_donation_items_subcategory ON donation_items (subcategory)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_demands_subcategory ON demands (subcategory)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_cart_items_subcategory ON cart_items (subcategory)"))


def downgrade() -> None:
    op.execute(sa.text("DROP INDEX IF EXISTS ix_cart_items_subcategory"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_demands_subcategory"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_donation_items_subcategory"))

    op.execute(sa.text("ALTER TABLE cart_items DROP COLUMN IF EXISTS subcategory"))
    op.execute(sa.text("ALTER TABLE demands DROP COLUMN IF EXISTS subcategory"))
    op.execute(sa.text("ALTER TABLE donation_items DROP COLUMN IF EXISTS subcategory"))
    op.execute(sa.text("ALTER TABLE ai_detections DROP COLUMN IF EXISTS subcategory"))
