"""ImagenExpediente: fotos subidas por el taller, asociadas a un expediente
y opcionalmente a una etapa puntual del historial (para mostrar "fotos de
esta etapa" en el timeline visual).
"""
import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class ImagenExpediente(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "imagenes_expediente"

    expediente_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("expedientes.id", ondelete="CASCADE"), nullable=False
    )
    historial_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("historial_expediente.id", ondelete="SET NULL"), nullable=True
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)

    expediente: Mapped["Expediente"] = relationship(back_populates="imagenes")
    historial: Mapped["HistorialExpediente"] = relationship(back_populates="imagenes")
