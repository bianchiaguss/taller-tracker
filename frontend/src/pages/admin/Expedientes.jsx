import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import api from '../../api/client'
import { Plus, X, FileText, ChevronRight, Search, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react'
import { Page, PageHeader, Card, EstadoBadge, EmptyState, Loading, Modal, Spinner, Field, TextInput, MoneyInput } from '../../components/ui'

function ModalNuevoExpediente({ onClose, onCreated }) {
  const [vehiculos, setVehiculos] = useState([])
  const [form, setForm] = useState({
    vehiculo_id: '', fecha_ingreso: new Date().toISOString().slice(0, 10),
    fecha_estimada_entrega: '', descripcion_inicial: '',
    presupuesto_estimado: '', es_siniestro: false, aseguradora: '', numero_siniestro: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const setV = k => v => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => { api.get('/vehiculos').then(r => setVehiculos(r.data)) }, [])

  const handleSubmit = async ev => {
    ev.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = {
        ...form,
        presupuesto_estimado: form.presupuesto_estimado ? Number(form.presupuesto_estimado) : null,
        fecha_estimada_entrega: form.fecha_estimada_entrega || null,
        aseguradora: form.es_siniestro ? form.aseguradora : null,
        numero_siniestro: form.es_siniestro ? form.numero_siniestro : null,
      }
      const { data } = await api.post('/expedientes', payload)
      onCreated(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear')
    } finally { setLoading(false) }
  }

  return (
    <Modal open onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
        <h3 className="font-bold text-slate-900">Nuevo expediente</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Field label="Vehículo">
          <select className="select" required value={form.vehiculo_id} onChange={set('vehiculo_id')}>
            <option value="">Seleccionar vehículo…</option>
            {vehiculos.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} — {v.patente}</option>)}
          </select>
          {vehiculos.length === 0 && <p className="text-xs text-amber-600 mt-1">No hay vehículos. Creá un cliente con vehículo primero.</p>}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha de ingreso">
            <input className="input" type="date" required value={form.fecha_ingreso} onChange={set('fecha_ingreso')} />
          </Field>
          <Field label="Entrega estimada">
            <input className="input" type="date" value={form.fecha_estimada_entrega} onChange={set('fecha_estimada_entrega')} />
          </Field>
        </div>
        <Field label="Descripción inicial">
          <TextInput as="textarea" capitalize="sentence" className="textarea" rows={3} value={form.descripcion_inicial} onChange={setV('descripcion_inicial')} placeholder="Ej.: Reparación de puerta trasera derecha y pintura del lateral." />
        </Field>
        <Field label="Presupuesto estimado ($)">
          <MoneyInput value={form.presupuesto_estimado} onChange={setV('presupuesto_estimado')} placeholder="0" />
        </Field>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded accent-primary" checked={form.es_siniestro} onChange={set('es_siniestro')} />
          <span className="text-sm font-medium text-slate-700">Es siniestro / seguro</span>
        </label>
        {form.es_siniestro && (
          <div className="grid grid-cols-2 gap-3 pl-6 border-l-2 border-primary/20">
            <Field label="Aseguradora">
              <TextInput capitalize value={form.aseguradora} onChange={setV('aseguradora')} placeholder="Ej.: La Caja" />
            </Field>
            <Field label="N° siniestro">
              <input className="input font-mono" value={form.numero_siniestro} onChange={set('numero_siniestro')} placeholder="Ej.: 100-2024-0001" />
            </Field>
          </div>
        )}
        {error && <p className="error-text"><AlertTriangle size={13} /> {error}</p>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? <><Spinner size={4} /> Creando…</> : 'Crear expediente'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Expedientes() {
  const [expedientes, setExpedientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [sp] = useSearchParams()
  const [busqueda, setBusqueda] = useState(sp.get('q') || '')

  useEffect(() => {
    api.get('/expedientes').then(r => setExpedientes(r.data)).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (exp, e) => {
    e.preventDefault(); e.stopPropagation()
    if (!confirm(`¿Borrar el expediente ${exp.numero_expediente}? Se eliminarán también el historial, fotos y documentos asociados.`)) return
    await api.delete(`/expedientes/${exp.id}`)
    setExpedientes(p => p.filter(x => x.id !== exp.id))
  }

  const filtrados = expedientes.filter(e => {
    const q = busqueda.toLowerCase()
    return (
      e.numero_expediente.toLowerCase().includes(q) ||
      e.vehiculo.patente.toLowerCase().includes(q) ||
      `${e.vehiculo.marca} ${e.vehiculo.modelo}`.toLowerCase().includes(q)
    )
  })

  if (loading) return <Loading />

  return (
    <Page className="p-6 sm:p-8 max-w-7xl mx-auto">
      <PageHeader title="Expedientes" icon={FileText}
        subtitle={`${expedientes.length} expediente${expedientes.length !== 1 ? 's' : ''} en total`}
        actions={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> Nuevo expediente</button>} />

      {expedientes.length > 0 && (
        <div className="relative mb-4 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Buscar por número, patente o vehículo…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
      )}

      {expedientes.length === 0 ? (
        <Card>
          <EmptyState icon={FileText} title="Sin expedientes todavía"
            description="Creá el primero para empezar a hacer seguimiento."
            action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> Crear primer expediente</button>} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Expediente</th>
                  <th>Vehículo</th>
                  <th className="hidden sm:table-cell">Estado</th>
                  <th className="hidden md:table-cell">Ingreso</th>
                  <th className="hidden md:table-cell">Entrega est.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(exp => (
                  <tr key={exp.id} className="group">
                    <td>
                      <Link to={`/admin/expedientes/${exp.id}`} className="font-mono font-semibold text-slate-900 hover:text-primary">
                        {exp.numero_expediente}
                      </Link>
                      {exp.es_siniestro && <span className="badge badge-pendiente ml-2"><ShieldCheck size={11} /> Seguro</span>}
                    </td>
                    <td>
                      <p className="text-sm font-medium text-slate-900">{exp.vehiculo.marca} {exp.vehiculo.modelo}</p>
                      <p className="font-mono text-xs text-slate-500">{exp.vehiculo.patente}</p>
                    </td>
                    <td className="hidden sm:table-cell">
                      <EstadoBadge color={exp.estado_actual.color}>{exp.estado_actual.nombre}</EstadoBadge>
                    </td>
                    <td className="text-slate-500 hidden md:table-cell">{new Date(exp.fecha_ingreso).toLocaleDateString('es-AR')}</td>
                    <td className="text-slate-500 hidden md:table-cell">
                      {exp.fecha_estimada_entrega ? new Date(exp.fecha_estimada_entrega).toLocaleDateString('es-AR') : <span className="text-slate-300">—</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={e => handleDelete(exp, e)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg sm:opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={15} />
                        </button>
                        <Link to={`/admin/expedientes/${exp.id}`} className="p-1.5 text-slate-300 hover:text-primary">
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AnimatePresence>
        {showModal && (
          <ModalNuevoExpediente
            onClose={() => setShowModal(false)}
            onCreated={e => { setExpedientes(p => [e, ...p]); setShowModal(false) }}
          />
        )}
      </AnimatePresence>
    </Page>
  )
}
