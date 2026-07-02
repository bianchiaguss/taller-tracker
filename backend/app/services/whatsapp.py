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
        else:
            logger.warning("WHATSAPP_BACKEND desconocido: %s", backend)
    except Exception:
        logger.exception("Error enviando WhatsApp a %s", telefono)
        # No propagar — un fallo de WA no debe romper la operación principal
