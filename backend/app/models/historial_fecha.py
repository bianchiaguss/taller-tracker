"""Historial de cambios en la fecha estimada de entrega de un expediente."""
import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class HistorialFechaEntrega(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "historial_fecha_entrega"

    expediente_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("expedientes.id", ondelete="CASCADE"), nullable=False
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False
    )
    fecha_anterior: Mapped[date | None] = mapped_column(Date, nullable=True)
    fecha_nueva: Mapped[date | None] = mapped_column(Date, nullable=True)
    motivo: Mapped[str] = mapped_column(Text, nullable=False)

    expediente: Mapped["Expediente"] = relationship(back_populates="historial_fechas")
    usuario: Mapped["Usuario"] = relationship()
