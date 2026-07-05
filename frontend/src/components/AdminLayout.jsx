import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, FileText, Settings, LogOut, Wrench,
  ClipboardList, Image as ImageIcon, Star, FolderOpen, Menu
} from 'lucide-react'

const nav = [
  { section: 'General' },
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/expedientes', label: 'Expedientes', icon: FileText },
  { to: '/admin/solicitudes', label: 'Presupuestos', icon: ClipboardList },
  { to: '/admin/documentos', label: 'Documentos', icon: FolderOpen },
  { section: 'Reputación' },
  { to: '/admin/galeria', label: 'Galería', icon: ImageIcon },
  { to: '/admin/opiniones', label: 'Reseñas', icon: Star },
  { section: 'Sistema' },
  { to: '/admin/estados', label: 'Estados', icon: Settings },
  { to: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

function SidebarContent({ usuario, onLogout, onNavigate }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-glow">
            <Wrench size={17} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-[15px] leading-none tracking-tight">TallerTrack</p>
            <p className="text-slate-500 text-[11px] mt-1">Panel de gestión</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {nav.map((item, idx) => item.section
          ? <p key={idx} className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 first:pt-1">{item.section}</p>
          : (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} className={({ isActive }) =>
            `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`
          }>
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div layoutId="admin-active" className="absolute inset-0 bg-primary/15 rounded-lg ring-1 ring-primary/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
                <item.icon size={18} className={`relative z-10 ${isActive ? 'text-primary' : ''}`} />
                <span className="relative z-10">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 mt-auto">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{usuario?.nombre} {usuario?.apellido}</p>
            <p className="text-slate-500 text-[11px] truncate">Administrador</p>
          </div>
          <button onClick={onLogout} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Cierra el drawer en cada cambio de ruta, sin depender del onClick del link.
  // Evita que el overlay quede montado interceptando toques tras navegar.
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-sidebar flex-col border-r border-white/5">
        <SidebarContent usuario={usuario} onLogout={handleLogout} />
      </aside>

      {/* Sidebar mobile — render condicional: al cerrar se desmonta al instante,
          sin depender de una animación de salida que en móvil puede no completar
          y dejar el overlay (opacity:0) interceptando todos los toques. */}
      {mobileOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => setMobileOpen(false)} className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" />
          <motion.aside initial={{ x: -288 }} animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col">
            <SidebarContent usuario={usuario} onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
          </motion.aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 text-slate-600"><Menu size={22} /></button>
          <span className="font-bold text-slate-900 text-sm">TallerTrack</span>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
