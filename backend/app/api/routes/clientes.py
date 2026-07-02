import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_usuario, require_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.cliente import Cliente
from app.models.usuario import RolUsuario, Usuario
from app.schemas.cliente import ClienteCreate, ClienteOut, ClienteUpdateCompleto

router = APIRouter(prefix="/api/clientes", tags=["clientes"])


@router.get("", response_model=list[ClienteOut])
def listar_clientes(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    return db.query(Cliente).all()


@router.post("", response_model=ClienteOut, status_code=status.HTTP_201_CREATED)
def crear_cliente(data: ClienteCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    if db.query(Usuario).filter(Usuario.email == data.email).first():
        raise HTTPException(400, "Ya existe un usuario con ese email")
    usuario = Usuario(
        email=data.email, password_hash=hash_password(data.password),
        nombre=data.nombre, apellido=data.apellido, telefono=data.telefono,
        rol=RolUsuario.CLIENTE,
    )
    cliente = Cliente(
        usuario=usuario, dni_cuit=data.dni_cuit,
        direccion=data.direccion, telefono_alternativo=data.telefono_alternativo,
    )
    db.add(usuario); db.add(cliente); db.commit(); db.refresh(cliente)
    return cliente


@router.get("/{cliente_id}", response_model=ClienteOut)
def obtener_cliente(cliente_id: uuid.UUID, db: Session = Depends(get_db), actual: Usuario = Depends(get_current_usuario)):
    cliente = db.get(Cliente, cliente_id)
    if not cliente: raise HTTPException(404, "Cliente no encontrado")
    if actual.rol == RolUsuario.CLIENTE and cliente.usuario_id != actual.id:
        raise HTTPException(403, "Sin permiso")
    return cliente


@router.put("/{cliente_id}", response_model=ClienteOut)
def actualizar_cliente(
    cliente_id: uuid.UUID,
    data: ClienteUpdateCompleto,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    cliente = db.get(Cliente, cliente_id)
    if not cliente: raise HTTPException(404, "Cliente no encontrado")
    usuario = db.get(Usuario, cliente.usuario_id)

    # Actualizar Usuario
    if data.nombre is not None: usuario.nombre = data.nombre
    if data.apellido is not None: usuario.apellido = data.apellido
    if data.telefono is not None: usuario.telefono = data.telefono
    if data.email is not None:
        existente = db.query(Usuario).filter(Usuario.email == data.email).first()
        if existente and existente.id != usuario.id:
            raise HTTPException(400, "Ese email ya está en uso")
        usuario.email = data.email

    # Actualizar Cliente
    if data.dni_cuit is not None: cliente.dni_cuit = data.dni_cuit
    if data.direccion is not None: cliente.direccion = data.direccion
    if data.telefono_alternativo is not None: cliente.telefono_alternativo = data.telefono_alternativo

    db.commit(); db.refresh(cliente)
    return cliente


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def borrar_cliente(cliente_id: uuid.UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_admin)):
    cliente = db.get(Cliente, cliente_id)
    if not cliente: raise HTTPException(404, "Cliente no encontrado")
    # Borrar el Usuario dispara el cascade a Cliente → Vehiculos → Expedientes
    usuario = db.get(Usuario, cliente.usuario_id)
    db.delete(usuario); db.commit()
