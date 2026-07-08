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


def _norm_patente(p: str) -> str:
    """Sin espacios y en mayúsculas, para que la unicidad sea consistente."""
    return "".join((p or "").split()).upper()


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
    valores = data.model_dump()
    valores["patente"] = _norm_patente(valores["patente"])
    if db.query(Vehiculo).filter(Vehiculo.patente == valores["patente"]).first():
        raise HTTPException(status_code=400, detail="Ya existe un vehículo con esa patente")
    vehiculo = Vehiculo(**valores)
    # El primer vehiculo del cliente queda como principal automaticamente.
    ya_tiene = db.query(Vehiculo).filter(Vehiculo.cliente_id == data.cliente_id).count()
    if ya_tiene == 0:
        vehiculo.es_principal = True
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
    cambios = data.model_dump(exclude_unset=True)
    if cambios.get("patente") is not None:
        cambios["patente"] = _norm_patente(cambios["patente"])
        dup = db.query(Vehiculo).filter(
            Vehiculo.patente == cambios["patente"], Vehiculo.id != vehiculo_id
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail="Ya existe un vehículo con esa patente")
    for campo, valor in cambios.items():
        setattr(vehiculo, campo, valor)
    db.commit()
    db.refresh(vehiculo)
    return vehiculo


@router.post("/{vehiculo_id}/principal", response_model=VehiculoOut)
def marcar_principal(
    vehiculo_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    """Marca este vehiculo como principal y desmarca los demas del mismo cliente."""
    vehiculo = db.get(Vehiculo, vehiculo_id)
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehiculo no encontrado")
    db.query(Vehiculo).filter(Vehiculo.cliente_id == vehiculo.cliente_id).update(
        {Vehiculo.es_principal: False}
    )
    vehiculo.es_principal = True
    db.commit()
    db.refresh(vehiculo)
    return vehiculo


@router.delete("/{vehiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
def borrar_vehiculo(
    vehiculo_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    """Elimina el vehiculo y (por cascade) sus expedientes asociados."""
    vehiculo = db.get(Vehiculo, vehiculo_id)
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehiculo no encontrado")
    era_principal = vehiculo.es_principal
    cliente_id = vehiculo.cliente_id
    db.delete(vehiculo)
    db.flush()
    # Si borramos el principal y quedan otros, promover al mas antiguo.
    if era_principal:
        sig = (
            db.query(Vehiculo)
            .filter(Vehiculo.cliente_id == cliente_id)
            .order_by(Vehiculo.created_at.asc())
            .first()
        )
        if sig:
            sig.es_principal = True
    db.commit()
