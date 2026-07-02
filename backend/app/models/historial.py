"""HistorialExpediente: el timeline real. Cada vez que cambia el estado
de un expediente se crea un registro aca. Esto es lo que el cliente ve
como linea de tiempo de su reparacion.
"""
import uuid

from sqlalchemy import ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class HistorialExpediente(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "historial_expediente"

    expediente_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("expedientes.id", ondelete="CASCADE"), nullable=False
    )
    estado_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("estados_expediente.id"), nullable=False
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False
    )
    observacion: Mapped[str | None] = mapped_column(Text, nullable=True)

    expediente: Mapped["Expediente"] = relationship(back_populates="historial")
    estado: Mapped["EstadoExpediente"] = relationship()
    usuario: Mapped["Usuario"] = relationship()
    imagenes: Mapped[list["ImagenExpediente"]] = relationship(back_populates="historial")
