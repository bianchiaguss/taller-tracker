"""Plantillas HTML reutilizables para notificaciones por email."""
from app.core.config import settings


def _base_template(titulo: str, cuerpo: str, cta_url: str | None = None, cta_texto: str = "Ver seguimiento") -> str:
    cta_html = ""
    if cta_url:
        cta_html = f"""
        <div style="text-align:center;margin:32px 0;">
          <a href="{cta_url}" style="background:#2563EB;color:#fff;padding:14px 28px;
             border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;
             display:inline-block;">{cta_texto}</a>
        </div>"""

    return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:#fff;border-radius:12px;
              overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:#0F172A;padding:24px 32px;display:flex;align-items:center;gap:12px;">
      <div style="width:36px;height:36px;background:#2563EB;border-radius:8px;
                  display:inline-flex;align-items:center;justify-content:center;">
        <span style="color:#fff;font-size:18px;">🔧</span>
      </div>
      <span style="color:#fff;font-weight:700;font-size:17px;">TallerTrack</span>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <h2 style="color:#0F172A;font-size:20px;margin:0 0 16px;">{titulo}</h2>
      {cuerpo}
      {cta_html}
    </div>
    <!-- Footer -->
    <div style="background:#F8FAFC;padding:20px 32px;border-top:1px solid #E2E8F0;">
      <p style="color:#94A3B8;font-size:12px;margin:0;">
        Recibiste este email porque tenés una reparación activa en nuestro taller.<br>
        Si tenés dudas, contactanos directamente.
      </p>
    </div>
  </div>
</body></html>"""


def template_cambio_estado(
    nombre: str, vehiculo: str, patente: str,
    numero_expediente: str, nuevo_estado: str,
    fecha_estimada: str | None, url_seguimiento: str
) -> tuple[str, str]:
    """Devuelve (asunto, html)."""
    asunto = f"🔄 Tu {vehiculo} avanzó de etapa — {numero_expediente}"
    fecha_html = f'<p style="color:#475569;font-size:14px;margin:8px 0;">📅 Entrega estimada: <strong>{fecha_estimada}</strong></p>' if fecha_estimada else ""
    cuerpo = f"""
    <p style="color:#475569;font-size:15px;">Hola <strong>{nombre}</strong>,</p>
    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;color:#1E40AF;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Estado actualizado</p>
      <p style="margin:0;color:#1E3A8A;font-size:18px;font-weight:700;">{nuevo_estado}</p>
    </div>
    <p style="color:#475569;font-size:14px;margin:8px 0;">🚗 Vehículo: <strong>{vehiculo}</strong></p>
    <p style="color:#475569;font-size:14px;margin:8px 0;">🔖 Patente: <strong>{patente}</strong></p>
    <p style="color:#475569;font-size:14px;margin:8px 0;">📋 Expediente: <strong>{numero_expediente}</strong></p>
    {fecha_html}
    """
    return asunto, _base_template(f"Actualización: {nuevo_estado}", cuerpo, url_seguimiento)


def template_cambio_fecha(
    nombre: str, vehiculo: str, patente: str,
    numero_expediente: str, fecha_anterior: str | None,
    fecha_nueva: str | None, motivo: str, url_seguimiento: str
) -> tuple[str, str]:
    asunto = f"📅 Cambio en la fecha de entrega — {numero_expediente}"
    anterior_html = f'<span style="text-decoration:line-through;color:#94A3B8;">{fecha_anterior}</span> →' if fecha_anterior else "Sin fecha →"
    nueva_html = f'<strong style="color:#16A34A;">{fecha_nueva}</strong>' if fecha_nueva else '<strong>Sin definir</strong>'
    cuerpo = f"""
    <p style="color:#475569;font-size:15px;">Hola <strong>{nombre}</strong>,</p>
    <p style="color:#475569;font-size:14px;">La fecha estimada de entrega de tu vehículo fue actualizada:</p>
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:16px;"> {anterior_html} {nueva_html}</p>
    </div>
    <p style="color:#475569;font-size:14px;margin:8px 0;">🚗 Vehículo: <strong>{vehiculo}</strong> — <strong>{patente}</strong></p>
    <p style="color:#475569;font-size:14px;margin:8px 0;">📋 Expediente: <strong>{numero_expediente}</strong></p>
    <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:12px;margin:16px 0;">
      <p style="margin:0;color:#92400E;font-size:13px;"><strong>Motivo:</strong> {motivo}</p>
    </div>
    """
    return asunto, _base_template("Cambio en la fecha de entrega", cuerpo, url_seguimiento)


def template_nuevo_documento(
    nombre: str, vehiculo: str, patente: str,
    numero_expediente: str, nombre_documento: str,
    tipo_documento: str, url_seguimiento: str
) -> tuple[str, str]:
    asunto = f"📄 Nuevo documento disponible — {numero_expediente}"
    cuerpo = f"""
    <p style="color:#475569;font-size:15px;">Hola <strong>{nombre}</strong>,</p>
    <p style="color:#475569;font-size:14px;">El taller subió un nuevo documento a tu expediente:</p>
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin:16px 0;display:flex;align-items:center;gap:12px;">
      <span style="font-size:28px;">📕</span>
      <div>
        <p style="margin:0;font-weight:600;color:#0F172A;">{nombre_documento}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#64748B;">{tipo_documento}</p>
      </div>
    </div>
    <p style="color:#475569;font-size:14px;margin:8px 0;">🚗 Vehículo: <strong>{vehiculo}</strong> — <strong>{patente}</strong></p>
    <p style="color:#475569;font-size:14px;margin:8px 0;">📋 Expediente: <strong>{numero_expediente}</strong></p>
    """
    return asunto, _base_template("Nuevo documento disponible", cuerpo, url_seguimiento)


def template_trabajo_finalizado(
    nombre: str, vehiculo: str, patente: str,
    numero_expediente: str, url_seguimiento: str, url_resena: str
) -> tuple[str, str]:
    asunto = f"✅ ¡Tu {vehiculo} está listo para retirar! — {numero_expediente}"
    cuerpo = f"""
    <p style="color:#475569;font-size:15px;">Hola <strong>{nombre}</strong>,</p>
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:20px;margin:16px 0;text-align:center;">
      <p style="font-size:32px;margin:0;">🎉</p>
      <p style="color:#166534;font-weight:700;font-size:18px;margin:8px 0;">¡Tu vehículo está listo!</p>
      <p style="color:#166534;font-size:14px;margin:0;">Coordiná con el taller para pasar a retirarlo.</p>
    </div>
    <p style="color:#475569;font-size:14px;margin:8px 0;">🚗 Vehículo: <strong>{vehiculo}</strong> — <strong>{patente}</strong></p>
    <p style="color:#475569;font-size:14px;margin:8px 0;">📋 Expediente: <strong>{numero_expediente}</strong></p>
    <hr style="border:none;border-top:1px solid #E2E8F0;margin:20px 0;">
    <p style="color:#64748B;font-size:13px;text-align:center;">
      ¿Cómo fue tu experiencia? 
      <a href="{url_resena}" style="color:#2563EB;font-weight:600;">Dejanos tu opinión</a>
    </p>
    """
    return asunto, _base_template("¡Trabajo finalizado!", cuerpo, url_seguimiento, "Ver mi expediente")
