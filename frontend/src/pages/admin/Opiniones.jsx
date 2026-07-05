import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import api from '../../api/client'
import { Plus, Trash2, X, Star, AlertTriangle } from 'lucide-react'
import { Page, PageHeader, Card, EmptyState, Loading, Modal, Reveal, Spinner, Field, TextInput } from '../../components/ui'

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star size={22} className={n <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
        </button>
      ))}
    </div>
  )
}

function StarDisplay({ n }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13} className={i <= n ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
      ))}
    </div>
  )
}

function ModalOpinion({ onClose, onCreated }) {
  const [form, setForm] = useState({ nombre: '', fecha: new Date().toISOString().slice(0,10), calificacion: 5, comentario: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setV = k => v => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async ev => {
    ev.preventDefault(); setError(''); setLoading(true)
    try {
      const { data } = await api.post('/opiniones', { ...form, calificacion: Number(form.calificacion) })
      onCreated(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear la opinión')
    } finally { setLoading(false) }
  }

  return (
    <Modal open onClose={onClose} size="md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Nueva reseña</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Nombre del cliente">
            <TextInput capitalize required value={form.nombre} onChange={setV('nombre')} placeholder="Ej.: Juan Pérez" />
          </Field>
          <Field label="Fecha">
            <input className="input" type="date" required value={form.fecha} onChange={set('fecha')} />
          </Field>
          <Field label="Calificación">
            <StarPicker value={form.calificacion} onChange={v => setForm(p => ({ ...p, calificacion: v }))} />
          </Field>
          <Field label="Comentario">
            <TextInput as="textarea" capitalize="sentence" className="textarea" rows={4} required value={form.comentario} onChange={setV('comentario')} placeholder="Ej.: Excelente atención y el auto quedó impecable." />
          </Field>
          {error && <p className="error-text"><AlertTriangle size={13} /> {error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? <><Spinner size={4} /> Guardando…</> : 'Agregar reseña'}
            </button>
          </div>
        </form>
    </Modal>
  )
}

export default function Opiniones() {
  const [opiniones, setOpiniones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    api.get('/opiniones/admin').then(r => setOpiniones(r.data)).finally(() => setLoading(false))
  }, [])

  const toggleActivo = async (op) => {
    const { data } = await api.put(`/opiniones/${op.id}`, { activo: !op.activo })
    setOpiniones(p => p.map(o => o.id === data.id ? data : o))
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Ocultar esta reseña?')) return
    const { data } = await api.put(`/opiniones/${id}`, { activo: false })
    setOpiniones(p => p.map(o => o.id === data.id ? data : o))
  }

  if (loading) return <Loading />

  return (
    <Page className="p-6 sm:p-8 max-w-4xl mx-auto">
      <PageHeader title="Reseñas" icon={Star}
        subtitle={`${opiniones.filter(o => o.activo).length} activas · ${opiniones.filter(o => !o.activo).length} ocultas`}
        actions={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> Nueva reseña</button>} />

      {opiniones.length === 0 ? (
        <Card>
          <EmptyState icon={Star} title="Sin reseñas todavía"
            description="Sumá testimonios de clientes para mostrar en la web."
            action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> Agregar primera reseña</button>} />
        </Card>
      ) : (
        <div className="space-y-3">
          {opiniones.map(op => (
            <Reveal key={op.id} className={`card card-pad flex items-start gap-4 ${!op.activo ? 'opacity-50' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-amber-500">{op.nombre[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-slate-900 text-sm">{op.nombre}</span>
                  <StarDisplay n={op.calificacion} />
                  <span className="text-xs text-slate-400">
                    {new Date(op.fecha + 'T12:00:00').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                  </span>
                  {!op.activo && <span className="badge badge-neutral">Oculta</span>}
                  {op.fuente !== 'manual' && <span className="badge badge-proceso">{op.fuente}</span>}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">"{op.comentario}"</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleActivo(op)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition-all">
                  {op.activo ? 'Ocultar' : 'Mostrar'}
                </button>
                <button onClick={() => handleEliminar(op.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <ModalOpinion
            onClose={() => setShowModal(false)}
            onCreated={op => { setOpiniones(p => [op, ...p]); setShowModal(false) }}
          />
        )}
      </AnimatePresence>
    </Page>
  )
}
