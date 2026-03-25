import { useState } from 'react'
import { useDocuments } from '../contexts/DocumentContext'
import { Rocket, CheckCircle2, Circle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

export default function OnboardingPage() {
  const { onboardingSteps, getDocumentById } = useDocuments()
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [expandedStep, setExpandedStep] = useState(null)

  const activeSteps = onboardingSteps
    .filter((s) => s.is_active)
    .sort((a, b) => a.display_order - b.display_order)

  const progress = activeSteps.length > 0
    ? Math.round((completedSteps.size / activeSteps.length) * 100)
    : 0

  function toggleStep(stepId) {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }

  function openDocument(documentId) {
    const doc = getDocumentById(documentId)
    if (!doc) return

    const url = doc.drive_link || doc.file_url
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Rocket className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Start Here</h1>
        <p className="text-slate-500 mt-2">
          ยินดีต้อนรับพนักงานใหม่! ทำตามขั้นตอนเหล่านี้เพื่อเริ่มต้นงานได้อย่างราบรื่น
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">ความคืบหน้า</span>
          <span className="text-sm font-semibold text-primary-600">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {completedSteps.size} จาก {activeSteps.length} ขั้นตอน
        </p>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {activeSteps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id)
          const isExpanded = expandedStep === step.id
          const doc = step.document_id ? getDocumentById(step.document_id) : null

          return (
            <div
              key={step.id}
              className={`bg-white rounded-xl border transition-all ${
                isCompleted
                  ? 'border-green-200 bg-green-50/50'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                {/* Checkbox */}
                <button
                  onClick={() => toggleStep(step.id)}
                  className="shrink-0 mt-0.5"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-300 hover:text-primary-400 transition-colors" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">
                      ขั้นตอน {index + 1}
                    </span>
                  </div>
                  <h3 className={`font-semibold mt-1 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {step.title}
                  </h3>

                  {/* Expandable description */}
                  <button
                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                    className="text-xs text-slate-500 hover:text-primary-600 mt-1 flex items-center gap-1"
                  >
                    {isExpanded ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 space-y-3">
                      <p className="text-sm text-slate-600">{step.description}</p>
                      {doc && (
                        <button
                          onClick={() => openDocument(step.document_id)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm hover:bg-primary-100 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          เปิดเอกสาร: {doc.name}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Completion message */}
      {progress === 100 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-lg font-semibold text-green-800">ยอดเยี่ยม!</h3>
          <p className="text-green-600 text-sm mt-1">
            คุณทำครบทุกขั้นตอนแล้ว ยินดีต้อนรับสู่ทีม HuaHed!
          </p>
        </div>
      )}
    </div>
  )
}
