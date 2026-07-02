from datetime import date
from sqlalchemy import Boolean, Date, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin

class Opinion(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "opiniones"
    nombre: Mapped[str] = mapped_column(String(150))
    fecha: Mapped[date] = mapped_column(Date)
    calificacion: Mapped[int] = mapped_column(Integer)   # 1–5
    comentario: Mapped[str] = mapped_column(Text)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    fuente: Mapped[str] = mapped_column(String(30), default="manual")  # futuro: 'google'
