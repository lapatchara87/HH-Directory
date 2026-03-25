import { useState } from 'react'
import { X, Upload, Link as LinkIcon, FileUp } from 'lucide-react'
import { CATEGORIES } from '../lib/categories'
import { useDocuments } from '../contexts/DocumentContext'
import { useAuth } from '../contexts/AuthContext'

export default function UploadModal({ onClose }) {
  const { addDocument } = useDocuments()
  const { user } = useAuth()
  const [mode, setMode] = useState(null) // 'file' | 'link'
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tags, setTags] = useState('')
  const [link, setLink] = useState('')
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function detectFileType(url) {
    if (!url) return 'link'
    if (url.includes('docs.google.com/document')) return 'google_doc'
    if (url.includes('docs.google.com/spreadsheets')) return 'google_sheet'
    if (url.includes('docs.google.com/presentation')) return 'google_slide'
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'video'
    if (url.includes('drive.google.com')) return 'link'
    return 'link'
  }

  function detectUploadFileType(fileName) {
    if (!fileName) return 'pdf'
    const ext = fileName.split('.').pop().toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'
    return 'pdf'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !categoryId) return
    setSubmitting(true)

    const doc = {
      name: name.trim(),
      description: description.trim(),
      category_id: Number(categoryId),
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      uploaded_by: user?.email || 'unknown',
      uploader_name: user?.user_metadata?.full_name || user?.email || 'Unknown',
    }

    if (mode === 'link') {
      doc.file_type = detectFileType(link)
      doc.drive_link = link.trim()
      doc.file_url = null
      doc.file_size = null
    } else if (file) {
      doc.file_type = detectUploadFileType(file.name)
      doc.file_url = URL.createObjectURL(file)
      doc.drive_link = null
      doc.file_size = formatFileSize(file.size)
    }

    addDocument(doc)
    setSubmitting(false)
    onClose()
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">อัปโหลดเอกสาร</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {!mode ? (
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600 text-center">เลือกวิธีเพิ่มเอกสาร</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMode('file')}
                className="p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-colors flex flex-col items-center gap-3"
              >
                <FileUp className="w-8 h-8 text-primary-500" />
                <div className="text-center">
                  <p className="font-medium text-slate-900 text-sm">อัปโหลดไฟล์</p>
                  <p className="text-xs text-slate-500 mt-1">PDF, รูปภาพ (สูงสุด 50MB)</p>
                </div>
              </button>
              <button
                onClick={() => setMode('link')}
                className="p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-colors flex flex-col items-center gap-3"
              >
                <LinkIcon className="w-8 h-8 text-primary-500" />
                <div className="text-center">
                  <p className="font-medium text-slate-900 text-sm">วางลิงก์</p>
                  <p className="text-xs text-slate-500 mt-1">Google Drive, YouTube</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'file' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ไฟล์</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileUp className="w-5 h-5 text-primary-500" />
                      <span className="text-sm text-slate-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">คลิกเพื่อเลือกไฟล์</p>
                      <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG (สูงสุด 50MB)</p>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                        onChange={(e) => {
                          const f = e.target.files[0]
                          if (f && f.size <= 50 * 1024 * 1024) {
                            setFile(f)
                            if (!name) setName(f.name.replace(/\.[^.]+$/, ''))
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {mode === 'link' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ลิงก์</label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://docs.google.com/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ชื่อเอกสาร <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อเอกสาร"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                หมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">เลือกหมวดหมู่</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">คำอธิบาย</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="รายละเอียดเอกสาร (ไม่บังคับ)"
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">แท็ก</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="คั่นด้วยคอมม่า เช่น policy, hr, template"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                ย้อนกลับ
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim() || !categoryId}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
