"""Initial_migration

Revision ID: be06db9aa91b
Revises: 
Create Date: 2026-03-16 13:03:00.825043

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'be06db9aa91b'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create Enums
    step_type_enum = sa.Enum('task', 'approval', 'notification', name='steptype')
    execution_status_enum = sa.Enum('pending', 'in_progress', 'completed', 'failed', 'canceled', name='executionstatus')
    
    # Create workflows table
    op.create_table('workflows',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False, default=1),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('input_schema', postgresql.JSONB(), nullable=False, default={}),
        sa.Column('start_step_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'))
    )

    # Create steps table
    op.create_table('steps',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workflow_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workflows.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('step_type', step_type_enum, nullable=False),
        sa.Column('order', sa.Integer(), nullable=False, default=0),
        sa.Column('metadata', postgresql.JSONB(), nullable=False, default={}),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'))
    )

    # Create rules table
    op.create_table('rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('step_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('steps.id', ondelete='CASCADE'), nullable=False),
        sa.Column('condition', sa.String(), nullable=False),
        sa.Column('next_step_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('steps.id', ondelete='SET NULL'), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'))
    )

    # Create executions table
    op.create_table('executions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('workflow_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workflows.id', ondelete='CASCADE'), nullable=False),
        sa.Column('workflow_version', sa.Integer(), nullable=False),
        sa.Column('status', execution_status_enum, nullable=False),
        sa.Column('data', postgresql.JSONB(), nullable=False, default={}),
        sa.Column('current_step_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('steps.id', ondelete='SET NULL'), nullable=True),
        sa.Column('retries', sa.Integer(), nullable=False, default=0),
        sa.Column('triggered_by', sa.String(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True)
    )

    # Create execution_logs table
    op.create_table('execution_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('execution_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('executions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('step_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('steps.id', ondelete='SET NULL'), nullable=True),
        sa.Column('log', postgresql.JSONB(), nullable=False, default={}),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'))
    )

def downgrade() -> None:
    op.drop_table('execution_logs')
    op.drop_table('executions')
    op.drop_table('rules')
    op.drop_table('steps')
    op.drop_table('workflows')
    # Drop types if needed
    op.execute("DROP TYPE executionstatus")
    op.execute("DROP TYPE steptype")
