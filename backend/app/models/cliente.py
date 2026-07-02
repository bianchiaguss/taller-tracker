"""Modelo de Cliente: datos especificos de la persona dueña de los vehiculos.

Separado de Usuario porque no todo Usuario es necesariamente un Cliente
(el admin/staff del taller tambien es Usuario pero no tiene perfil de Cliente),
y porque Cliente tiene campos propios (DNI, direccion) que no aplican a un admin.
"""
import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class Cliente(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "clientes"

    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    dni_cuit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    direccion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telefono_alternativo: Mapped[str | None] = mapped_column(String(30), nullable=True)
    # Preferencias de notificación
    notif_email: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default='1')
    notif_whatsapp: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default='0')

    usuario: Mapped["Usuario"] = relationship(back_populates="cliente")
    vehiculos: Mapped[list["Vehiculo"]] = relationship(
        back_populates="cliente", cascade="all, delete-orphan"
    )
