"""Servicio único de envío de correos (Gmail SMTP).

- Toda la app envía emails a través de este módulo (no hay lógica de envío
  repetida en los controladores).
- Sin SMTP_PASSWORD configurada, simula el envío (log) para no romper en dev.
- Reintenta ante fallos y nunca propaga la excepción: un email caído no debe
  transformar una operación exitosa en un error.
- Migrar a dominio propio = cambiar variables de entorno, sin tocar código.
"""
import logging
import smtplib
import ssl
import time
from email.message import EmailMessage
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings

logger = logging.getLogger("email")

_TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates" / "email"
_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)


def render(template: str, **contexto) -> str:
    return _env.get_template(template).render(**contexto)


def send_email(destinatario: str, asunto: str, html: str, reintentos: int = 3) -> bool:
    """Envía un email HTML. Devuelve True si se envió. Nunca lanza."""
    if not settings.SMTP_PASSWORD or not settings.SMTP_EMAIL:
        logger.info("[EMAIL SIMULADO] Para: %s | Asunto: %s", destinatario, asunto)
        return False

    msg = EmailMessage()
    msg["Subject"] = asunto
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = destinatario
    msg.set_content("Este mensaje requiere un cliente de correo compatible con HTML.")
    msg.add_alternative(html, subtype="html")

    contexto_ssl = ssl.create_default_context()
    for intento in range(1, reintentos + 1):
        try:
            with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=15) as servidor:
                servidor.starttls(context=contexto_ssl)
                servidor.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
                servidor.send_message(msg)
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
