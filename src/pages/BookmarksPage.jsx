import { useState } from 'react'
import { useDocuments } from '../contexts/DocumentContext'
import FileCard from '../components/FileCard'
import FilePreviewModal from '../components/FilePreviewModal'
import { Star } from 'lucide-react'

export default function BookmarksPage() {
  const { getBookmarkedDocs } = useDocuments()
  const [previewDoc, setPreviewDoc] = useState(null)
  const docs = getBookmarkedDocs()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">ไฟล์ที่ปักหมุด</h1>
          <p className="text-sm text-slate-500">{docs.length} ไฟล์</p>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <Star className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700">ยังไม่มีไฟล์ที่ปักหมุด</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
            กดไอคอน ⭐ ที่ไฟล์ใดก็ได้เพื่อปักหมุดไว้ดูง่ายๆ ตรงนี้
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {docs.map((doc) => (
            <FileCard key={doc.id} document={doc} onPreview={setPreviewDoc} showActions />
          ))}
        </div>
      )}

      {previewDoc && (
        <FilePreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  )
}
