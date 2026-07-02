import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'
import { Wrench, Eye, EyeOff, AlertCircle, Clock, Camera, MapPin, BellRing, CheckCircle2 } from 'lucide-react'
import { Spinner } from '../../components/ui'

const BENEFICIOS = [
  { icon: Clock, t: 'Seguimiento en vivo', d: 'Mirá en qué etapa está tu vehículo en cada momento.' },
  { icon: Camera, t: 'Fotos de cada paso', d: 'Documentación visual real del trabajo realizado.' },
  { icon: BellRing, t: 'Notificaciones', d: 'Te avisamos cuando hay novedades o cambia la fecha.' },
  { icon: MapPin, t: 'Todo en un lugar', d: 'Expedientes, documentos y reseñas centralizados.' },
]

function BrandPanel({ tallerNombre }) {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '40px 40px'
        }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative">
        <Link to="/" className="flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-glow">
            <Wrench size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">{tallerNombre}</span>
        </Link>
        <h1 className="text-white text-[40px] font-extrabold leading-[1.05] mb-4 tracking-tight">
          Creá tu cuenta<br /><span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg,#60A5FA,#818CF8)' }}>y seguí tu auto.</span>
        </h1>
        <p className="text-slate-400 text-base leading-relaxed max-w-sm">
          En menos de un minuto vas a poder ver el avance de tu reparación desde donde estés.
        </p>
      </motion.div>

      <div className="relative space-y-3">
        {BENEFICIOS.map(({ icon: Icon, t, d }, i) => (
          <motion.div key={t} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
            className="flex gap-3.5 items-start p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Icon size={17} className="text-primary-light" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{t}</p>
              <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{d}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function Registro() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [tallerNombre, setTallerNombre] = useState('TallerTrack')
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', confirmar: '', telefono: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/config').then(r => { if (r.data.nombre_taller) setTallerNombre(r.data.nombre_taller) }).catch(() => {})
  }, [])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password !== form.confirmar) { setError('Las contraseñas no coinciden.'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/registro', {
        nombre: form.nombre, apellido: form.apellido,
        email: form.email, password: form.password,
        telefono: form.telefono || null,
      })
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('usuario', JSON.stringify(data.usuario))
      navigate('/mis-expedientes', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear la cuenta.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      <BrandPanel tallerNombre={tallerNombre} />

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="w-full max-w-sm py-8">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Wrench size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">{tallerNombre}</span>
          </Link>

          <h2 className="text-[28px] font-bold text-slate-900 tracking-tight mb-1">Crear cuenta</h2>
          <p className="text-slate-500 text-sm mb-7">Registrate para seguir tu vehículo en tiempo real.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nombre</label>
                <input className="input" required value={form.nombre} onChange={set('nombre')} placeholder="Juan" />
              </div>
              <div>
                <label className="label">Apellido</label>
                <input className="input" required value={form.apellido} onChange={set('apellido')} placeholder="Pérez" />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={form.email} onChange={set('email')} placeholder="tu@email.com" />
            </div>
            <div>
              <label className="label">Teléfono (opcional)</label>
              <input className="input" type="tel" value={form.telefono} onChange={set('telefono')} placeholder="+54 11 ..." />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <input className="input pr-10" type={showPwd ? 'text' : 'password'} required
                  value={form.password} onChange={set('password')} placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirmar contraseña</label>
              <input className="input" type="password" required value={form.confirmar} onChange={set('confirmar')} placeholder="Repetí la contraseña" />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}

            <motion.button whileTap={{ scale: 0.98 }} type="submit" className="btn-primary btn-lg w-full" disabled={loading}>
              {loading ? <><Spinner size={4} /> Creando cuenta…</> : 'Crear cuenta'}
            </motion.button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6 pt-6 border-t border-slate-200/70">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Iniciá sesión</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
