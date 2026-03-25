import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDocuments } from '../contexts/DocumentContext'
import { useAuth } from '../contexts/AuthContext'
import FilePreviewModal from '../components/FilePreviewModal'
import {
  Search, FolderOpen, Clock, Star, ArrowRight, RefreshCw, Plug,
  FileText, Table, Presentation, FileDown, Image, Video, ExternalLink,
  Sparkles,
} from 'lucide-react'

const TYPE_ICON = {
  google_doc: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  google_sheet: { icon: Table, color: 'text-green-500', bg: 'bg-green-50' },
  google_slide: { icon: Presentation, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  pdf: { icon: FileDown, color: 'text-red-500', bg: 'bg-red-50' },
  image: { icon: Image, color: 'text-purple-500', bg: 'bg-purple-50' },
  video: { icon: Video, color: 'text-pink-500', bg: 'bg-pink-50' },
  link: { icon: ExternalLink, color: 'text-slate-400', bg: 'bg-slate-50' },
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

  const recentDocs = getRecentDocuments(5)
  const bookmarkedDocs = getBookmarkedDocs()
  const firstName = user?.displayName?.split(' ')[0] || ''
  const totalFiles = documents.filter((d) => !d.is_archived).length

  function handleSearch(e) {
    e.preventDefault()
    if (searchInput.trim()) navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`)
  }

  function openFile(doc) {
    trackView(doc.id)
    if (['pdf', 'image'].includes(doc.file_type)) setPreviewDoc(doc)
    else if (doc.drive_link) window.open(doc.drive_link, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Search Hero */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
        {firstName && <p className="text-primary-200 text-sm mb-1">สวัสดี, {firstName}</p>}
        <h1 className="text-lg sm:text-xl font-bold">ค้นหาเอกสาร</h1>
        <form onSubmit={handleSearch} className="mt-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="พิมพ์ชื่อไฟล์ คนอัปโหลด หรืออะไรก็ได้..."
              className="w-full pl-12 pr-4 py-3 bg-white text-slate-900 rounded-xl text-sm focus:outline-none shadow-lg placeholder:text-slate-400"
            />
          </div>
        </form>
        <div className="flex gap-4 mt-3 text-xs text-primary-200">
          <span><strong className="text-white text-sm">{totalFiles}</strong> ไฟล์</span>
          <span><strong className="text-white text-sm">{categories.length}</strong> โฟลเดอร์</span>
        </div>
      </div>

      {/* Drive Status */}
      {driveLoading && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent" />
          <p className="text-sm text-primary-700">กำลังโหลดไฟล์จาก Google Drive...</p>
        </div>
      )}
      {!driveLoading && (tokenExpired || driveError) && (
        <button
          onClick={async () => { const t = await refreshToken(); if (t) refreshDriveData() }}
          className="w-full flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Plug className="w-5 h-5 text-amber-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-amber-800">{driveError ? 'โหลดไฟล์ไม่สำเร็จ' : 'เชื่อมต่อ Google Drive'}</p>
              <p className="text-xs text-amber-600">กดเพื่อเชื่อมต่อและโหลดไฟล์</p>
            </div>
          </div>
          <RefreshCw className="w-5 h-5 text-amber-400 group-hover:text-amber-600" />
        </button>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/directory"
          className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all group">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 group-hover:text-primary-600">ไดเรกทอรี่</p>
            <p className="text-xs text-slate-400">{categories.length} โฟลเดอร์</p>
          </div>
        </Link>
        <Link to="/search"
          className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all group">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 group-hover:text-primary-600">ค้นหาขั้นสูง</p>
            <p className="text-xs text-slate-400">ตัวกรอง แท็ก วันที่</p>
          </div>
        </Link>
      </div>

      {/* Main Content: 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Favourites (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              ไฟล์ที่ปักหมุด
            </h2>
            {bookmarkedDocs.length > 0 && (
              <Link to="/bookmarks" className="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-0.5">
                ดูทั้งหมด ({bookmarkedDocs.length}) <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {bookmarkedDocs.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <Star className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">ยังไม่มีไฟล์ที่ปักหมุด</p>
              <p className="text-xs text-slate-400 mt-1">กดไอคอน ⭐ ที่ไฟล์เพื่อปักหมุดไว้เข้าถึงง่ายๆ ที่นี่</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {bookmarkedDocs.slice(0, 8).map((doc) => (
                <FileRow key={doc.id} doc={doc} onClick={() => openFile(doc)} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              อัปเดตล่าสุด
            </h2>
            {!driveLoading && accessToken && !driveError && (
              <button onClick={refreshDriveData}
                className="text-xs text-slate-400 hover:text-primary-600 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> รีเฟรช
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {recentDocs.map((doc) => (
              <MiniFileItem key={doc.id} doc={doc} onClick={() => openFile(doc)} />
            ))}
            {recentDocs.length === 0 && !driveLoading && (
              <div className="p-6 text-center text-sm text-slate-400">ยังไม่มีไฟล์</div>
            )}
          </div>

          {/* Top folders shortcut */}
          {categories.length > 0 && (
            <>
              <h2 className="font-semibold text-slate-900 flex items-center gap-2 pt-2">
                <FolderOpen className="w-4 h-4 text-slate-400" />
                โฟลเดอร์ยอดนิยม
              </h2>
              <div className="space-y-1.5">
                {categories.slice(0, 5).map((cat) => (
                  <Link key={cat.id} to={`/category/${cat.slug}`}
                    className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-3 py-2.5 hover:border-primary-200 transition-all group">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center ${cat.color} text-white`}>
                      <FolderOpen className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm text-slate-700 group-hover:text-primary-600 truncate flex-1">{cat.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  </Link>
                ))}
                {categories.length > 5 && (
                  <Link to="/directory" className="block text-center text-xs text-primary-500 hover:text-primary-700 py-2">
                    ดูทั้งหมด {categories.length} โฟลเดอร์ →
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {previewDoc && <FilePreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  )
}

// File row with icon, name, date, uploader
function FileRow({ doc, onClick }) {
  const cfg = TYPE_ICON[doc.file_type] || TYPE_ICON.link
  const Icon = cfg.icon
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-primary-200 hover:shadow-sm transition-all text-left group">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
        <Icon className={`w-4 h-4 ${cfg.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate group-hover:text-primary-600">{doc.name}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {timeAgo(doc.updated_at)}{doc.uploader_name && ` · ${doc.uploader_name}`}
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-primary-400 shrink-0" />
    </button>
  )
}

// Compact file item for sidebar
function MiniFileItem({ doc, onClick }) {
  const cfg = TYPE_ICON[doc.file_type] || TYPE_ICON.link
  const Icon = cfg.icon
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 transition-colors text-left group">
      <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-700 truncate group-hover:text-primary-600">{doc.name}</p>
        <p className="text-[10px] text-slate-400">{timeAgo(doc.updated_at)}</p>
      </div>
    </button>
  )
}
