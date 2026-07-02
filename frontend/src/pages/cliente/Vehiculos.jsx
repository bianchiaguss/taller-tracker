import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { Car, FileText, ChevronRight, Calendar } from 'lucide-react'
import { Page, PageHeader, Card, EstadoBadge, EmptyState, Loading, Reveal } from '../../components/ui'

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([])
  const [expedientes, setExpedientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/vehiculos'), api.get('/expedientes')]).then(([v, e]) => {
      setVehiculos(v.data); setExpedientes(e.data)
    }).finally(() => setLoading(false))
  }, [])

  const expDeVehiculo = id => expedientes.filter(e => e.vehiculo_id === id)

  if (loading) return <Loading />

  return (
    <Page>
      <PageHeader title="Mis vehículos" icon={Car}
        subtitle={`${vehiculos.length} vehículo${vehiculos.length !== 1 ? 's' : ''} registrado${vehiculos.length !== 1 ? 's' : ''}`} />

      {vehiculos.length === 0 ? (
        <Card>
          <EmptyState icon={Car} title="Sin vehículos registrados"
            description="El taller registrará tu vehículo cuando ingreses la unidad." />
        </Card>
      ) : (
        <div className="space-y-4">
          {vehiculos.map(v => {
            const exps = expDeVehiculo(v.id)
            const activo = exps.find(e => !e.estado_actual.es_estado_final)
            return (
              <Reveal key={v.id} className="card card-pad">
                {/* Cabecera del vehículo */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="icon-box w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-50 text-slate-500 ring-1 ring-slate-100">
                    <Car size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900">{v.marca} {v.modelo}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="font-mono text-sm font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg tracking-widest">{v.patente}</span>
                      {v.anio && <span className="text-sm text-slate-500">{v.anio}</span>}
                      {v.color && <span className="text-sm text-slate-500">· {v.color}</span>}
                    </div>
                    {v.vin && <p className="text-xs text-slate-400 mt-1 font-mono">VIN: {v.vin}</p>}
                  </div>
                  {activo && (
                    <EstadoBadge color={activo.estado_actual.color} className="flex-shrink-0">En reparación</EstadoBadge>
                  )}
                </div>

                {/* Expedientes de este vehículo */}
                {exps.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expedientes</p>
                    <div className="space-y-2">
                      {exps.slice(0, 3).map(exp => (
                        <Link key={exp.id} to={`/mis-expedientes/${exp.id}`}
                          className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5 hover:bg-slate-100 transition-colors group">
                          <FileText size={14} className="text-slate-400 flex-shrink-0" />
                          <span className="font-mono text-sm font-semibold text-slate-700">{exp.numero_expediente}</span>
                          <EstadoBadge color={exp.estado_actual.color} className="ml-auto">{exp.estado_actual.nombre}</EstadoBadge>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Calendar size={11} />
                            {new Date(exp.fecha_ingreso + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </div>
                          <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </Link>
                      ))}
                      {exps.length > 3 && (
                        <Link to="/mis-expedientes" className="text-xs text-primary hover:underline pl-3">
                          Ver {exps.length - 3} más →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </Reveal>
            )
          })}
        </div>
      )}
    </Page>
  )
}
