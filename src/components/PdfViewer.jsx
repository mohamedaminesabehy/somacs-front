import { useState, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, List } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export default function PdfViewer({ url, name, onClose, embedded = false }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.15)
  const [showOutline, setShowOutline] = useState(false)
  const [hasOutline, setHasOutline] = useState(false)
  const [outlineItems, setOutlineItems] = useState([])
  const [pdfInstance, setPdfInstance] = useState(null)

  const onDocumentLoadSuccess = useCallback(async (pdf) => {
    setNumPages(pdf.numPages)
    setPageNumber(1)
    setPdfInstance(pdf)

    try {
      const outline = await pdf.getOutline()
      const topLevel = Array.isArray(outline) ? outline : []
      setOutlineItems(topLevel)
      setHasOutline(topLevel.length > 0)
    } catch {
      setOutlineItems([])
      setHasOutline(false)
    }
  }, [])

  useEffect(() => {
    setShowOutline(false)
    setHasOutline(false)
    setOutlineItems([])
    setPdfInstance(null)
    setPageNumber(1)
  }, [url])

  const onOutlineItemClick = useCallback(async (item) => {
    if (!pdfInstance || !item?.dest) return

    try {
      let destination = item.dest
      if (typeof destination === 'string') {
        destination = await pdfInstance.getDestination(destination)
      }

      if (Array.isArray(destination) && destination[0]) {
        const targetIndex = await pdfInstance.getPageIndex(destination[0])
        setPageNumber(targetIndex + 1)
      }
    } catch {
      // ignore invalid outline target
    }
  }, [pdfInstance])

  if (!url) {
    return (
      <div className="h-[70vh] rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500 font-semibold">Selectionnez un PDF pour l'afficher.</p>
      </div>
    )
  }

  const wrapperClass = embedded
    ? 'bg-white rounded-2xl border border-slate-200 w-full h-[76vh] flex flex-col overflow-hidden'
    : 'bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden'

  return (
    <div className={embedded ? 'w-full' : 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4'}>
      <div className={wrapperClass}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            {hasOutline && (
              <button
                onClick={() => setShowOutline(v => !v)}
                className={`p-2 rounded-lg transition-all ${showOutline ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
                title="Table des matieres"
              >
                <List size={18} />
              </button>
            )}
            <span className="text-sm font-bold text-slate-700 truncate max-w-[60vw]">{name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-all">
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-bold text-slate-500 w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-all">
              <ZoomIn size={16} />
            </button>
            {!embedded && (
              <>
                <div className="w-px h-5 bg-slate-200 mx-1" />
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                  <X size={18} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {showOutline && hasOutline && (
            <div className="w-64 border-r border-slate-200 overflow-y-auto bg-slate-50 shrink-0">
              <div className="px-4 py-3 border-b border-slate-200">
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Table des matieres</p>
              </div>
              <div className="p-3 text-sm space-y-1.5">
                {outlineItems.map((item, idx) => (
                  <button
                    key={`${item.title || 'chapitre'}-${idx}`}
                    onClick={() => onOutlineItemClick(item)}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-slate-700 hover:bg-white hover:text-blue-700 transition-colors"
                    title={item.title || `Chapitre ${idx + 1}`}
                  >
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Chapitre {idx + 1}</span>
                    <span className="block text-sm font-semibold truncate">{item.title || `Section ${idx + 1}`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto bg-slate-100 flex flex-col items-center py-6 px-4">
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              }
              error={<p className="text-red-500 text-sm font-semibold p-8">Impossible de charger le PDF.</p>}
            >
              <div className="shadow-lg rounded-lg overflow-hidden bg-white ring-1 ring-slate-200">
                <Page pageNumber={pageNumber} scale={scale} renderTextLayer renderAnnotationLayer />
              </div>
            </Document>
          </div>
        </div>

        {numPages && (
          <div className="flex items-center justify-center gap-4 px-5 py-3 border-t border-slate-200 shrink-0 bg-white">
            <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-all">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-600">Page {pageNumber} / {numPages}</span>
            <button onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}