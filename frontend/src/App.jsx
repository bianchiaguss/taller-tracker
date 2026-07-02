import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Páginas públicas
import Home from './pages/public/Home'
import Presupuesto from './pages/public/Presupuesto'
import Resena from './pages/public/Resena'
import Registro from './pages/public/Registro'
import Login from './pages/Login'

// Admin
import AdminLayout from './components/AdminLayout'
import Dashboard_Admin from './pages/admin/Dashboard'
import Clientes from './pages/admin/Clientes'
import Expedientes from './pages/admin/Expedientes'
import ExpedienteDetalle from './pages/admin/ExpedienteDetalle'
import Estados from './pages/admin/Estados'
import Solicitudes from './pages/admin/Solicitudes'
import Galeria from './pages/admin/Galeria'
import Opiniones from './pages/admin/Opiniones'
import Configuracion from './pages/admin/Configuracion'
import Documentos from './pages/admin/Documentos'

// Cliente
import ClienteLayout from './components/ClienteLayout'
import Dashboard_Cliente from './pages/cliente/Dashboard'
import MisVehiculos from './pages/cliente/Vehiculos'
import MisExpedientes from './pages/cliente/MisExpedientes'
import ExpedienteTracking from './pages/cliente/ExpedienteTracking'
import Actualizaciones from './pages/cliente/Actualizaciones'
import Perfil from './pages/cliente/Perfil'

function ProtectedRoute({ children, role }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (role && usuario.rol !== role) {
    return <Navigate to={usuario.rol === 'admin' ? '/admin' : '/dashboard'} replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/presupuesto" element={<Presupuesto />} />
          <Route path="/resena/:token" element={<Resena />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/login" element={<Login />} />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>
          }>
            <Route index element={<Dashboard_Admin />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="expedientes" element={<Expedientes />} />
            <Route path="expedientes/:id" element={<ExpedienteDetalle />} />
            <Route path="estados" element={<Estados />} />
            <Route path="solicitudes" element={<Solicitudes />} />
            <Route path="galeria" element={<Galeria />} />
            <Route path="opiniones" element={<Opiniones />} />
            <Route path="configuracion" element={<Configuracion />} />
            <Route path="documentos" element={<Documentos />} />
          </Route>

          {/* Cliente */}
          <Route path="/" element={
            <ProtectedRoute role="cliente"><ClienteLayout /></ProtectedRoute>
          }>
            <Route path="dashboard" element={<Dashboard_Cliente />} />
            <Route path="mis-vehiculos" element={<MisVehiculos />} />
            <Route path="mis-expedientes" element={<MisExpedientes />} />
            <Route path="mis-expedientes/:id" element={<ExpedienteTracking />} />
            <Route path="actualizaciones" element={<Actualizaciones />} />
            <Route path="mi-perfil" element={<Perfil />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
