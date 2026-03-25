import {
  FileText,
  Table,
  Presentation,
  Image,
  FileDown,
  Video,
  ExternalLink,
  Clock,
  User,
} from 'lucide-react'

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

export default function FileCard({ document, onPreview, compact = false }) {
  const config = FILE_TYPE_CONFIG[document.file_type] || FILE_TYPE_CONFIG.link
  const Icon = config.icon

  function handleClick() {
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

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group"
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900 truncate group-hover:text-primary-600 transition-colors">
            {document.name}
          </p>
          <p className="text-xs text-slate-500">
            {formatDate(document.updated_at)}
          </p>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="w-full bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-md transition-all text-left group"
    >
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
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {document.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-primary-400 transition-colors shrink-0 mt-1" />
      </div>
    </button>
  )
}
