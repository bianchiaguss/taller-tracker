import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin

ESTADOS_SOLICITUD = ['nueva', 'vista', 'en_contacto', 'convertida', 'descartada']

class SolicitudPresupuesto(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "solicitudes_presupuesto"
    nombre: Mapped[str] = mapped_column(String(100))
    apellido: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255))
    telefono: Mapped[str] = mapped_column(String(30))
    marca: Mapped[str] = mapped_column(String(100))
    modelo: Mapped[str] = mapped_column(String(100))
    anio: Mapped[int | None] = mapped_column(Integer, nullable=True)
    patente: Mapped[str | None] = mapped_column(String(20), nullable=True)
    descripcion_danio: Mapped[str] = mapped_column(Text)
    estado: Mapped[str] = mapped_column(String(30), default="nueva")
    respuesta: Mapped[str | None] = mapped_column(Text, nullable=True)
    respuesta_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    imagenes: Mapped[list["ImagenSolicitud"]] = relationship(
        back_populates="solicitud", cascade="all, delete-orphan"
    )

class ImagenSolicitud(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "imagenes_solicitud"
    solicitud_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("solicitudes_presupuesto.id", ondelete="CASCADE")
    )
    url: Mapped[str] = mapped_column(String(500))
    solicitud: Mapped["SolicitudPresupuesto"] = relationship(back_populates="imagenes")
