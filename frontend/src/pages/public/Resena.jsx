import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../api/client'
import { Wrench, Star, CheckCircle, AlertCircle } from 'lucide-react'
import { Spinner } from '../../components/ui'

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-2 justify-center">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)} className="transition-transform hover:scale-110">
          <Star size={36} className={
            n <= (hover || value)
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-200 fill-slate-200'
          } />
        </button>
      ))}
    </div>
  )
}

const LABELS_CALIFICACION = { 1: 'Malo', 2: 'Regular', 3: 'Bueno', 4: 'Muy bueno', 5: 'Excelente ✨' }

export default function Resena() {
  const { token } = useParams()
  const [info, setInfo] = useState(null)
  const [estado, setEstado] = useState('cargando')  // cargando | listo | enviado | invalido
  const [calificacion, setCalificacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/resenas/public/${token}`)
      .then(r => { setInfo(r.data); setEstado('listo') })
      .catch(err => {
        if (err.response?.status === 410) setEstado('yaCompletado')
        else setEstado('invalido')
      })
  }, [token])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!calificacion) { setError('Por favor seleccioná una calificación.'); return }
    if (!comentario.trim()) { setError('Por favor escribí un breve comentario.'); return }
    setLoading(true); setError('')
    try {
      await api.post(`/resenas/public/${token}`, { calificacion, comentario })
      setEstado('enviado')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al enviar. Intentá de nuevo.')
    } finally { setLoading(false) }
  }

  if (estado === 'cargando') return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <Spinner size={8} className="text-primary" />
    </div>
  )

  if (estado === 'invalido') return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Link inválido</h2>
        <p className="text-slate-500 text-sm">Este link no es válido o ya expiró.</p>
      </div>
    </div>
  )

  if (estado === 'yaCompletado') return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Ya calificaste</h2>
        <p className="text-slate-500 text-sm">Ya enviaste tu reseña para esta reparación. ¡Gracias!</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Ir al sitio</Link>
      </div>
    </div>
  )

  if (estado === 'enviado') return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.15, stiffness: 200 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={36} className="text-green-600" />
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">¡Gracias, {info?.nombre_cliente}!</h2>
        <p className="text-slate-500 mb-2">Tu calificación fue registrada.</p>
        <p className="text-slate-400 text-sm">Tu opinión nos ayuda a seguir mejorando.</p>
        <Link to="/" className="btn-primary mt-8 inline-flex">Volver al sitio</Link>
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-glow">
              <Wrench size={19} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">{info?.nombre_taller}</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Hola, {info?.nombre_cliente} 👋
          </h1>
          <p className="text-slate-500 text-sm">
            Tu <strong>{info?.vehiculo}</strong> ya está listo.<br />
            ¿Cómo fue tu experiencia con nosotros?
          </p>
          <p className="font-mono text-xs text-slate-400 mt-2">{info?.numero_expediente}</p>
        </div>

        <div className="card card-pad sm:p-8 shadow-elevated">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Estrellas */}
            <div>
              <label className="label text-center block mb-4">Calificación</label>
              <StarPicker value={calificacion} onChange={setCalificacion} />
              {calificacion > 0 && (
                <p className="text-center text-sm font-semibold mt-2" style={{
                  color: calificacion >= 4 ? '#16A34A' : calificacion >= 3 ? '#F59E0B' : '#EF4444'
                }}>
                  {LABELS_CALIFICACION[calificacion]}
                </p>
              )}
            </div>

            {/* Comentario */}
            <div>
              <label className="label">Tu comentario</label>
              <textarea
                className="textarea"
                rows={4}
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Contanos cómo fue la atención, los tiempos, la calidad del trabajo…"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary btn-lg w-full" disabled={loading || !calificacion}>
              {loading ? <><Spinner size={4} /> Enviando…</> : 'Enviar mi calificación'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Este link es personal y de un solo uso
        </p>
      </motion.div>
    </div>
  )
}
