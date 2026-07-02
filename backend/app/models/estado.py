"""Catalogo de estados configurables del proceso de reparacion.

El admin del taller puede crear/editar/reordenar estos estados
(ej: Ingreso, Diagnostico, Desarme, Chapa, Pintura, Armado, Pulido,
Control de calidad, Listo para entrega, Entregado). El campo `orden`
define la posicion en el timeline visual.
"""
from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class EstadoExpediente(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "estados_expediente"

    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    orden: Mapped[int] = mapped_column(Integer, nullable=False)
    color: Mapped[str] = mapped_column(String(20), default="#2563EB")  # color hex para la UI
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    es_estado_final: Mapped[bool] = mapped_column(Boolean, default=False)  # ej: "Entregado"
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
