"""Modelo de Expediente: el nucleo del sistema.

Une un Vehiculo + un Cliente en un proceso de reparacion con un estado
actual, fechas y datos opcionales de seguro.
"""
import uuid
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class Expediente(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "expedientes"

    numero_expediente: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)

    vehiculo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehiculos.id", ondelete="CASCADE"), nullable=False
    )
    estado_actual_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("estados_expediente.id"), nullable=False
    )

    descripcion_inicial: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_ingreso: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_estimada_entrega: Mapped[date | None] = mapped_column(Date, nullable=True)
    fecha_entrega_real: Mapped[date | None] = mapped_column(Date, nullable=True)
    presupuesto_estimado: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    # Datos de siniestro / aseguradora (opcionales)
    es_siniestro: Mapped[bool] = mapped_column(Boolean, default=False)
    aseguradora: Mapped[str | None] = mapped_column(String(150), nullable=True)
    numero_siniestro: Mapped[str | None] = mapped_column(String(50), nullable=True)

    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    token_resena: Mapped[str | None] = mapped_column(String(36), nullable=True, unique=True, index=True)
    resena_completada: Mapped[bool] = mapped_column(Boolean, default=False)

    vehiculo: Mapped["Vehiculo"] = relationship(back_populates="expedientes")
    estado_actual: Mapped["EstadoExpediente"] = relationship()
    historial: Mapped[list["HistorialExpediente"]] = relationship(
        back_populates="expediente", cascade="all, delete-orphan", order_by="HistorialExpediente.created_at"
    )
    imagenes: Mapped[list["ImagenExpediente"]] = relationship(
        back_populates="expediente", cascade="all, delete-orphan"
    )
    novedades: Mapped[list["Novedad"]] = relationship(
        back_populates="expediente", cascade="all, delete-orphan", order_by="Novedad.created_at.desc()"
    )
    documentos: Mapped[list["Documento"]] = relationship(
        back_populates="expediente", cascade="all, delete-orphan"
    )
    historial_fechas: Mapped[list["HistorialFechaEntrega"]] = relationship(
        back_populates="expediente", cascade="all, delete-orphan"
    )
