import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocuments } from '../contexts/DocumentContext'
import { Search, FileText, Table, Presentation, FileDown, Image, Video, ExternalLink, ArrowRight } from 'lucide-react'

const TYPE_ICON = {
  google_doc: FileText,
  google_sheet: Table,
  google_slide: Presentation,
  pdf: FileDown,
  image: Image,
  video: Video,
  link: ExternalLink,
}

export default function CommandPalette({ open, onClose }) {
  const { documents, trackView } = useDocuments()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const results = query.trim()
    ? documents
        .filter((d) => {
          const q = query.toLowerCase()
          return d.name.toLowerCase().includes(q) ||
            (d.uploader_name && d.uploader_name.toLowerCase().includes(q))
        })
        .slice(0, 8)
    : documents
        .filter((d) => !d.is_archived)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 6)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  function openFile(doc) {
    trackView(doc.id)
    onClose()
    if (doc.drive_link) {
      window.open(doc.drive_link, '_blank', 'noopener,noreferrer')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      openFile(results[selectedIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-slate-200">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ค้นหาไฟล์... พิมพ์แล้วกด Enter"
            className="flex-1 text-sm focus:outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {!query && (
            <p className="px-4 py-1 text-[10px] text-slate-400 uppercase tracking-wider">ล่าสุด</p>
          )}
          {results.map((doc, i) => {
            const Icon = TYPE_ICON[doc.file_type] || ExternalLink
            return (
              <button
                key={doc.id}
                onClick={() => openFile(doc)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === selectedIndex ? 'bg-primary-50' : 'hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${i === selectedIndex ? 'text-primary-500' : 'text-slate-400'}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${i === selectedIndex ? 'text-primary-700 font-medium' : 'text-slate-700'}`}>
                    {doc.name}
                  </p>
                  {doc.uploader_name && (
                    <p className="text-[11px] text-slate-400 truncate">{doc.uploader_name}</p>
                  )}
                </div>
                {i === selectedIndex && <ArrowRight className="w-3.5 h-3.5 text-primary-400 shrink-0" />}
              </button>
            )
          })}
          {results.length === 0 && query && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-400">ไม่พบไฟล์ "{query}"</p>
              <button
                onClick={() => { onClose(); navigate(`/search?q=${encodeURIComponent(query)}`) }}
                className="text-xs text-primary-500 hover:text-primary-700 mt-2"
              >
                ค้นหาขั้นสูง →
              </button>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-400">
          <span>↑↓ เลือก</span>
          <span>Enter เปิด</span>
          <span>Esc ปิด</span>
        </div>
      </div>
    </div>
  )
}
