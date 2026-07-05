import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../api/client'
import { Navbar, Footer, WhatsAppButton } from '../../components/PublicLayout'
import { CheckCircle, Upload, ArrowLeft, X } from 'lucide-react'
import { Spinner, Field, TextInput, PhoneInput } from '../../components/ui'

export default function Presupuesto() {
  const [config, setConfig] = useState({})
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    marca: '', modelo: '', anio: '', patente: '', descripcion_danio: ''
  })
  const [archivos, setArchivos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    api.get('/config').then(r => setConfig(r.data)).catch(() => {})
  }, [])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setV = k => v => setForm(p => ({ ...p, [k]: v }))
  const setUpper = k => e => setForm(p => ({ ...p, [k]: e.target.value.toUpperCase() }))

  const handleFiles = e => {
    const nuevos = Array.from(e.target.files).slice(0, 5)
    setArchivos(p => [...p, ...nuevos].slice(0, 5))
  }

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const payload = { ...form, anio: form.anio ? Number(form.anio) : null }
      const { data } = await api.post('/presupuestos', payload)
      // Subir imágenes si las hay
      for (const archivo of archivos) {
        const fd = new FormData(); fd.append('archivo', archivo)
        await api.post(`/presupuestos/${data.id}/imagenes`, fd)
      }
      setExito(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al enviar la solicitud. Intentá de nuevo.')
    } finally { setLoading(false) }
  }

  if (exito) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar config={config} />
        <div className="flex-1 flex items-center justify-center p-6 pt-24">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center max-w-md">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.15, stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">¡Solicitud enviada!</h2>
            <p className="text-slate-600 mb-8">
              Recibimos tu solicitud de presupuesto para tu <strong>{form.marca} {form.modelo}</strong>.
              Te contactaremos a la brevedad al email <strong>{form.email}</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/" className="btn-secondary justify-center">Volver al inicio</Link>
              <Link to="/login" className="btn-primary justify-center">Seguir mi vehículo</Link>
            </div>
          </motion.div>
        </div>
        <Footer config={config} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar config={config} />

      <div className="max-w-2xl mx-auto px-4 pt-28 pb-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm mb-8 transition-colors">
          <ArrowLeft size={15} /> Volver al inicio
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Solicitar presupuesto</h1>
          <p className="text-slate-500">Completá el formulario y te contactamos sin cargo en menos de 24 horas.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card card-pad sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Tus datos</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre">
                  <TextInput capitalize required value={form.nombre} onChange={setV('nombre')} placeholder="Juan" />
                </Field>
                <Field label="Apellido">
                  <TextInput capitalize required value={form.apellido} onChange={setV('apellido')} placeholder="Pérez" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label="Email">
                  <input className="input" type="email" required value={form.email} onChange={set('email')} placeholder="nombre@correo.com" />
                </Field>
                <Field label="Teléfono">
                  <PhoneInput required value={form.telefono} onChange={setV('telefono')} />
                </Field>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Datos del vehículo</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Marca">
                  <TextInput capitalize required value={form.marca} onChange={setV('marca')} placeholder="Ford" />
                </Field>
                <Field label="Modelo">
                  <TextInput capitalize required value={form.modelo} onChange={setV('modelo')} placeholder="Focus" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label="Año">
                  <input className="input" type="number" inputMode="numeric" min="1900" max="2100" value={form.anio} onChange={set('anio')} placeholder="2020" />
                </Field>
                <Field label="Patente">
                  <input className="input font-mono uppercase" value={form.patente} onChange={setUpper('patente')} placeholder="AB123CD" />
                </Field>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Descripción del daño</p>
              <TextInput as="textarea" capitalize="sentence" className="textarea" rows={4} required
                value={form.descripcion_danio} onChange={setV('descripcion_danio')}
                placeholder="Describí el daño o reparación que necesitás. Por ejemplo: golpe en puerta trasera derecha, rayón profundo en capó, etc." />            </div>

            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Fotos del daño (opcional)</p>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer"
                   onClick={() => document.getElementById('file-input').click()}>
                <Upload size={22} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">Subí hasta 5 fotos del daño</p>
                <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP</p>
                <input id="file-input" type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFiles} />
              </div>
              {archivos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {archivos.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 text-sm">
                      <span className="text-slate-700 truncate max-w-[120px]">{f.name}</span>
                      <button type="button" onClick={() => setArchivos(p => p.filter((_, j) => j !== i))}
                        className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-red-700 text-sm">{error}</div>
            )}

            <button type="submit" className="btn-primary btn-lg w-full" disabled={loading}>
              {loading ? <><Spinner size={4} /> Enviando…</> : 'Enviar solicitud de presupuesto'}
            </button>
          </form>
        </motion.div>
      </div>

      <Footer config={config} />
      <WhatsAppButton config={config} />
    </div>
  )
}
