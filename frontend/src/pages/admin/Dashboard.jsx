import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../api/client'
import {
  FileText, Users, CheckCircle, Clock, ChevronRight, AlertTriangle, Plus,
  ClipboardList, FolderOpen, Image as ImageIcon, Star, TrendingUp, Activity, ArrowRight
} from 'lucide-react'
import { Page, StatCard, Card, EstadoBadge, EmptyState, SkeletonCard, Skeleton, Reveal, fadeUp } from '../../components/ui'

const ACCIONES = [
  { to: '/admin/expedientes', label: 'Nuevo expediente', icon: Plus, accent: 'bg-primary/10 text-primary' },
  { to: '/admin/clientes', label: 'Clientes', icon: Users, accent: 'bg-violet-50 text-violet-600' },
  { to: '/admin/solicitudes', label: 'Presupuestos', icon: ClipboardList, accent: 'bg-amber-50 text-amber-600' },
  { to: '/admin/documentos', label: 'Documentos', icon: FolderOpen, accent: 'bg-sky-50 text-sky-600' },
  { to: '/admin/galeria', label: 'Galería', icon: ImageIcon, accent: 'bg-rose-50 text-rose-600' },
  { to: '/admin/opiniones', label: 'Reseñas', icon: Star, accent: 'bg-green-50 text-green-600' },
]

function timeAgo(d) {
  const diff = Math.round((Date.now() - new Date(d)) / 86400000)
  if (diff <= 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  if (diff < 30) return `Hace ${diff} días`
  return new Date(d).toLocaleDateString('es-AR')
}

export default function Dashboard() {
  const [expedientes, setExpedientes] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/expedientes'), api.get('/clientes')]).then(([e, c]) => {
      setExpedientes(e.data); setClientes(c.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <Skeleton className="h-9 w-56 mb-2" />
      <Skeleton className="h-4 w-40 mb-7" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  )

  const activosList = expedientes.filter(e => e.activo && !e.estado_actual.es_estado_final)
  const activos = activosList.length
  const entregados = expedientes.filter(e => e.estado_actual.es_estado_final).length
  const demoradosList = expedientes.filter(e => e.activo && e.fecha_estimada_entrega &&
    new Date(e.fecha_estimada_entrega) < new Date() && !e.estado_actual.es_estado_final)
  const demorados = demoradosList.length

  // Distribución de carga por estado (solo activos)
  const dist = Object.values(activosList.reduce((acc, e) => {
    const k = e.estado_actual.id
    if (!acc[k]) acc[k] = { nombre: e.estado_actual.nombre, color: e.estado_actual.color, count: 0 }
    acc[k].count++
    return acc
  }, {})).sort((a, b) => b.count - a.count)
  const maxCount = Math.max(...dist.map(d => d.count), 1)

  const hora = new Date().getHours()
  const saludo = hora < 13 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches'
  const hoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <Page className="p-6 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-tight">{saludo} 👋</h1>
          <p className="text-slate-500 text-sm mt-1 capitalize">{hoy}</p>
        </div>
        <Link to="/admin/expedientes" className="btn-primary"><Plus size={16} /> Nuevo expediente</Link>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FileText} label="Expedientes activos" value={activos} accent="primary" to="/admin/expedientes" hint="En reparación ahora" />
        <StatCard icon={CheckCircle} label="Entregados" value={entregados} accent="green" hint="Trabajos finalizados" />
        <StatCard icon={AlertTriangle} label="Demorados" value={demorados} accent={demorados ? 'red' : 'slate'} hint={demorados ? 'Requieren atención' : 'Todo en fecha'} />
        <StatCard icon={Users} label="Clientes" value={clientes.length} accent="violet" to="/admin/clientes" hint="Registrados" />
      </div>

      {/* Alerta demorados */}
      {demorados > 0 && (
        <Reveal className="card border-l-4 border-l-red-500 bg-red-50/50 p-4 mb-6 flex items-center gap-3">
          <div className="icon-box w-9 h-9 bg-red-100 text-red-600"><AlertTriangle size={17} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">{demorados} expediente{demorados !== 1 ? 's' : ''} con entrega vencida</p>
            <p className="text-xs text-slate-500 truncate">{demoradosList.slice(0, 3).map(e => e.numero_expediente).join(' · ')}</p>
          </div>
          <Link to="/admin/expedientes" className="btn-secondary btn-sm flex-shrink-0">Revisar</Link>
        </Reveal>
      )}

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Actividad reciente */}
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Activity size={16} className="text-primary" /> Actividad reciente</h2>
            <Link to="/admin/expedientes" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              Ver todos <ChevronRight size={13} />
            </Link>
          </div>

          {expedientes.length === 0 ? (
            <EmptyState icon={FileText} title="Sin expedientes todavía"
              description="Creá el primero desde la sección Expedientes."
              action={<Link to="/admin/expedientes" className="btn-primary"><Plus size={16} /> Crear expediente</Link>} />
          ) : (
            <div className="divide-y divide-slate-100">
              {expedientes.slice(0, 7).map(exp => {
                const demorado = exp.activo && exp.fecha_estimada_entrega &&
                  new Date(exp.fecha_estimada_entrega) < new Date() && !exp.estado_actual.es_estado_final
                return (
                  <Link key={exp.id} to={`/admin/expedientes/${exp.id}`}
                    className="flex items-center gap-3.5 px-5 sm:px-6 py-3.5 hover:bg-slate-50/70 transition-colors group">
                    <div className="icon-box w-10 h-10 flex-shrink-0" style={{ backgroundColor: exp.estado_actual.color + '1A' }}>
                      <FileText size={17} style={{ color: exp.estado_actual.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-slate-900">{exp.numero_expediente}</span>
                        <EstadoBadge color={exp.estado_actual.color}>{exp.estado_actual.nombre}</EstadoBadge>
                        {demorado && <span className="badge badge-demorado"><AlertTriangle size={11} /> Demorado</span>}
                      </div>
                      <p className="text-slate-500 text-sm truncate">
                        {exp.vehiculo.marca} {exp.vehiculo.modelo} · {exp.vehiculo.patente}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className="text-xs text-slate-400">{timeAgo(exp.fecha_ingreso)}</p>
                      {exp.fecha_estimada_entrega && (
                        <p className={`text-xs flex items-center gap-1 justify-end mt-0.5 ${demorado ? 'text-red-500' : 'text-slate-400'}`}>
                          <Clock size={11} /> {new Date(exp.fecha_estimada_entrega).toLocaleDateString('es-AR')}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </Card>

        {/* Columna lateral */}
        <div className="space-y-4">
          {/* Accesos rápidos */}
          <Card className="card-pad">
            <h2 className="font-semibold text-slate-900 mb-4 text-sm flex items-center gap-2"><TrendingUp size={15} className="text-primary" /> Accesos rápidos</h2>
            <div className="grid grid-cols-3 gap-2">
              {ACCIONES.map(a => (
                <motion.div key={a.to} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
                  <Link to={a.to} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition-colors text-center">
                    <div className={`icon-box w-9 h-9 ${a.accent}`}><a.icon size={17} /></div>
                    <span className="text-[11px] font-medium text-slate-600 leading-tight">{a.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Carga por estado */}
          <Card className="card-pad">
            <h2 className="font-semibold text-slate-900 mb-4 text-sm flex items-center gap-2"><Activity size={15} className="text-primary" /> Carga por estado</h2>
            {dist.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Sin trabajos activos.</p>
            ) : (
              <div className="space-y-3.5">
                {dist.map((d, i) => (
                  <div key={d.nombre}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="truncate">{d.nombre}</span>
                      </span>
                      <span className="text-xs font-bold text-slate-900 tabular-nums">{d.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(d.count / maxCount) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                        className="h-full rounded-full" style={{ backgroundColor: d.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Page>
  )
}
