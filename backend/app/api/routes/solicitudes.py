import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.api.deps import require_admin
from app.db.session import get_db
from app.models.solicitud import ImagenSolicitud, SolicitudPresupuesto
from app.models.usuario import Usuario
from app.schemas.solicitud import SolicitudCreate, SolicitudOut, SolicitudUpdate
from app.services.storage import guardar_imagen_solicitud
from app.services.email import notificar_nueva_solicitud, notificar_respuesta_presupuesto

router = APIRouter(prefix="/api/presupuestos", tags=["presupuestos"])


@router.post("", response_model=SolicitudOut, status_code=status.HTTP_201_CREATED)
def crear_solicitud(data: SolicitudCreate, db: Session = Depends(get_db)):
    solicitud = SolicitudPresupuesto(**data.model_dump())
    db.add(solicitud); db.commit(); db.refresh(solicitud)
    notificar_nueva_solicitud(data.email, data.nombre, data.marca, data.modelo)
    return solicitud


@router.post("/{solicitud_id}/imagenes", response_model=SolicitudOut)
def subir_imagen_solicitud(solicitud_id: uuid.UUID, archivo: UploadFile = File(...), db: Session = Depends(get_db)):
    s = db.get(SolicitudPresupuesto, solicitud_id)
    if not s: raise HTTPException(404, "Solicitud no encontrada")
    try:
        url = guardar_imagen_solicitud(archivo, solicitud_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    db.add(ImagenSolicitud(solicitud_id=solicitud_id, url=url))
    db.commit(); db.refresh(s)
    return s


@router.get("", response_model=list[SolicitudOut])
def listar_solicitudes(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    return db.query(SolicitudPresupuesto).order_by(SolicitudPresupuesto.created_at.desc()).all()


@router.get("/{solicitud_id}", response_model=SolicitudOut)
def obtener_solicitud(solicitud_id: uuid.UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    s = db.get(SolicitudPresupuesto, solicitud_id)
    if not s: raise HTTPException(404, "Solicitud no encontrada")
    return s


@router.patch("/{solicitud_id}", response_model=SolicitudOut)
def actualizar_solicitud(
    solicitud_id: uuid.UUID,
    data: SolicitudUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    s = db.get(SolicitudPresupuesto, solicitud_id)
    if not s: raise HTTPException(404, "Solicitud no encontrada")

    if data.estado is not None:
        s.estado = data.estado

    if data.respuesta is not None:
        s.respuesta = data.respuesta
        s.respuesta_at = datetime.now(timezone.utc)
        if s.estado == "nueva":
            s.estado = "en_contacto"
        # Notificar al cliente
        notificar_respuesta_presupuesto(
            email_destino=s.email,
            nombre=s.nombre,
            marca=s.marca,
            modelo=s.modelo,
            respuesta=data.respuesta,
        )

    db.commit(); db.refresh(s)
    return s
