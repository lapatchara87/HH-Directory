import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDocuments } from '../contexts/DocumentContext'
import { useAuth } from '../contexts/AuthContext'
import FilePreviewModal from '../components/FilePreviewModal'
import {
  Search, FolderOpen, Clock, Star, ArrowRight, RefreshCw, Plug,
  FileText, Table, Presentation, FileDown, Image, Video, ExternalLink,
} from 'lucide-react'

const TYPE_ICON = {
  google_doc: { icon: FileText, color: 'text-blue-500' },
  google_sheet: { icon: Table, color: 'text-green-500' },
  google_slide: { icon: Presentation, color: 'text-yellow-600' },
  pdf: { icon: FileDown, color: 'text-red-500' },
  image: { icon: Image, color: 'text-purple-500' },
  video: { icon: Video, color: 'text-pink-500' },
  link: { icon: ExternalLink, color: 'text-slate-400' },
}

function timeAgo(dateString) {
  if (!dateString) return ''
  const diff = Date.now() - new Date(dateString).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'วันนี้'
  if (days === 1) return 'เมื่อวาน'
  if (days < 7) return `${days} วันที่แล้ว`
  return new Date(dateString).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

export default function HomePage() {
  const { user, accessToken, tokenExpired, refreshToken } = useAuth()
  const {
    categories, documents, getRecentDocuments,
    driveLoading, driveError, getBookmarkedDocs, trackView, refreshDriveData,
  } = useDocuments()
  const [previewDoc, setPreviewDoc] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const navigate = useNavigate()

  const recentDocs = getRecentDocuments(8)
  const bookmarkedDocs = getBookmarkedDocs()
  const firstName = user?.displayName?.split(' ')[0] || ''
  const totalFiles = documents.filter((d) => !d.is_archived).length

  function handleSearch(e) {
    e.preventDefault()
    if (searchInput.trim()) navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`)
  }

  function openFile(doc) {
    trackView(doc.id)
    if (['pdf', 'image'].includes(doc.file_type)) {
      setPreviewDoc(doc)
    } else if (doc.drive_link) {
      window.open(doc.drive_link, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 sm:p-8 text-white">
        <p className="text-primary-200 text-sm">
          {firstName ? `สวัสดี, ${firstName}` : 'สวัสดี'}
        </p>
        <h1 className="text-xl sm:text-2xl font-bold mt-1">ค้นหาเอกสารบริษัท</h1>

        <form onSubmit={handleSearch} className="mt-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="พิมพ์ชื่อไฟล์ หรือคำที่ต้องการหา..."
              className="w-full pl-12 pr-4 py-3.5 bg-white text-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg placeholder:text-slate-400"
            />
          </div>
        </form>

        <div className="flex items-center gap-4 mt-4 text-sm text-primary-200">
          <span><strong className="text-white">{totalFiles}</strong> ไฟล์</span>
          <span><strong className="text-white">{categories.length}</strong> โฟลเดอร์</span>
        </div>
      </div>

      {/* Status & Actions */}
      {driveLoading && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent" />
          <p className="text-sm text-primary-700">กำลังโหลดไฟล์จาก Google Drive...</p>
        </div>
      )}

      {/* Token expired or no Drive access — show reconnect button */}
      {!driveLoading && (tokenExpired || driveError) && (
        <button
          onClick={async () => {
            const newToken = await refreshToken()
            if (newToken) refreshDriveData()
          }}
          className="w-full flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Plug className="w-5 h-5 text-amber-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-amber-800">
                {driveError ? 'โหลดไฟล์ไม่สำเร็จ' : 'ยังไม่ได้เชื่อมต่อ Google Drive'}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">กดที่นี่เพื่อเชื่อมต่อและโหลดไฟล์จาก Drive</p>
            </div>
          </div>
          <RefreshCw className="w-5 h-5 text-amber-400 group-hover:text-amber-600" />
        </button>
      )}

      {/* Refresh button when data is loaded */}
      {!driveLoading && accessToken && !driveError && totalFiles > 0 && (
        <div className="flex justify-end">
          <button
            onClick={refreshDriveData}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary-600 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            รีเฟรชข้อมูล
          </button>
        </div>
      )}

      {/* Quick Access: Directory shortcut */}
      <Link
        to="/directory"
        className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm group-hover:text-primary-600">ไดเรกทอรี่</h3>
            <p className="text-xs text-slate-500">ดูโฟลเดอร์ทั้งหมด {categories.length} โฟลเดอร์</p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary-500 transition-colors" />
      </Link>

      {/* Bookmarked — show only if has bookmarks */}
      {bookmarkedDocs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              ปักหมุดของฉัน
            </h2>
            <Link to="/bookmarks" className="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-0.5">
              ดูทั้งหมด <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid gap-2">
            {bookmarkedDocs.slice(0, 4).map((doc) => (
              <FileRow key={doc.id} doc={doc} onClick={() => openFile(doc)} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Updated */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            อัปเดตล่าสุด
          </h2>
        </div>
        <div className="grid gap-2">
          {recentDocs.map((doc) => (
            <FileRow key={doc.id} doc={doc} onClick={() => openFile(doc)} />
          ))}
          {recentDocs.length === 0 && !driveLoading && (
            <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
              <p className="text-sm text-slate-400">ยังไม่มีไฟล์</p>
            </div>
          )}
        </div>
      </section>

      {previewDoc && (
        <FilePreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  )
}

// Clean, minimal file row
function FileRow({ doc, onClick }) {
  const typeConfig = TYPE_ICON[doc.file_type] || TYPE_ICON.link
  const TypeIcon = typeConfig.icon

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-primary-200 hover:shadow-sm transition-all text-left group"
    >
      <div className={`w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0`}>
        <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate group-hover:text-primary-600 transition-colors">
          {doc.name}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {timeAgo(doc.updated_at)}
          {doc.uploader_name && <span className="ml-2">{doc.uploader_name}</span>}
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-primary-400 shrink-0" />
    </button>
  )
}
