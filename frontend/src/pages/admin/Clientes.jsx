import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import api from '../../api/client'
import { Plus, X, Car, Pencil, Trash2, Users, AlertTriangle } from 'lucide-react'
import { Page, PageHeader, Card, EmptyState, Loading, Modal, Reveal, Spinner, Field, TextInput, PhoneInput } from '../../components/ui'

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
  const setV = k => v => setForm(p => ({ ...p, [k]: v }))

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
          <Field label="Nombre">
            <TextInput capitalize required value={form.nombre} onChange={setV('nombre')} placeholder="Ej.: Juan" />
          </Field>
          <Field label="Apellido">
            <TextInput capitalize required value={form.apellido} onChange={setV('apellido')} placeholder="Ej.: Pérez" />
          </Field>
        </div>
        <Field label="Email">
          <input className="input" type="email" required value={form.email} onChange={set('email')} placeholder="nombre@correo.com" />
        </Field>
        {!editando && (
          <Field label="Contraseña inicial">
            <input className="input" type="password" required minLength={8} value={form.password} onChange={set('password')} placeholder="Mínimo 8 caracteres" />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Teléfono">
            <PhoneInput value={form.telefono} onChange={setV('telefono')} />
          </Field>
          <Field label="DNI / CUIT">
            <input className="input" inputMode="numeric" value={form.dni_cuit} onChange={e => setForm(p => ({ ...p, dni_cuit: e.target.value.replace(/\D/g, '') }))} placeholder="20304050607" />
          </Field>
        </div>
        <Field label="Dirección" hint="Calle, número, localidad.">
          <TextInput capitalize value={form.direccion} onChange={setV('direccion')} placeholder="Ej.: Av. Siempreviva 742, Springfield" />
        </Field>
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
  const setV = k => v => setForm(p => ({ ...p, [k]: v }))
  const setUpper = k => e => setForm(p => ({ ...p, [k]: e.target.value.toUpperCase() }))
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
          <Field label="Marca">
            <TextInput capitalize required value={form.marca} onChange={setV('marca')} placeholder="Ford" />
          </Field>
          <Field label="Modelo">
            <TextInput capitalize required value={form.modelo} onChange={setV('modelo')} placeholder="Focus" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Año">
            <input className="input" type="number" inputMode="numeric" min="1900" max="2100" value={form.anio} onChange={set('anio')} placeholder="2020" />
          </Field>
          <Field label="Patente">
            <input className="input font-mono uppercase" required value={form.patente} onChange={setUpper('patente')} placeholder="AB123CD" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Color">
            <TextInput capitalize value={form.color} onChange={setV('color')} placeholder="Gris" />
          </Field>
          <Field label="VIN">
            <input className="input font-mono text-xs uppercase" maxLength={17} value={form.vin} onChange={setUpper('vin')} placeholder="8AFDR5FD..." />
          </Field>
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
