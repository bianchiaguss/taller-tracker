import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_usuario, require_admin
from app.core.config import settings
from app.db.session import get_db
from app.models.cliente import Cliente
from app.models.estado import EstadoExpediente
from app.models.expediente import Expediente
from app.models.historial import HistorialExpediente
from app.models.historial_fecha import HistorialFechaEntrega
from app.models.usuario import RolUsuario, Usuario
from app.models.vehiculo import Vehiculo
from app.schemas.expediente import (
    CambioEstadoRequest,
    ExpedienteCreate,
    ExpedienteDetalleOut,
    ExpedienteOut,
    ExpedienteUpdate,
)
from app.services import notifications

router = APIRouter(prefix="/api/expedientes", tags=["expedientes"])


# ── Schemas locales ──────────────────────────────────────────────────────────

class CambioFechaRequest(BaseModel):
    fecha_nueva: str | None  # ISO date o null para quitar fecha
    motivo: str


class HistorialFechaOut(BaseModel):
    id: uuid.UUID
    fecha_anterior: str | None
    fecha_nueva: str | None
    motivo: str
    usuario_nombre: str
    created_at: str

    class Config:
        from_attributes = True


# ── Helpers ──────────────────────────────────────────────────────────────────

def _generar_numero_expediente(db: Session) -> str:
    anio = datetime.now().year
    cantidad = db.query(Expediente).filter(
        Expediente.numero_expediente.like(f"EXP-{anio}-%")
    ).count()
    return f"EXP-{anio}-{cantidad + 1:04d}"


def _verificar_acceso(actual: Usuario, expediente: Expediente, db: Session):
    if actual.rol == RolUsuario.CLIENTE:
        cliente = db.query(Cliente).filter(Cliente.usuario_id == actual.id).first()
        if not cliente or expediente.vehiculo.cliente_id != cliente.id:
            raise HTTPException(403, "No tenes permiso para ver este expediente")


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("", response_model=list[ExpedienteOut])
def listar_expedientes(db: Session = Depends(get_db), actual: Usuario = Depends(get_current_usuario)):
    query = db.query(Expediente).filter(Expediente.activo == True)
    if actual.rol == RolUsuario.CLIENTE:
        cliente = db.query(Cliente).filter(Cliente.usuario_id == actual.id).first()
        ids = [v.id for v in cliente.vehiculos] if cliente else []
        query = query.filter(Expediente.vehiculo_id.in_(ids))
    return query.order_by(Expediente.created_at.desc()).all()


@router.post("", response_model=ExpedienteOut, status_code=status.HTTP_201_CREATED)
def crear_expediente(data: ExpedienteCreate, db: Session = Depends(get_db), actual: Usuario = Depends(require_admin)):
    if not db.get(Vehiculo, data.vehiculo_id):
        raise HTTPException(404, "Vehiculo no encontrado")
    primer_estado = (
        db.query(EstadoExpediente).filter(EstadoExpediente.activo == True)
        .order_by(EstadoExpediente.orden).first()
    )
    if not primer_estado:
        raise HTTPException(400, "No hay estados configurados.")
    exp = Expediente(
        numero_expediente=_generar_numero_expediente(db),
        estado_actual_id=primer_estado.id,
        **data.model_dump(),
    )
    db.add(exp); db.flush()
    db.add(HistorialExpediente(
        expediente_id=exp.id, estado_id=primer_estado.id,
        usuario_id=actual.id, observacion="Expediente creado",
    ))
    db.commit(); db.refresh(exp)
    notifications.notificar(exp, notifications.expediente_creado(primer_estado.nombre))
    return exp


@router.get("/{expediente_id}", response_model=ExpedienteDetalleOut)
def obtener_expediente(expediente_id: uuid.UUID, db: Session = Depends(get_db), actual: Usuario = Depends(get_current_usuario)):
    exp = db.get(Expediente, expediente_id)
    if not exp: raise HTTPException(404, "Expediente no encontrado")
    _verificar_acceso(actual, exp, db)
    return exp


@router.put("/{expediente_id}", response_model=ExpedienteOut)
def actualizar_expediente(expediente_id: uuid.UUID, data: ExpedienteUpdate, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    exp = db.get(Expediente, expediente_id)
    if not exp: raise HTTPException(404, "Expediente no encontrado")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(exp, k, v)
    db.commit(); db.refresh(exp)
    return exp


@router.delete("/{expediente_id}", status_code=status.HTTP_204_NO_CONTENT)
def borrar_expediente(expediente_id: uuid.UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    exp = db.get(Expediente, expediente_id)
    if not exp: raise HTTPException(404, "Expediente no encontrado")
    db.delete(exp); db.commit()


@router.patch("/{expediente_id}/estado", response_model=ExpedienteDetalleOut)
def cambiar_estado(
    expediente_id: uuid.UUID,
    data: CambioEstadoRequest,
    db: Session = Depends(get_db),
    actual: Usuario = Depends(require_admin),
):
    exp = db.get(Expediente, expediente_id)
    if not exp: raise HTTPException(404, "Expediente no encontrado")
    nuevo_estado = db.get(EstadoExpediente, data.estado_id)
    if not nuevo_estado: raise HTTPException(404, "Estado no encontrado")

    exp.estado_actual_id = nuevo_estado.id
    db.add(HistorialExpediente(
        expediente_id=exp.id, estado_id=nuevo_estado.id,
        usuario_id=actual.id, observacion=data.observacion,
    ))

    if nuevo_estado.es_estado_final:
        exp.fecha_entrega_real = datetime.now().date()
        if not exp.token_resena:
            from app.models.config import ConfiguracionSitio
            token = str(uuid.uuid4())
            exp.token_resena = token
            db.commit(); db.refresh(exp)
            cfg = db.query(ConfiguracionSitio).filter(ConfiguracionSitio.clave == "google_maps_review_url").first()
            url_resena = (cfg.valor if cfg and cfg.valor else f"{settings.FRONTEND_URL}/resena/{token}")
            notifications.notificar(exp, notifications.entregado(url_resena))
            return exp

    db.commit(); db.refresh(exp)
    notifications.notificar(exp, notifications.cambio_estado(nuevo_estado.nombre))
    return exp


@router.patch("/{expediente_id}/fecha-estimada", response_model=ExpedienteDetalleOut)
def cambiar_fecha_estimada(
    expediente_id: uuid.UUID,
    data: CambioFechaRequest,
    db: Session = Depends(get_db),
    actual: Usuario = Depends(require_admin),
):
    from datetime import date as date_type
    exp = db.get(Expediente, expediente_id)
    if not exp: raise HTTPException(404, "Expediente no encontrado")

    fecha_anterior = exp.fecha_estimada_entrega
    fecha_nueva = date_type.fromisoformat(data.fecha_nueva) if data.fecha_nueva else None

    db.add(HistorialFechaEntrega(
        expediente_id=exp.id,
        usuario_id=actual.id,
        fecha_anterior=fecha_anterior,
        fecha_nueva=fecha_nueva,
        motivo=data.motivo,
    ))
    exp.fecha_estimada_entrega = fecha_nueva

    # Crear novedad visible al cliente para que aparezca en su feed
    from app.models.novedad import Novedad
    ant_str = fecha_anterior.strftime("%d/%m/%Y") if fecha_anterior else "sin fecha"
    nueva_str = fecha_nueva.strftime("%d/%m/%Y") if fecha_nueva else "sin fecha"
    db.add(Novedad(
        expediente_id=exp.id,
        usuario_id=actual.id,
        titulo="📅 Fecha de entrega actualizada",
        mensaje=f"La fecha estimada de entrega cambió de {ant_str} a {nueva_str}. Motivo: {data.motivo}",
    ))

    db.commit(); db.refresh(exp)

    def _fmt(d): return d.strftime("%d/%m/%Y") if d else None
    notifications.notificar(exp, notifications.cambio_fecha(_fmt(fecha_anterior), _fmt(fecha_nueva), data.motivo))
    return exp


@router.get("/{expediente_id}/historial-fechas")
def historial_fechas(
    expediente_id: uuid.UUID,
    db: Session = Depends(get_db),
    actual: Usuario = Depends(get_current_usuario),
):
    exp = db.get(Expediente, expediente_id)
    if not exp: raise HTTPException(404, "Expediente no encontrado")
    _verificar_acceso(actual, exp, db)
    registros = (
        db.query(HistorialFechaEntrega)
        .filter(HistorialFechaEntrega.expediente_id == expediente_id)
        .order_by(HistorialFechaEntrega.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(r.id),
            "fecha_anterior": r.fecha_anterior.strftime("%d/%m/%Y") if r.fecha_anterior else None,
            "fecha_nueva": r.fecha_nueva.strftime("%d/%m/%Y") if r.fecha_nueva else None,
            "motivo": r.motivo,
            "usuario_nombre": f"{r.usuario.nombre} {r.usuario.apellido}",
            "created_at": r.created_at.strftime("%d/%m/%Y %H:%M"),
        }
        for r in registros
    ]


class ResenaClienteRequest(BaseModel):
    calificacion: int   # 1-5
    comentario: str


@router.post("/{expediente_id}/mi-resena", status_code=201)
def calificar_expediente(
    expediente_id: uuid.UUID,
    data: ResenaClienteRequest,
    db: Session = Depends(get_db),
    actual: Usuario = Depends(get_current_usuario),
):
    """El cliente califica su propia experiencia desde el portal (sin token)."""
    from datetime import date as date_type
    from app.models.opinion import Opinion

    if actual.rol != RolUsuario.CLIENTE:
        raise HTTPException(403, "Solo los clientes pueden calificar")
    if not (1 <= data.calificacion <= 5):
        raise HTTPException(400, "Calificación debe ser 1-5")

    exp = db.get(Expediente, expediente_id)
    if not exp:
        raise HTTPException(404, "Expediente no encontrado")

    # Verificar que pertenece al cliente
    _verificar_acceso(actual, exp, db)

    if not exp.estado_actual.es_estado_final:
        raise HTTPException(400, "Solo se puede calificar un trabajo finalizado")
    if exp.resena_completada:
        raise HTTPException(409, "Ya calificaste este trabajo")

    nombre = f"{actual.nombre} {actual.apellido}"
    op = Opinion(
        nombre=nombre,
        fecha=date_type.today(),
        calificacion=data.calificacion,
        comentario=data.comentario,
        activo=True,
        fuente="cliente",
    )
    db.add(op)
    exp.resena_completada = True
    db.commit()
    return {"ok": True, "mensaje": "¡Gracias por tu calificación!"}
