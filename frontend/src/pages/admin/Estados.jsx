import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import api from '../../api/client'
import { Plus, Pencil, Trash2, X, GripVertical, Check, Settings, AlertTriangle } from 'lucide-react'
import { Page, PageHeader, Card, EmptyState, Loading, Modal, Reveal, Spinner, Field, TextInput } from '../../components/ui'

const COLORES_PRESET = [
  '#64748B','#0EA5E9','#8B5CF6','#F59E0B',
  '#EC4899','#6366F1','#14B8A6','#F97316','#22C55E','#16A34A'
]

function ModalEstado({ inicial, onClose, onSaved }) {
  const [form, setForm] = useState(inicial || { nombre: '', orden: 1, color: '#2563EB', descripcion: '', es_estado_final: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const setV = k => v => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (ev) => {
    ev.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = { ...form, orden: Number(form.orden) }
      const { data } = inicial
        ? await api.put(`/estados/${inicial.id}`, payload)
        : await api.post('/estados', payload)
      onSaved(data, !!inicial)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar')
    } finally { setLoading(false) }
  }

  return (
    <Modal open onClose={onClose} size="sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{inicial ? 'Editar estado' : 'Nuevo estado'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Nombre" hint="Nombre de la etapa.">
            <TextInput capitalize required value={form.nombre} onChange={setV('nombre')} placeholder="Ej.: Pintura" />
          </Field>
          <Field label="Orden" hint="Posición en el flujo (1 = primera).">
            <input className="input" type="number" inputMode="numeric" min="1" required value={form.orden} onChange={set('orden')} />
          </Field>
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COLORES_PRESET.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: c, borderColor: form.color === c ? '#0F172A' : 'transparent' }} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={form.color} onChange={set('color')} className="w-9 h-9 rounded cursor-pointer border-0 p-0.5" />
              <input className="input font-mono" value={form.color} onChange={set('color')} placeholder="#2563EB" />
            </div>
          </div>
          <Field label="Descripción (opcional)" hint="Breve explicación de la etapa.">
            <TextInput capitalize="sentence" value={form.descripcion || ''} onChange={setV('descripcion')} placeholder="Ej.: El vehículo está en cabina de pintura." />
          </Field>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="es_final" className="w-4 h-4 rounded" checked={form.es_estado_final} onChange={set('es_estado_final')} />
            <label htmlFor="es_final" className="text-sm text-slate-700">Es estado final (ej: Entregado)</label>
          </div>
          {error && <p className="error-text"><AlertTriangle size={13} /> {error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? <><Spinner size={4} /> Guardando…</> : 'Guardar'}
            </button>
          </div>
        </form>
    </Modal>
  )
}

export default function Estados() {
  const [estados, setEstados] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'nuevo' | objeto estado a editar

  useEffect(() => {
    api.get('/estados').then(r => setEstados(r.data)).finally(() => setLoading(false))
  }, [])

  const handleDesactivar = async (id) => {
    if (!confirm('¿Desactivar este estado? No se borrará del historial, pero dejará de estar disponible.')) return
    await api.delete(`/estados/${id}`)
    setEstados(p => p.filter(e => e.id !== id))
  }

  if (loading) return <Loading />

  return (
    <Page className="p-6 sm:p-8 max-w-2xl mx-auto">
      <PageHeader title="Estados de reparación" icon={Settings}
        subtitle="Etapas del proceso de reparación, en orden."
        actions={<button onClick={() => setModal('nuevo')} className="btn-primary"><Plus size={16} /> Nuevo estado</button>} />

      {estados.length === 0 ? (
        <Card>
          <EmptyState icon={Settings} title="Sin estados configurados"
            description="El seed.py crea los estados por defecto. Si no los ves, correlo de nuevo."
            action={<button onClick={() => setModal('nuevo')} className="btn-primary"><Plus size={16} /> Crear primer estado</button>} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/70">
            {estados.length} estado{estados.length !== 1 ? 's' : ''} activos
          </div>
          <div className="divide-y divide-slate-100">
            {[...estados].sort((a, b) => a.orden - b.orden).map((e, i) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50/70 group transition-colors">
                <GripVertical size={15} className="text-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-4" style={{ backgroundColor: e.color, '--tw-ring-color': e.color + '22' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-slate-900">{e.nombre}</span>
                    {e.es_estado_final && <span className="badge badge-finalizado"><Check size={10} /> Final</span>}
                  </div>
                  {e.descripcion && <p className="text-xs text-slate-400 mt-0.5 truncate">{e.descripcion}</p>}
                </div>
                <span className="text-xs text-slate-400 font-mono">#{e.orden}</span>
                <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal(e)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDesactivar(e.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <AnimatePresence>
      {modal && (
        <ModalEstado
          inicial={modal === 'nuevo' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={(data, isEdit) => {
            setEstados(p => isEdit ? p.map(e => e.id === data.id ? data : e) : [...p, data])
            setModal(null)
          }}
        />
      )}
      </AnimatePresence>
    </Page>
  )
}
