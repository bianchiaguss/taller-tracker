import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_usuario, require_admin
from app.db.session import get_db
from app.models.estado import EstadoExpediente
from app.models.usuario import Usuario
from app.schemas.estado import EstadoCreate, EstadoOut, EstadoUpdate

router = APIRouter(prefix="/api/estados", tags=["estados"])


@router.get("", response_model=list[EstadoOut])
def listar_estados(db: Session = Depends(get_db), _: Usuario = Depends(get_current_usuario)):
    """Cualquier usuario autenticado puede leer el catalogo (lo necesita el cliente
    para entender el timeline), pero solo el admin puede modificarlo."""
    return db.query(EstadoExpediente).filter(EstadoExpediente.activo == True).order_by(  # noqa: E712
        EstadoExpediente.orden
    ).all()


@router.post("", response_model=EstadoOut, status_code=status.HTTP_201_CREATED)
def crear_estado(
    data: EstadoCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)
):
    estado = EstadoExpediente(**data.model_dump())
    db.add(estado)
    db.commit()
    db.refresh(estado)
    return estado


@router.put("/{estado_id}", response_model=EstadoOut)
def actualizar_estado(
    estado_id: uuid.UUID,
    data: EstadoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    estado = db.get(EstadoExpediente, estado_id)
    if not estado:
        raise HTTPException(status_code=404, detail="Estado no encontrado")
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(estado, campo, valor)
    db.commit()
    db.refresh(estado)
    return estado


@router.delete("/{estado_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_estado(
    estado_id: uuid.UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)
):
    """No borramos fisicamente: un estado puede estar referenciado en el
    historial de expedientes viejos. Solo lo desactivamos del catalogo activo."""
    estado = db.get(EstadoExpediente, estado_id)
    if not estado:
        raise HTTPException(status_code=404, detail="Estado no encontrado")
    estado.activo = False
    db.commit()
