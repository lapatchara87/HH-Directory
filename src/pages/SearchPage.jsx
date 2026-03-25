import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDocuments } from '../contexts/DocumentContext'
import FileCard from '../components/FileCard'
import FilePreviewModal from '../components/FilePreviewModal'
import { Search, SlidersHorizontal, Star, Clock, Tag, Hash } from 'lucide-react'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    searchDocuments, searchQuery, setSearchQuery, categories, documents,
    getAllUploaders, getAllUniqueTags, getBookmarkedDocs, getRecentlyViewedDocs, getTagsForDoc,
  } = useDocuments()
  const [previewDoc, setPreviewDoc] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterUploader, setFilterUploader] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('latest')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [activeView, setActiveView] = useState('search') // 'search' | 'bookmarks' | 'recent' | 'tags'
  const [selectedTag, setSelectedTag] = useState(null)

  const query = searchParams.get('q') || searchQuery

  useEffect(() => {
    if (activeView !== 'search') return
    let cancelled = false
    async function doSearch() {
      setSearching(true)
      const res = await searchDocuments(query, {
        category: filterCategory ? Number(filterCategory) : undefined,
        fileType: filterType || undefined,
        uploader: filterUploader || undefined,
        tag: filterTag || undefined,
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
        bookmarkedOnly,
        sort: sortBy,
      })
      if (!cancelled) { setResults(res); setSearching(false) }
    }
    doSearch()
    return () => { cancelled = true }
  }, [query, filterCategory, filterType, filterUploader, filterTag, filterDateFrom, filterDateTo, bookmarkedOnly, sortBy, searchDocuments, activeView])

  function handleSearch(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    const q = formData.get('q')
    setActiveView('search')
    if (q.trim()) {
      setSearchParams({ q: q.trim() })
      setSearchQuery(q.trim())
    }
  }

  const uploaders = getAllUploaders()
  const allTags = getAllUniqueTags()
  const bookmarkedDocs = getBookmarkedDocs()
  const recentDocs = getRecentlyViewedDocs(20)

  const taggedDocs = selectedTag
    ? documents.filter((d) => (getTagsForDoc(d.id) || []).includes(selectedTag))
    : documents.filter((d) => (getTagsForDoc(d.id) || []).length > 0)

  const displayDocs = activeView === 'bookmarks' ? bookmarkedDocs
    : activeView === 'recent' ? recentDocs
    : activeView === 'tags' ? taggedDocs
    : results

  const hasActiveFilters = filterCategory || filterType || filterUploader || filterTag || filterDateFrom || filterDateTo || bookmarkedOnly

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
            placeholder="ค้นหาเอกสาร ชื่อไฟล์ คนอัปโหลด..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
              showFilters || hasActiveFilters ? 'bg-primary-100 text-primary-600' : 'hover:bg-slate-100 text-slate-400'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Quick view tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('search')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'search' ? 'bg-primary-100 text-primary-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          ค้นหา
        </button>
        <button
          onClick={() => setActiveView('bookmarks')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'bookmarks' ? 'bg-amber-100 text-amber-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          ปักหมุด ({bookmarkedDocs.length})
        </button>
        <button
          onClick={() => setActiveView('recent')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'recent' ? 'bg-green-100 text-green-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          เพิ่งเปิด ({recentDocs.length})
        </button>
        <button
          onClick={() => { setActiveView('tags'); setSelectedTag(null) }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'tags' ? 'bg-violet-100 text-violet-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          แท็ก ({allTags.length})
        </button>
      </div>

      {/* Tag filter chips — show when tags tab is active */}
      {activeView === 'tags' && allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !selectedTag ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-violet-50'
            }`}
          >ทั้งหมด ({documents.filter((d) => (getTagsForDoc(d.id) || []).length > 0).length})</button>
          {allTags.map((tag) => {
            const count = documents.filter((d) => (getTagsForDoc(d.id) || []).includes(tag)).length
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                  selectedTag === tag ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-violet-50 hover:border-violet-300'
                }`}
              >
                <Hash className="w-3 h-3" />
                {tag} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Filters — only for search view */}
      {showFilters && activeView === 'search' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">หมวดหมู่</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">ทุกหมวดหมู่</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">ประเภทไฟล์</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
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
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="latest">ล่าสุด</option>
                <option value="oldest">เก่าสุด</option>
                <option value="name">ชื่อ A-Z</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">ผู้อัปโหลด</label>
              <select value={filterUploader} onChange={(e) => setFilterUploader(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">ทุกคน</option>
                {uploaders.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">ตั้งแต่วันที่</label>
              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">ถึงวันที่</label>
              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          {allTags.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">แท็ก</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterTag('')}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    !filterTag ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >ทั้งหมด</button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                      filterTag === tag ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={bookmarkedOnly} onChange={(e) => setBookmarkedOnly(e.target.checked)}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
              เฉพาะที่ปักหมุด
            </label>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setFilterCategory(''); setFilterType(''); setFilterUploader('')
                  setFilterTag(''); setFilterDateFrom(''); setFilterDateTo('')
                  setBookmarkedOnly(false)
                }}
                className="text-xs text-red-500 hover:text-red-700"
              >ล้างตัวกรองทั้งหมด</button>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      <div>
        <p className="text-sm text-slate-500 mb-4">
          {activeView === 'bookmarks' ? (
            <>ไฟล์ที่ปักหมุด <span className="font-medium text-slate-700">{displayDocs.length}</span> ไฟล์</>
          ) : activeView === 'recent' ? (
            <>เพิ่งเปิดดู <span className="font-medium text-slate-700">{displayDocs.length}</span> ไฟล์</>
          ) : activeView === 'tags' ? (
            <>{selectedTag ? <><span className="font-medium text-violet-600">#{selectedTag}</span> — </> : 'ไฟล์ที่ติดแท็ก '}<span className="font-medium text-slate-700">{displayDocs.length}</span> ไฟล์</>
          ) : query ? (
            <>พบ <span className="font-medium text-slate-700">{displayDocs.length}</span> ผลลัพธ์สำหรับ &ldquo;{query}&rdquo;{searching && ' (กำลังค้นหา...)'}</>
          ) : (
            <>เอกสารทั้งหมด <span className="font-medium text-slate-700">{displayDocs.length}</span> ไฟล์</>
          )}
        </p>
        {displayDocs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            {activeView === 'bookmarks' ? (
              <>
                <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">ยังไม่มีไฟล์ที่ปักหมุด</p>
                <p className="text-sm text-slate-400 mt-1">กดไอคอนดาวที่ไฟล์เพื่อปักหมุด</p>
              </>
            ) : activeView === 'recent' ? (
              <>
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">ยังไม่มีไฟล์ที่เปิดดู</p>
              </>
            ) : activeView === 'tags' ? (
              <>
                <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">ยังไม่มีไฟล์ที่ติดแท็ก</p>
                <p className="text-sm text-slate-400 mt-1">กดปุ่ม "+ แท็ก" ที่ไฟล์เพื่อเพิ่มแท็ก</p>
              </>
            ) : (
              <>
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">ไม่พบเอกสารที่ค้นหา</p>
                <p className="text-sm text-slate-400 mt-1">ลองค้นหาด้วยคำอื่น หรือลองใช้ตัวกรอง</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {displayDocs.map((doc) => (
              <FileCard key={doc.id} document={doc} onPreview={setPreviewDoc} showActions />
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
