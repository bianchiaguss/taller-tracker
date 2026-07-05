import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../api/client'
import { Navbar, Footer, WhatsAppButton } from '../../components/PublicLayout'
import {
  Shield, Camera, Star, ChevronLeft, ChevronRight, ArrowRight, Phone, Mail, MapPin, Clock,
  Wrench, Zap, Car, PaintBucket, FileCheck, Gem, CheckCircle, CheckCircle2, Smartphone
} from 'lucide-react'

const viewport = { once: true, margin: '-80px' }
function InView({ children, className = '', delay = 0, as = 'div', ...props }) {
  const M = motion[as] || motion.div
  return (
    <M className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport} transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }} {...props}>
      {children}
    </M>
  )
}

const SERVICIOS = [
  { icon: Wrench,    title: 'Chapa y Enderezado',  desc: 'Reparación de abolladuras, deformaciones y daños estructurales con técnicas de última generación.' },
  { icon: PaintBucket, title: 'Pintura Automotriz', desc: 'Cabina de pintura profesional y mezcla computarizada para un acabado idéntico al original.' },
  { icon: Shield,    title: 'Siniestros',           desc: 'Trabajamos con todas las aseguradoras. Gestionamos el trámite y te mantenemos informado.' },
  { icon: Gem,       title: 'Restauraciones',       desc: 'Devolvemos el aspecto original a vehículos clásicos y de colección con acabado perfecto.' },
  { icon: Zap,       title: 'Pulido y Detailing',   desc: 'Corrección de pintura, pulido profundo y protección cerámica para máximo brillo.' },
  { icon: FileCheck, title: 'Gestión con Seguros',  desc: 'Asesoramiento y tramitación completa ante compañías aseguradoras. Sin intermediarios.' },
]

function StarRating({ n }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14} className={i <= n ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
      ))}
    </div>
  )
}

/* Mockup flotante de seguimiento para el hero */
function HeroPreview() {
  const pasos = ['Ingreso', 'Chapa', 'Pintura', 'Entrega']
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
      className="relative">
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center">
              <Car size={20} className="text-primary-light" />
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-none">Toyota Corolla</p>
              <p className="text-slate-500 text-xs mt-1 font-mono">AB 123 CD · Gris</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-primary-light bg-primary/20 px-2.5 py-1 rounded-full">En pintura</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span>Avance de la reparación</span><span className="text-white font-bold">65%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-5">
          <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ delay: 0.7, duration: 1 }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-400" />
        </div>
        <div className="flex items-center justify-between">
          {pasos.map((p, i) => (
            <div key={p} className="flex flex-col items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${i < 2 ? 'bg-primary' : i === 2 ? 'bg-primary/30 ring-2 ring-primary' : 'bg-white/10'}`}>
                {i < 2 ? <CheckCircle2 size={15} className="text-white" /> : <span className={`w-1.5 h-1.5 rounded-full ${i === 2 ? 'bg-primary-light' : 'bg-white/30'}`} />}
              </div>
              <span className={`text-[10px] ${i <= 2 ? 'text-slate-300' : 'text-slate-600'}`}>{p}</span>
            </div>
          ))}
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 }}
        className="absolute -bottom-5 -left-5 bg-white rounded-xl shadow-elevated px-4 py-3 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center"><Camera size={16} className="text-green-600" /></div>
        <div>
          <p className="text-slate-900 text-xs font-bold leading-none">Nueva foto</p>
          <p className="text-slate-400 text-[11px] mt-1">Etapa de pintura</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Home() {
  const [config, setConfig] = useState({})
  const [galeria, setGaleria] = useState([])
  const [opiniones, setOpiniones] = useState([])
  const [loadingGaleria, setLoadingGaleria] = useState(true)
  const [googleRating, setGoogleRating] = useState(null)
  const [googleTotal, setGoogleTotal] = useState(null)

  useEffect(() => {
    api.get('/config').then(r => setConfig(r.data)).catch(() => {})
    api.get('/galeria').then(r => setGaleria(r.data)).catch(() => {}).finally(() => setLoadingGaleria(false))
    api.get('/opiniones/google').then(r => {
      if (r.data.ok && r.data.reviews?.length > 0) {
        setOpiniones(r.data.reviews.map((r2, i) => ({ id: i, nombre: r2.nombre, calificacion: r2.calificacion, comentario: r2.comentario, fecha_relativa: r2.fecha_relativa, fuente: 'google' })))
        setGoogleRating(r.data.rating); setGoogleTotal(r.data.total)
      } else {
        api.get('/opiniones').then(r2 => setOpiniones(r2.data)).catch(() => {})
      }
    }).catch(() => { api.get('/opiniones').then(r2 => setOpiniones(r2.data)).catch(() => {}) })
  }, [])

  const trabajosRef = useRef(null)
  const animRef = useRef(0)
  const dragRef = useRef({ down: false, startX: 0, startScroll: 0 })

  const animarScroll = (el, to, duration = 520) => {
    cancelAnimationFrame(animRef.current)
    const start = el.scrollLeft
    const change = to - start
    if (Math.abs(change) < 1) return
    const t0 = performance.now()
    const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) // easeInOutCubic
    const step = now => {
      const p = Math.min(1, (now - t0) / duration)
      el.scrollLeft = start + change * ease(p)
      if (p < 1) animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
  }

  const pasoCard = (el) => {
    const card = el.children[0]
    const w = card ? card.offsetWidth + 24 : el.clientWidth
    return { w, perPage: Math.max(1, Math.round(el.clientWidth / w)) }
  }

  const scrollTrabajos = (dir) => {
    const el = trabajosRef.current
    if (!el) return
    const { w, perPage } = pasoCard(el)
    const max = el.scrollWidth - el.clientWidth
    const raw = el.scrollLeft + dir * w * perPage
    animarScroll(el, Math.max(0, Math.min(max, Math.round(raw / w) * w)))
  }

  const onDragStart = (e) => {
    if (e.pointerType !== 'mouse') return // en touch usamos el scroll nativo
    const el = trabajosRef.current
    cancelAnimationFrame(animRef.current)
    dragRef.current = { down: true, startX: e.clientX, startScroll: el.scrollLeft }
    el.setPointerCapture?.(e.pointerId)
  }
  const onDragMove = (e) => {
    if (!dragRef.current.down) return
    e.preventDefault()
    trabajosRef.current.scrollLeft = dragRef.current.startScroll - (e.clientX - dragRef.current.startX)
  }
  const onDragEnd = () => {
    if (!dragRef.current.down) return
    dragRef.current.down = false
    const el = trabajosRef.current
    const { w } = pasoCard(el)
    const max = el.scrollWidth - el.clientWidth
    animarScroll(el, Math.max(0, Math.min(max, Math.round(el.scrollLeft / w) * w)), 360)
  }

  const stats = [
    { label: 'Años de experiencia',      value: config.anios_experiencia || '15+' },
    { label: 'Reparaciones realizadas',  value: config.reparaciones_realizadas || '2.000+' },
    { label: 'Clientes satisfechos',     value: config.clientes_satisfechos || '98%' },
    { label: 'Días promedio de entrega', value: config.tiempo_promedio_dias || '7' },
  ]

  return (
    <div className="min-h-screen bg-surface">
      <Navbar config={config} />

      {/* ─── Hero asimétrico ──────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16"
        style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0F172A 40%, #1E1B4B 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }} />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }} />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center w-full">
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary-light text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Seguimiento en tiempo real de tu reparación
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}
              className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-white leading-[1.05] mb-6 tracking-tight">
              {config.nombre_taller || 'Tu Taller'}<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #60A5FA, #818CF8)' }}>de confianza</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.16 }}
              className="text-slate-400 text-lg max-w-md mb-8 leading-relaxed">
              {config.descripcion_hero || 'Seguí el avance de tu reparación en tiempo real, con fotos y actualizaciones de cada etapa.'}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.24 }}
              className="flex flex-col sm:flex-row gap-4">
              <Link to="/presupuesto" className="btn-primary btn-lg rounded-xl px-7 py-4">Solicitar presupuesto</Link>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 px-7 py-4 text-base font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-all active:scale-[0.98]">
                Seguir mi vehículo <ChevronRight size={18} />
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="flex items-center gap-3 mt-8 text-slate-400 text-sm">
              <StarRating n={5} />
              <span>{googleRating ? `${googleRating} en Google · ${googleTotal?.toLocaleString()} reseñas` : 'Cientos de clientes satisfechos'}</span>
            </motion.div>
          </div>

          <div className="hidden lg:block"><HeroPreview /></div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-5 h-8 border-2 border-white/20 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/40 rounded-full" />
          </div>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────────── */}
      <section className="bg-sidebar py-10 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <InView key={s.label} delay={i * 0.05} className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-white mb-1">{s.value}</p>
              <p className="text-slate-500 text-xs uppercase tracking-wide font-medium">{s.label}</p>
            </InView>
          ))}
        </div>
      </section>

      {/* ─── Quiénes Somos ────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white" id="nosotros">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <InView>
            <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">¿Quiénes somos?</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Calidad, <span className="text-primary">transparencia</span><br />y tecnología en cada reparación
            </h2>

            <p className="text-slate-600 leading-relaxed mt-6 border-l-2 border-primary/30 pl-5 text-[15px]">
              {config.sobre_nosotros || 'Somos un taller especializado en chapa, pintura y reparaciones por siniestro con más de 15 años de experiencia. Trabajamos con las principales aseguradoras y con clientes particulares, siempre con el mismo estándar de calidad y transparencia.'}
            </p>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 mt-10">
              {['Trabajamos con las principales aseguradoras', 'Seguimiento online en tiempo real',
                'Cabina de pintura con mezcla computarizada', 'Técnicos certificados y en formación continua',
              ].map(v => (
                <div key={v} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle size={12} className="text-primary" />
                  </div>
                  <span className="text-slate-700 text-sm leading-snug">{v}</span>
                </div>
              ))}
            </div>
          </InView>

          <InView delay={0.1} className="grid grid-cols-2 gap-4">
            {[
              { icon: FileCheck, title: 'Presupuesto sin cargo', desc: 'Evaluación gratuita y detallada' },
              { icon: Shield, title: 'Garantía escrita', desc: 'Todos nuestros trabajos tienen garantía' },
              { icon: Wrench, title: 'Repuestos de calidad', desc: 'Solo repuestos garantizados' },
              { icon: Smartphone, title: 'Plataforma digital', desc: 'Seguí tu vehículo desde el celular' },
            ].map(c => (
              <motion.div key={c.title} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="bg-surface rounded-2xl p-5 border border-slate-200/70 hover:border-primary/20 hover:shadow-card transition-colors">
                <div className="icon-box w-11 h-11 bg-primary/10 text-primary mb-3"><c.icon size={20} strokeWidth={1.75} /></div>
                <p className="font-bold text-slate-900 text-sm">{c.title}</p>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </InView>
        </div>
      </section>

      {/* ─── Servicios (bento) ────────────────────────────────── */}
      <section className="py-24 px-4 bg-surface" id="servicios">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">Lo que hacemos</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Servicios especializados</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICIOS.map((s, i) => (
              <InView key={s.title} delay={(i % 3) * 0.06}>
                <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="group relative h-56 rounded-2xl border border-slate-200/70 bg-white shadow-card overflow-hidden cursor-default transition-shadow duration-500 hover:shadow-elevated">
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
                  <div className="relative h-full flex flex-col items-center justify-center text-center px-6 transition-transform duration-500 group-hover:-translate-y-8">
                    <div className="icon-box w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-500 mb-4">
                      <s.icon size={26} strokeWidth={1.75} className="text-primary group-hover:text-primary-light transition-colors duration-500" />
                    </div>
                    <h3 className="font-bold text-[17px] tracking-tight text-slate-900 group-hover:text-white transition-colors duration-500">{s.title}</h3>
                  </div>
                  <p className="absolute inset-x-6 bottom-6 text-center text-sm leading-relaxed text-white/75 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 line-clamp-3">
                    {s.desc}
                  </p>
                </motion.div>
              </InView>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Cómo funciona ────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">La diferencia</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Seguimiento como nunca lo tuviste</h2>
          <p className="text-slate-500 mt-3">Sin llamadas, sin incertidumbre. Todo en tiempo real.</p>
        </div>
        <div className="max-w-5xl mx-auto relative">
          <div className="hidden md:block absolute top-[88px] left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: '01', icon: Car,    title: 'Dejás tu auto', desc: 'El taller registra tu vehículo y abre un expediente digital con todos los datos.' },
              { n: '02', icon: Camera, title: 'Seguís el avance', desc: 'Recibís notificaciones y ves fotos de cada etapa desde tu celular o computadora.' },
              { n: '03', icon: CheckCircle, title: 'Retirás informado', desc: 'Sabés exactamente cuándo está listo antes de ir a buscarlo.' },
            ].map((s, i) => (
              <InView key={s.n} delay={i * 0.12} className="relative text-center">
                <div className="text-6xl font-black text-slate-100 mb-2 font-mono">{s.n}</div>
                <div className="icon-box w-14 h-14 bg-gradient-to-br from-primary to-primary-dark mx-auto -mt-12 mb-5 shadow-glow relative z-10 ring-4 ring-white">
                  <s.icon size={24} className="text-white" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-lg">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </InView>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Galería (carrusel Antes y después) ───────────────── */}
      <section className="py-24 px-4 bg-surface overflow-hidden" id="trabajos">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">Trabajos realizados</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Antes y después</h2>
            </div>
            {galeria.length > 3 && (
              <div className="hidden md:flex gap-2">
                <button onClick={() => scrollTrabajos(-1)} aria-label="Anterior"
                  className="w-11 h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-primary hover:text-primary hover:shadow-card transition-all active:scale-95">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => scrollTrabajos(1)} aria-label="Siguiente"
                  className="w-11 h-11 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-primary hover:text-primary hover:shadow-card transition-all active:scale-95">
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          {loadingGaleria ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : galeria.length === 0 ? (
            <div className="text-center py-16 text-slate-400"><p>Pronto vas a ver nuestros trabajos acá.</p></div>
          ) : (
            <div ref={trabajosRef}
              onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerLeave={onDragEnd}
              className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {galeria.map(item => (
                <div key={item.id} className="shrink-0 w-[300px] sm:w-[340px] lg:w-[calc((100%-3rem)/3)] card card-hover overflow-hidden group">
                  <div className="relative grid grid-cols-2 h-44">
                    <div className="relative overflow-hidden">
                      <img src={item.imagen_antes} alt="Antes" draggable={false} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded">ANTES</span>
                    </div>
                    <div className="relative overflow-hidden">
                      <img src={item.imagen_despues} alt="Después" draggable={false} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <span className="absolute bottom-2 right-2 bg-primary/90 text-white text-xs font-bold px-2 py-0.5 rounded">DESPUÉS</span>
                    </div>
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-white/60 z-10" />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-slate-900 text-sm">{item.marca} {item.modelo}{item.anio ? ` ${item.anio}` : ''}</p>
                    <p className="text-primary text-xs font-medium mt-0.5">{item.tipo_reparacion}</p>
                    {item.descripcion && <p className="text-slate-500 text-xs mt-2 line-clamp-2">{item.descripcion}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Opiniones ────────────────────────────────────────── */}
      {(opiniones.length > 0 || config.google_maps_review_url) && (
        <section className="py-24 px-4 bg-sidebar" id="opiniones">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-primary-light text-xs font-bold uppercase tracking-widest mb-3">Lo que dicen</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Clientes satisfechos</h2>
              {googleRating && <p className="text-slate-400 mt-2 text-sm">⭐ {googleRating} · {googleTotal?.toLocaleString()} reseñas en Google</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {config.google_maps_review_url && (
                <InView as="a" href={config.google_maps_review_url} target="_blank" rel="noreferrer"
                  className="group relative overflow-hidden rounded-2xl p-6 flex flex-col items-center text-center ring-1 ring-white/15 hover:ring-white/30 transition-all shadow-elevated hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(150deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.03) 100%)' }}>
                  <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none opacity-40 blur-2xl"
                    style={{ background: 'radial-gradient(circle, rgba(66,133,244,0.35) 0%, transparent 70%)' }} />
                  <div className="relative mb-4 flex justify-center group-hover:scale-105 transition-transform" style={{ width: 54, height: 66 }}>
                    <div style={{
                      width: 48, height: 48,
                      borderRadius: '50% 50% 50% 0',
                      transform: 'rotate(-45deg)',
                      background: 'conic-gradient(from 130deg at 50% 50%, #4285F4 0deg, #34A853 90deg, #FBBC05 170deg, #EA4335 250deg, #4285F4 360deg)',
                      boxShadow: '0 10px 18px rgba(0,0,0,0.4)',
                    }} />
                    <div className="absolute rounded-full keep-white" style={{ width: 18, height: 18, left: '50%', top: 24, transform: 'translate(-50%, -50%)' }} />
                  </div>
                  <p className="relative text-white font-bold text-base leading-snug">Más de nuestros clientes nos recomiendan en Google</p>
                  <p className="relative text-slate-300 text-sm leading-relaxed mt-2">Conocé todas las opiniones reales de quienes confiaron en nuestro trabajo.</p>
                  <div className="relative mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-1.5 text-white font-semibold text-sm mt-auto w-full">
                    Ver todas las reseñas
                    <ArrowRight size={15} className="text-primary-light group-hover:translate-x-1 transition-transform" />
                  </div>
                </InView>
              )}
              {opiniones.slice(0, config.google_maps_review_url ? 2 : 3).map((op, i) => (
                <InView key={op.id} delay={((i + 1) % 3) * 0.06} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <StarRating n={op.calificacion} />
                    {op.fuente === 'google' && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <svg viewBox="0 0 24 24" width="12" height="12"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Google
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">"{op.comentario}"</p>
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                    <p className="text-white font-semibold text-sm">{op.nombre}</p>
                    <p className="text-slate-500 text-xs">
                      {op.fecha_relativa || (op.fecha ? new Date(op.fecha + 'T12:00:00').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : '')}
                    </p>
                  </div>
                </InView>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Contacto + CTA (una sola experiencia) ────────────── */}
      <section className="py-24 px-4 bg-white" id="contacto">
        <InView className="max-w-6xl mx-auto rounded-3xl overflow-hidden relative shadow-elevated ring-1 ring-white/5"
          style={{ background: 'linear-gradient(160deg, #111827 0%, #1E293B 100%)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-40 -right-32 w-[460px] h-[460px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }} />
          </div>

          <div className="relative grid lg:grid-cols-2">
            {/* Contacto */}
            <div className="p-9 sm:p-12">
              <p className="text-primary-light text-xs font-bold uppercase tracking-widest mb-3">Contacto</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">Hablemos de<br />tu vehículo</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
                Estamos para asesorarte. Escribinos o acercate al taller y te atendemos sin compromiso.
              </p>
              <div className="space-y-2.5">
                {config.telefono && (
                  <a href={`tel:${config.telefono}`} className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="icon-box w-10 h-10 bg-primary/15 text-primary-light flex-shrink-0"><Phone size={17} /></div>
                    <div className="min-w-0"><p className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">Teléfono</p><p className="text-white text-sm font-semibold">{config.telefono}</p></div>
                  </a>
                )}
                {config.email && (
                  <a href={`mailto:${config.email}`} className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="icon-box w-10 h-10 bg-primary/15 text-primary-light flex-shrink-0"><Mail size={17} /></div>
                    <div className="min-w-0"><p className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">Email</p><p className="text-white text-sm font-semibold truncate">{config.email}</p></div>
                  </a>
                )}
                {config.direccion && (
                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="icon-box w-10 h-10 bg-primary/15 text-primary-light flex-shrink-0"><MapPin size={17} /></div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">Dirección</p>
                      <p className="text-white text-sm font-semibold">{config.direccion}</p>
                      {config.horarios && <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1"><Clock size={11} /> {config.horarios}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA — enfocado en contactar al taller */}
            <div className="p-9 sm:p-12 lg:border-l border-white/10 flex flex-col justify-center bg-white/[0.03]">
              <h3 className="text-white font-extrabold text-2xl mb-2">¿Listo para empezar?</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Contanos qué necesita tu vehículo y te asesoramos sin compromiso.
              </p>
              {config.whatsapp && (
                <a href={`https://wa.me/${config.whatsapp}?text=Hola, quería consultar sobre una reparación`} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors text-base active:scale-[0.98] mb-3">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Escribinos por WhatsApp
                </a>
              )}
              <Link to="/presupuesto" className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 keep-white text-sidebar font-bold rounded-xl hover:bg-slate-100 transition-colors active:scale-[0.98]">
                Solicitar presupuesto <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </InView>
      </section>

      <Footer config={config} />
      <WhatsAppButton config={config} />
    </div>
  )
}
