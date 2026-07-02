import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../api/client'
import {
  ArrowLeft, Camera, CheckCircle2, ShieldCheck,
  Car, Calendar, Upload, CalendarClock, History
} from 'lucide-react'
import SeccionDocumentos from '../../components/SeccionDocumentos'
import { Page, EstadoBadge, Loading, Spinner } from '../../components/ui'

function formatFecha(f) {
  if (!f) return null
  return new Date(f + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ExpedienteDetalle() {
  const { id } = useParams()
  const [exp, setExp] = useState(null)
  const [estados, setEstados] = useState([])
  const [loading, setLoading] = useState(true)

  const [nuevoEstadoId, setNuevoEstadoId] = useState('')
  const [observacion, setObservacion] = useState('')
  const [savingEstado, setSavingEstado] = useState(false)
  const [estadoMsg, setEstadoMsg] = useState(null)

  const [fechaNueva, setFechaNueva] = useState('')
  const [motivoFecha, setMotivoFecha] = useState('')
  const [savingFecha, setSavingFecha] = useState(false)
  const [fechaMsg, setFechaMsg] = useState(null)
  const [historialFechas, setHistorialFechas] = useState([])
  const [showHistFechas, setShowHistFechas] = useState(false)

  const [uploadMsg, setUploadMsg] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    Promise.all([api.get(`/expedientes/${id}`), api.get('/estados')]).then(([e, es]) => {
      setExp(e.data); setEstados(es.data)
    }).finally(() => setLoading(false))
    api.get(`/expedientes/${id}/historial-fechas`).then(r => setHistorialFechas(r.data)).catch(() => {})
  }, [id])

  const handleCambioEstado = async (ev) => {
    ev.preventDefault()
    if (!nuevoEstadoId) return
    setSavingEstado(true); setEstadoMsg(null)
    try {
      const { data } = await api.patch(`/expedientes/${id}/estado`, { estado_id: nuevoEstadoId, observacion: observacion || null })
      setExp(data); setNuevoEstadoId(''); setObservacion('')
      setEstadoMsg({ ok: true, text: 'Estado actualizado. El cliente fue notificado.' })
    } catch (err) {
      setEstadoMsg({ ok: false, text: err.response?.data?.detail || 'Error al cambiar el estado' })
    } finally { setSavingEstado(false) }
  }

  const handleCambioFecha = async (ev) => {
    ev.preventDefault()
    setSavingFecha(true); setFechaMsg(null)
    try {
      const { data } = await api.patch(`/expedientes/${id}/fecha-estimada`, {
        fecha_nueva: fechaNueva || null,
        motivo: motivoFecha,
      })
      setExp(data); setFechaNueva(''); setMotivoFecha('')
      setFechaMsg({ ok: true, text: 'Fecha actualizada. El cliente fue notificado.' })
      api.get(`/expedientes/${id}/historial-fechas`).then(r => setHistorialFechas(r.data)).catch(() => {})
    } catch (err) {
      setFechaMsg({ ok: false, text: err.response?.data?.detail || 'Error al actualizar la fecha' })
    } finally { setSavingFecha(false) }
  }

  const handleUploadImagen = async (ev) => {
    const file = ev.target.files?.[0]; if (!file) return
    const fd = new FormData(); fd.append('archivo', file)
    setUploading(true); setUploadMsg(null)
    try {
      const { data } = await api.post(`/expedientes/${id}/imagenes`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setExp(p => ({ ...p, imagenes: [...p.imagenes, data] }))
      setUploadMsg({ ok: true, text: 'Imagen subida.' })
    } catch (err) {
      setUploadMsg({ ok: false, text: err.response?.data?.detail || 'Error al subir la imagen' })
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  if (loading) return <Loading />
  if (!exp) return <div className="p-8 text-slate-500">Expediente no encontrado.</div>

  const { vehiculo, estado_actual, historial, imagenes } = exp

  return (
    <Page className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Link to="/admin/expedientes" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> Volver a expedientes
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="font-mono text-2xl font-bold text-slate-900 tracking-tight">{exp.numero_expediente}</h1>
            <EstadoBadge color={estado_actual.color}>{estado_actual.nombre}</EstadoBadge>
            {exp.es_siniestro && <span className="badge badge-pendiente"><ShieldCheck size={11} /> Siniestro</span>}
          </div>
          <p className="text-slate-500 text-sm flex items-center gap-1.5">
            <Car size={14} />
            {vehiculo.marca} {vehiculo.modelo}
            {vehiculo.anio && ` ${vehiculo.anio}`}
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs ml-1">{vehiculo.patente}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar size={14} />
            <span>Ingreso: <strong className="text-slate-900">{formatFecha(exp.fecha_ingreso)}</strong></span>
          </div>
          {exp.fecha_estimada_entrega && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar size={14} />
              <span>Entrega est.: <strong className="text-slate-900">{formatFecha(exp.fecha_estimada_entrega)}</strong></span>
            </div>
          )}
        </div>
      </div>

      {exp.descripcion_inicial && (
        <div className="card p-4 mb-6 bg-slate-50 border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Descripción inicial</p>
          <p className="text-sm text-slate-700">{exp.descripcion_inicial}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: acciones */}
        <div className="lg:col-span-1 space-y-4">

          {/* Cambiar estado */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-primary" /> Cambiar estado
            </h3>
            <form onSubmit={handleCambioEstado} className="space-y-3">
              <div>
                <label className="label">Nuevo estado</label>
                <select className="select" value={nuevoEstadoId} onChange={e => setNuevoEstadoId(e.target.value)} required>
                  <option value="">Seleccionar…</option>
                  {estados.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Observación (opcional)</label>
                <textarea className="textarea" rows={3} value={observacion}
                  onChange={e => setObservacion(e.target.value)}
                  placeholder="Detalle para el historial interno…" />
              </div>
              {estadoMsg && (
                <div className={`text-xs p-2 rounded-lg ${estadoMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {estadoMsg.text}
                </div>
              )}
              <button type="submit" className="btn-primary w-full" disabled={savingEstado || !nuevoEstadoId}>
                {savingEstado ? <><Spinner size={4} /> Guardando…</> : 'Actualizar estado'}
              </button>
            </form>
          </div>

          {/* Subir imagen */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Camera size={16} className="text-primary" /> Subir foto
            </h3>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                  <span className="text-sm text-slate-500">Subiendo...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Upload size={22} />
                  <span className="text-sm">Clic para seleccionar</span>
                  <span className="text-xs">JPG, PNG, WEBP (máx. 10MB)</span>
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleUploadImagen} />
            {uploadMsg && (
              <div className={`text-xs p-2 rounded-lg mt-2 ${uploadMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {uploadMsg.text}
              </div>
            )}
          </div>

          {/* Cambiar fecha estimada */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CalendarClock size={16} className="text-primary" /> Fecha estimada de entrega
            </h3>
            <form onSubmit={handleCambioFecha} className="space-y-3">
              <div>
                <label className="label">Nueva fecha (vacío para quitar)</label>
                <input className="input" type="date" value={fechaNueva}
                  onChange={e => setFechaNueva(e.target.value)} />
                {exp.fecha_estimada_entrega && (
                  <p className="text-xs text-slate-400 mt-1">Actual: {formatFecha(exp.fecha_estimada_entrega)}</p>
                )}
              </div>
              <div>
                <label className="label">Motivo del cambio</label>
                <textarea className="textarea" rows={2} required value={motivoFecha}
                  onChange={e => setMotivoFecha(e.target.value)}
                  placeholder="Ej: Espera de repuesto importado…" />
              </div>
              {fechaMsg && (
                <div className={`text-xs p-2 rounded-lg ${fechaMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {fechaMsg.text}
                </div>
              )}
              <button type="submit" className="btn-primary w-full" disabled={savingFecha || !motivoFecha}>
                {savingFecha ? <><Spinner size={4} /> Guardando…</> : 'Actualizar fecha'}
              </button>
            </form>

            {historialFechas.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <button onClick={() => setShowHistFechas(p => !p)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors">
                  <History size={13} /> {showHistFechas ? 'Ocultar' : 'Ver'} historial ({historialFechas.length})
                </button>
                {showHistFechas && (
                  <div className="mt-3 space-y-2">
                    {historialFechas.map(h => (
                      <div key={h.id} className="bg-slate-50 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-500 line-through">{h.fecha_anterior || 'Sin fecha'}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-semibold text-slate-900">{h.fecha_nueva || 'Sin fecha'}</span>
                        </div>
                        <p className="text-slate-600 italic">"{h.motivo}"</p>
                        <p className="text-slate-400 mt-1">{h.usuario_nombre} · {h.created_at}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: timeline + fotos */}
        <div className="lg:col-span-2 space-y-5">

          {/* Historial / Timeline */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-5">Historial de estados</h3>
            {historial.length === 0 ? (
              <p className="text-slate-400 text-sm">Sin historial todavía.</p>
            ) : (
              <div className="space-y-0">
                {[...historial].reverse().map((h, i) => (
                  <motion.div key={h.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ring-4"
                        style={{ backgroundColor: h.estado.color + '20', '--tw-ring-color': h.estado.color + '12' }}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: h.estado.color }} />
                      </div>
                      {i < historial.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1" />}
                    </div>
                    <div className="pb-5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900">{h.estado.nombre}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(h.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {h.observacion && <p className="text-sm text-slate-600 mt-1">{h.observacion}</p>}
                      <p className="text-xs text-slate-400 mt-1">por {h.usuario.nombre} {h.usuario.apellido}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Fotos */}
          {imagenes.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Camera size={16} className="text-slate-400" /> Fotos ({imagenes.length})
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {imagenes.map(img => (
                  <a key={img.id} href={img.url} target="_blank" rel="noreferrer"
                    className="aspect-square rounded-lg overflow-hidden bg-slate-100 hover:opacity-90 transition-opacity">
                    <img src={img.url} alt={img.descripcion || 'Foto'} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Documentos */}
          <SeccionDocumentos expedienteId={id} isAdmin={true} />
        </div>
      </div>
    </Page>
  )
}
