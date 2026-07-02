import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import api from '../../api/client'
import { Plus, X, Car, Pencil, Trash2, Users, AlertTriangle } from 'lucide-react'
import { Page, PageHeader, Card, EmptyState, Loading, Modal, Reveal, Spinner } from '../../components/ui'

function ModalHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
      <h3 className="font-bold text-slate-900">{title}</h3>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
    </div>
  )
}

function ModalCliente({ inicial, onClose, onSaved }) {
  const editando = !!inicial
  const [form, setForm] = useState(
    editando
      ? {
          nombre: inicial.usuario.nombre, apellido: inicial.usuario.apellido,
          email: inicial.usuario.email, telefono: inicial.usuario.telefono || '',
          dni_cuit: inicial.dni_cuit || '', direccion: inicial.direccion || '',
          telefono_alternativo: inicial.telefono_alternativo || '', password: ''
        }
      : { nombre: '', apellido: '', email: '', password: '', telefono: '', dni_cuit: '', direccion: '', telefono_alternativo: '' }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async ev => {
    ev.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = editando
        ? { nombre: form.nombre, apellido: form.apellido, email: form.email,
            telefono: form.telefono, dni_cuit: form.dni_cuit, direccion: form.direccion,
            telefono_alternativo: form.telefono_alternativo }
        : form
      const { data } = editando
        ? await api.put(`/clientes/${inicial.id}`, payload)
        : await api.post('/clientes', payload)
      onSaved(data, editando)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar')
    } finally { setLoading(false) }
  }

  return (
    <Modal open onClose={onClose} size="md">
      <ModalHeader title={editando ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Nombre</label><input className="input" required value={form.nombre} onChange={set('nombre')} /></div>
          <div><label className="label">Apellido</label><input className="input" required value={form.apellido} onChange={set('apellido')} /></div>
        </div>
        <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={set('email')} /></div>
        {!editando && (
          <div><label className="label">Contraseña inicial</label><input className="input" type="password" required minLength={6} value={form.password} onChange={set('password')} /></div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Teléfono</label><input className="input" value={form.telefono} onChange={set('telefono')} /></div>
          <div><label className="label">DNI / CUIT</label><input className="input" value={form.dni_cuit} onChange={set('dni_cuit')} /></div>
        </div>
        <div><label className="label">Dirección</label><input className="input" value={form.direccion} onChange={set('direccion')} /></div>
        {error && <p className="error-text"><AlertTriangle size={13} /> {error}</p>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button type="submit" className="btn-primary flex-1" disabled={loading}>
            {loading ? <><Spinner size={4} /> Guardando…</> : editando ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ModalVehiculo({ clienteId, onClose, onCreated }) {
  const [form, setForm] = useState({ marca: '', modelo: '', anio: '', patente: '', color: '', vin: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const handleSubmit = async ev => {
    ev.preventDefault(); setError(''); setLoading(true)
    try {
      const { data } = await api.post('/vehiculos', { ...form, cliente_id: clienteId, anio: form.anio ? Number(form.anio) : null })
      onCreated(data)
    } catch (err) { setError(err.response?.data?.detail || 'Error') } finally { setLoading(false) }
  }
  return (
    <Modal open onClose={onClose} size="md">
      <ModalHeader title="Agregar vehículo" onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Marca</label><input className="input" required value={form.marca} onChange={set('marca')} placeholder="Ford" /></div>
          <div><label className="label">Modelo</label><input className="input" required value={form.modelo} onChange={set('modelo')} placeholder="Focus" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Año</label><input className="input" type="number" value={form.anio} onChange={set('anio')} placeholder="2020" /></div>
          <div><label className="label">Patente</label><input className="input font-mono" required value={form.patente} onChange={set('patente')} placeholder="AB123CD" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Color</label><input className="input" value={form.color} onChange={set('color')} /></div>
          <div><label className="label">VIN</label><input className="input font-mono text-xs" value={form.vin} onChange={set('vin')} /></div>
        </div>
        {error && <p className="error-text"><AlertTriangle size={13} /> {error}</p>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? <><Spinner size={4} /> Guardando…</> : 'Agregar'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [vehiculoFor, setVehiculoFor] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/clientes'), api.get('/vehiculos')]).then(([c, v]) => {
      setClientes(c.data); setVehiculos(v.data)
    }).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (cliente) => {
    if (!confirm(`¿Borrar a ${cliente.usuario.nombre} ${cliente.usuario.apellido} y todos sus datos? Esta acción no se puede deshacer.`)) return
    await api.delete(`/clientes/${cliente.id}`)
    setClientes(p => p.filter(c => c.id !== cliente.id))
    setVehiculos(p => p.filter(v => v.cliente_id !== cliente.id))
  }

  const vPorCliente = id => vehiculos.filter(v => v.cliente_id === id)

  if (loading) return <Loading />

  return (
    <Page className="p-6 sm:p-8 max-w-5xl mx-auto">
      <PageHeader title="Clientes" icon={Users}
        subtitle={`${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} registrado${clientes.length !== 1 ? 's' : ''}`}
        actions={<button onClick={() => setModal('nuevo')} className="btn-primary"><Plus size={16} /> Nuevo cliente</button>} />

      {clientes.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="Sin clientes todavía"
            description="Agregá tu primer cliente para empezar."
            action={<button onClick={() => setModal('nuevo')} className="btn-primary"><Plus size={16} /> Crear primer cliente</button>} />
        </Card>
      ) : (
        <div className="space-y-3">
          {clientes.map(c => (
            <Reveal key={c.id}>
              <div className="card card-pad card-hover group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">{c.usuario.nombre[0]}{c.usuario.apellido[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{c.usuario.nombre} {c.usuario.apellido}</p>
                      <p className="text-sm text-slate-500">{c.usuario.email}</p>
                      {c.dni_cuit && <p className="text-xs text-slate-400 mt-0.5">DNI/CUIT: {c.dni_cuit}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setVehiculoFor(c.id)} className="btn-secondary btn-sm" title="Agregar vehículo"><Car size={14} /></button>
                    <button onClick={() => setModal(c)} className="btn-secondary btn-sm" title="Editar"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(c)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Borrar"><Trash2 size={15} /></button>
                  </div>
                </div>
                {vPorCliente(c.id).length > 0 && (
                  <div className="mt-4 sm:pl-[58px] grid sm:grid-cols-2 gap-2">
                    {vPorCliente(c.id).map(v => (
                      <div key={v.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                        <Car size={15} className="text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-700 font-medium">{v.marca} {v.modelo}</span>
                        {v.anio && <span className="text-xs text-slate-400">{v.anio}</span>}
                        <span className="font-mono text-xs bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded ml-auto">{v.patente}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <ModalCliente
            inicial={modal === 'nuevo' ? null : modal}
            onClose={() => setModal(null)}
            onSaved={(data, editando) => {
              setClientes(p => editando ? p.map(c => c.id === data.id ? data : c) : [data, ...p])
              setModal(null)
            }}
          />
        )}
        {vehiculoFor && (
          <ModalVehiculo
            clienteId={vehiculoFor}
            onClose={() => setVehiculoFor(null)}
            onCreated={v => { setVehiculos(p => [...p, v]); setVehiculoFor(null) }}
          />
        )}
      </AnimatePresence>
    </Page>
  )
}
