"""Correos de solicitudes de presupuesto.

Usan exactamente el mismo layout base (templates/email/base.html) que los
correos del expediente: solo cambia el contenido. Así todo lo que sale de la
plataforma se ve como un correo oficial de Bianchi Detailing.
"""
import logging
from urllib.parse import quote

from app.services import email_service
from app.services.notifications import _taller

logger = logging.getLogger("email")


def _fecha(dt) -> str:
    try:
        return dt.strftime("%d/%m/%Y")
    except Exception:
        return "—"


def _whatsapp_url(telefono, mensaje) -> str | None:
    """Link wa.me hacia el taller, con mensaje pre-cargado. None si no hay teléfono."""
    d = "".join(c for c in str(telefono or "") if c.isdigit())
    if not d:
        return None
    if not d.startswith("54") and len(d) <= 10:
        d = "54" + d
    return f"https://wa.me/{d}?text={quote(mensaje)}"


def _contexto(solicitud, titulo: str) -> dict:
    return {
        "titulo": titulo,
        "cliente": solicitud.nombre,
        "marca": solicitud.marca,
        "modelo": solicitud.modelo,
        "anio": solicitud.anio,
        "patente": solicitud.patente,
        "fecha": _fecha(solicitud.created_at),
        "taller": _taller(),
    }


def notificar_nueva_solicitud(solicitud) -> None:
    ctx = _contexto(solicitud, "Solicitud de presupuesto recibida")
    html = email_service.render("presupuesto_solicitud.html", **ctx)
    email_service.send_email(
        solicitud.email,
        f"Solicitud de presupuesto recibida — {solicitud.marca} {solicitud.modelo}",
        html,
    )


def notificar_respuesta_presupuesto(solicitud) -> None:
    ctx = _contexto(solicitud, "Tu presupuesto ya tiene una respuesta")
    ctx["respuesta"] = solicitud.respuesta or ""
    ctx["whatsapp_url"] = _whatsapp_url(
        ctx["taller"].get("telefono"),
        f"Hola, quiero consultar por el presupuesto de mi {solicitud.marca} {solicitud.modelo}.",
    )
    html = email_service.render("presupuesto_respuesta.html", **ctx)
    email_service.send_email(
        solicitud.email,
        f"Respuesta a tu solicitud de presupuesto — {solicitud.marca} {solicitud.modelo}",
        html,
    )
