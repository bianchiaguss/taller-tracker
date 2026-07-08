import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { ThemeToggle } from './ui'
import { LayoutDashboard, Car, FileText, Bell, User, LogOut, Wrench } from 'lucide-react'

const nav = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { to: '/mis-vehiculos', label: 'Vehículos', icon: Car },
  { to: '/mis-expedientes', label: 'Expedientes', icon: FileText },
  { to: '/actualizaciones', label: 'Novedades', icon: Bell },
  { to: '/mi-perfil', label: 'Mi perfil', icon: User },
]

export default function ClienteLayout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="glass border-b border-slate-200/70 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
              <Wrench size={15} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-[15px] tracking-tight hidden sm:block">TallerTrack</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) =>
                `relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-900'
                }`
              }>
                {({ isActive }) => (
                  <>
                    {isActive && <motion.div layoutId="cli-active" className="absolute inset-0 bg-primary/10 rounded-lg"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                    <Icon size={15} className="relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                <span className="text-[11px] font-bold text-white">{usuario?.nombre?.[0]}{usuario?.apellido?.[0]}</span>
              </div>
              <span className="text-sm text-slate-700 font-medium">{usuario?.nombre}</span>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50">
              <LogOut size={15} />
              <span className="hidden sm:block font-medium">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-7 pb-24 md:pb-7">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 glass border-t border-slate-200/70 z-20 pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-slate-400'
              }`
            }>
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
                    <Icon size={19} />
                  </div>
                  <span className="text-[10px]">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
