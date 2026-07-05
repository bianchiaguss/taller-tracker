"""Servicio único de envío de correos (Brevo API HTTP).

- Toda la app envía emails a través de este módulo (no hay lógica de envío
  repetida en los controladores).
- Usa la API HTTP de Brevo (puerto 443): Render bloquea SMTP saliente en el
  plan free, por eso no se usa smtplib.
- Sin BREVO_API_KEY configurada, simula el envío (log) para no romper en dev.
- Reintenta ante fallos y nunca propaga la excepción: un email caído no debe
  transformar una operación exitosa en un error.
- Migrar de proveedor = cambiar este módulo + variables de entorno.
"""
import logging
import time
from pathlib import Path

import httpx
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings

logger = logging.getLogger("email")

_BREVO_URL = "https://api.brevo.com/v3/smtp/email"

_TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates" / "email"
_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)


def render(template: str, **contexto) -> str:
    return _env.get_template(template).render(**contexto)


def send_email(destinatario: str, asunto: str, html: str, reintentos: int = 3) -> bool:
    """Envía un email HTML vía la API de Brevo. Devuelve True si se envió. Nunca lanza."""
    if not settings.BREVO_API_KEY:
        logger.info("[EMAIL SIMULADO] Para: %s | Asunto: %s", destinatario, asunto)
        return False

    payload = {
        "sender": {"name": settings.EMAIL_FROM_NAME, "email": settings.EMAIL_FROM_EMAIL},
        "to": [{"email": destinatario}],
        "subject": asunto,
        "htmlContent": html,
    }
    headers = {
        "api-key": settings.BREVO_API_KEY,
        "accept": "application/json",
        "content-type": "application/json",
    }
    for intento in range(1, reintentos + 1):
        try:
            resp = httpx.post(_BREVO_URL, json=payload, headers=headers, timeout=15)
            resp.raise_for_status()
            logger.info("Email enviado a %s | %s", destinatario, asunto)
            return True
        except Exception:
            logger.exception("Fallo al enviar email a %s (intento %s/%s)", destinatario, intento, reintentos)
            if intento < reintentos:
                time.sleep(2 * intento)
    return False


def enviar_notificacion(ctx: dict, evento) -> bool:
    """Renderiza la plantilla de notificación con el contexto y la envía."""
    html = render(
        "notificacion.html",
        titulo=evento.titulo,
        descripcion=evento.descripcion,
        cta_texto=evento.cta_texto,
        cliente=ctx["nombre"],
        vehiculo=ctx["vehiculo"],
        patente=ctx["patente"],
        estado=ctx["estado"],
        numero=ctx["numero_expediente"],
        fecha_hora=ctx["fecha_hora"],
        url=ctx["url"],
        taller=ctx["taller"],
    )
    return send_email(ctx["email"], evento.asunto, html)
