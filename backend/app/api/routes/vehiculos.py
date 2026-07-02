import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_usuario, require_admin
from app.db.session import get_db
from app.models.cliente import Cliente
from app.models.usuario import RolUsuario, Usuario
from app.models.vehiculo import Vehiculo
from app.schemas.vehiculo import VehiculoCreate, VehiculoOut, VehiculoUpdate

router = APIRouter(prefix="/api/vehiculos", tags=["vehiculos"])


def _verificar_acceso_cliente(actual: Usuario, cliente_id: uuid.UUID, db: Session):
    if actual.rol == RolUsuario.CLIENTE:
        cliente = db.query(Cliente).filter(Cliente.usuario_id == actual.id).first()
        if not cliente or cliente.id != cliente_id:
            raise HTTPException(status_code=403, detail="No tenes permiso para esta accion")


@router.get("", response_model=list[VehiculoOut])
def listar_vehiculos(
    db: Session = Depends(get_db), actual: Usuario = Depends(get_current_usuario)
):
    query = db.query(Vehiculo)
    if actual.rol == RolUsuario.CLIENTE:
        cliente = db.query(Cliente).filter(Cliente.usuario_id == actual.id).first()
        query = query.filter(Vehiculo.cliente_id == cliente.id if cliente else None)
    return query.all()


@router.post("", response_model=VehiculoOut, status_code=status.HTTP_201_CREATED)
def crear_vehiculo(
    data: VehiculoCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)
):
    if not db.get(Cliente, data.cliente_id):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    vehiculo = Vehiculo(**data.model_dump())
    db.add(vehiculo)
    db.commit()
    db.refresh(vehiculo)
    return vehiculo


@router.get("/{vehiculo_id}", response_model=VehiculoOut)
def obtener_vehiculo(
    vehiculo_id: uuid.UUID, db: Session = Depends(get_db), actual: Usuario = Depends(get_current_usuario)
):
    vehiculo = db.get(Vehiculo, vehiculo_id)
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehiculo no encontrado")
    _verificar_acceso_cliente(actual, vehiculo.cliente_id, db)
    return vehiculo


@router.put("/{vehiculo_id}", response_model=VehiculoOut)
def actualizar_vehiculo(
    vehiculo_id: uuid.UUID,
    data: VehiculoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    vehiculo = db.get(Vehiculo, vehiculo_id)
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehiculo no encontrado")
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(vehiculo, campo, valor)
    db.commit()
    db.refresh(vehiculo)
    return vehiculo
