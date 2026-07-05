import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import api from '../../api/client'
import {
  Upload, Download, Trash2, Eye, EyeOff, X,
  FileText, Search, ExternalLink, FolderOpen, AlertTriangle
} from 'lucide-react'
import { Page, PageHeader, Card, EmptyState, Loading, Modal, Spinner, Field, TextInput } from '../../components/ui'

const LABELS_TIPO = {
  presupuesto: 'Presupuesto', factura: 'Factura', comprobante_pago: 'Comprobante de pago',
  sena: 'Seña / Depósito', orden_reparacion: 'Orden de reparación',
  informe_tecnico: 'Informe técnico', seguro: 'Doc. seguro', garantia: 'Garantía', otro: 'Otro',
}

function iconoExt(ext) {
  if (!ext) return '📄'
  if (ext === '.pdf') return '📕'
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return '🖼️'
  if (['.xls', '.xlsx'].includes(ext)) return '📊'
  if (['.doc', '.docx'].includes(ext)) return '📝'
  return '📄'
}

function formatBytes(b) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

function ModalSubir({ expedientes, onClose, onSubido }) {
  const [expId, setExpId] = useState('')
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('otro')
  const [visibleCliente, setVisibleCliente] = useState(false)
  const [archivo, setArchivo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!archivo || !expId || !nombre) { setError('Completá todos los campos y seleccioná un archivo.'); return }
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('archivo', archivo)
      fd.append('nombre', nombre)
      fd.append('tipo', tipo)
      fd.append('visible_cliente', visibleCliente)
      const { data } = await api.post(`/expedientes/${expId}/documentos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      onSubido(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al subir')
    } finally { setLoading(false) }
  }

  return (
    <Modal open onClose={onClose} size="md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Subir documento</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Expediente">
            <select className="select" required value={expId} onChange={e => setExpId(e.target.value)}>
              <option value="">Seleccionar expediente…</option>
              {expedientes.map(e => (
                <option key={e.id} value={e.id}>{e.numero_expediente} — {e.vehiculo?.patente}</option>
              ))}
            </select>
          </Field>
          <Field label="Nombre del documento">
            <TextInput capitalize required value={nombre} onChange={setNombre} placeholder="Ej.: Presupuesto N°001" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo</label>
              <select className="select" value={tipo} onChange={e => setTipo(e.target.value)}>
                {Object.entries(LABELS_TIPO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" checked={visibleCliente} onChange={e => setVisibleCliente(e.target.checked)} />
                <span className="text-sm text-slate-700">Visible al cliente</span>
              </label>
            </div>
          </div>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center cursor-pointer hover:border-primary transition-colors"
          >
            {archivo ? (
              <p className="text-sm text-slate-700 font-medium">{archivo.name}</p>
            ) : (
              <>
                <Upload size={20} className="mx-auto text-slate-400 mb-1" />
                <p className="text-sm text-slate-500">Clic para seleccionar archivo</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" className="hidden" onChange={e => setArchivo(e.target.files?.[0] || null)} />
          {error && <p className="error-text"><AlertTriangle size={13} /> {error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? <><Spinner size={4} /> Subiendo…</> : 'Subir documento'}
            </button>
          </div>
        </form>
    </Modal>
  )
}

export default function Documentos() {
  const [docs, setDocs] = useState([])
  const [expedientes, setExpedientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [showModal, setShowModal] = useState(false)

  const cargar = () => {
    setLoading(true)
    Promise.all([api.get('/documentos'), api.get('/expedientes')])
      .then(([d, e]) => { setDocs(d.data); setExpedientes(e.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const handleToggleVisibilidad = async (doc) => {
    if (!doc.expediente?.id) return
    const { data } = await api.patch(`/expedientes/${doc.expediente.id}/documentos/${doc.id}`, {
      visible_cliente: !doc.visible_cliente
    })
    setDocs(p => p.map(d => d.id === data.id ? data : d))
  }

  const handleEliminar = async (doc) => {
    if (!confirm(`¿Eliminar "${doc.nombre}"?`)) return
    await api.delete(`/documentos/${doc.id}`)
    setDocs(p => p.filter(d => d.id !== doc.id))
  }

  const filtrados = docs.filter(d => {
    const q = busqueda.toLowerCase()
    const matchQ = !q ||
      d.nombre.toLowerCase().includes(q) ||
      d.expediente?.numero_expediente?.toLowerCase().includes(q) ||
      d.expediente?.vehiculo?.patente?.toLowerCase().includes(q) ||
      `${d.expediente?.vehiculo?.marca || ''} ${d.expediente?.vehiculo?.modelo || ''}`.toLowerCase().includes(q)
    const matchTipo = !filtroTipo || d.tipo === filtroTipo
    return matchQ && matchTipo
  })

  if (loading) return <Loading />

  return (
    <Page className="p-6 sm:p-8 max-w-5xl mx-auto">
      <PageHeader title="Documentos" icon={FolderOpen}
        subtitle={`${docs.length} documento${docs.length !== 1 ? 's' : ''} en total`}
        actions={<button onClick={() => setShowModal(true)} className="btn-primary"><Upload size={16} /> Subir documento</button>} />

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Buscar por nombre o expediente…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <select className="select w-auto min-w-[160px]" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {Object.entries(LABELS_TIPO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {filtrados.length === 0 ? (
        <Card>
          <EmptyState icon={FileText}
            title={docs.length === 0 ? 'No hay documentos todavía' : 'Sin resultados para ese filtro'}
            description={docs.length === 0 ? 'Subí presupuestos, facturas y comprobantes por expediente.' : 'Probá con otra búsqueda o tipo.'}
            action={docs.length === 0 ? <button onClick={() => setShowModal(true)} className="btn-primary"><Upload size={16} /> Subir primer documento</button> : null} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtrados.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/70 transition-colors group">
                <span className="text-xl flex-shrink-0">{iconoExt(doc.extension)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-slate-900 truncate">{doc.nombre}</p>
                    <span className="badge badge-neutral">{LABELS_TIPO[doc.tipo] || doc.tipo}</span>
                    {doc.visible_cliente
                      ? <span className="badge badge-finalizado"><Eye size={10} /> Cliente</span>
                      : <span className="badge badge-neutral"><EyeOff size={10} /> Solo admin</span>
                    }
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                    <Link to={`/admin/expedientes/${doc.expediente?.id}`} className="font-mono hover:text-primary transition-colors flex items-center gap-1">
  {doc.expediente?.numero_expediente}{doc.expediente?.vehiculo?.patente ? ` · ${doc.expediente.vehiculo.patente}` : ''} <ExternalLink size={10} />
                    </Link>
                    {doc.tamano_bytes && <span>{formatBytes(doc.tamano_bytes)}</span>}
                    <span>{new Date(doc.created_at).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <a href={doc.url} download target="_blank" rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                    <Download size={15} />
                  </a>
                  <button onClick={() => handleToggleVisibilidad(doc)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                    title={doc.visible_cliente ? 'Ocultar al cliente' : 'Mostrar al cliente'}>
                    {doc.visible_cliente ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={() => handleEliminar(doc)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <AnimatePresence>
        {showModal && (
          <ModalSubir
            expedientes={expedientes}
            onClose={() => setShowModal(false)}
            onSubido={doc => { setDocs(p => [doc, ...p]); setShowModal(false) }}
          />
        )}
      </AnimatePresence>
    </Page>
  )
}
