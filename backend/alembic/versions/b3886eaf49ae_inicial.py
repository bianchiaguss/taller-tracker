"""Normaliza la cadena de migraciones inicial.

Revision ID: b3886eaf49ae
Revises: 78197c8121b0
"""

revision = "b3886eaf49ae"
down_revision = "78197c8121b0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # La migracion original intentaba convertir UUID ya creados como UUID.
    # En SQLite Alembic los inspeccionaba como NUMERIC y generaba ALTER COLUMN,
    # una operacion innecesaria y no soportada por SQLite.
    pass


def downgrade() -> None:
    pass
