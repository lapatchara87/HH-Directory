import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDocuments } from '../contexts/DocumentContext'
import { useAuth } from '../contexts/AuthContext'
import FileCard from '../components/FileCard'
import FilePreviewModal from '../components/FilePreviewModal'
import {
  Search, FolderOpen, Clock, Star, ArrowRight,
  FileText, Table, Presentation, FileDown, Image, Video,
} from 'lucide-react'

const FILE_TYPE_ICONS = {
  google_doc: { icon: FileText, color: 'text-blue-500' },
  google_sheet: { icon: Table, color: 'text-green-500' },
  google_slide: { icon: Presentation, color: 'text-yellow-500' },
  pdf: { icon: FileDown, color: 'text-red-500' },
  image: { icon: Image, color: 'text-purple-500' },
  video: { icon: Video, color: 'text-pink-500' },
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'วันนี้'
  if (days === 1) return 'เมื่อวาน'
  if (days < 7) return `${days} วันที่แล้ว`
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

export default function HomePage() {
  const { user } = useAuth()
  const {
    categories, documents, getRecentDocuments, getCategoryFileCount,
    getCategoryLastUpdated, driveLoading, driveError, getBookmarkedDocs,
  } = useDocuments()
  const [previewDoc, setPreviewDoc] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const navigate = useNavigate()

  const recentDocs = getRecentDocuments(5)
  const bookmarkedDocs = getBookmarkedDocs()
  const firstName = user?.displayName?.split(' ')[0] || 'คุณ'
  const totalFiles = documents.filter((d) => !d.is_archived).length

  function handleSearch(e) {
    e.preventDefault()
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`)
    }
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 sm:p-8 text-white">
        <h1 className="text-xl sm:text-2xl font-bold">
          สวัสดี, {firstName} 👋
        </h1>
        <p className="text-primary-100 mt-1 text-sm sm:text-base">
          ค้นหาเอกสารจาก {totalFiles > 0 ? `${totalFiles} ไฟล์ ใน ${categories.length} โฟลเดอร์` : 'Google Drive ของบริษัท'}
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mt-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ค้นหาชื่อไฟล์ คนอัปโหลด หรืออะไรก็ได้..."
              className="w-full pl-12 pr-4 py-3.5 bg-white text-slate-900 rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg placeholder:text-slate-400"
            />
          </div>
        </form>

        {/* Quick stats */}
        <div className="flex gap-6 mt-5 text-sm">
          <div>
            <span className="text-2xl font-bold">{totalFiles}</span>
            <span className="text-primary-200 ml-1">ไฟล์</span>
          </div>
          <div>
            <span className="text-2xl font-bold">{categories.length}</span>
            <span className="text-primary-200 ml-1">โฟลเดอร์</span>
          </div>
          {bookmarkedDocs.length > 0 && (
            <div>
              <span className="text-2xl font-bold">{bookmarkedDocs.length}</span>
              <span className="text-primary-200 ml-1">ปักหมุด</span>
            </div>
          )}
        </div>
      </div>

      {/* Loading / Error */}
      {driveLoading && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent" />
          <div>
            <p className="text-sm font-medium text-primary-700">กำลังโหลดไฟล์จาก Google Drive...</p>
            <p className="text-xs text-primary-500 mt-0.5">อาจใช้เวลาสักครู่ถ้ามีไฟล์เยอะ</p>
          </div>
        </div>
      )}

      {driveError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{driveError}</p>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Folders (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Folders */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary-500" />
                โฟลเดอร์
              </h2>
              <span className="text-xs text-slate-400">{categories.length} โฟลเดอร์</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((category) => {
                const fileCount = getCategoryFileCount(category.id)
                const lastUpdated = getCategoryLastUpdated(category.id)

                return (
                  <Link
                    key={category.id}
                    to={`/category/${category.slug}`}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${category.color} text-white`}>
                        <FolderOpen className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                        {fileCount}
                      </span>
                    </div>
                    <h3 className="font-medium text-slate-900 text-sm mt-3 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                      {category.name}
                    </h3>
                    {lastUpdated && (
                      <p className="text-[11px] text-slate-400 mt-2">{formatDate(lastUpdated)}</p>
                    )}
                  </Link>
                )
              })}
            </div>
          </section>
        </div>

        {/* Right Column — Recent & Bookmarks (1/3 width) */}
        <div className="space-y-6">
          {/* Bookmarks */}
          {bookmarkedDocs.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ปักหมุด
                </h2>
                <Link to="/search" className="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-0.5">
                  ดูทั้งหมด <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {bookmarkedDocs.slice(0, 5).map((doc) => (
                  <QuickFileItem key={doc.id} document={doc} onPreview={setPreviewDoc} />
                ))}
              </div>
            </section>
          )}

          {/* Recently Updated */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary-500" />
                อัปเดตล่าสุด
              </h2>
              <Link to="/search" className="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-0.5">
                ดูทั้งหมด <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {recentDocs.map((doc) => (
                <QuickFileItem key={doc.id} document={doc} onPreview={setPreviewDoc} />
              ))}
              {recentDocs.length === 0 && (
                <div className="p-4 text-center text-sm text-slate-400">ยังไม่มีไฟล์</div>
              )}
            </div>
          </section>
        </div>
      </div>

      {previewDoc && (
        <FilePreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  )
}

// Minimal file item for sidebar lists
function QuickFileItem({ document, onPreview }) {
  const { trackView } = useDocuments()
  const typeConfig = FILE_TYPE_ICONS[document.file_type] || { icon: FileText, color: 'text-slate-400' }
  const TypeIcon = typeConfig.icon

  function handleClick() {
    trackView(document.id)
    const { file_type, drive_link } = document
    if (['pdf', 'image'].includes(file_type) && onPreview) {
      onPreview(document)
    } else if (drive_link) {
      window.open(drive_link, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left group"
    >
      <TypeIcon className={`w-4 h-4 shrink-0 ${typeConfig.color}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-800 truncate group-hover:text-primary-600 transition-colors">
          {document.name}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {formatDate(document.updated_at)}
          {document.uploader_name && ` · ${document.uploader_name}`}
        </p>
      </div>
    </button>
  )
}
