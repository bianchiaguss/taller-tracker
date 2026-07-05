"""
Integración con WhatsApp Business API (Evolution API / Meta Cloud API).

Para activar: configurar en .env las variables:
  WHATSAPP_BACKEND=evolution   # "evolution" o "meta"
  WHATSAPP_API_URL=https://...
  WHATSAPP_API_KEY=...
  WHATSAPP_INSTANCE=...        # solo Evolution API

El servicio recibe texto plano y lo adapta al formato de cada proveedor.
Cuando el cliente no tiene WhatsApp habilitado o no hay credenciales,
la llamada es silenciosa (solo log).
"""
import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger("whatsapp")


def _telefono_a_jid(telefono: str) -> str:
    """Normaliza el número a formato JID de WhatsApp: sólo dígitos + @s.whatsapp.net."""
    limpio = "".join(c for c in telefono if c.isdigit())
    # Asumir Argentina si no tiene código de país
    if limpio.startswith("0"):
        limpio = "54" + limpio[1:]
    elif not limpio.startswith("54") and len(limpio) <= 10:
        limpio = "54" + limpio
    return f"{limpio}@s.whatsapp.net"


def _enviar_evolution(telefono: str, mensaje: str) -> None:
    """Evolution API (self-hosted)."""
    import httpx
    url = f"{settings.WHATSAPP_API_URL}/message/sendText/{settings.WHATSAPP_INSTANCE}"
    payload = {
        "number": _telefono_a_jid(telefono),
        "options": {"delay": 500, "presence": "composing"},
        "textMessage": {"text": mensaje},
    }
    httpx.post(
        url,
        json=payload,
        headers={"apikey": settings.WHATSAPP_API_KEY},
        timeout=10,
    ).raise_for_status()


def _enviar_meta(telefono: str, mensaje: str) -> None:
    """Meta Cloud API (oficial)."""
    import httpx
    # Normalizar sin JID para Meta
    limpio = "".join(c for c in telefono if c.isdigit())
    if not limpio.startswith("54") and len(limpio) <= 10:
        limpio = "54" + limpio
    url = f"https://graph.facebook.com/v18.0/{settings.WHATSAPP_PHONE_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": limpio,
        "type": "text",
        "text": {"body": mensaje},
    }
    httpx.post(
        url,
        json=payload,
        headers={"Authorization": f"Bearer {settings.WHATSAPP_API_KEY}"},
        timeout=10,
    ).raise_for_status()


def _enviar_callmebot(telefono: str, mensaje: str) -> None:
    """CallMeBot (gratis, para DEMO). Solo envía a números que activaron el bot:
    cada número debe registrar su propia apikey escribiéndole al bot una vez."""
    import httpx
    limpio = "".join(c for c in telefono if c.isdigit())
    if limpio.startswith("0"):
        limpio = "54" + limpio[1:]
    elif not limpio.startswith("54") and len(limpio) <= 10:
        limpio = "54" + limpio
    # WhatsApp Argentina usa el 9 tras el código de país (54 9 <area> <numero>)
    if limpio.startswith("54") and not limpio.startswith("549"):
        limpio = "549" + limpio[2:]
    httpx.get(
        "https://api.callmebot.com/whatsapp.php",
        params={"phone": limpio, "text": mensaje, "apikey": settings.WHATSAPP_API_KEY},
        timeout=15,
    ).raise_for_status()


def enviar_notificacion(ctx: dict, evento) -> None:
    """Canal WhatsApp del sistema de notificaciones: arma el texto desde la
    misma Notificacion que usa el email y delega en `enviar_whatsapp`."""
    mensaje = (
        f"*{evento.titulo}*\n\n"
        f"Hola {ctx['nombre']}, {evento.descripcion}\n\n"
        f"🚗 {ctx['vehiculo']} ({ctx['patente']})\n"
        f"📋 {ctx['numero_expediente']} · {ctx['estado']}\n"
        f"🔗 {ctx['url']}"
    )
    enviar_whatsapp(ctx["telefono"], mensaje)


def enviar_whatsapp(telefono: str | None, mensaje: str) -> None:
    """Punto de entrada principal. Silencioso si no hay configuración."""
    if not telefono:
        logger.debug("WhatsApp: sin teléfono configurado, omitiendo.")
        return

    backend = getattr(settings, "WHATSAPP_BACKEND", None)
    api_url = getattr(settings, "WHATSAPP_API_URL", None)
    api_key = getattr(settings, "WHATSAPP_API_KEY", None)

    if not backend or not api_key:
        logger.info("[WHATSAPP SIMULADO] Para: %s\n%s", telefono, mensaje)
        return

    try:
        if backend == "evolution":
            _enviar_evolution(telefono, mensaje)
        elif backend == "meta":
            _enviar_meta(telefono, mensaje)
        elif backend == "callmebot":
            _enviar_callmebot(telefono, mensaje)
            logger.info("WhatsApp enviado a %s", telefono)
        else:
            logger.warning("WHATSAPP_BACKEND desconocido: %s", backend)
    except Exception:
        logger.exception("Error enviando WhatsApp a %s", telefono)
        # No propagar — un fallo de WA no debe romper la operación principal
