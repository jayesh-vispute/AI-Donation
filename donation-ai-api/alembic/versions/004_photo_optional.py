"""Make delivery_proofs.photo_url nullable

Revision ID: 004_photo_optional
Revises: 357c12f36058
Create Date: 2026-09-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004_photo_optional'
down_revision: Union[str, None] = '357c12f36058'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('delivery_proofs', 'photo_url',
                    existing_type=sa.String(),
                    nullable=True)


def downgrade() -> None:
    op.alter_column('delivery_proofs', 'photo_url',
                    existing_type=sa.String(),
                    nullable=False)
