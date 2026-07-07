import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import api from '../../api/client'
import {
  ArrowLeft, Calendar, CalendarClock, CheckCircle2, Clock, Camera, Star, Bell,
  Car, Hash, ChevronDown, Flag, Activity, Download, FileText, Route
} from 'lucide-react'
import { Page, Reveal, Loading } from '../../components/ui'

const LABELS_TIPO = {
  presupuesto: 'Presupuesto', factura: 'Factura', comprobante_pago: 'Comprobante de pago',
  sena: 'Seña / Depósito', orden_reparacion: 'Orden de reparación', informe_tecnico: 'Informe técnico',
  seguro: 'Doc. de seguro', garantia: 'Garantía', otro: 'Documento',
}

function fmtCorta(f) {
  if (!f) return null
  return new Date(f + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatFechaHora(f) {
  if (!f) return null
  return new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function timeAgo(f) {
  if (!f) return null
  const s = Math.floor((Date.now() - new Date(f)) / 1000)
  if (s < 60) return 'recién'
  const m = Math.floor(s / 60); if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60); if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24); if (d < 30) return `hace ${d} día${d !== 1 ? 's' : ''}`
  return new Date(f).toLocaleDateString('es-AR')
}
function formatBytes(b) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

function getRecomendacion(estado, todosEstados) {
  const n = (estado?.nombre || '').toLowerCase()
  const total = todosEstados.length || 1
  const progreso = Math.round((estado?.orden / total) * 100)
  if (estado?.es_estado_final) return { icono: '🎉', titulo: '¡Tu vehículo fue entregado!', mensaje: '¡Gracias por confiar en nosotros! Si quedaste conforme, nos encantaría que nos dejes tu reseña.' }
  if (n.includes('ingreso') || n.includes('recepci')) return { icono: '📋', titulo: 'Vehículo recibido', mensaje: 'Registramos tu auto en el sistema. En breve comenzamos la evaluación de los daños.' }
  if (n.includes('diagn')) return { icono: '🔍', titulo: 'Diagnóstico en curso', mensaje: 'Estamos evaluando todos los daños para definir el plan de trabajo.' }
  if (n.includes('desarme')) return { icono: '🔩', titulo: 'Proceso de desarme', mensaje: 'Desarmamos las piezas necesarias para acceder a las zonas afectadas.' }
  if (n.includes('chapa') || n.includes('enderez')) return { icono: '🔨', titulo: 'Trabajos de chapa', mensaje: 'Nuestros chapistas están reparando y enderezando la estructura.' }
  if (n.includes('pintura')) return { icono: '🎨', titulo: 'En cabina de pintura', mensaje: 'Se está preparando y pintando el vehículo con mezcla computarizada. La transformación está en marcha.' }
  if (n.includes('armado')) return { icono: '🔧', titulo: 'Proceso de armado', mensaje: 'Recolocamos todas las piezas y ajustamos cada detalle.' }
  if (n.includes('pulido') || n.includes('detail')) return { icono: '✨', titulo: 'Pulido y terminación', mensaje: 'Perfeccionamos el acabado final para dejar tu auto impecable.' }
  if (n.includes('control') || n.includes('calidad')) return { icono: '🏁', titulo: 'Control de calidad', mensaje: 'Inspección final del trabajo antes de la entrega.' }
  if (n.includes('listo') || n.includes('entrega')) return { icono: '✅', titulo: '¡Trabajo finalizado!', mensaje: 'El trabajo fue finalizado. Tu vehículo está listo para que lo vengas a retirar.' }
  if (progreso < 35) return { icono: '📌', titulo: 'Proceso iniciado', mensaje: 'La reparación está en marcha.' }
  if (progreso < 70) return { icono: '⚙️', titulo: 'Reparación en proceso', mensaje: 'El trabajo avanza correctamente.' }
  return { icono: '🏁', titulo: 'Etapas finales', mensaje: 'Tu vehículo está a punto de estar listo.' }
}

function SectionHeader({ icon: Icon, title, count, right }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="icon-box w-8 h-8 bg-primary/10 text-primary flex-shrink-0"><Icon size={16} /></div>
      <h3 className="font-semibold text-slate-900 text-sm flex-1 truncate">
        {title}{count != null && <span className="text-slate-400 font-normal"> · {count}</span>}
      </h3>
      {right}
    </div>
  )
}

function HeroStat({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-white/40 font-semibold flex items-center gap-1">
        <Icon size={11} /> <span className="truncate">{label}</span>
      </p>
      <p className="text-sm font-bold text-white mt-1.5 truncate">{value}</p>
    </div>
  )
}

/* ── Stepper: el paso actual se destaca claramente ── */
function Stepper({ estados, historial, currentId, entregado }) {
  const ordenados = [...estados].sort((a, b) => a.orden - b.orden)
  const completados = new Set(historial.map(h => h.estado.id))
  const currentRef = useRef(null)
  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [currentId])
  return (
    <div className="overflow-x-auto pb-2 -mx-1">
      <div className="flex min-w-max px-1 pt-9">
        {ordenados.map((e, i) => {
          const done = completados.has(e.id)
          const current = e.id === currentId && !entregado
          const evento = historial.find(h => h.estado.id === e.id)
          const activo = done || current
          return (
            <div key={e.id} ref={current ? currentRef : null} className="flex-1 min-w-[94px] flex flex-col items-center relative">
              {i > 0 && (
                <span className="absolute top-[18px] -translate-y-1/2 right-1/2 w-full h-[3px] rounded-full"
                  style={{ backgroundColor: done ? e.color : '#E2E8F0' }} />
              )}
              {current && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20">
                  <span className="relative flex items-center gap-1 text-[10px] font-bold text-white px-2 py-1 rounded-full shadow-md whitespace-nowrap" style={{ backgroundColor: e.color }}>
                    <Car size={11} /> Tu auto
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" style={{ backgroundColor: e.color }} />
                  </span>
                </div>
              )}
              <div className="relative z-10">
                {current && <span className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ backgroundColor: e.color }} />}
                <div className="relative w-9 h-9 rounded-full border-2 flex items-center justify-center bg-white transition-transform"
                  style={{ borderColor: activo ? e.color : '#E2E8F0', boxShadow: current ? `0 0 0 4px ${e.color}33` : 'none', transform: current ? 'scale(1.12)' : 'none' }}>
                  {done
                    ? <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: e.color }}><CheckCircle2 size={18} className="text-white" /></span>
                    : current
                      ? <span className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
                      : <span className="w-2 h-2 rounded-full bg-slate-300" />}
                </div>
              </div>
              {current
                ? <span className="text-center leading-tight mt-2.5 text-[11px] font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: e.color }}>{e.nombre}</span>
                : <p className={`text-center leading-tight px-1 mt-2.5 text-[11px] max-w-[88px] ${done ? 'font-semibold text-slate-700' : 'font-medium text-slate-400'}`}>{e.nombre}</p>}
              {evento && <p className="text-[10px] text-slate-400 mt-1">{new Date(evento.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Historial de la reparación: narrativa con jerarquía ── */
const TIPO_META = {
  fecha: { icon: CalendarClock, bg: 'bg-amber-50', fg: 'text-amber-500' },
  documento: { icon: FileText, bg: 'bg-sky-50', fg: 'text-sky-500' },
  aviso: { icon: Bell, bg: 'bg-primary/10', fg: 'text-primary' },
}

function accionEtapa(estado) {
  if (estado.es_estado_final) return 'El vehículo fue entregado. ¡Gracias por confiar en nosotros!'
  const n = (estado.nombre || '').toLowerCase()
  if (n.includes('ingreso') || n.includes('recepci')) return 'El vehículo fue recibido y se registró el expediente.'
  if (n.includes('diagn')) return 'Se inició la evaluación de los daños.'
  if (n.includes('desarme')) return 'Se desarmaron las piezas necesarias para acceder a las zonas afectadas.'
  if (n.includes('chapa') || n.includes('enderez')) return 'Comenzaron los trabajos de chapa y enderezado.'
  if (n.includes('pintura')) return 'Se inició el proceso de pintura con mezcla computarizada.'
  if (n.includes('armado')) return 'Comenzó el armado y montaje de las piezas.'
  if (n.includes('pulido') || n.includes('detail')) return 'Se realizó el pulido y la terminación final.'
  if (n.includes('control') || n.includes('calidad')) return 'Se inició el control de calidad previo a la entrega.'
  if (n.includes('listo') || n.includes('entrega')) return 'El trabajo fue finalizado. El vehículo está listo para retirar.'
  return `Comenzó la etapa de ${estado.nombre}.`
}

function buildTimeline(historial, novedades) {
  const hist = [...historial].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const etapas = hist.map((h, i) => {
    const prev = i > 0 ? hist[i - 1].estado : null
    const final = h.estado.es_estado_final
    const titulo = !prev ? 'Ingreso al taller' : final ? 'Vehículo entregado' : 'Nueva etapa iniciada'
    return { id: `h-${i}`, fecha: h.created_at, tipo: 'etapa', estado: h.estado, titulo, descripcion: accionEtapa(h.estado) }
  })
  const novs = (novedades || []).map(n => {
    const t = (n.titulo || '').toLowerCase()
    const tipo = t.includes('documento') ? 'documento' : (t.includes('fecha') || t.includes('entrega')) ? 'fecha' : 'aviso'
    return { id: `n-${n.id}`, fecha: n.created_at, tipo, titulo: n.titulo, descripcion: n.mensaje }
  })
  return [...etapas, ...novs].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}

function fechaLabel(f) {
  const d = new Date(f), now = new Date()
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.round((a - b) / 86400000)
  if (diff <= 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  if (diff < 7) return 'Esta semana'
  if (diff < 30) return 'Este mes'
  return 'Anteriormente'
}

function HistorialReparacion({ historial, novedades }) {
  const [open, setOpen] = useState(false)
  const eventos = buildTimeline(historial, novedades)
  if (eventos.length === 0) return null
  const latestId = eventos[0].id

  const grupos = []
  eventos.forEach(ev => {
    const label = fechaLabel(ev.fecha)
    const last = grupos[grupos.length - 1]
    if (last && last.label === label) last.items.push(ev)
    else grupos.push({ label, items: [ev] })
  })

  return (
    <Reveal className="card rounded-2xl p-5 sm:p-6">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-2.5 text-left group">
        <div className="icon-box w-8 h-8 bg-primary/10 text-primary flex-shrink-0"><Activity size={16} /></div>
        <span className="font-semibold text-slate-900 text-sm flex-1">
          Historial de la reparación <span className="text-slate-400 font-normal">· {eventos.length}</span>
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:text-primary-dark transition-colors">
          {open ? 'Ocultar historial' : 'Ver historial'}
          <ChevronDown size={16} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="hist" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }} className="overflow-hidden">
            <div className="pt-5 pl-1.5">
              {grupos.map((g, gi) => (
                <div key={gi} className={gi > 0 ? 'mt-5' : ''}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{g.label}</span>
                    <span className="h-px flex-1 bg-slate-100" />
                  </div>
                  <ul className="relative space-y-3">
                    <span className="absolute left-[15px] top-1 bottom-1 w-px bg-slate-200 dark:bg-white/10" />
                    {g.items.map(ev => {
                      const isLatest = ev.id === latestId
                      const isEtapa = ev.tipo === 'etapa'
                      const meta = TIPO_META[ev.tipo] || TIPO_META.aviso
                      const Icon = isEtapa ? (ev.estado.es_estado_final ? CheckCircle2 : Flag) : meta.icon
                      return (
                        <li key={ev.id} className="relative flex gap-3">
                          <div className="relative z-10 flex-shrink-0 mt-0.5">
                            {isLatest && <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: isEtapa ? ev.estado.color : '#2563EB' }} />}
                            <div className={`relative w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-[color:var(--c-card)] ${isEtapa ? '' : meta.bg}`}
                              style={isEtapa ? { backgroundColor: ev.estado.color + '1F' } : undefined}>
                              {isEtapa ? <Icon size={14} style={{ color: ev.estado.color }} /> : <Icon size={13} className={meta.fg} />}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <p className="font-semibold text-sm text-slate-900 leading-snug truncate">{ev.titulo}</p>
                                {isEtapa && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: ev.estado.color + '1A', color: ev.estado.color }}>{ev.estado.nombre}</span>}
                              </div>
                              <span className="text-[11px] text-slate-400 flex-shrink-0 whitespace-nowrap flex items-center gap-1.5" title={formatFechaHora(ev.fecha)}>
                                {isLatest && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}{timeAgo(ev.fecha)}
                              </span>
                            </div>
                            {ev.descripcion && <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{ev.descripcion}</p>}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reveal>
  )
}

/* ── Archivos: fotos + documentos, compacto ── */
function Archivos({ imagenes, expedienteId }) {
  const imgs = imagenes || []
  const [docs, setDocs] = useState(null)
  const [docsOpen, setDocsOpen] = useState(false)
  useEffect(() => {
    api.get(`/expedientes/${expedienteId}/documentos`).then(r => setDocs(r.data)).catch(() => setDocs([]))
  }, [expedienteId])

  const maxThumbs = 8
  const shownImgs = imgs.slice(0, maxThumbs)
  const extra = imgs.length - maxThumbs
  const lista = docs || []
  const visDocs = docsOpen ? lista : lista.slice(0, 3)

  return (
    <Reveal className="card rounded-2xl p-5 sm:p-6">
      {/* Fotos */}
      <SectionHeader icon={Camera} title="Fotos del trabajo" count={imgs.length || null} />
      {imgs.length === 0 ? (
        <p className="text-sm text-slate-400 flex items-center gap-2 -mt-1 mb-1">Aún no se cargaron fotos.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {shownImgs.map((img, i) => {
            const overlay = i === maxThumbs - 1 && extra > 0
            return (
              <motion.a key={img.id} href={img.url} target="_blank" rel="noreferrer"
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="relative w-[72px] h-[72px] flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 group">
                <img src={img.url} alt={img.descripcion || 'Foto'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                {overlay
                  ? <div className="absolute inset-0 bg-slate-900/65 flex items-center justify-center text-white font-bold text-sm">+{extra + 1}</div>
                  : <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
              </motion.a>
            )
          })}
        </div>
      )}

      <div className="border-t border-slate-100 my-5" />

      {/* Documentos */}
      <SectionHeader icon={FileText} title="Documentos" count={docs === null ? null : (lista.length || null)} />
      {docs === null ? (
        <div className="space-y-2">{[0, 1].map(i => <div key={i} className="h-11 skeleton rounded-xl" />)}</div>
      ) : lista.length === 0 ? (
        <p className="text-sm text-slate-400 -mt-1">No hay documentos disponibles.</p>
      ) : (
        <>
          <ul className="space-y-1.5">
            {visDocs.map(doc => (
              <li key={doc.id}>
                <a href={doc.url} download target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 p-2.5 -mx-1 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className="icon-box w-9 h-9 bg-primary/10 text-primary flex-shrink-0"><FileText size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{doc.nombre}</p>
                    <p className="text-xs text-slate-400">{LABELS_TIPO[doc.tipo] || doc.tipo}{doc.tamano_bytes ? ` · ${formatBytes(doc.tamano_bytes)}` : ''}</p>
                  </div>
                  <Download size={16} className="text-slate-300 group-hover:text-primary transition-colors flex-shrink-0" />
                </a>
              </li>
            ))}
          </ul>
          {lista.length > 3 && (
            <button onClick={() => setDocsOpen(o => !o)} className="mt-2 w-full text-xs font-semibold text-primary hover:text-primary-dark py-1.5 transition-colors">
              {docsOpen ? 'Ver menos' : `Ver ${lista.length - 3} más`}
            </button>
          )}
        </>
      )}
    </Reveal>
  )
}

function GoogleIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

/* ── Tarjeta de agradecimiento + reseña (al entregar) ── */
function GraciasResena({ mapsUrl }) {
  return (
    <Reveal className="card rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-br from-amber-50 via-white to-white dark:from-amber-500/10 dark:via-transparent dark:to-transparent p-6 sm:p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center mb-4">
          <Star size={30} className="text-amber-400 fill-amber-400" />
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">¡Gracias por confiar en nosotros!</h3>
        <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto leading-relaxed">
          Esperamos que hayas quedado conforme con el trabajo realizado. Tu opinión nos ayuda a seguir creciendo y permite que otros clientes conozcan nuestro servicio.
        </p>
        <div className="flex justify-center gap-1 my-5">
          {[0, 1, 2, 3, 4].map(i => <Star key={i} size={22} className="text-amber-400 fill-amber-400" />)}
        </div>
        <a href={mapsUrl} target="_blank" rel="noreferrer"
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 hover:border-primary hover:shadow-card transition-all active:scale-[0.98]">
          <GoogleIcon size={18} /> Dejar una reseña en Google
        </a>
      </div>
    </Reveal>
  )
}

export default function ExpedienteTracking() {
  const { id } = useParams()
  const [exp, setExp] = useState(null)
  const [estadosCatalogo, setEstadosCatalogo] = useState([])
  const [mapsUrl, setMapsUrl] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/config').then(r => setMapsUrl(r.data.google_maps_review_url || '')).catch(() => {})
    Promise.all([api.get(`/expedientes/${id}`), api.get('/estados')]).then(([e, es]) => {
      setExp(e.data); setEstadosCatalogo(es.data)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <Loading />
  if (!exp) return <div className="text-center py-20 text-slate-500">Expediente no encontrado.</div>

  const { vehiculo, estado_actual, historial, imagenes, novedades } = exp
  const entregado = estado_actual?.es_estado_final || false
  const color = estado_actual?.color || '#2563EB'

  const ordenados = [...estadosCatalogo].sort((a, b) => a.orden - b.orden)
  const currentIndex = ordenados.findIndex(e => e.id === estado_actual?.id)
  const etapaNum = currentIndex >= 0 ? currentIndex + 1 : 1
  const progreso = entregado ? 100 : ordenados.length ? Math.round((etapaNum / ordenados.length) * 100) : 0
  const proximoPaso = !entregado && currentIndex >= 0 && currentIndex < ordenados.length - 1 ? ordenados[currentIndex + 1] : null
  const diasEnTaller = exp.fecha_ingreso ? Math.max(0, Math.round((Date.now() - new Date(exp.fecha_ingreso)) / 86400000)) : null
  const rec = getRecomendacion(estado_actual, estadosCatalogo)

  const ultimaActFecha = [
    ...historial.map(h => h.created_at),
    ...(novedades || []).map(n => n.created_at),
  ].filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0]

  return (
    <Page className="max-w-3xl mx-auto">
      <Link to="/mis-expedientes" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm mb-5 transition-colors group">
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Mis vehículos
      </Link>

      {/* ── HERO: el estado es protagonista ──────────────── */}
      <Reveal className="relative rounded-2xl overflow-hidden shadow-elevated mb-5"
        style={{ background: 'linear-gradient(150deg, #0F172A 0%, #1E293B 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '34px 34px' }} />
          <div className="absolute -right-12 -bottom-14 opacity-[0.06]"><Car size={280} strokeWidth={1} className="text-white" /></div>
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-25" style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
        </div>

        <div className="relative p-6 sm:p-8">
          {/* identidad (secundaria) */}
          <div className="flex items-center justify-between gap-3 mb-7">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-white/70 bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-lg">
              <Hash size={12} /> {exp.numero_expediente}
            </span>
            <div className="text-right min-w-0">
              <p className="text-white font-bold text-sm sm:text-base truncate capitalize leading-tight">
                {vehiculo.marca} {vehiculo.modelo} <span className="text-white/45 font-medium">{vehiculo.anio}</span>
              </p>
              <p className="text-white/45 text-xs font-mono uppercase tracking-wide mt-0.5">{vehiculo.patente}{vehiculo.color ? ` · ${vehiculo.color}` : ''}</p>
            </div>
          </div>

          {/* estado (protagonista) */}
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              {!entregado && <span className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ backgroundColor: color }} />}
              <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center border" style={{ backgroundColor: color + '26', borderColor: color + '59' }}>
                <span className="text-[32px] leading-none">{rec.icono}</span>
              </div>
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-white/50">
                {entregado ? 'Reparación finalizada' : `Etapa ${etapaNum} de ${ordenados.length || '—'}`}
              </p>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-3xl sm:text-[40px] font-extrabold text-white tracking-tight leading-[1.05] mt-1">
                {estado_actual?.nombre}
              </motion.h1>
            </div>
          </div>
          <p className="text-white/70 text-[15px] leading-relaxed mt-4 max-w-lg">{rec.mensaje}</p>

          {ultimaActFecha && (
            <p className="text-xs text-white/50 mt-4 flex items-center gap-1.5"><Clock size={11} /> Última actualización {timeAgo(ultimaActFecha)}</p>
          )}

          {/* métricas */}
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-3 gap-3">
            <HeroStat icon={entregado ? CheckCircle2 : Flag} label="Próximo paso" value={entregado ? 'Entregado' : (proximoPaso?.nombre || 'Etapa final')} />
            <HeroStat icon={Calendar} label={entregado ? 'Entregado' : 'Entrega est.'} value={entregado ? (fmtCorta(exp.fecha_entrega_real) || '—') : (fmtCorta(exp.fecha_estimada_entrega) || 'A confirmar')} />
            <HeroStat icon={Clock} label="Ingreso" value={!entregado && diasEnTaller != null ? `${fmtCorta(exp.fecha_ingreso)} · ${diasEnTaller}d` : fmtCorta(exp.fecha_ingreso)} />
          </div>
        </div>
      </Reveal>

      {/* ── Contenido ────────────────────────────────────── */}
      <div className="space-y-5">
        {/* Agradecimiento + reseña en Google (al entregar) */}
        {entregado && mapsUrl && <GraciasResena mapsUrl={mapsUrl} />}

        {/* Ruta de reparación */}
        {estadosCatalogo.length > 0 && (
          <Reveal className="card rounded-2xl p-5 sm:p-6">
            <SectionHeader icon={Route} title={entregado ? 'Reparación completada' : 'Ruta de reparación'}
              right={<span className="text-xs font-bold tabular-nums" style={{ color }}>{progreso}%</span>} />
            <Stepper estados={estadosCatalogo} historial={historial} currentId={estado_actual?.id} entregado={entregado} />
          </Reveal>
        )}

        {/* Historial de la reparación */}
        {(historial.length > 0 || (novedades && novedades.length > 0)) && (
          <HistorialReparacion historial={historial} novedades={novedades} />
        )}

        {/* Archivos */}
        <Archivos imagenes={imagenes} expedienteId={id} />
      </div>
    </Page>
  )
}
