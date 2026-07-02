import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { Bell, CheckCircle2, Megaphone, Car } from 'lucide-react'
import { Page, PageHeader, Card, EmptyState, Loading, Reveal } from '../../components/ui'

function formatFechaHora(f) {
  return new Date(f).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export default function Actualizaciones() {
  const [expedientes, setExpedientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cargamos el detalle de cada expediente para obtener historial y novedades
    api.get('/expedientes').then(async r => {
      const lista = r.data
      const detallados = await Promise.all(
        lista.map(e => api.get(`/expedientes/${e.id}`).then(r => r.data))
      )
      setExpedientes(detallados)
    }).finally(() => setLoading(false))
  }, [])

  // Construir el feed unificado de actualizaciones
  const feed = []
  expedientes.forEach(exp => {
    const etiqueta = `${exp.vehiculo.marca} ${exp.vehiculo.modelo} (${exp.vehiculo.patente})`
    // Cambios de estado
    ;(exp.historial || []).forEach(h => {
      feed.push({
        id: `h-${h.id}`, tipo: 'estado', fecha: h.created_at,
        titulo: h.estado.nombre, descripcion: h.observacion,
        color: h.estado.color, expedienteId: exp.id,
        numero: exp.numero_expediente, vehiculo: etiqueta,
      })
    })
    // Novedades del taller
    ;(exp.novedades || []).forEach(n => {
      feed.push({
        id: `n-${n.id}`, tipo: 'novedad', fecha: n.created_at,
        titulo: n.titulo, descripcion: n.mensaje,
        color: '#2563EB', expedienteId: exp.id,
        numero: exp.numero_expediente, vehiculo: etiqueta,
      })
    })
  })
  feed.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  if (loading) return <Loading />

  return (
    <Page>
      <PageHeader title="Novedades" icon={Bell}
        subtitle={`${feed.length} actualizacion${feed.length !== 1 ? 'es' : ''} en total`} />

      {feed.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} title="Sin novedades todavía"
            description="Cuando el taller actualice tu expediente, vas a verlo acá." />
        </Card>
      ) : (
        <div className="space-y-2">
          {feed.map(item => (
            <Reveal key={item.id} as="div">
            <Link to={`/mis-expedientes/${item.expedienteId}`}
              className="card card-hover p-4 flex items-start gap-3 group block">
              {/* Ícono */}
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: item.color + '20' }}>
                {item.tipo === 'novedad'
                  ? <Megaphone size={16} style={{ color: item.color }} />
                  : <CheckCircle2 size={16} style={{ color: item.color }} />
                }
              </div>
              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{item.titulo}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-xs text-slate-400">{item.numero}</span>
                      <span className="text-slate-300">·</span>
                      <Car size={10} className="text-slate-400" />
                      <span className="text-xs text-slate-400 truncate">{item.vehiculo}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">{formatFechaHora(item.fecha)}</span>
                </div>
                {item.descripcion && (
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed line-clamp-2">{item.descripcion}</p>
                )}
                {item.tipo === 'novedad' && (
                  <span className="badge badge-proceso mt-1.5">Comunicado del taller</span>
                )}
              </div>
            </Link>
            </Reveal>
          ))}
        </div>
      )}
    </Page>
  )
}
