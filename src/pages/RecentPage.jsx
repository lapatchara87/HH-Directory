import { useState } from 'react'
import { useDocuments } from '../contexts/DocumentContext'
import FileCard from '../components/FileCard'
import FilePreviewModal from '../components/FilePreviewModal'
import { Clock } from 'lucide-react'

export default function RecentPage() {
  const { getRecentlyViewedDocs } = useDocuments()
  const [previewDoc, setPreviewDoc] = useState(null)
  const docs = getRecentlyViewedDocs(30)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Clock className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">เพิ่งเปิดดู</h1>
          <p className="text-sm text-slate-500">{docs.length} ไฟล์</p>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <Clock className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700">ยังไม่มีไฟล์ที่เปิดดู</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
            เมื่อคุณกดเปิดไฟล์ใดก็ได้ ระบบจะจำไว้แสดงตรงนี้
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
