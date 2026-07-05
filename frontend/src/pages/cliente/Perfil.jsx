import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'
import { User, Lock, Bell, Check, AlertCircle, Eye, EyeOff, Mail, MessageCircle } from 'lucide-react'
import { Page, PageHeader, Reveal, Spinner, Field, TextInput } from '../../components/ui'

function Msg({ msg }) {
  if (!msg) return null
  return (
    <div className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
      {msg.ok ? <Check size={14} /> : <AlertCircle size={14} />} {msg.text}
    </div>
  )
}

export default function Perfil() {
  const { usuario } = useAuth()
  const [editDatos, setEditDatos] = useState(false)
  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    apellido: usuario?.apellido || '',
    telefono: usuario?.telefono || '',
  })
  const [dniCuit, setDniCuit] = useState('')
  const [savingDatos, setSavingDatos] = useState(false)
  const [datosMsg, setDatosMsg] = useState(null)

  const [pwd, setPwd] = useState({ actual: '', nuevo: '', confirmar: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState(null)

  const [notifEmail, setNotifEmail] = useState(true)
  const [notifWa, setNotifWa] = useState(false)
  const [savingNotif, setSavingNotif] = useState(false)
  const [notifMsg, setNotifMsg] = useState(null)

  useEffect(() => {
    api.get('/auth/preferencias-notificacion').then(r => {
      setNotifEmail(r.data.notif_email)
      setNotifWa(r.data.notif_whatsapp)
    }).catch(() => {})

    // Get cliente data for DNI
    // We'll try to get it from the clientes list (admin endpoint won't work)
    // Use /api/auth/me and match via profile
  }, [])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setV = k => v => setForm(p => ({ ...p, [k]: v }))
  const setPwdF = k => e => setPwd(p => ({ ...p, [k]: e.target.value }))

  const handleSaveDatos = async e => {
    e.preventDefault(); setSavingDatos(true); setDatosMsg(null)
    try {
      const { data } = await api.put('/auth/perfil', form)
      localStorage.setItem('usuario', JSON.stringify(data))
      setDatosMsg({ ok: true, text: 'Datos actualizados.' })
      setEditDatos(false)
      setTimeout(() => setDatosMsg(null), 3000)
    } catch (err) {
      setDatosMsg({ ok: false, text: err.response?.data?.detail || 'Error al guardar.' })
    } finally { setSavingDatos(false) }
  }

  const handleCambiarPwd = async e => {
    e.preventDefault()
    if (pwd.nuevo !== pwd.confirmar) { setPwdMsg({ ok: false, text: 'Las contraseñas no coinciden.' }); return }
    if (pwd.nuevo.length < 8) { setPwdMsg({ ok: false, text: 'Mínimo 8 caracteres.' }); return }
    setSavingPwd(true); setPwdMsg(null)
    try {
      await api.post('/auth/cambiar-password', { password_actual: pwd.actual, password_nuevo: pwd.nuevo })
      setPwdMsg({ ok: true, text: '¡Contraseña actualizada!' })
      setPwd({ actual: '', nuevo: '', confirmar: '' })
    } catch (err) {
      setPwdMsg({ ok: false, text: err.response?.data?.detail || 'Error al cambiar la contraseña.' })
    } finally { setSavingPwd(false) }
  }

  const handleSaveNotif = async () => {
    setSavingNotif(true); setNotifMsg(null)
    try {
      await api.put('/auth/preferencias-notificacion', { notif_email: notifEmail, notif_whatsapp: notifWa })
      setNotifMsg({ ok: true, text: 'Preferencias guardadas.' })
      setTimeout(() => setNotifMsg(null), 3000)
    } catch {
      setNotifMsg({ ok: false, text: 'Error al guardar.' })
    } finally { setSavingNotif(false) }
  }

  return (
    <Page className="max-w-lg mx-auto">
      <PageHeader title="Mi perfil" icon={User} subtitle="Datos personales y configuración de cuenta" />

      {/* Avatar + datos */}
      <Reveal className="card card-pad mb-4">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center flex-shrink-0 shadow-soft">
            <span className="text-white font-bold text-xl">
              {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
            </span>
          </div>
          <div>
            <h2 className="font-bold text-slate-900">{usuario?.nombre} {usuario?.apellido}</h2>
            <p className="text-slate-500 text-sm">{usuario?.email}</p>
            <span className="badge badge-proceso mt-1.5 inline-flex">Cliente</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <User size={14} className="text-slate-400" /> Datos personales
          </h3>
          {!editDatos && (
            <button onClick={() => setEditDatos(true)} className="btn-secondary btn-sm">Editar</button>
          )}
        </div>

        {datosMsg && <div className="mb-3"><Msg msg={datosMsg} /></div>}

        {editDatos ? (
          <form onSubmit={handleSaveDatos} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre" hint="Ingresá tu nombre.">
                <TextInput capitalize value={form.nombre} onChange={setV('nombre')} required placeholder="Juan" />
              </Field>
              <Field label="Apellido" hint="Ingresá tu apellido.">
                <TextInput capitalize value={form.apellido} onChange={setV('apellido')} required placeholder="Pérez" />
              </Field>
            </div>
            <Field label="Teléfono" hint="Ej.: +54 11 1234-5678">
              <input className="input" type="tel" value={form.telefono} onChange={set('telefono')} placeholder="+54 11 1234-5678" />
            </Field>
            <Field label="DNI / CUIT" hint="Solo números, sin puntos ni guiones.">
              <input className="input" inputMode="numeric" value={dniCuit} onChange={e => setDniCuit(e.target.value.replace(/\D/g, ''))} placeholder="20304050607" />
            </Field>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setEditDatos(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button type="submit" className="btn-primary flex-1" disabled={savingDatos}>
                {savingDatos ? <><Spinner size={4} /> Guardando…</> : 'Guardar'}
              </button>
            </div>
          </form>
        ) : (
          <div className="divide-y divide-slate-100">
            {[
              { label: 'Nombre completo', value: `${usuario?.nombre} ${usuario?.apellido}` },
              { label: 'Email', value: usuario?.email },
              { label: 'Teléfono', value: usuario?.telefono || '—' },
              { label: 'DNI / CUIT', value: dniCuit || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-medium text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        )}
      </Reveal>

      {/* Notificaciones */}
      <Reveal className="card card-pad mb-4">
        <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2 mb-2">
          <Bell size={14} className="text-slate-400" /> Preferencias de notificación
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Elegí cómo querés recibir actualizaciones de tu reparación.
        </p>
        <div className="space-y-3 mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-10 h-6 rounded-full transition-colors relative ${notifEmail ? 'bg-primary' : 'bg-slate-200'}`}
              onClick={() => setNotifEmail(p => !p)}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notifEmail ? 'left-5' : 'left-1'}`} />
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-900">Email</p>
                <p className="text-xs text-slate-500">Recibís un correo en cada actualización importante</p>
              </div>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-10 h-6 rounded-full transition-colors relative ${notifWa ? 'bg-green-500' : 'bg-slate-200'}`}
              onClick={() => setNotifWa(p => !p)}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notifWa ? 'left-5' : 'left-1'}`} />
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-900">WhatsApp</p>
                <p className="text-xs text-slate-500">Mensaje directo a tu número (próximamente)</p>
              </div>
            </div>
          </label>
        </div>
        <Msg msg={notifMsg} />
        <button onClick={handleSaveNotif} className="btn-primary w-full mt-3" disabled={savingNotif}>
          {savingNotif ? <><Spinner size={4} /> Guardando…</> : 'Guardar preferencias'}
        </button>
      </Reveal>

      {/* Contraseña */}
      <Reveal className="card card-pad">
        <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2 mb-4">
          <Lock size={14} className="text-slate-400" /> Cambiar contraseña
        </h3>
        <form onSubmit={handleCambiarPwd} className="space-y-3">
          {[
            { key: 'actual', label: 'Contraseña actual', hint: 'La que usás para ingresar hoy.' },
            { key: 'nuevo', label: 'Nueva contraseña', hint: 'Mínimo 8 caracteres.' },
            { key: 'confirmar', label: 'Confirmar nueva contraseña', hint: 'Repetí la nueva contraseña.' },
          ].map(({ key, label, hint }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <div className="relative">
                <input className="input pr-10" type={showPwd ? 'text' : 'password'}
                  value={pwd[key]} onChange={setPwdF(key)} required minLength={key === 'actual' ? undefined : 8} placeholder="••••••••" />
                {key === 'actual' && (
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
              <p className="hint">{hint}</p>
            </div>
          ))}
          <Msg msg={pwdMsg} />
          <button type="submit" className="btn-primary w-full" disabled={savingPwd}>
            {savingPwd ? <><Spinner size={4} /> Cambiando…</> : 'Cambiar contraseña'}
          </button>
        </form>
      </Reveal>
    </Page>
  )
}
