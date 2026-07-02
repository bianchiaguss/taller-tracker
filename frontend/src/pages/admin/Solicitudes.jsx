import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import api from '../../api/client'
import { ChevronRight, X, Send, CheckCircle, Search, ClipboardList } from 'lucide-react'
import { Page, PageHeader, Card, EmptyState, Loading } from '../../components/ui'

const ESTADOS = {
  nueva:       { label: 'Nueva',       cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  vista:       { label: 'Vista',        cls: 'bg-slate-50 text-slate-600 border-slate-200' },
  en_contacto: { label: 'En contacto', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  convertida:  { label: 'Convertida',  cls: 'bg-green-50 text-green-700 border-green-200' },
  descartada:  { label: 'Descartada',  cls: 'bg-red-50 text-red-600 border-red-200' },
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-slate-900 font-medium text-right">{value}</span>
    </div>
  )
}

function PanelDetalle({ solicitud, onClose, onUpdate }) {
  const [estado, setEstado] = useState(solicitud.estado)
  const [respuesta, setRespuesta] = useState(solicitud.respuesta || '')
  const [saving, setSaving] = useState(false)
  const [enviado, setEnviado] = useState(!!solicitud.respuesta_at)

  const handleEstado = async (nuevoEstado) => {
    setSaving(true)
    const { data } = await api.patch(`/presupuestos/${solicitud.id}`, { estado: nuevoEstado })
    setEstado(nuevoEstado)
    onUpdate(data)
    setSaving(false)
  }

  const handleEnviarRespuesta = async () => {
    if (!respuesta.trim()) return
    setSaving(true)
    try {
      const { data } = await api.patch(`/presupuestos/${solicitud.id}`, { respuesta })
      setEstado(data.estado)
      setEnviado(true)
      onUpdate(data)
    } finally { setSaving(false) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-end" onClick={onClose}>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 38 }}
        className="bg-white h-full w-full max-w-lg shadow-elevated overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 glass border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="font-bold text-slate-900">Solicitud de presupuesto</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Estado */}
          <div>
            <p className="label mb-3">Estado</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ESTADOS).map(([key, { label, cls }]) => (
                <button key={key} disabled={saving} onClick={() => handleEstado(key)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    estado === key ? cls + ' ring-2 ring-offset-1 ring-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Datos */}
          <div className="card p-4 space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cliente</p>
            <Row label="Nombre" value={`${solicitud.nombre} ${solicitud.apellido}`} />
            <Row label="Email" value={<a href={`mailto:${solicitud.email}`} className="text-primary hover:underline">{solicitud.email}</a>} />
            <Row label="Teléfono" value={<a href={`tel:${solicitud.telefono}`} className="text-primary hover:underline">{solicitud.telefono}</a>} />
          </div>

          <div className="card p-4 space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Vehículo</p>
            <Row label="Marca / Modelo" value={`${solicitud.marca} ${solicitud.modelo}`} />
            {solicitud.anio && <Row label="Año" value={solicitud.anio} />}
            {solicitud.patente && <Row label="Patente" value={<span className="font-mono">{solicitud.patente}</span>} />}
          </div>

          <div>
            <p className="label mb-2">Descripción del daño</p>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {solicitud.descripcion_danio}
            </div>
          </div>

          {/* Fotos */}
          {solicitud.imagenes?.length > 0 && (
            <div>
              <p className="label mb-3">Fotos ({solicitud.imagenes.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {solicitud.imagenes.map(img => (
                  <a key={img.id} href={img.url} target="_blank" rel="noreferrer"
                    className="aspect-square rounded-lg overflow-hidden bg-slate-100 hover:opacity-90 transition-opacity">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Respuesta al cliente */}
          <div className="border-t border-slate-100 pt-5">
            <p className="label mb-3">Respuesta al cliente</p>
            {enviado && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-3 text-sm">
                <CheckCircle size={15} />
                Respuesta enviada — el cliente recibió un email.
              </div>
            )}
            <textarea
              className="input resize-none"
              rows={4}
              value={respuesta}
              onChange={e => setRespuesta(e.target.value)}
              placeholder="Escribí la respuesta o cotización para este cliente. Se le enviará por email..."
            />
            <button
              onClick={handleEnviarRespuesta}
              disabled={saving || !respuesta.trim()}
              className="btn-primary w-full justify-center mt-3">
              <Send size={15} />
              {enviado ? 'Actualizar y reenviar' : 'Enviar respuesta al cliente'}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Recibida el {new Date(solicitud.created_at).toLocaleDateString('es-AR', {
              day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    api.get('/presupuestos').then(r => setSolicitudes(r.data)).finally(() => setLoading(false))
  }, [])

  const filtradas = solicitudes.filter(s => {
    const estadoOk = filtroEstado === 'todas' || s.estado === filtroEstado
    if (!busqueda.trim()) return estadoOk
    const q = busqueda.toLowerCase()
    return estadoOk && (
      `${s.nombre} ${s.apellido}`.toLowerCase().includes(q) ||
      (s.patente || '').toLowerCase().includes(q) ||
      `${s.marca} ${s.modelo}`.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    )
  })
  const contadores = Object.keys(ESTADOS).reduce((acc, k) => ({ ...acc, [k]: solicitudes.filter(s => s.estado === k).length }), {})

  if (loading) return <Loading />

  return (
    <Page className="p-6 sm:p-8 max-w-5xl mx-auto">
      <PageHeader title="Solicitudes de presupuesto" icon={ClipboardList}
        subtitle={`${solicitudes.length} solicitud${solicitudes.length !== 1 ? 'es' : ''} recibida${solicitudes.length !== 1 ? 's' : ''}`} />

      <div className="relative mb-4 max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Buscar por nombre, patente, marca o email…"
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setFiltroEstado('todas')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filtroEstado === 'todas' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
          Todas ({solicitudes.length})
        </button>
        {Object.entries(ESTADOS).map(([key, { label, cls }]) => contadores[key] > 0 && (
          <button key={key} onClick={() => setFiltroEstado(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filtroEstado === key ? cls : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
            {label} ({contadores[key]})
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <Card>
          <EmptyState icon={ClipboardList}
            title={solicitudes.length === 0 ? 'Todavía no llegaron solicitudes' : 'Sin solicitudes con este filtro'}
            description={solicitudes.length === 0 ? 'Las solicitudes desde el sitio público aparecerán acá.' : 'Probá con otro estado o búsqueda.'} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtradas.map(s => {
              const { label, cls } = ESTADOS[s.estado] || { label: s.estado, cls: '' }
              return (
                <button key={s.id} onClick={() => setSelected(s)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{s.nombre[0]}{s.apellido[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900">{s.nombre} {s.apellido}</span>
                      <span className={`badge border text-xs ${cls}`}>{label}</span>
                      {s.respuesta_at && <span className="badge bg-blue-50 text-blue-600 border-blue-200 text-xs">✓ Respondida</span>}
                      {s.imagenes?.length > 0 && <span className="text-xs text-slate-400">📷 {s.imagenes.length}</span>}
                    </div>
                    <p className="text-sm text-slate-500 truncate">{s.marca} {s.modelo} — {s.descripcion_danio.substring(0, 60)}...</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400">{new Date(s.created_at).toLocaleDateString('es-AR')}</p>
                  </div>
                  <ChevronRight size={15} className="text-slate-300" />
                </button>
              )
            })}
          </div>
        </Card>
      )}

      <AnimatePresence>
        {selected && (
          <PanelDetalle
            solicitud={selected}
            onClose={() => setSelected(null)}
            onUpdate={updated => {
              setSolicitudes(p => p.map(s => s.id === updated.id ? updated : s))
              setSelected(updated)
            }}
          />
        )}
      </AnimatePresence>
    </Page>
  )
}
