"""
Motor central de eventos y notificaciones.

Uso:
    from app.services.events import EventBus
    EventBus.emit("cambio_estado", expediente=exp, actor=usuario, extra={...})

Agregar un handler nuevo:
    @EventBus.on("mi_evento")
    def handler(expediente, actor, extra): ...
"""
import logging
from collections import defaultdict
from typing import Any

from app.core.config import settings

logger = logging.getLogger("events")

# ──────────────────────────────────────────────────────────────────────────────
# Registry interno
# ──────────────────────────────────────────────────────────────────────────────
_handlers: dict[str, list] = defaultdict(list)


class EventBus:
    @staticmethod
    def on(event_type: str):
        """Decorador para registrar un handler."""
        def decorator(fn):
            _handlers[event_type].append(fn)
            return fn
        return decorator

    @staticmethod
    def emit(event_type: str, **kwargs) -> None:
        """Dispara todos los handlers registrados para el evento.
        Los errores en un handler no afectan a los demás.
        """
        for handler in _handlers.get(event_type, []):
            try:
                handler(**kwargs)
            except Exception:
                logger.exception("Error en handler %s para evento %s", handler.__name__, event_type)


# ──────────────────────────────────────────────────────────────────────────────
# Helpers de contexto comunes
# ──────────────────────────────────────────────────────────────────────────────

def _get_cliente_notif(expediente) -> dict[str, Any]:
    """Extrae datos del cliente y sus preferencias de notificación."""
    vehiculo_obj = expediente.vehiculo
    cliente_obj = vehiculo_obj.cliente
    usuario_obj = cliente_obj.usuario
    return {
        "nombre": usuario_obj.nombre,
        "email": usuario_obj.email,
        "telefono": usuario_obj.telefono,
        "notif_email": getattr(cliente_obj, "notif_email", True),
        "notif_whatsapp": getattr(cliente_obj, "notif_whatsapp", False),
        "vehiculo": f"{vehiculo_obj.marca} {vehiculo_obj.modelo}",
        "patente": vehiculo_obj.patente,
        "numero_expediente": expediente.numero_expediente,
        "url_seguimiento": f"{settings.FRONTEND_URL}/mis-expedientes/{expediente.id}",
    }


def _fmt_fecha(d) -> str | None:
    if d is None:
        return None
    return d.strftime("%d/%m/%Y")


# ──────────────────────────────────────────────────────────────────────────────
# Handlers — cambio de estado
# ──────────────────────────────────────────────────────────────────────────────

@EventBus.on("cambio_estado")
def _email_cambio_estado(expediente, actor, extra: dict):
    from app.services.templates import template_cambio_estado
    from app.services.email import _enviar

    ctx = _get_cliente_notif(expediente)
    if not ctx["notif_email"]:
        return
    asunto, html = template_cambio_estado(
        nombre=ctx["nombre"],
        vehiculo=ctx["vehiculo"],
        patente=ctx["patente"],
        numero_expediente=ctx["numero_expediente"],
        nuevo_estado=extra.get("nuevo_estado", ""),
        fecha_estimada=_fmt_fecha(expediente.fecha_estimada_entrega),
        url_seguimiento=ctx["url_seguimiento"],
    )
    _enviar(ctx["email"], asunto, html)


@EventBus.on("cambio_estado")
def _whatsapp_cambio_estado(expediente, actor, extra: dict):
    from app.services.whatsapp import enviar_whatsapp

    ctx = _get_cliente_notif(expediente)
    if not ctx["notif_whatsapp"]:
        return
    fecha = f"\n📅 Entrega estimada: {_fmt_fecha(expediente.fecha_estimada_entrega)}" if expediente.fecha_estimada_entrega else ""
    mensaje = (
        f"🔄 *TallerTrack* — Actualización de expediente\n\n"
        f"Hola {ctx['nombre']}, tu *{ctx['vehiculo']}* ({ctx['patente']}) "
        f"avanzó a la etapa: *{extra.get('nuevo_estado', '')}*{fecha}\n\n"
        f"📋 Expediente: {ctx['numero_expediente']}\n"
        f"🔗 {ctx['url_seguimiento']}"
    )
    enviar_whatsapp(ctx["telefono"], mensaje)


# ──────────────────────────────────────────────────────────────────────────────
# Handlers — cambio de fecha estimada
# ──────────────────────────────────────────────────────────────────────────────

@EventBus.on("cambio_fecha_estimada")
def _email_cambio_fecha(expediente, actor, extra: dict):
    from app.services.templates import template_cambio_fecha
    from app.services.email import _enviar

    ctx = _get_cliente_notif(expediente)
    if not ctx["notif_email"]:
        return
    asunto, html = template_cambio_fecha(
        nombre=ctx["nombre"],
        vehiculo=ctx["vehiculo"],
        patente=ctx["patente"],
        numero_expediente=ctx["numero_expediente"],
        fecha_anterior=extra.get("fecha_anterior"),
        fecha_nueva=extra.get("fecha_nueva"),
        motivo=extra.get("motivo", ""),
        url_seguimiento=ctx["url_seguimiento"],
    )
    _enviar(ctx["email"], asunto, html)


@EventBus.on("cambio_fecha_estimada")
def _whatsapp_cambio_fecha(expediente, actor, extra: dict):
    from app.services.whatsapp import enviar_whatsapp

    ctx = _get_cliente_notif(expediente)
    if not ctx["notif_whatsapp"]:
        return
    ant = extra.get("fecha_anterior") or "Sin fecha"
    nueva = extra.get("fecha_nueva") or "Sin definir"
    mensaje = (
        f"📅 *TallerTrack* — Cambio de fecha de entrega\n\n"
        f"Hola {ctx['nombre']}, la fecha estimada de entrega de tu "
        f"*{ctx['vehiculo']}* fue actualizada.\n\n"
        f"Anterior: {ant}\nNueva: *{nueva}*\n"
        f"Motivo: {extra.get('motivo', '')}\n\n"
        f"📋 {ctx['numero_expediente']}\n🔗 {ctx['url_seguimiento']}"
    )
    enviar_whatsapp(ctx["telefono"], mensaje)


# ──────────────────────────────────────────────────────────────────────────────
# Handlers — nuevo documento visible al cliente
# ──────────────────────────────────────────────────────────────────────────────

@EventBus.on("nuevo_documento")
def _email_nuevo_documento(expediente, actor, extra: dict):
    from app.services.templates import template_nuevo_documento
    from app.services.email import _enviar

    ctx = _get_cliente_notif(expediente)
    if not ctx["notif_email"]:
        return
    from app.models.documento import LABELS_TIPO
    tipo_label = LABELS_TIPO.get(extra.get("tipo", "otro"), "Documento")
    asunto, html = template_nuevo_documento(
        nombre=ctx["nombre"],
        vehiculo=ctx["vehiculo"],
        patente=ctx["patente"],
        numero_expediente=ctx["numero_expediente"],
        nombre_documento=extra.get("nombre_documento", ""),
        tipo_documento=tipo_label,
        url_seguimiento=ctx["url_seguimiento"],
    )
    _enviar(ctx["email"], asunto, html)


@EventBus.on("nuevo_documento")
def _whatsapp_nuevo_documento(expediente, actor, extra: dict):
    from app.services.whatsapp import enviar_whatsapp

    ctx = _get_cliente_notif(expediente)
    if not ctx["notif_whatsapp"]:
        return
    mensaje = (
        f"📄 *TallerTrack* — Nuevo documento\n\n"
        f"Hola {ctx['nombre']}, el taller subió un nuevo documento "
        f"para tu *{ctx['vehiculo']}*: *{extra.get('nombre_documento', '')}*\n\n"
        f"📋 {ctx['numero_expediente']}\n🔗 {ctx['url_seguimiento']}"
    )
    enviar_whatsapp(ctx["telefono"], mensaje)


# ──────────────────────────────────────────────────────────────────────────────
# Handlers — trabajo finalizado
# ──────────────────────────────────────────────────────────────────────────────

@EventBus.on("trabajo_finalizado")
def _email_trabajo_finalizado(expediente, actor, extra: dict):
    from app.services.templates import template_trabajo_finalizado
    from app.services.email import _enviar

    ctx = _get_cliente_notif(expediente)
    if not ctx["notif_email"]:
        return
    # Reputacion centralizada en Google: preferimos la ficha de Google Maps.
    url_resena = extra.get("google_review_url") or f"{settings.FRONTEND_URL}/resena/{extra.get('token_resena', '')}"
    asunto, html = template_trabajo_finalizado(
        nombre=ctx["nombre"],
        vehiculo=ctx["vehiculo"],
        patente=ctx["patente"],
        numero_expediente=ctx["numero_expediente"],
        url_seguimiento=ctx["url_seguimiento"],
        url_resena=url_resena,
    )
    _enviar(ctx["email"], asunto, html)


@EventBus.on("trabajo_finalizado")
def _whatsapp_trabajo_finalizado(expediente, actor, extra: dict):
    from app.services.whatsapp import enviar_whatsapp

    ctx = _get_cliente_notif(expediente)
    if not ctx["notif_whatsapp"]:
        return
    url_resena = extra.get("google_review_url") or f"{settings.FRONTEND_URL}/resena/{extra.get('token_resena', '')}"
    mensaje = (
        f"✅ *TallerTrack* — ¡Trabajo finalizado!\n\n"
        f"Hola {ctx['nombre']}, tu *{ctx['vehiculo']}* ({ctx['patente']}) "
        f"está listo para retirar. 🎉\n\n"
        f"¡Gracias por confiar en nosotros! Tu opinión nos ayuda a crecer.\n"
        f"⭐ Dejanos tu reseña en Google: {url_resena}\n\n"
        f"📋 {ctx['numero_expediente']}\n"
        f"🔗 Ver seguimiento: {ctx['url_seguimiento']}"
    )
    enviar_whatsapp(ctx["telefono"], mensaje)
