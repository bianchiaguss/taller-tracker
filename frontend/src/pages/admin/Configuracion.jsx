import { useEffect, useState } from 'react'
import api from '../../api/client'
import { Save, Check, SlidersHorizontal } from 'lucide-react'
import { Page, PageHeader, Reveal, Loading, Spinner } from '../../components/ui'

const SECCIONES = [
  {
    titulo: 'Identidad del taller',
    campos: [
      { key: 'nombre_taller',  label: 'Nombre del taller', tipo: 'text' },
      { key: 'slogan',         label: 'Eslogan',            tipo: 'text' },
      { key: 'descripcion_hero', label: 'Descripción hero (debajo del eslogan)', tipo: 'textarea' },
      { key: 'sobre_nosotros', label: 'Texto "Sobre nosotros"', tipo: 'textarea' },
    ],
  },
  {
    titulo: 'Estadísticas visibles',
    campos: [
      { key: 'anios_experiencia',      label: 'Años de experiencia',       tipo: 'text', placeholder: '15+' },
      { key: 'reparaciones_realizadas', label: 'Reparaciones realizadas',  tipo: 'text', placeholder: '2.000+' },
      { key: 'clientes_satisfechos',   label: 'Clientes satisfechos',      tipo: 'text', placeholder: '98%' },
      { key: 'tiempo_promedio_dias',   label: 'Días promedio de entrega',  tipo: 'text', placeholder: '7' },
    ],
  },
  {
    titulo: 'Información de contacto',
    campos: [
      { key: 'telefono',   label: 'Teléfono',   tipo: 'text', placeholder: '+54 11 0000-0000' },
      { key: 'email',      label: 'Email',       tipo: 'email', placeholder: 'info@tutaller.com' },
      { key: 'direccion',  label: 'Dirección',   tipo: 'text' },
      { key: 'horarios',   label: 'Horarios de atención', tipo: 'text', placeholder: 'Lun–Vie 8:00–18:00' },
      { key: 'whatsapp',   label: 'WhatsApp (solo números, sin +)', tipo: 'text', placeholder: '5491100000000' },
    ],
  },
  {
    titulo: 'Redes sociales',
    campos: [
      { key: 'instagram', label: 'Usuario de Instagram (sin @)', tipo: 'text' },
      { key: 'facebook',  label: 'URL de Facebook', tipo: 'url' },
    ],
  },
  {
    titulo: 'Mapa (Google Maps)',
    campos: [
      { key: 'google_maps_embed', label: 'URL de embed de Google Maps (iframe)', tipo: 'url', placeholder: 'https://www.google.com/maps/embed?...' },
      { key: 'google_maps_review_url', label: 'URL para dejar reseña en Google Maps', tipo: 'url', placeholder: 'https://search.google.com/local/writereview?placeid=...' },
      { key: 'google_place_id', label: 'Google Place ID (para mostrar reseñas automáticamente)', tipo: 'text', placeholder: 'ChIJxxxxxxxxxxxxxxxx' },
    ],
  },
]

export default function Configuracion() {
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/config').then(r => setConfig(r.data)).finally(() => setLoading(false))
  }, [])

  const set = key => e => setConfig(p => ({ ...p, [key]: e.target.value }))

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false)
    try {
      await api.put('/config', config)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar')
    } finally { setSaving(false) }
  }

  if (loading) return <Loading />

  const SaveBtn = () => (
    <button onClick={handleSave} disabled={saving}
      className={`btn-primary ${saved ? '!bg-green-600 hover:!bg-green-700' : ''}`}>
      {saved ? <><Check size={16} /> Guardado</> : saving ? <><Spinner size={4} /> Guardando…</> : <><Save size={16} /> Guardar cambios</>}
    </button>
  )

  return (
    <Page className="p-6 sm:p-8 max-w-3xl mx-auto">
      <PageHeader title="Configuración del sitio" icon={SlidersHorizontal}
        subtitle="Estos datos se muestran en la web pública del taller."
        actions={<SaveBtn />} />

      {error && <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">{error}</div>}

      <div className="space-y-5">
        {SECCIONES.map(sec => (
          <Reveal key={sec.titulo}>
            <div className="card card-pad">
              <h3 className="font-semibold text-slate-900 mb-5 pb-3 border-b border-slate-100">{sec.titulo}</h3>
              <div className="space-y-4">
                {sec.campos.map(campo => (
                  <div key={campo.key}>
                    <label className="label">{campo.label}</label>
                    {campo.tipo === 'textarea' ? (
                      <textarea className="textarea" rows={4} value={config[campo.key] || ''}
                        onChange={set(campo.key)} placeholder={campo.placeholder || ''} />
                    ) : (
                      <input className="input" type={campo.tipo} value={config[campo.key] || ''}
                        onChange={set(campo.key)} placeholder={campo.placeholder || ''} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <SaveBtn />
      </div>
    </Page>
  )
}
