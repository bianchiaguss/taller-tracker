import uuid
from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin

TIPOS_DOCUMENTO = [
    "presupuesto", "factura", "comprobante_pago", "sena",
    "orden_reparacion", "informe_tecnico", "seguro", "garantia", "otro"
]

LABELS_TIPO = {
    "presupuesto": "Presupuesto",
    "factura": "Factura",
    "comprobante_pago": "Comprobante de pago",
    "sena": "Seña / Depósito",
    "orden_reparacion": "Orden de reparación",
    "informe_tecnico": "Informe técnico",
    "seguro": "Documentación de seguro",
    "garantia": "Garantía",
    "otro": "Otro",
}

class Documento(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "documentos"
    expediente_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("expedientes.id", ondelete="CASCADE")
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id")
    )
    nombre: Mapped[str] = mapped_column(String(255))
    tipo: Mapped[str] = mapped_column(String(50), default="otro")
    url: Mapped[str] = mapped_column(String(500))
    extension: Mapped[str | None] = mapped_column(String(10), nullable=True)
    tamano_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    visible_cliente: Mapped[bool] = mapped_column(Boolean, default=False)
    expediente: Mapped["Expediente"] = relationship(back_populates="documentos")
    usuario: Mapped["Usuario"] = relationship()
