from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin

class GaleriaTrabajo(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "galeria_trabajos"
    marca: Mapped[str] = mapped_column(String(100))
    modelo: Mapped[str] = mapped_column(String(100))
    anio: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tipo_reparacion: Mapped[str] = mapped_column(String(150))
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    imagen_antes: Mapped[str] = mapped_column(String(500))
    imagen_despues: Mapped[str] = mapped_column(String(500))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    orden: Mapped[int] = mapped_column(Integer, default=0)
