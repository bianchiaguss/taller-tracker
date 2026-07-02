import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Car, FileText, Clock, ChevronRight, Sparkles } from 'lucide-react'
import { Page, Reveal, EstadoBadge, Loading, EmptyState, Card } from '../../components/ui'

export default function Dashboard() {
  const { usuario } = useAuth()
  const [expedientes, setExpedientes] = useState([])
  const [estados, setEstados] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/expedientes'), api.get('/estados')]).then(([e, es]) => {
      setExpedientes(e.data); setEstados(es.data)
    }).finally(() => setLoading(false))
  }, [])

  const activos = expedientes.filter(e => !e.estado_actual.es_estado_final)
  const entregados = expedientes.filter(e => e.estado_actual.es_estado_final)
  const hora = new Date().getHours()
  const saludo = hora < 13 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches'

  if (loading) return <Loading />

  const stats = [
    { label: 'En reparación', value: activos.length, accent: 'text-primary bg-primary/5 ring-primary/15' },
    { label: 'Entregados', value: entregados.length, accent: 'text-green-700 bg-green-50 ring-green-100' },
    { label: 'Total', value: expedientes.length, accent: 'text-slate-700 bg-slate-50 ring-slate-100' },
  ]

  return (
    <Page>
      <Reveal className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{saludo}, {usuario?.nombre} 👋</h1>
        <p className="text-slate-500 text-sm mt-1">
          {activos.length === 0
            ? 'No tenés reparaciones activas por el momento.'
            : `Tenés ${activos.length} reparación${activos.length !== 1 ? 'es' : ''} en curso.`}
        </p>
      </Reveal>

      <Reveal className="grid grid-cols-3 gap-3 mb-7">
        {stats.map(s => (
          <div key={s.label} className={`rounded-xl ring-1 p-4 ${s.accent}`}>
            <p className="text-2xl sm:text-3xl font-bold tabular-nums">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </Reveal>

      {activos.length > 0 && (
        <div className="mb-7">
          <Reveal as="h2" className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            En reparación
          </Reveal>
          <div className="space-y-3">
            {activos.map(exp => (
              <Card key={exp.id} hover as="div" className="p-0">
                <Link to={`/mis-expedientes/${exp.id}`} className="card-pad flex items-start gap-3.5 group block">
                  <div className="icon-box w-11 h-11" style={{ backgroundColor: exp.estado_actual.color + '20' }}>
                    <Car size={19} style={{ color: exp.estado_actual.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{exp.vehiculo.marca} {exp.vehiculo.modelo}</p>
                        <p className="font-mono text-xs text-slate-400">{exp.vehiculo.patente}</p>
                      </div>
                      <EstadoBadge color={exp.estado_actual.color}>{exp.estado_actual.nombre}</EstadoBadge>
                    </div>
                    {exp.fecha_estimada_entrega && (
                      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <Clock size={11} />
                        Entrega est.: {new Date(exp.fecha_estimada_entrega + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long' })}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

      {expedientes.length === 0 && (
        <Card>
          <EmptyState icon={Sparkles} title="Sin vehículos registrados"
            description="Cuando el taller registre tu vehículo, vas a verlo acá con su seguimiento en tiempo real." />
        </Card>
      )}

      <Reveal className="grid grid-cols-2 gap-3 mt-2">
        <Link to="/mis-expedientes" className="card card-hover card-pad flex items-center gap-3">
          <div className="icon-box w-9 h-9 bg-primary/10 text-primary"><FileText size={16} /></div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">Mis expedientes</p>
            <p className="text-xs text-slate-500">Ver todos</p>
          </div>
        </Link>
        <Link to="/mis-vehiculos" className="card card-hover card-pad flex items-center gap-3">
          <div className="icon-box w-9 h-9 bg-primary/10 text-primary"><Car size={16} /></div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">Mis vehículos</p>
            <p className="text-xs text-slate-500">Ver todos</p>
          </div>
        </Link>
      </Reveal>
    </Page>
  )
}
