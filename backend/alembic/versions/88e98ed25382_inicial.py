"""Agrega la respuesta del taller a las solicitudes de presupuesto.

Revision ID: 88e98ed25382
Revises: c9e4a1f62d30
"""

from alembic import op
import sqlalchemy as sa


revision = "88e98ed25382"
down_revision = "c9e4a1f62d30"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "solicitudes_presupuesto",
        sa.Column("respuesta", sa.Text(), nullable=True),
    )
    op.add_column(
        "solicitudes_presupuesto",
        sa.Column("respuesta_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("solicitudes_presupuesto", "respuesta_at")
    op.drop_column("solicitudes_presupuesto", "respuesta")
