"""Agrega los campos de reseña a expedientes.

Revision ID: a4d92c7e61bf
Revises: 88e98ed25382
"""

from alembic import op
import sqlalchemy as sa


revision = "a4d92c7e61bf"
down_revision = "88e98ed25382"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "expedientes",
        sa.Column("token_resena", sa.String(length=36), nullable=True),
    )
    op.add_column(
        "expedientes",
        sa.Column(
            "resena_completada",
            sa.Boolean(),
            server_default=sa.false(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_expedientes_token_resena",
        "expedientes",
        ["token_resena"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_expedientes_token_resena", table_name="expedientes")
    op.drop_column("expedientes", "resena_completada")
    op.drop_column("expedientes", "token_resena")
