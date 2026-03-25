import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDocuments } from '../contexts/DocumentContext'
import { CATEGORIES } from '../lib/categories'
import FileCard from '../components/FileCard'
import FilePreviewModal from '../components/FilePreviewModal'
import { Search, SlidersHorizontal } from 'lucide-react'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { searchDocuments, searchQuery, setSearchQuery } = useDocuments()
  const [previewDoc, setPreviewDoc] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const query = searchParams.get('q') || searchQuery

  useEffect(() => {
    let cancelled = false
    async function doSearch() {
      setSearching(true)
      const res = await searchDocuments(query, {
        category: filterCategory ? Number(filterCategory) : undefined,
        fileType: filterType || undefined,
        sort: sortBy,
        includeArchived,
      })
      if (!cancelled) {
        setResults(res)
        setSearching(false)
      }
    }
    doSearch()
    return () => { cancelled = true }
  }, [query, filterCategory, filterType, sortBy, includeArchived, searchDocuments])

  function handleSearch(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const q = formData.get('q')
    if (q.trim()) {
      setSearchParams({ q: q.trim() })
      setSearchQuery(q.trim())
    }
  }

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="ค้นหาเอกสาร ชื่อไฟล์ แท็ก..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
              showFilters ? 'bg-primary-100 text-primary-600' : 'hover:bg-slate-100 text-slate-400'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">หมวดหมู่</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">ทุกหมวดหมู่</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">ประเภทไฟล์</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">เรียงลำดับ</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="latest">ล่าสุด</option>
                <option value="oldest">เก่าสุด</option>
                <option value="name">ชื่อ A-Z</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 mt-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            รวมเอกสารเก่า/ที่เก็บถาวร
          </label>
        </div>
      )}

      {/* Results */}
      <div>
        <p className="text-sm text-slate-500 mb-4">
          {query ? (
            <>พบ <span className="font-medium text-slate-700">{results.length}</span> ผลลัพธ์สำหรับ &ldquo;{query}&rdquo;</>
          ) : (
            <>เอกสารทั้งหมด <span className="font-medium text-slate-700">{results.length}</span> ไฟล์</>
          )}
        </p>
        {results.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">ไม่พบเอกสารที่ค้นหา</p>
            <p className="text-sm text-slate-400 mt-1">ลองค้นหาด้วยคำอื่น หรือลองใช้ตัวกรอง</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {results.map((doc) => (
              <FileCard key={doc.id} document={doc} onPreview={setPreviewDoc} />
            ))}
          </div>
        )}
      </div>

      {previewDoc && (
        <FilePreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  )
}
