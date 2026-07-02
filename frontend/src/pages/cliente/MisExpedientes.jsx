import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { Car, Calendar, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Page, PageHeader, Card, EstadoBadge, EmptyState, Loading } from '../../components/ui'

export default function MisExpedientes() {
  const [expedientes, setExpedientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/expedientes').then(r => setExpedientes(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  return (
    <Page>
      <PageHeader title="Mis vehículos" icon={Car}
        subtitle={expedientes.length === 0
          ? 'No tenés expedientes activos por ahora.'
          : `${expedientes.length} expediente${expedientes.length !== 1 ? 's' : ''} encontrado${expedientes.length !== 1 ? 's' : ''}.`} />

      {expedientes.length === 0 ? (
        <Card>
          <EmptyState icon={Car} title="Sin reparaciones activas"
            description="Cuando el taller registre tu vehículo, vas a verlo acá con su seguimiento." />
        </Card>
      ) : (
        <div className="space-y-3">
          {expedientes.map(exp => {
            const entregado = exp.estado_actual.es_estado_final
            return (
              <Card key={exp.id} hover as="div" className="p-0">
                <Link to={`/mis-expedientes/${exp.id}`} className="card-pad flex items-center gap-4 group block">
                  <div className="icon-box w-12 h-12" style={{ backgroundColor: exp.estado_actual.color + '20' }}>
                    <Car size={22} style={{ color: exp.estado_actual.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-sm font-bold text-slate-900">{exp.numero_expediente}</span>
                      <EstadoBadge color={exp.estado_actual.color}>{exp.estado_actual.nombre}</EstadoBadge>
                      {entregado && <span className="badge badge-finalizado"><CheckCircle2 size={11} /> Entregado</span>}
                    </div>
                    <p className="font-semibold text-slate-900">
                      {exp.vehiculo.marca} {exp.vehiculo.modelo}
                      {exp.vehiculo.anio && <span className="text-slate-500 font-normal"> {exp.vehiculo.anio}</span>}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{exp.vehiculo.patente}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={11} /> Ingreso: {new Date(exp.fecha_ingreso + 'T12:00:00').toLocaleDateString('es-AR')}
                      </span>
                      {exp.fecha_estimada_entrega && !entregado && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar size={11} /> Entrega est.: {new Date(exp.fecha_estimada_entrega + 'T12:00:00').toLocaleDateString('es-AR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </Page>
  )
}
