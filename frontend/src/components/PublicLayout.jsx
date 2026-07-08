import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Wrench, Menu, X, MessageCircle, Phone, Mail, MapPin, Instagram, Facebook, ArrowUpRight } from 'lucide-react'
import { ThemeToggle } from './ui'

const INSTAGRAM_URL = 'https://www.instagram.com/bianchi.detailing/'

function Navbar({ config }) {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = [
    { href: '#servicios', label: 'Servicios' },
    { href: '#trabajos', label: 'Trabajos' },
    { href: '#opiniones', label: 'Opiniones' },
    { href: '#contacto', label: 'Contacto' },
  ]

  const handleNav = (href) => {
    setMenuOpen(false)
    if (href.startsWith('#')) {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-sidebar/80 backdrop-blur-xl shadow-elevated border-b border-white/5' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center shadow-glow">
            <Wrench size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-[15px] tracking-tight">{config.nombre_taller || 'TallerTrack'}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <button key={l.href} onClick={() => handleNav(l.href)}
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle chrome />
          <Link to="/presupuesto" className="hidden md:inline-flex btn-primary btn-sm">
            Solicitar presupuesto
          </Link>
          {usuario ? (
            <button onClick={() => navigate(usuario.rol === 'admin' ? '/admin' : '/mis-expedientes')}
              className="text-sm font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
              Mi panel
            </button>
          ) : (
            <Link to="/login" className="text-sm font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
              Ingresar
            </Link>
          )}
          <button onClick={() => setMenuOpen(p => !p)} className="md:hidden text-white">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-sidebar border-t border-white/10 px-4 py-4 space-y-2">
          {links.map(l => (
            <button key={l.href} onClick={() => handleNav(l.href)}
              className="block w-full text-left text-slate-300 hover:text-white text-sm font-medium py-2 transition-colors">
              {l.label}
            </button>
          ))}
          <Link to="/presupuesto" onClick={() => setMenuOpen(false)}
            className="block btn-primary justify-center mt-3">
            Solicitar presupuesto
          </Link>
        </div>
      )}
    </header>
  )
}

function WhatsAppButton({ config }) {
  if (!config.whatsapp) return null
  return (
    <a
      href={`https://wa.me/${config.whatsapp}?text=Hola, quería consultar sobre una reparación`}
      target="_blank" rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
      title="Escribinos por WhatsApp"
    >
      <MessageCircle size={26} className="text-white" fill="white" />
    </a>
  )
}

function Footer({ config }) {
  const year = new Date().getFullYear()
  const nombre = config.nombre_taller || 'TallerTrack'
  const accesos = [
    { to: '/presupuesto', label: 'Solicitar presupuesto' },
    { to: '/login', label: 'Seguí tu vehículo' },
    { to: '/registro', label: 'Crear cuenta' },
  ]
  return (
    <footer className="relative bg-sidebar text-slate-400 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-64 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }} />

      <div className="relative max-w-6xl mx-auto px-6 py-14">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Marca */}
          <div className="lg:col-span-5">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                <Wrench size={20} className="text-white" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">{nombre}</span>
            </Link>
            {config.slogan && <p className="text-sm leading-relaxed mt-4 max-w-xs">{config.slogan}</p>}
            <div className="flex items-center gap-2.5 mt-6">
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-primary hover:border-primary hover:-translate-y-0.5 transition-all duration-200">
                <Instagram size={18} />
              </a>
              {config.facebook && (
                <a href={config.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-primary hover:border-primary hover:-translate-y-0.5 transition-all duration-200">
                  <Facebook size={18} />
                </a>
              )}
              {config.whatsapp && (
                <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-green-500 hover:border-green-500 hover:-translate-y-0.5 transition-all duration-200">
                  <MessageCircle size={18} />
                </a>
              )}
            </div>
          </div>

          {/* Contacto */}
          <div className="lg:col-span-4">
            <p className="text-white font-semibold text-sm mb-4">Contacto</p>
            <ul className="space-y-3.5">
              {config.telefono && (
                <li><a href={`tel:${config.telefono}`} className="flex items-center gap-3 text-sm hover:text-white transition-colors">
                  <Phone size={15} className="text-primary-light flex-shrink-0" /> {config.telefono}</a></li>
              )}
              {config.email && (
                <li><a href={`mailto:${config.email}`} className="flex items-center gap-3 text-sm hover:text-white transition-colors">
                  <Mail size={15} className="text-primary-light flex-shrink-0" /> <span className="truncate">{config.email}</span></a></li>
              )}
              {config.direccion && (
                <li className="flex items-start gap-3 text-sm">
                  <MapPin size={15} className="text-primary-light flex-shrink-0 mt-0.5" />
                  <span>{config.direccion}{config.horarios && <span className="block text-xs text-slate-500 mt-1">{config.horarios}</span>}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Accesos */}
          <div className="lg:col-span-3">
            <p className="text-white font-semibold text-sm mb-4">Accesos</p>
            <ul className="space-y-3.5">
              {accesos.map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="group inline-flex items-center gap-1.5 text-sm hover:text-white transition-colors">
                    <span>{l.label}</span>
                    <ArrowUpRight size={14} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-500">© {year} {nombre}. Todos los derechos reservados.</p>
          <p className="text-xs text-slate-600 tracking-wide">Chapa · Pintura · Detailing</p>
        </div>
      </div>
    </footer>
  )
}

export { Navbar, Footer, WhatsAppButton }
