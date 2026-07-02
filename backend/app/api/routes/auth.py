import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.api.deps import get_current_usuario
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.cliente import Cliente
from app.models.usuario import RolUsuario, Usuario
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.usuario import UsuarioOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegistroRequest(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    password: str
    telefono: str | None = None


class CambiarPasswordRequest(BaseModel):
    password_actual: str
    password_nuevo: str


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == data.email).first()
    if not usuario or not verify_password(data.password, usuario.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Email o contraseña incorrectos")
    if not usuario.activo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Esta cuenta está desactivada")
    token = create_access_token(data={"sub": str(usuario.id), "rol": usuario.rol.value})
    return TokenResponse(access_token=token, usuario=usuario)


@router.post("/registro", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def registro_cliente(data: RegistroRequest, db: Session = Depends(get_db)):
    """Registro público de clientes desde el sitio web."""
    if db.query(Usuario).filter(Usuario.email == data.email).first():
        raise HTTPException(400, "Ya existe una cuenta con ese email")
    usuario = Usuario(
        email=data.email,
        password_hash=hash_password(data.password),
        nombre=data.nombre,
        apellido=data.apellido,
        telefono=data.telefono,
        rol=RolUsuario.CLIENTE,
    )
    cliente = Cliente(usuario=usuario)
    db.add(usuario); db.add(cliente); db.commit(); db.refresh(usuario)
    token = create_access_token(data={"sub": str(usuario.id), "rol": usuario.rol.value})
    return TokenResponse(access_token=token, usuario=usuario)


@router.get("/me", response_model=UsuarioOut)
def me(usuario: Usuario = Depends(get_current_usuario)):
    return usuario


@router.post("/cambiar-password")
def cambiar_password(
    data: CambiarPasswordRequest,
    db: Session = Depends(get_db),
    actual: Usuario = Depends(get_current_usuario),
):
    if not verify_password(data.password_actual, actual.password_hash):
        raise HTTPException(400, "Contraseña actual incorrecta")
    actual.password_hash = hash_password(data.password_nuevo)
    db.commit()
    return {"ok": True}


class PerfilUpdate(BaseModel):
    nombre: str | None = None
    apellido: str | None = None
    telefono: str | None = None


@router.put("/perfil", response_model=UsuarioOut)
def actualizar_perfil(
    data: PerfilUpdate,
    db: Session = Depends(get_db),
    actual: Usuario = Depends(get_current_usuario),
):
    if data.nombre is not None: actual.nombre = data.nombre
    if data.apellido is not None: actual.apellido = data.apellido
    if data.telefono is not None: actual.telefono = data.telefono
    db.commit(); db.refresh(actual)
    return actual


class PreferenciasNotificacionRequest(BaseModel):
    notif_email: bool
    notif_whatsapp: bool


@router.put("/preferencias-notificacion")
def actualizar_preferencias(
    data: PreferenciasNotificacionRequest,
    db: Session = Depends(get_db),
    actual: Usuario = Depends(get_current_usuario),
):
    cliente = db.query(Cliente).filter(Cliente.usuario_id == actual.id).first()
    if not cliente:
        raise HTTPException(400, "Solo los clientes pueden configurar preferencias de notificación")
    cliente.notif_email = data.notif_email
    cliente.notif_whatsapp = data.notif_whatsapp
    db.commit()
    return {"notif_email": cliente.notif_email, "notif_whatsapp": cliente.notif_whatsapp}


@router.get("/preferencias-notificacion")
def obtener_preferencias(
    db: Session = Depends(get_db),
    actual: Usuario = Depends(get_current_usuario),
):
    cliente = db.query(Cliente).filter(Cliente.usuario_id == actual.id).first()
    if not cliente:
        return {"notif_email": True, "notif_whatsapp": False}
    return {"notif_email": cliente.notif_email, "notif_whatsapp": cliente.notif_whatsapp}
