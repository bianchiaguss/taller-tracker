"""Modelo de Vehiculo."""
import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class Vehiculo(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "vehiculos"

    cliente_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False
    )
    marca: Mapped[str] = mapped_column(String(100), nullable=False)
    modelo: Mapped[str] = mapped_column(String(100), nullable=False)
    anio: Mapped[int | None] = mapped_column(Integer, nullable=True)
    patente: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    vin: Mapped[str | None] = mapped_column(String(50), nullable=True)
    kilometraje: Mapped[int | None] = mapped_column(Integer, nullable=True)
    es_principal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="0")

    cliente: Mapped["Cliente"] = relationship(back_populates="vehiculos")
    expedientes: Mapped[list["Expediente"]] = relationship(
        back_populates="vehiculo", cascade="all, delete-orphan"
    )
