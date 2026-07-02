import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.expediente import Expediente
from app.models.imagen import ImagenExpediente
from app.models.usuario import Usuario
from app.schemas.expediente import ImagenOut
from app.services.storage import guardar_imagen

router = APIRouter(prefix="/api/expedientes/{expediente_id}/imagenes", tags=["imagenes"])


@router.post("", response_model=ImagenOut, status_code=status.HTTP_201_CREATED)
def subir_imagen(
    expediente_id: uuid.UUID,
    archivo: UploadFile = File(...),
    descripcion: str | None = Form(None),
    historial_id: uuid.UUID | None = Form(None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    if not db.get(Expediente, expediente_id):
        raise HTTPException(status_code=404, detail="Expediente no encontrado")

    try:
        url = guardar_imagen(archivo, expediente_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    imagen = ImagenExpediente(
        expediente_id=expediente_id,
        historial_id=historial_id,
        url=url,
        descripcion=descripcion,
    )
    db.add(imagen)
    db.commit()
    db.refresh(imagen)
    return imagen
