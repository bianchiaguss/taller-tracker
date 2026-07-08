import { useRef, useLayoutEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'

/* ── Motion variants ─────────────────────────────── */
export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] } },
}
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
}

/* Contenedor que aparece con fade+slide. Úsalo para envolver páginas. */
export function Page({ children, className = '' }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  )
}

/* Item animado individual (hijo de Page/stagger) */
export function Reveal({ children, className = '', as = 'div', ...props }) {
  const M = motion[as] || motion.div
  return <M variants={fadeUp} className={className} {...props}>{children}</M>
}

/* ── Toggle de tema (claro / oscuro) ──────────────── */
export function ThemeToggle({ className = '', chrome = false }) {
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch { /* noop */ }
  }
  return (
    <button type="button" onClick={toggle} title={dark ? 'Modo claro' : 'Modo oscuro'}
      aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
      className={`theme-toggle ${chrome ? 'theme-toggle--chrome' : ''} ${className}`}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

/* ── Formularios ─────────────────────────────────── */

// Title Case sin bajar el resto → no cambia la longitud, el cursor no salta.
export const titleCase = s => s.replace(/(^|[\s'/-])(\p{L})/gu, (_, b, c) => b + c.toUpperCase())
// Primera letra de cada oración (para descripciones).
export const sentenceCase = s => s.replace(/(^\s*\p{L})|([.!?]\s+\p{L})/gu, m => m.toUpperCase())

// Campo uniforme: label + input + texto de ayuda sutil.
export function Field({ label, hint, htmlFor, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label htmlFor={htmlFor} className="label">{label}</label>}
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

// Restaura el cursor tras reformatear el valor (evita saltos al final).
function useCaret(ref) {
  const caret = useRef(null)
  useLayoutEffect(() => {
    if (caret.current != null && ref.current && document.activeElement === ref.current) {
      try { ref.current.setSelectionRange(caret.current, caret.current) } catch { /* noop */ }
    }
    caret.current = null
  })
  return caret
}

// Input/textarea controlado que preserva el cursor y opcionalmente capitaliza.
// onChange recibe el string ya transformado (no el evento).
export function TextInput({ value, onChange, capitalize, as = 'input', className = 'input', ...props }) {
  const ref = useRef(null)
  const caret = useCaret(ref)
  const handle = e => {
    caret.current = e.target.selectionStart
    let v = e.target.value
    if (capitalize === 'sentence') v = sentenceCase(v)
    else if (capitalize) v = titleCase(v)
    onChange(v)
  }
  const Tag = as
  return <Tag ref={ref} className={className} value={value} onChange={handle} {...props} />
}

// Input de dinero: muestra 1.500.000 y entrega los dígitos crudos ("1500000").
// Agrupa los miles con puntos manualmente (sin depender del locale del dispositivo).
const soloDigitos = v => String(v ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '')
const agruparMiles = d => (d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '')
export function MoneyInput({ value, onChange, className = 'input', ...props }) {
  const ref = useRef(null)
  const caret = useCaret(ref)
  const handle = e => {
    const el = e.target
    const digitsBefore = el.value.slice(0, el.selectionStart).replace(/\D/g, '').length
    const raw = soloDigitos(el.value)
    const formatted = agruparMiles(raw)
    let count = 0, pos = 0
    for (; pos < formatted.length && count < digitsBefore; pos++) {
      if (/\d/.test(formatted[pos])) count++
    }
    caret.current = pos
    onChange(raw)
  }
  return <input ref={ref} inputMode="numeric" className={className} value={agruparMiles(soloDigitos(value))} onChange={handle} {...props} />
}

// Teléfono con prefijo +54 fijo y máscara (+54 9 11 1234-5678 / +54 11 1234-5678).
// Guarda el string formateado; el cursor queda al final (escritura natural).
function formatTelefono(v) {
  let d = String(v ?? '').replace(/\D/g, '')
  if (d.startsWith('54')) d = d.slice(2)
  if (!d) return ''
  let nueve = ''
  if (d[0] === '9') { nueve = '9 '; d = d.slice(1) }
  let area = '', local = d
  if (d.length > 8) { area = d.slice(0, d.length - 8); local = d.slice(d.length - 8) }
  if (local.length > 4) local = local.slice(0, -4) + '-' + local.slice(-4)
  return `+54 ${nueve}${area ? area + ' ' : ''}${local}`.trimEnd()
}
export function PhoneInput({ value, onChange, className = 'input', ...props }) {
  const ref = useRef(null)
  const caret = useCaret(ref)
  const handle = e => {
    let d = String(e.target.value).replace(/\D/g, '')
    if (d.startsWith('54')) d = d.slice(2)
    if (!d) { onChange(''); caret.current = 4; return }
    const out = formatTelefono(e.target.value)
    caret.current = out.length
    onChange(out)
  }
  return <input ref={ref} type="tel" inputMode="numeric" className={className}
    value={value ? formatTelefono(value) : '+54 '} onChange={handle} {...props} />
}

/* ── PageHeader ──────────────────────────────────── */
export function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-4 mb-7">
      <div className="flex items-center gap-3.5">
        {Icon && (
          <div className="icon-box w-11 h-11 bg-primary/10 text-primary">
            <Icon size={20} />
          </div>
        )}
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  )
}

/* ── Card ────────────────────────────────────────── */
export function Card({ children, className = '', hover = false, as = 'div', ...props }) {
  const M = motion[as] || motion.div
  return (
    <M variants={fadeUp} className={`card ${hover ? 'card-hover' : ''} ${className}`} {...props}>
      {children}
    </M>
  )
}

/* ── StatCard ────────────────────────────────────── */
export function StatCard({ icon: Icon, label, value, accent = 'primary', to, hint }) {
  const accents = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    violet: 'bg-violet-50 text-violet-600',
    slate: 'bg-slate-100 text-slate-600',
  }
  const inner = (
    <>
      <div className="flex items-start justify-between">
        <div className={`icon-box w-11 h-11 ${accents[accent]}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
    </>
  )
  const cls = 'card card-pad block'
  if (to) return (
    <motion.div variants={fadeUp}>
      <Link to={to} className={`${cls} card-hover`}>{inner}</Link>
    </motion.div>
  )
  return <motion.div variants={fadeUp} className={`${cls} card-hover`}>{inner}</motion.div>
}

/* ── Badge de estado (color hex del backend) ─────── */
export function EstadoBadge({ color, children, dot = true, className = '' }) {
  return (
    <span className={`badge ${className}`} style={{ backgroundColor: (color || '#64748B') + '18', color: color || '#64748B' }}>
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color || '#64748B' }} />}
      {children}
    </span>
  )
}

/* ── Spinner ─────────────────────────────────────── */
export function Spinner({ size = 5, className = '' }) {
  return <span className={`inline-block animate-spin border-2 border-current border-t-transparent rounded-full ${className}`}
    style={{ width: `${size * 4}px`, height: `${size * 4}px` }} />
}

export function Loading({ label = 'Cargando…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
      <Spinner size={6} className="text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

/* ── Skeleton ────────────────────────────────────── */
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="card card-pad space-y-3">
      <Skeleton className="w-11 h-11 rounded-xl" />
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}

/* ── EmptyState ──────────────────────────────────── */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div variants={scaleIn} initial="hidden" animate="show"
      className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="icon-box w-14 h-14 bg-slate-50 text-slate-300 mb-4 ring-1 ring-slate-100">
          <Icon size={26} />
        </div>
      )}
      <p className="text-slate-800 font-semibold">{title}</p>
      {description && <p className="text-slate-400 text-sm mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}

/* ── Modal con animación ─────────────────────────── */
export function Modal({ open, onClose, children, className = '', size = 'md' }) {
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  if (!open) return null
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: 'none' }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50"
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
        className={`w-full ${sizes[size]} bg-white rounded-t-2xl sm:rounded-2xl shadow-elevated max-h-[92vh] overflow-y-auto ${className}`}>
        {children}
      </motion.div>
    </motion.div>
  )
}
