"""Novedad: actualizaciones/comentarios que el taller publica para el cliente.
Distinto del cambio de estado tecnico: es comunicacion en lenguaje natural
("Encontramos un golpe adicional en la puerta, te escribimos para avisarte").
"""
import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class Novedad(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "novedades"

    expediente_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("expedientes.id", ondelete="CASCADE"), nullable=False
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False
    )
    titulo: Mapped[str] = mapped_column(String(150), nullable=False)
    mensaje: Mapped[str] = mapped_column(Text, nullable=False)

    expediente: Mapped["Expediente"] = relationship(back_populates="novedades")
    usuario: Mapped["Usuario"] = relationship()
