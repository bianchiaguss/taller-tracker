import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import api from '../api/client'
import { FileText, Upload, Eye, EyeOff, Trash2, X, Download, ChevronDown } from 'lucide-react'

const LABELS_TIPO = {
  presupuesto: 'Presupuesto', factura: 'Factura', comprobante_pago: 'Comprobante de pago',
  sena: 'Seña / Depósito', orden_reparacion: 'Orden de reparación',
  informe_tecnico: 'Informe técnico', seguro: 'Doc. de seguro', garantia: 'Garantía', otro: 'Otro',
}

function iconoExtension(ext) {
  if (!ext) return '📄'
  if (['.pdf'].includes(ext)) return '📕'
  if (['.jpg','.jpeg','.png','.webp'].includes(ext)) return '🖼️'
  if (['.xls','.xlsx'].includes(ext)) return '📊'
  if (['.doc','.docx'].includes(ext)) return '📝'
  return '📄'
}

function formatBytes(b) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b/1024).toFixed(0)} KB`
  return `${(b/1048576).toFixed(1)} MB`
}

export default function SeccionDocumentos({ expedienteId, isAdmin }) {
  const [docs, setDocs] = useState(null)  // null = no cargado aún
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState(null)
  const [uploadForm, setUploadForm] = useState({ nombre: '', tipo: 'otro', visible_cliente: false })
  const [showUpload, setShowUpload] = useState(false)
  const fileRef = useRef(null)

  const cargar = async () => {
    if (docs !== null) return
    setLoading(true)
    const { data } = await api.get(`/expedientes/${expedienteId}/documentos`)
    setDocs(data); setLoading(false)
  }

  const toggle = async () => {
    if (!expanded && docs === null) await cargar()
    setExpanded(p => !p)
  }

  const handleUpload = async (archivo) => {
    if (!uploadForm.nombre.trim()) { setUploadMsg({ ok: false, text: 'Ingresá un nombre para el documento.' }); return }
    setUploading(true); setUploadMsg(null)
    const fd = new FormData()
    fd.append('archivo', archivo)
    fd.append('nombre', uploadForm.nombre)
    fd.append('tipo', uploadForm.tipo)
    fd.append('visible_cliente', uploadForm.visible_cliente)
    try {
      const { data } = await api.post(`/expedientes/${expedienteId}/documentos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setDocs(p => [data, ...(p || [])])
      setUploadMsg({ ok: true, text: 'Documento subido.' })
      setUploadForm({ nombre: '', tipo: 'otro', visible_cliente: false })
      setShowUpload(false)
    } catch (err) {
      setUploadMsg({ ok: false, text: err.response?.data?.detail || 'Error al subir' })
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const toggleVisibilidad = async (doc) => {
    const { data } = await api.patch(`/expedientes/${expedienteId}/documentos/${doc.id}`, {
      visible_cliente: !doc.visible_cliente
    })
    setDocs(p => p.map(d => d.id === data.id ? data : d))
  }

  const eliminar = async (docId) => {
    if (!confirm('¿Eliminar este documento?')) return
    await api.delete(`/expedientes/${expedienteId}/documentos/${docId}`)
    setDocs(p => p.filter(d => d.id !== docId))
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <span className="font-semibold text-slate-900 flex items-center gap-2">
          <FileText size={16} className="text-slate-400" />
          Documentación
          {docs !== null && (
            <span className="text-xs text-slate-400 font-normal">({docs.length})</span>
          )}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }} className="border-t border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-6 flex justify-center">
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {/* Botón subir (solo admin) */}
              {isAdmin && (
                <div>
                  {!showUpload ? (
                    <button onClick={() => setShowUpload(true)} className="btn-secondary btn-sm w-full justify-center">
                      <Upload size={14} /> Subir documento
                    </button>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-slate-600">Nuevo documento</p>
                        <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                      </div>
                      <div><label className="label">Nombre del documento</label>
                        <input className="input" value={uploadForm.nombre}
                          onChange={e => setUploadForm(p => ({ ...p, nombre: e.target.value }))}
                          placeholder="Ej: Presupuesto N°001" />
                      </div>
                      <div><label className="label">Tipo</label>
                        <select className="select" value={uploadForm.tipo}
                          onChange={e => setUploadForm(p => ({ ...p, tipo: e.target.value }))}>
                          {Object.entries(LABELS_TIPO).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="visible" className="w-4 h-4 rounded"
                          checked={uploadForm.visible_cliente}
                          onChange={e => setUploadForm(p => ({ ...p, visible_cliente: e.target.checked }))} />
                        <label htmlFor="visible" className="text-sm text-slate-700">Visible para el cliente</label>
                      </div>
                      {uploadMsg && (
                        <p className={`text-xs ${uploadMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{uploadMsg.text}</p>
                      )}
                      <div
                        onClick={() => fileRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
                        <Upload size={18} className="mx-auto text-slate-400 mb-1" />
                        <p className="text-xs text-slate-500">{uploading ? 'Subiendo...' : 'Clic para seleccionar archivo'}</p>
                      </div>
                      <input ref={fileRef} type="file" className="hidden"
                        onChange={e => { if (e.target.files[0]) handleUpload(e.target.files[0]) }} />
                    </div>
                  )}
                </div>
              )}

              {/* Lista de documentos */}
              {!docs || docs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  {isAdmin ? 'No hay documentos. Subí el primero arriba.' : 'No hay documentos disponibles todavía.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {docs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group">
                      <span className="text-xl flex-shrink-0">{iconoExtension(doc.extension)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{doc.nombre}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{LABELS_TIPO[doc.tipo] || doc.tipo}</span>
                          {doc.tamano_bytes && <span className="text-xs text-slate-400">· {formatBytes(doc.tamano_bytes)}</span>}
                          {!doc.visible_cliente && isAdmin && (
                            <span className="text-xs text-slate-400 flex items-center gap-1"><EyeOff size={10} /> Solo admin</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={doc.url} download target="_blank" rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                          <Download size={14} />
                        </a>
                        {isAdmin && (
                          <>
                            <button onClick={() => toggleVisibilidad(doc)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all"
                              title={doc.visible_cliente ? 'Ocultar al cliente' : 'Mostrar al cliente'}>
                              {doc.visible_cliente ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <button onClick={() => eliminar(doc.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
