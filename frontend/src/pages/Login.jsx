import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { Wrench, Eye, EyeOff, AlertCircle, ShieldCheck, Camera, Bell, Car, CheckCircle2 } from 'lucide-react'
import { Spinner } from '../components/ui'

/* Mockup del producto — refuerza la identidad */
function TrackingPreview() {
  const pasos = ['Ingreso', 'Chapa', 'Pintura', 'Entrega']
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
      className="rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-xl p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Car size={17} className="text-primary-light" />
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-none">Toyota Corolla</p>
            <p className="text-slate-500 text-[11px] mt-1 font-mono">AB 123 CD</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-primary-light bg-primary/20 px-2 py-1 rounded-full">En pintura</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-1.5">
        <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ delay: 0.6, duration: 0.9 }}
          className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-400" />
      </div>
      <p className="text-[11px] text-slate-500 mb-4 text-right">65% completado</p>
      <div className="flex items-center justify-between">
        {pasos.map((p, i) => (
          <div key={p} className="flex flex-col items-center gap-1.5 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${i < 2 ? 'bg-primary' : i === 2 ? 'bg-primary/30 ring-2 ring-primary' : 'bg-white/10'}`}>
              {i < 2 ? <CheckCircle2 size={13} className="text-white" /> : <span className={`w-1.5 h-1.5 rounded-full ${i === 2 ? 'bg-primary-light' : 'bg-white/30'}`} />}
            </div>
            <span className={`text-[9px] ${i <= 2 ? 'text-slate-300' : 'text-slate-600'}`}>{p}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function BrandPanel({ tallerNombre }) {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }} />
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
          Tu reparación,<br /><span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg,#60A5FA,#818CF8)' }}>siempre visible.</span>
        </h1>
        <p className="text-slate-400 text-base leading-relaxed max-w-sm mb-8">
          Seguimiento en tiempo real del estado de tu vehículo. Sin llamadas, sin esperas.
        </p>
        <TrackingPreview />
      </motion.div>

      <div className="relative space-y-2.5">
        {[
          { icon: ShieldCheck, t: 'Transparencia total' },
          { icon: Camera, t: 'Fotos por cada etapa' },
          { icon: Bell, t: 'Avisos automáticos por email' },
        ].map(({ icon: Icon, t }, i) => (
          <motion.div key={t} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }} className="flex items-center gap-3 text-slate-300">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Icon size={14} className="text-primary-light" />
            </div>
            <span className="text-sm font-medium">{t}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [tallerNombre, setTallerNombre] = useState('TallerTrack')
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/config').then(r => { if (r.data.nombre_taller) setTallerNombre(r.data.nombre_taller) }).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const u = await login(form.email, form.password)
      navigate(u.rol === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Email o contraseña incorrectos.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      <BrandPanel tallerNombre={tallerNombre} />

      {/* Panel derecho */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface relative">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Wrench size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">{tallerNombre}</span>
          </Link>

          <h2 className="text-[28px] font-bold text-slate-900 tracking-tight mb-1">Bienvenido de nuevo</h2>
          <p className="text-slate-500 text-sm mb-8">
            Ingresá para ver el avance de tu vehículo.{' '}
            <Link to="/" className="text-primary hover:underline text-xs">← Volver al sitio</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="tu@email.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required autoFocus />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Contraseña</label>
              </div>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} className="input pr-10" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}
            <motion.button whileTap={{ scale: 0.98 }} type="submit" className="btn-primary btn-lg w-full" disabled={loading}>
              {loading ? <><Spinner size={4} /> Ingresando…</> : 'Ingresar'}
            </motion.button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200/70 text-center">
            <p className="text-sm text-slate-500">
              ¿No tenés cuenta?{' '}
              <Link to="/registro" className="text-primary font-semibold hover:underline">Registrate gratis</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
