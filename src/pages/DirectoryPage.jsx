import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocuments } from '../contexts/DocumentContext'
import { FolderOpen, Search, LayoutGrid, List, ArrowRight } from 'lucide-react'

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'วันนี้'
  if (days === 1) return 'เมื่อวาน'
  if (days < 7) return `${days} วันที่แล้ว`
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

export default function DirectoryPage() {
  const { categories, getCategoryFileCount, getCategoryLastUpdated, driveLoading } = useDocuments()
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('name') // 'name' | 'files' | 'updated'

  let filtered = search
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : [...categories]

  // Sort
  if (sortBy === 'files') {
    filtered.sort((a, b) => getCategoryFileCount(b.id) - getCategoryFileCount(a.id))
  } else if (sortBy === 'updated') {
    filtered.sort((a, b) => {
      const aDate = getCategoryLastUpdated(a.id) || '2000-01-01'
      const bDate = getCategoryLastUpdated(b.id) || '2000-01-01'
      return new Date(bDate) - new Date(aDate)
    })
  }

  const totalFiles = categories.reduce((sum, cat) => sum + getCategoryFileCount(cat.id), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">ไดเรกทอรี่</h1>
          <p className="text-sm text-slate-500">{categories.length} โฟลเดอร์ · {totalFiles} ไฟล์</p>
        </div>
      </div>

      {/* Toolbar: Search + View toggle + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาโฟลเดอร์..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="name">ชื่อ A-Z</option>
            <option value="files">จำนวนไฟล์</option>
            <option value="updated">อัปเดตล่าสุด</option>
          </select>
          <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {driveLoading && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent" />
          <p className="text-sm text-primary-700">กำลังโหลดโฟลเดอร์จาก Google Drive...</p>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((category) => {
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
                  <p className="text-[11px] text-slate-400 mt-2">อัปเดต {formatDate(lastUpdated)}</p>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {filtered.map((category) => {
            const fileCount = getCategoryFileCount(category.id)
            const lastUpdated = getCategoryLastUpdated(category.id)
            return (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${category.color} text-white`}>
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                    {category.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {fileCount} ไฟล์{lastUpdated && ` · อัปเดต ${formatDate(lastUpdated)}`}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-400 shrink-0" />
              </Link>
            )
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <FolderOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">ไม่พบโฟลเดอร์ที่ค้นหา</p>
        </div>
      )}
    </div>
  )
}
