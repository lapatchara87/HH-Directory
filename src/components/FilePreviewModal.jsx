import { X, Download, ExternalLink } from 'lucide-react'

export default function FilePreviewModal({ document, onClose }) {
  if (!document) return null

  const isPDF = document.file_type === 'pdf'
  const isImage = document.file_type === 'image'
  const fileUrl = document.file_url || document.drive_link

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{document.name}</h2>
            {document.description && (
              <p className="text-sm text-slate-500">{document.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {fileUrl && (
              <>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                  title="เปิดในแท็บใหม่"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
                {(isPDF || isImage) && document.file_url && (
                  <a
                    href={document.file_url}
                    download={document.name}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                    title="ดาวน์โหลด"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                )}
              </>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-50 rounded-b-2xl min-h-[400px]">
          {isPDF && fileUrl && (
            <iframe
              src={fileUrl}
              className="w-full h-full min-h-[500px] rounded-lg border border-slate-200"
              title={document.name}
            />
          )}
          {isImage && fileUrl && (
            <img
              src={fileUrl}
              alt={document.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          )}
          {!isPDF && !isImage && (
            <div className="text-center">
              <p className="text-slate-500 mb-4">ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้</p>
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  เปิดในแท็บใหม่
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
