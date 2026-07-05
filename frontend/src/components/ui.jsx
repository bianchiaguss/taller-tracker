import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm"
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
