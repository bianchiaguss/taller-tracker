"""Agrega presupuestos, galeria, opiniones, documentos y configuracion.

Revision ID: c9e4a1f62d30
Revises: b3886eaf49ae
"""

from alembic import op
import sqlalchemy as sa


revision = "c9e4a1f62d30"
down_revision = "b3886eaf49ae"
branch_labels = None
depends_on = None


def _campos_comunes():
    return (
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
    )


def upgrade() -> None:
    op.create_table(
        "solicitudes_presupuesto",
        sa.Column("nombre", sa.String(length=100), nullable=False),
        sa.Column("apellido", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("telefono", sa.String(length=30), nullable=False),
        sa.Column("marca", sa.String(length=100), nullable=False),
        sa.Column("modelo", sa.String(length=100), nullable=False),
        sa.Column("anio", sa.Integer(), nullable=True),
        sa.Column("patente", sa.String(length=20), nullable=True),
        sa.Column("descripcion_danio", sa.Text(), nullable=False),
        sa.Column("estado", sa.String(length=30), nullable=False),
        *_campos_comunes(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "galeria_trabajos",
        sa.Column("marca", sa.String(length=100), nullable=False),
        sa.Column("modelo", sa.String(length=100), nullable=False),
        sa.Column("anio", sa.Integer(), nullable=True),
        sa.Column("tipo_reparacion", sa.String(length=150), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("imagen_antes", sa.String(length=500), nullable=False),
        sa.Column("imagen_despues", sa.String(length=500), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("orden", sa.Integer(), nullable=False),
        *_campos_comunes(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "opiniones",
        sa.Column("nombre", sa.String(length=150), nullable=False),
        sa.Column("fecha", sa.Date(), nullable=False),
        sa.Column("calificacion", sa.Integer(), nullable=False),
        sa.Column("comentario", sa.Text(), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False),
        sa.Column("fuente", sa.String(length=30), nullable=False),
        *_campos_comunes(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "configuracion_sitio",
        sa.Column("clave", sa.String(length=100), nullable=False),
        sa.Column("valor", sa.Text(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_configuracion_sitio_clave", "configuracion_sitio", ["clave"], unique=True)

    op.create_table(
        "imagenes_solicitud",
        sa.Column("solicitud_id", sa.UUID(), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        *_campos_comunes(),
        sa.ForeignKeyConstraint(["solicitud_id"], ["solicitudes_presupuesto.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "documentos",
        sa.Column("expediente_id", sa.UUID(), nullable=False),
        sa.Column("usuario_id", sa.UUID(), nullable=False),
        sa.Column("nombre", sa.String(length=255), nullable=False),
        sa.Column("tipo", sa.String(length=50), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("extension", sa.String(length=10), nullable=True),
        sa.Column("tamano_bytes", sa.Integer(), nullable=True),
        sa.Column("visible_cliente", sa.Boolean(), nullable=False),
        *_campos_comunes(),
        sa.ForeignKeyConstraint(["expediente_id"], ["expedientes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("documentos")
    op.drop_table("imagenes_solicitud")
    op.drop_index("ix_configuracion_sitio_clave", table_name="configuracion_sitio")
    op.drop_table("configuracion_sitio")
    op.drop_table("opiniones")
    op.drop_table("galeria_trabajos")
    op.drop_table("solicitudes_presupuesto")
