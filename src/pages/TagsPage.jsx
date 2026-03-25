import { useState } from 'react'
import { useDocuments } from '../contexts/DocumentContext'
import FileCard from '../components/FileCard'
import FilePreviewModal from '../components/FilePreviewModal'
import { Tag, Hash, X } from 'lucide-react'

export default function TagsPage() {
  const { documents, getAllUniqueTags, getTagsForDoc } = useDocuments()
  const [selectedTag, setSelectedTag] = useState(null)
  const [previewDoc, setPreviewDoc] = useState(null)
  const allTags = getAllUniqueTags()

  // Get documents that have the selected tag
  const taggedDocs = selectedTag
    ? documents.filter((d) => {
        const tags = getTagsForDoc(d.id)
        return tags.includes(selectedTag)
      })
    : []

  // Get all docs that have any tag
  const allTaggedDocs = documents.filter((d) => {
    const tags = getTagsForDoc(d.id)
    return tags.length > 0
  })

  // Count per tag
  function getTagCount(tag) {
    return documents.filter((d) => getTagsForDoc(d.id).includes(tag)).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <Tag className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">แท็กของฉัน</h1>
          <p className="text-sm text-slate-500">{allTags.length} แท็ก · {allTaggedDocs.length} ไฟล์ที่ติดแท็ก</p>
        </div>
      </div>

      {allTags.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <Tag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700">ยังไม่มีแท็ก</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
            กด <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 rounded text-xs font-medium">+ แท็ก</span> ที่ไฟล์ใดก็ได้เพื่อเพิ่มแท็ก
            <br />เช่น <span className="text-violet-500">#urgent</span> <span className="text-violet-500">#template</span> <span className="text-violet-500">#ต้องทำ</span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Tag list */}
          <div className="lg:col-span-1">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">แท็กทั้งหมด</h3>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {/* Show all tagged files */}
              <button
                onClick={() => setSelectedTag(null)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                  selectedTag === null ? 'bg-violet-50 text-violet-700' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-sm font-medium">ทั้งหมด</span>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{allTaggedDocs.length}</span>
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    selectedTag === tag ? 'bg-violet-50 text-violet-700' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Hash className="w-3.5 h-3.5 text-violet-400" />
                    {tag}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{getTagCount(tag)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Files with selected tag */}
          <div className="lg:col-span-3">
            {selectedTag ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-violet-400" />
                    {selectedTag}
                    <span className="text-slate-400 font-normal">({taggedDocs.length} ไฟล์)</span>
                  </h3>
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    ล้าง
                  </button>
                </div>
                <div className="grid gap-3">
                  {taggedDocs.map((doc) => (
                    <FileCard key={doc.id} document={doc} onPreview={setPreviewDoc} showActions />
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  ไฟล์ที่ติดแท็กทั้งหมด ({allTaggedDocs.length})
                </h3>
                {allTaggedDocs.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                    <p className="text-sm text-slate-400">เลือกแท็กด้านซ้ายเพื่อดูไฟล์</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {allTaggedDocs.map((doc) => (
                      <FileCard key={doc.id} document={doc} onPreview={setPreviewDoc} showActions />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {previewDoc && (
        <FilePreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  )
}
