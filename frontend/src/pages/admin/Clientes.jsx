import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import api from '../../api/client'
import { Plus, X, Car, Pencil, Trash2, Users, AlertTriangle, Star, FolderOpen, Check } from 'lucide-react'
import { Page, PageHeader, Card, EmptyState, Loading, Modal, Reveal, Spinner, Field, TextInput, PhoneInput } from '../../components/ui'

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
    </div>
  )
}

/* ── Form de vehículo (crear / editar), modal apilado ── */
function VehiculoForm({ clienteId, inicial, onClose, onSaved }) {
  const editando = !!inicial
  const [form, setForm] = useState({
    marca: inicial?.marca || '', modelo: inicial?.modelo || '', anio: inicial?.anio || '',
    patente: inicial?.patente || '', color: inicial?.color || '', vin: inicial?.vin || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setV = k => v => setForm(p => ({ ...p, [k]: v }))
  const setUpper = k => e => setForm(p => ({ ...p, [k]: e.target.value.toUpperCase() }))

  const handleSubmit = async ev => {
    ev.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = { ...form, anio: form.anio ? Number(form.anio) : null }
      const { data } = editando
        ? await api.put(`/vehiculos/${inicial.id}`, payload)
        : await api.post('/vehiculos', { ...payload, cliente_id: clienteId })
      onSaved(data, editando)
    } catch (err) { setError(err.response?.data?.detail || 'Error') } finally { setLoading(false) }
  }

  return (
    <Modal open onClose={onClose} size="md">
      <ModalHeader title={editando ? 'Editar vehículo' : 'Agregar vehículo'} onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Marca"><TextInput capitalize required value={form.marca} onChange={setV('marca')} placeholder="Ford" /></Field>
          <Field label="Modelo"><TextInput capitalize required value={form.modelo} onChange={setV('modelo')} placeholder="Focus" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Año"><input className="input" type="number" inputMode="numeric" min="1900" max="2100" value={form.anio} onChange={set('anio')} placeholder="2020" /></Field>
          <Field label="Patente"><input className="input font-mono uppercase" required value={form.patente} onChange={setUpper('patente')} placeholder="AB123CD" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Color"><TextInput capitalize value={form.color} onChange={setV('color')} placeholder="Gris" /></Field>
          <Field label="VIN"><input className="input font-mono text-xs uppercase" maxLength={17} value={form.vin} onChange={setUpper('vin')} placeholder="8AFDR5FD..." /></Field>
        </div>
        {error && <p className="error-text"><AlertTriangle size={13} /> {error}</p>}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? <><Spinner size={4} /> Guardando…</> : editando ? 'Guardar' : 'Agregar'}</button>
        </div>
      </form>
    </Modal>
  )
}

/* ── Tarjeta de un vehículo dentro del módulo del cliente ── */
function VehiculoCard({ v, onEdit, onDelete, onPrincipal, onVerExpedientes }) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
        <Car size={16} className="text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 truncate">{v.marca} {v.modelo}</p>
          {v.es_principal && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
              <Star size={10} className="fill-amber-500 text-amber-500" /> Principal
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 truncate">
          {[v.anio, v.color].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
        </p>
      </div>
      <span className="font-mono text-xs bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded flex-shrink-0">{v.patente}</span>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {!v.es_principal && (
          <button type="button" onClick={onPrincipal} title="Marcar como principal"
            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Star size={15} /></button>
        )}
        <button type="button" onClick={onVerExpedientes} title="Ver expedientes"
          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><FolderOpen size={15} /></button>
        <button type="button" onClick={onEdit} title="Editar vehículo"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><Pencil size={14} /></button>
        <button type="button" onClick={onDelete} title="Eliminar vehículo"
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
      </div>
    </div>
  )
}

/* ── Modal de gestión: datos personales + módulo de vehículos ── */
function ModalCliente({ inicial, vehiculos, setVehiculos, onClose, onSaved }) {
  const navigate = useNavigate()
  const [cli, setCli] = useState(inicial)
  const editando = !!cli
  const [form, setForm] = useState(
    inicial
      ? {
          nombre: inicial.usuario.nombre, apellido: inicial.usuario.apellido,
          email: inicial.usuario.email, telefono: inicial.usuario.telefono || '',
          dni_cuit: inicial.dni_cuit || '', direccion: inicial.direccion || '',
          telefono_alternativo: inicial.telefono_alternativo || '', password: '',
        }
      : { nombre: '', apellido: '', email: '', password: '', telefono: '', dni_cuit: '', direccion: '', telefono_alternativo: '' }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [vehModal, setVehModal] = useState(null) // 'nuevo' | vehiculo
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setV = k => v => setForm(p => ({ ...p, [k]: v }))

  const misVehiculos = cli ? vehiculos.filter(v => v.cliente_id === cli.id) : []

  const guardarPersonal = async ev => {
    ev.preventDefault(); setError(''); setOk(false); setLoading(true)
    try {
      const payload = {
        nombre: form.nombre, apellido: form.apellido, email: form.email,
        telefono: form.telefono, dni_cuit: form.dni_cuit, direccion: form.direccion,
        telefono_alternativo: form.telefono_alternativo,
      }
      if (editando) {
        const { data } = await api.put(`/clientes/${cli.id}`, payload)
        onSaved(data, true); setCli(data)
      } else {
        const { data } = await api.post('/clientes', { ...payload, password: form.password })
        onSaved(data, false); setCli(data) // pasa a modo edición para poder cargar vehículos
      }
      setOk(true); setTimeout(() => setOk(false), 2200)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar')
    } finally { setLoading(false) }
  }

  const guardarVehiculo = (data, era) => {
    setVehiculos(p => era ? p.map(v => v.id === data.id ? data : v) : [...p, data])
    setVehModal(null)
  }

  const eliminarVehiculo = async v => {
    if (!confirm(`¿Eliminar ${v.marca} ${v.modelo} (${v.patente})? Se borran también sus expedientes. Esta acción no se puede deshacer.`)) return
    await api.delete(`/vehiculos/${v.id}`)
    setVehiculos(p => {
      const resto = p.filter(x => x.id !== v.id)
      // Si borramos el principal, el backend promueve el más antiguo: reflejarlo.
      if (v.es_principal) {
        const delCliente = resto.filter(x => x.cliente_id === v.cliente_id)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        if (delCliente[0]) delCliente[0].es_principal = true
      }
      return [...resto]
    })
  }

  const marcarPrincipal = async v => {
    const { data } = await api.post(`/vehiculos/${v.id}/principal`)
    setVehiculos(p => p.map(x =>
      x.cliente_id === v.cliente_id ? { ...x, es_principal: x.id === data.id } : x))
  }

  return (
    <>
      <Modal open onClose={onClose} size="lg">
        <ModalHeader
          title={editando ? 'Gestión del cliente' : 'Nuevo cliente'}
          subtitle={editando ? `${cli.usuario.nombre} ${cli.usuario.apellido}` : 'Cargá los datos personales'}
          onClose={onClose} />

        {/* ── Bloque 1: Datos personales ── */}
        <form onSubmit={guardarPersonal} className="p-6 space-y-4 border-b border-slate-100">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Datos personales</h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre"><TextInput capitalize required value={form.nombre} onChange={setV('nombre')} placeholder="Ej.: Juan" /></Field>
            <Field label="Apellido"><TextInput capitalize required value={form.apellido} onChange={setV('apellido')} placeholder="Ej.: Pérez" /></Field>
          </div>
          <Field label="Email"><input className="input" type="email" required value={form.email} onChange={set('email')} placeholder="nombre@correo.com" /></Field>
          {!editando && (
            <Field label="Contraseña inicial"><input className="input" type="password" required minLength={8} value={form.password} onChange={set('password')} placeholder="Mínimo 8 caracteres" /></Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono"><PhoneInput value={form.telefono} onChange={setV('telefono')} /></Field>
            <Field label="DNI / CUIT"><input className="input" inputMode="numeric" value={form.dni_cuit} onChange={e => setForm(p => ({ ...p, dni_cuit: e.target.value.replace(/\D/g, '') }))} placeholder="20304050607" /></Field>
          </div>
          <Field label="Dirección" hint="Calle, número, localidad."><TextInput capitalize value={form.direccion} onChange={setV('direccion')} placeholder="Ej.: Av. Siempreviva 742, Springfield" /></Field>
          {error && <p className="error-text"><AlertTriangle size={13} /> {error}</p>}
          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cerrar</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? <><Spinner size={4} /> Guardando…</> : ok ? <><Check size={16} /> Guardado</> : editando ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>

        {/* ── Bloque 2: Vehículos del cliente ── */}
        {editando ? (
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Vehículos del cliente {misVehiculos.length > 0 && <span className="text-slate-300">· {misVehiculos.length}</span>}
              </h4>
              <button type="button" onClick={() => setVehModal('nuevo')} className="btn-secondary btn-sm"><Plus size={14} /> Agregar vehículo</button>
            </div>
            {misVehiculos.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                <Car size={22} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">Este cliente todavía no tiene vehículos.</p>
                <button type="button" onClick={() => setVehModal('nuevo')} className="btn-primary btn-sm mt-3"><Plus size={14} /> Agregar el primero</button>
              </div>
            ) : (
              <div className="space-y-2">
                {misVehiculos.map(v => (
                  <VehiculoCard key={v.id} v={v}
                    onEdit={() => setVehModal(v)}
                    onDelete={() => eliminarVehiculo(v)}
                    onPrincipal={() => marcarPrincipal(v)}
                    onVerExpedientes={() => navigate(`/admin/expedientes?q=${encodeURIComponent(v.patente)}`)} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="px-6 py-4 text-xs text-slate-400">Guardá el cliente para poder cargar sus vehículos.</p>
        )}
      </Modal>

      {vehModal && (
        <VehiculoForm
          clienteId={cli.id}
          inicial={vehModal === 'nuevo' ? null : vehModal}
          onClose={() => setVehModal(null)}
          onSaved={guardarVehiculo} />
      )}
    </>
  )
}

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

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
                  <button onClick={() => setModal(c)} className="flex items-start gap-3.5 text-left min-w-0">
                    <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">{c.usuario.nombre[0]}{c.usuario.apellido[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{c.usuario.nombre} {c.usuario.apellido}</p>
                      <p className="text-sm text-slate-500 truncate">{c.usuario.email}</p>
                      {c.dni_cuit && <p className="text-xs text-slate-400 mt-0.5">DNI/CUIT: {c.dni_cuit}</p>}
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModal(c)} className="btn-secondary btn-sm" title="Gestionar cliente y vehículos"><Pencil size={14} /> Gestionar</button>
                    <button onClick={() => handleDelete(c)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Borrar"><Trash2 size={15} /></button>
                  </div>
                </div>
                {vPorCliente(c.id).length > 0 && (
                  <div className="mt-4 sm:pl-[58px] grid sm:grid-cols-2 gap-2">
                    {vPorCliente(c.id).map(v => (
                      <div key={v.id} className="flex items-center gap-2.5 bg-slate-50 rounded-lg px-3 py-2">
                        {v.es_principal
                          ? <Star size={14} className="fill-amber-500 text-amber-500 flex-shrink-0" title="Principal" />
                          : <Car size={15} className="text-slate-400 flex-shrink-0" />}
                        <span className="text-sm text-slate-700 font-medium truncate">{v.marca} {v.modelo}</span>
                        {v.anio && <span className="text-xs text-slate-400">{v.anio}</span>}
                        <span className="font-mono text-xs bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded ml-auto flex-shrink-0">{v.patente}</span>
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
            vehiculos={vehiculos}
            setVehiculos={setVehiculos}
            onClose={() => setModal(null)}
            onSaved={(data, editando) => setClientes(p => editando ? p.map(c => c.id === data.id ? data : c) : [data, ...p])}
          />
        )}
      </AnimatePresence>
    </Page>
  )
}
