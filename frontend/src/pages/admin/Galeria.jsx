import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import api from '../../api/client'
import { Plus, Trash2, X, Image as ImageIcon, AlertTriangle } from 'lucide-react'
import { Page, PageHeader, Card, EmptyState, Loading, Modal, Reveal, Spinner } from '../../components/ui'

function ModalNuevoItem({ onClose, onCreated }) {
  const [form, setForm] = useState({ marca: '', modelo: '', anio: '', tipo_reparacion: '', descripcion: '', orden: '0' })
  const [imgAntes, setImgAntes] = useState(null)
  const [imgDespues, setImgDespues] = useState(null)
  const [prevAntes, setPrevAntes] = useState(null)
  const [prevDespues, setPrevDespues] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleFile = (setter, prevSetter) => e => {
    const file = e.target.files[0]
    if (!file) return
    setter(file)
    prevSetter(URL.createObjectURL(file))
  }

  const handleSubmit = async ev => {
    ev.preventDefault()
    if (!imgAntes || !imgDespues) { setError('Debés subir la foto de antes y la de después.'); return }
    setError(''); setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
      fd.append('imagen_antes', imgAntes)
      fd.append('imagen_despues', imgDespues)
      const { data } = await api.post('/galeria', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onCreated(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear el item')
    } finally { setLoading(false) }
  }

  return (
    <Modal open onClose={onClose}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-slate-900">Nuevo trabajo</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Marca</label><input className="input" required value={form.marca} onChange={set('marca')} /></div>
            <div><label className="label">Modelo</label><input className="input" required value={form.modelo} onChange={set('modelo')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Año</label><input className="input" type="number" value={form.anio} onChange={set('anio')} /></div>
            <div><label className="label">Orden</label><input className="input" type="number" value={form.orden} onChange={set('orden')} /></div>
          </div>
          <div><label className="label">Tipo de reparación</label><input className="input" required value={form.tipo_reparacion} onChange={set('tipo_reparacion')} placeholder="Ej: Chapa y pintura completa" /></div>
          <div><label className="label">Descripción (opcional)</label><textarea className="textarea" rows={2} value={form.descripcion} onChange={set('descripcion')} /></div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Foto ANTES</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-primary transition-colors aspect-video"
                   onClick={() => document.getElementById('antes-input').click()}>
                {prevAntes
                  ? <img src={prevAntes} className="w-full h-full object-cover" alt="Antes" />
                  : <div className="flex items-center justify-center h-full text-slate-400 text-xs">+ Subir foto</div>}
              </div>
              <input id="antes-input" type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFile(setImgAntes, setPrevAntes)} />
            </div>
            <div>
              <label className="label">Foto DESPUÉS</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-primary transition-colors aspect-video"
                   onClick={() => document.getElementById('despues-input').click()}>
                {prevDespues
                  ? <img src={prevDespues} className="w-full h-full object-cover" alt="Después" />
                  : <div className="flex items-center justify-center h-full text-slate-400 text-xs">+ Subir foto</div>}
              </div>
              <input id="despues-input" type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFile(setImgDespues, setPrevDespues)} />
            </div>
          </div>

          {error && <p className="error-text"><AlertTriangle size={13} /> {error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? <><Spinner size={4} /> Subiendo…</> : 'Agregar trabajo'}
            </button>
          </div>
        </form>
    </Modal>
  )
}

export default function Galeria() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    api.get('/galeria/admin').then(r => setItems(r.data)).finally(() => setLoading(false))
  }, [])

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este trabajo de la galería?')) return
    await api.delete(`/galeria/${id}`)
    setItems(p => p.filter(i => i.id !== id))
  }

  if (loading) return <Loading />

  return (
    <Page className="p-6 sm:p-8 max-w-6xl mx-auto">
      <PageHeader title="Galería de trabajos" icon={ImageIcon}
        subtitle={`${items.length} trabajo${items.length !== 1 ? 's' : ''} publicado${items.length !== 1 ? 's' : ''}`}
        actions={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> Agregar trabajo</button>} />

      {items.length === 0 ? (
        <Card>
          <EmptyState icon={ImageIcon} title="Galería vacía"
            description="Mostrá tus mejores trabajos antes/después en la web pública."
            action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> Agregar primer trabajo</button>} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(item => (
            <Reveal key={item.id} className={`card card-hover overflow-hidden ${!item.activo ? 'opacity-50' : ''}`}>
              <div className="relative">
                <div className="grid grid-cols-2 h-40">
                  <div className="relative overflow-hidden">
                    <img src={item.imagen_antes} alt="Antes" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs font-bold px-1.5 py-0.5 rounded">ANTES</span>
                  </div>
                  <div className="relative overflow-hidden">
                    <img src={item.imagen_despues} alt="Después" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-primary/90 text-white text-xs font-bold px-1.5 py-0.5 rounded">DESPUÉS</span>
                  </div>
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-white/60 z-10" />
                </div>
              </div>
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{item.marca} {item.modelo}{item.anio ? ` ${item.anio}` : ''}</p>
                  <p className="text-primary text-xs font-medium mt-0.5">{item.tipo_reparacion}</p>
                  {!item.activo && <span className="text-xs text-slate-400">Oculto</span>}
                </div>
                <button onClick={() => handleEliminar(item.id)} className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 p-1">
                  <Trash2 size={15} />
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <ModalNuevoItem
            onClose={() => setShowModal(false)}
            onCreated={item => { setItems(p => [item, ...p]); setShowModal(false) }}
          />
        )}
      </AnimatePresence>
    </Page>
  )
}
