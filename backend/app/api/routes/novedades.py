import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.expediente import Expediente
from app.models.novedad import Novedad
from app.models.usuario import Usuario
from app.schemas.novedad import NovedadCreate, NovedadOut

router = APIRouter(prefix="/api/expedientes/{expediente_id}/novedades", tags=["novedades"])


@router.post("", response_model=NovedadOut, status_code=status.HTTP_201_CREATED)
def crear_novedad(
    expediente_id: uuid.UUID,
    data: NovedadCreate,
    db: Session = Depends(get_db),
    actual: Usuario = Depends(require_admin),
):
    if not db.get(Expediente, expediente_id):
        raise HTTPException(status_code=404, detail="Expediente no encontrado")
    novedad = Novedad(expediente_id=expediente_id, usuario_id=actual.id, **data.model_dump())
    db.add(novedad)
    db.commit()
    db.refresh(novedad)
    return novedad
