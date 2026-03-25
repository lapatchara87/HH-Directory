import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDocuments } from '../contexts/DocumentContext'
import FileCard from '../components/FileCard'
import FilePreviewModal from '../components/FilePreviewModal'
import { ArrowLeft, Filter, FolderOpen } from 'lucide-react'

export default function CategoryPage() {
  const { slug } = useParams()
  const { categories, getDocumentsByCategory } = useDocuments()
  const [previewDoc, setPreviewDoc] = useState(null)
  const [sortBy, setSortBy] = useState('latest')
  const [filterType, setFilterType] = useState('')

  // Find category by slug (which is the folderId for dynamic categories)
  const category = categories.find((c) => c.slug === slug)

  if (!category) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">ไม่พบหมวดหมู่นี้</p>
        <Link to="/" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
          กลับหน้าหลัก
        </Link>
      </div>
    )
  }

  let docs = getDocumentsByCategory(category.id)

  if (filterType) docs = docs.filter((d) => d.file_type === filterType)

  if (sortBy === 'oldest') docs = [...docs].sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at))
  else if (sortBy === 'name') docs = [...docs].sort((a, b) => a.name.localeCompare(b.name))
  else docs = [...docs].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าหลัก
        </Link>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${category.color || 'bg-blue-500'} text-white`}>
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{category.name}</h1>
            <p className="text-sm text-slate-500">{docs.length} ไฟล์</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">ทุกประเภท</option>
            <option value="google_doc">Google Docs</option>
            <option value="google_sheet">Google Sheets</option>
            <option value="google_slide">Google Slides</option>
            <option value="pdf">PDF</option>
            <option value="image">รูปภาพ</option>
            <option value="video">วิดีโอ</option>
          </select>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="latest">ล่าสุด</option>
          <option value="oldest">เก่าสุด</option>
          <option value="name">ชื่อ A-Z</option>
        </select>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">ยังไม่มีเอกสารในโฟลเดอร์นี้</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {docs.map((doc) => (
            <FileCard key={doc.id} document={doc} onPreview={setPreviewDoc} />
          ))}
        </div>
      )}

      {previewDoc && (
        <FilePreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  )
}
