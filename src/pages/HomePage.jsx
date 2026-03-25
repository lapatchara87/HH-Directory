import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES } from '../lib/categories'
import { useDocuments } from '../contexts/DocumentContext'
import FileCard from '../components/FileCard'
import FilePreviewModal from '../components/FilePreviewModal'
import { Clock, ArrowRight } from 'lucide-react'

function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

export default function HomePage() {
  const { getRecentDocuments, getCategoryFileCount, getCategoryLastUpdated, driveLoading, driveError } = useDocuments()
  const [previewDoc, setPreviewDoc] = useState(null)
  const recentDocs = getRecentDocuments(10)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Document Hub</h1>
        <p className="text-slate-500 mt-1">ศูนย์รวมเอกสารบริษัท HuaHed</p>
      </div>

      {/* Loading state */}
      {driveLoading && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent" />
          <p className="text-sm text-primary-700">กำลังโหลดไฟล์จาก Google Drive...</p>
        </div>
      )}

      {driveError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{driveError}</p>
        </div>
      )}

      {/* Recently Updated */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-slate-900">อัปเดตล่าสุด</h2>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {recentDocs.map((doc) => (
            <FileCard key={doc.id} document={doc} compact onPreview={setPreviewDoc} />
          ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">หมวดหมู่เอกสาร</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((category) => {
            const Icon = category.icon
            const fileCount = getCategoryFileCount(category.id)
            const lastUpdated = getCategoryLastUpdated(category.id)

            return (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-md transition-all group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.color} text-white mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm group-hover:text-primary-600 transition-colors line-clamp-1">
                  {category.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{category.description}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">{fileCount} ไฟล์</span>
                  {lastUpdated && (
                    <span className="text-xs text-slate-400">{formatDate(lastUpdated)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>ดูทั้งหมด</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {previewDoc && (
        <FilePreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  )
}
