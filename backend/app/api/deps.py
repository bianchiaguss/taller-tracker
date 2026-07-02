"""Dependencias de FastAPI: usuario autenticado actual y control de roles."""
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.usuario import RolUsuario, Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_usuario(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    usuario_id = payload.get("sub")
    if usuario_id is None:
        raise credentials_exception

    usuario = db.get(Usuario, uuid.UUID(usuario_id))
    if usuario is None or not usuario.activo:
        raise credentials_exception
    return usuario


def require_admin(usuario: Usuario = Depends(get_current_usuario)) -> Usuario:
    if usuario.rol != RolUsuario.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta accion requiere permisos de administrador",
        )
    return usuario
