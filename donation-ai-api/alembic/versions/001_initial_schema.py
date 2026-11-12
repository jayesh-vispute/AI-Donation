"""Initial schema and additions

Revision ID: 001
Revises: 
Create Date: 2026-09-06 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Alter 'users' table to support local auth
    # Check if table exists (assuming it does, but we alter it safely)
    try:
        op.alter_column('users', 'firebase_uid', existing_type=sa.String(), nullable=True)
    except Exception as e:
        print(f"Skipping alter column firebase_uid: {e}")
        
    try:
        op.add_column('users', sa.Column('password_hash', sa.String(), nullable=True))
    except Exception as e:
        print(f"Skipping add column password_hash: {e}")

    # 2. Create 'categories' table
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(), nullable=False, index=True, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
    )

    # 3. Create 'inventory' table
    op.create_table(
        'inventory',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('ngo_id', sa.Integer(), sa.ForeignKey('ngo_profiles.id'), nullable=False),
        sa.Column('category_id', sa.Integer(), sa.ForeignKey('categories.id'), nullable=True),
        sa.Column('item_name', sa.String(), nullable=False, index=True),
        sa.Column('quantity', sa.Integer(), default=0),
        sa.Column('available_quantity', sa.Integer(), default=0),
        sa.Column('used_quantity', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
    )

    # 4. Create 'notifications' table
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('type', sa.String(), nullable=True),
        sa.Column('is_read', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
    )

    # 5. Create 'audit_logs' table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('module', sa.String(), nullable=True),
        sa.Column('entity_type', sa.String(), nullable=True),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
    )

    # 6. Create 'ai_detections' table
    op.create_table(
        'ai_detections',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('donation_id', sa.Integer(), sa.ForeignKey('donations.id'), nullable=True),
        sa.Column('image_path', sa.String(), nullable=True),
        sa.Column('detected_class', sa.String(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('quantity', sa.Integer(), default=1),
        sa.Column('bbox', sa.String(), nullable=True), # JSON string
        sa.Column('model_name', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
    )

    # Add optional columns to existing tables safely
    try:
        op.add_column('donations', sa.Column('delivery_address', sa.String(), nullable=True))
        op.add_column('donations', sa.Column('donation_date', sa.DateTime(), nullable=True))
    except Exception:
        pass

    try:
        op.add_column('donation_items', sa.Column('category_id', sa.Integer(), sa.ForeignKey('categories.id'), nullable=True))
        op.add_column('donation_items', sa.Column('condition', sa.String(), nullable=True))
        op.add_column('donation_items', sa.Column('description', sa.Text(), nullable=True))
    except Exception:
        pass

    try:
        op.add_column('demands', sa.Column('category_id', sa.Integer(), sa.ForeignKey('categories.id'), nullable=True))
        op.add_column('demands', sa.Column('required_date', sa.DateTime(), nullable=True))
    except Exception:
        pass
        
    try:
        op.add_column('ngo_profiles', sa.Column('account_status', sa.String(), nullable=True))
    except Exception:
        pass
        
    try:
        op.add_column('donation_status_history', sa.Column('remarks', sa.Text(), nullable=True))
    except Exception:
        pass


def downgrade() -> None:
    pass # Simplification for this exercise
