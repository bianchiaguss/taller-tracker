"""Sistema de notificaciones desacoplado.

Cada evento del dominio genera una `Notificacion` y `notificar()` la despacha
a cada canal (Email hoy; WhatsApp / Push preparados). Agregar un canal nuevo =
agregar un bloque en `notificar()`. Agregar un evento nuevo = agregar un
builder abajo. Los controladores no arman contenido ni envían: solo llaman a
`notificar(expediente, evento_x(...))`.
"""
import logging
from dataclasses import dataclass
from datetime import datetime

from app.core.config import settings
from app.services import email_service

logger = logging.getLogger("notifications")


@dataclass
class Notificacion:
    asunto: str
    titulo: str
    descripcion: str
    cta_texto: str = "Ver mi expediente"


def _taller() -> dict:
    """Datos del taller para el footer (desde ConfiguracionSitio)."""
    from app.db.base import SessionLocal
    from app.models.config import ConfiguracionSitio
    cfg = {}
    db = SessionLocal()
    try:
        cfg = {r.clave: r.valor for r in db.query(ConfiguracionSitio).all()}
    except Exception:
        logger.exception("No se pudo leer la configuración del taller")
    finally:
        db.close()
    return {
        "nombre": cfg.get("nombre_taller") or "Bianchi Detailing",
        "telefono": cfg.get("telefono"),
        "email": cfg.get("email"),
        "direccion": cfg.get("direccion"),
        "horarios": cfg.get("horarios"),
    }


def _contexto(expediente) -> dict:
    vehiculo = expediente.vehiculo
    cliente = vehiculo.cliente
    usuario = cliente.usuario
    return {
        "nombre": usuario.nombre,
        "email": usuario.email,
        "telefono": usuario.telefono,
        "notif_email": getattr(cliente, "notif_email", True),
        "notif_whatsapp": getattr(cliente, "notif_whatsapp", False),
        "vehiculo": f"{vehiculo.marca} {vehiculo.modelo}",
        "patente": vehiculo.patente,
        "estado": expediente.estado_actual.nombre if expediente.estado_actual else "—",
        "numero_expediente": expediente.numero_expediente,
        "url": f"{settings.FRONTEND_URL}/mis-expedientes/{expediente.id}",
        "fecha_hora": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "taller": _taller(),
    }


def notificar(expediente, evento: Notificacion) -> None:
    """Despacha la notificación a todos los canales. Nunca lanza."""
    try:
        ctx = _contexto(expediente)
    except Exception:
        logger.exception("No se pudo construir el contexto de notificación")
        return

    # Canal: Email
    try:
        if ctx["notif_email"] and ctx["email"]:
            email_service.enviar_notificacion(ctx, evento)
    except Exception:
        logger.exception("Error en el canal Email")

    # Canal: WhatsApp (futuro — Evolution API / WhatsApp Business)
    try:
        if ctx["notif_whatsapp"] and ctx["telefono"]:
            from app.services import whatsapp
            whatsapp.enviar_notificacion(ctx, evento)
    except Exception:
        logger.exception("Error en el canal WhatsApp")

    # Canal: Push (futuro) → agregar aquí


# ── Builders de eventos (contenido centralizado) ──────────────────────────

def expediente_creado(estado: str) -> Notificacion:
    return Notificacion(
        asunto="Recibimos tu vehículo en el taller",
        titulo="Tu vehículo ingresó al taller",
        descripcion="Abrimos el expediente de tu reparación. Vas a poder seguir cada etapa del "
                    "proceso en tiempo real, con fotos y actualizaciones, desde tu portal.",
    )


def cambio_estado(nuevo_estado: str) -> Notificacion:
    n = nuevo_estado.lower()
    if "listo" in n or "entrega" in n:
        return Notificacion(
            asunto="¡Tu vehículo está listo para retirar! 🎉",
            titulo="¡Trabajo finalizado!",
            descripcion="Terminamos el trabajo y tu vehículo ya está listo para que lo vengas a "
                        "retirar. Coordiná con nosotros el día y horario del retiro.",
        )
    return Notificacion(
        asunto=f"Tu vehículo avanzó a: {nuevo_estado}",
        titulo=f"Nueva etapa: {nuevo_estado}",
        descripcion=f"Tu vehículo avanzó a la etapa “{nuevo_estado}”. Ingresá para ver el detalle "
                    "y las fotos del avance.",
    )


def cambio_fecha(anterior: str | None, nueva: str | None, motivo: str) -> Notificacion:
    ant = anterior or "sin fecha"
    nue = nueva or "a definir"
    return Notificacion(
        asunto="Actualizamos la fecha estimada de entrega",
        titulo="Nueva fecha de entrega",
        descripcion=f"La fecha estimada de entrega cambió de {ant} a {nue}. Motivo: {motivo}",
    )


def nueva_foto() -> Notificacion:
    return Notificacion(
        asunto="Nuevas fotos de tu reparación",
        titulo="Se agregaron fotos nuevas",
        descripcion="El taller subió nuevas fotografías del avance de tu vehículo. Entrá para verlas.",
        cta_texto="Ver las fotos",
    )


def nuevo_documento(nombre_documento: str, tipo: str) -> Notificacion:
    return Notificacion(
        asunto=f"Nuevo documento: {nombre_documento}",
        titulo="Nuevo documento disponible",
        descripcion=f"Subimos un nuevo documento a tu expediente: {nombre_documento} ({tipo}).",
        cta_texto="Ver documento",
    )


def entregado(url_resena: str) -> Notificacion:
    return Notificacion(
        asunto="¡Gracias por confiar en nosotros! 🎉",
        titulo="¡Tu vehículo fue entregado!",
        descripcion="Tu vehículo fue entregado. ¡Gracias por elegirnos y confiar en nuestro trabajo! "
                    f"Si quedaste conforme, nos ayudaría muchísimo que nos dejes tu reseña en Google: {url_resena}",
        cta_texto="Ver mi expediente",
    )
