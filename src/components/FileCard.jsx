import { useState } from 'react'
import {
  FileText, Table, Presentation, Image, FileDown, Video,
  ExternalLink, Clock, User, Star, Tag, Plus, X, Link2,
} from 'lucide-react'
import { useDocuments } from '../contexts/DocumentContext'
import { useToast } from '../contexts/ToastContext'

const FILE_TYPE_CONFIG = {
  google_doc: { icon: FileText, label: 'Google Docs', color: 'text-blue-600 bg-blue-50' },
  google_sheet: { icon: Table, label: 'Google Sheets', color: 'text-green-600 bg-green-50' },
  google_slide: { icon: Presentation, label: 'Google Slides', color: 'text-yellow-600 bg-yellow-50' },
  pdf: { icon: FileDown, label: 'PDF', color: 'text-red-600 bg-red-50' },
  image: { icon: Image, label: 'Image', color: 'text-purple-600 bg-purple-50' },
  video: { icon: Video, label: 'Video', color: 'text-pink-600 bg-pink-50' },
  link: { icon: ExternalLink, label: 'Link', color: 'text-slate-600 bg-slate-50' },
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'วันนี้'
  if (days === 1) return 'เมื่อวาน'
  if (days < 7) return `${days} วันที่แล้ว`
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function FileCard({ document, onPreview, compact = false, showActions = false }) {
  const { toggleBookmark, isBookmarked, trackView, addTag, removeTag, getTagsForDoc } = useDocuments()
  const { showToast } = useToast()
  const config = FILE_TYPE_CONFIG[document.file_type] || FILE_TYPE_CONFIG.link
  const Icon = config.icon
  const bookmarked = isBookmarked(document.id)
  const tags = getTagsForDoc(document.id)
  const [showTagInput, setShowTagInput] = useState(false)
  const [newTag, setNewTag] = useState('')

  function handleClick() {
    trackView(document.id)
    const { file_type, drive_link, file_url } = document
    if (['google_doc', 'google_sheet', 'google_slide'].includes(file_type) && drive_link) {
      window.open(drive_link, '_blank', 'noopener,noreferrer')
    } else if (file_type === 'video' && drive_link) {
      window.open(drive_link, '_blank', 'noopener,noreferrer')
    } else if (['pdf', 'image'].includes(file_type)) {
      if (onPreview) onPreview(document)
    } else if (drive_link) {
      window.open(drive_link, '_blank', 'noopener,noreferrer')
    }
  }

  function handleBookmark(e) {
    e.stopPropagation()
    const wasBookmarked = bookmarked
    toggleBookmark(document.id)
    showToast(wasBookmarked ? 'ยกเลิกปักหมุดแล้ว' : 'ปักหมุดแล้ว', 'bookmark')
  }

  function handleCopyLink(e) {
    e.stopPropagation()
    const url = document.drive_link || document.file_url || ''
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('คัดลอกลิงก์แล้ว', 'copy')
      }).catch(() => {
        showToast('ไม่สามารถคัดลอกได้', 'error')
      })
    }
  }

  function handleAddTag(e) {
    e.stopPropagation()
    if (newTag.trim()) {
      addTag(document.id, newTag.trim())
      showToast(`เพิ่มแท็ก "${newTag.trim()}" แล้ว`, 'tag')
      setNewTag('')
      setShowTagInput(false)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleClick}
          className="flex-1 flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group min-w-0"
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 truncate group-hover:text-primary-600 transition-colors">
              {document.name}
            </p>
            <p className="text-xs text-slate-500">{formatDate(document.updated_at)}</p>
          </div>
        </button>
        <button onClick={handleBookmark} className="p-1.5 shrink-0 rounded-lg hover:bg-slate-100">
          <Star className={`w-4 h-4 ${bookmarked ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all">
      <button onClick={handleClick} className="w-full p-4 text-left group">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">
              {document.name}
            </h3>
            {document.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{document.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(document.updated_at)}
              </span>
              {document.uploader_name && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {document.uploader_name}
                </span>
              )}
              {document.file_size && <span>{document.file_size}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-primary-400 transition-colors" />
          </div>
        </div>
      </button>

      {/* Tags & actions bar — always visible */}
      <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
        <button onClick={handleBookmark} className="p-1 rounded hover:bg-slate-100" title="ปักหมุด">
          <Star className={`w-4 h-4 ${bookmarked ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400'}`} />
        </button>
        <button onClick={handleCopyLink} className="p-1 rounded hover:bg-slate-100" title="คัดลอกลิงก์">
          <Link2 className="w-4 h-4 text-slate-300 hover:text-blue-500" />
        </button>

        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-[10px] font-medium">
            <Tag className="w-2.5 h-2.5" />
            {tag}
            <button onClick={(e) => { e.stopPropagation(); removeTag(document.id, tag) }} className="hover:text-red-500 ml-0.5">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}

        {showTagInput ? (
          <form onSubmit={handleAddTag} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="พิมพ์แท็ก..."
              className="w-24 px-2 py-0.5 text-xs border border-violet-300 rounded-full focus:outline-none focus:ring-1 focus:ring-violet-500 bg-violet-50"
              autoFocus
            />
            <button type="submit" className="text-violet-500 hover:text-violet-700">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setShowTagInput(false) }} className="text-slate-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setShowTagInput(true) }}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors border border-dashed border-slate-300 hover:border-violet-300"
          >
            <Plus className="w-2.5 h-2.5" />
            แท็ก
          </button>
        )}
      </div>
    </div>
  )
}
