import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDocuments } from '../contexts/DocumentContext'
// Categories come from DocumentContext dynamically
import {
  Settings,
  FileText,
  Rocket,
  BarChart3,
  Trash2,
  Pencil,
  Plus,
  GripVertical,
  X,
  Save,
  ArrowUpDown,
} from 'lucide-react'

export default function AdminPage() {
  const { tab } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const {
    documents,
    onboardingSteps,
    updateDocument,
    deleteDocument,
    addOnboardingStep,
    updateOnboardingStep,
    deleteOnboardingStep,
    categories,
  } = useDocuments()

  const activeTab = tab || 'documents'

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <Settings className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">คุณไม่มีสิทธิ์เข้าถึงหน้า Admin</p>
      </div>
    )
  }

  const tabs = [
    { id: 'documents', label: 'เอกสาร', icon: FileText },
    { id: 'onboarding', label: 'Onboarding', icon: Rocket },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary-500" />
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => navigate(`/admin/${t.id}`)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'documents' && (
        <DocumentsTab
          documents={documents}
          categories={categories}
          onUpdate={updateDocument}
          onDelete={deleteDocument}
        />
      )}
      {activeTab === 'onboarding' && (
        <OnboardingTab
          steps={onboardingSteps}
          documents={documents}
          onAdd={addOnboardingStep}
          onUpdate={updateOnboardingStep}
          onDelete={deleteOnboardingStep}
        />
      )}
      {activeTab === 'dashboard' && <DashboardTab documents={documents} categories={categories} />}
    </div>
  )
}

function DocumentsTab({ documents, categories, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [filterCat, setFilterCat] = useState('')

  const filtered = filterCat
    ? documents.filter((d) => d.category_id === Number(filterCat))
    : documents

  function startEdit(doc) {
    setEditingId(doc.id)
    setEditData({
      name: doc.name,
      description: doc.description || '',
      category_id: doc.category_id,
      tags: doc.tags ? doc.tags.join(', ') : '',
    })
  }

  function saveEdit() {
    onUpdate(editingId, {
      ...editData,
      tags: editData.tags ? editData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    })
    setEditingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">ทุกหมวดหมู่ ({documents.length})</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500">ชื่อเอกสาร</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">หมวดหมู่</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">ประเภท</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">อัปเดตล่าสุด</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {editingId === doc.id ? (
                      <div className="space-y-2">
                        <input
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                        />
                        <input
                          value={editData.description}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                          placeholder="คำอธิบาย"
                        />
                        <select
                          value={editData.category_id}
                          onChange={(e) => setEditData({ ...editData, category_id: Number(e.target.value) })}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <input
                          value={editData.tags}
                          onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                          placeholder="แท็ก (คั่นด้วยคอมม่า)"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-slate-900">{doc.name}</p>
                        {doc.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{doc.description}</p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-slate-600">
                      {categories.find((c) => c.id === doc.category_id)?.name || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                      {doc.file_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-slate-500">
                      {new Date(doc.updated_at).toLocaleDateString('th-TH')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === doc.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={saveEdit}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(doc)}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('ต้องการลบเอกสารนี้?')) onDelete(doc.id)
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function OnboardingTab({ steps, documents, onAdd, onUpdate, onDelete }) {
  const [adding, setAdding] = useState(false)
  const [newStep, setNewStep] = useState({ title: '', description: '', document_id: '' })

  const sortedSteps = [...steps].sort((a, b) => a.display_order - b.display_order)

  function handleAdd() {
    if (!newStep.title.trim()) return
    onAdd(newStep)
    setNewStep({ title: '', description: '', document_id: '' })
    setAdding(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">จัดการ Onboarding Checklist</h2>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มขั้นตอน
        </button>
      </div>

      {adding && (
        <div className="bg-white rounded-xl border border-primary-200 p-4 space-y-3">
          <input
            value={newStep.title}
            onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
            placeholder="ชื่อขั้นตอน"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <textarea
            value={newStep.description}
            onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
            placeholder="คำอธิบาย"
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          <select
            value={newStep.document_id}
            onChange={(e) => setNewStep({ ...newStep, document_id: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">เลือกเอกสารที่เชื่อมโยง (ไม่บังคับ)</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newStep.title.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
            >
              เพิ่ม
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sortedSteps.map((step, index) => (
          <div
            key={step.id}
            className={`bg-white rounded-xl border p-4 flex items-center gap-3 ${
              step.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'
            }`}
          >
            <GripVertical className="w-5 h-5 text-slate-300 shrink-0 cursor-grab" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">
                  {index + 1}
                </span>
                <h3 className="font-medium text-slate-900 text-sm">{step.title}</h3>
              </div>
              {step.description && (
                <p className="text-xs text-slate-500 mt-1">{step.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onUpdate(step.id, { is_active: !step.is_active })}
                className={`px-2 py-1 rounded text-xs ${
                  step.is_active
                    ? 'bg-green-50 text-green-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {step.is_active ? 'Active' : 'Hidden'}
              </button>
              <button
                onClick={() => {
                  if (confirm('ต้องการลบขั้นตอนนี้?')) onDelete(step.id)
                }}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardTab({ documents, categories }) {
  const totalFiles = documents.length
  const thisWeek = documents.filter((d) => {
    const date = new Date(d.created_at)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return date >= weekAgo
  }).length

  const byCategoryCount = categories.map((cat) => ({
    ...cat,
    count: documents.filter((d) => d.category_id === cat.id).length,
  })).sort((a, b) => b.count - a.count)

  const byTypeCount = {}
  documents.forEach((d) => {
    byTypeCount[d.file_type] = (byTypeCount[d.file_type] || 0) + 1
  })

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-slate-900">{totalFiles}</p>
          <p className="text-sm text-slate-500">เอกสารทั้งหมด</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-green-600">{thisWeek}</p>
          <p className="text-sm text-slate-500">เพิ่มสัปดาห์นี้</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-primary-600">{categories.length}</p>
          <p className="text-sm text-slate-500">หมวดหมู่</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-orange-600">{Object.keys(byTypeCount).length}</p>
          <p className="text-sm text-slate-500">ประเภทไฟล์</p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-4">จำนวนเอกสารตามหมวดหมู่</h3>
        <div className="space-y-3">
          {byCategoryCount.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3">
              <span className="text-sm text-slate-700 w-40 shrink-0 truncate">{cat.name}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full rounded-full ${cat.color} transition-all`}
                  style={{ width: `${totalFiles > 0 ? (cat.count / totalFiles) * 100 : 0}%`, minWidth: cat.count > 0 ? '20px' : '0' }}
                />
              </div>
              <span className="text-sm font-medium text-slate-600 w-8 text-right">{cat.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* File types */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-4">ประเภทไฟล์</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(byTypeCount).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-700">{type}</span>
              <span className="text-sm font-semibold text-slate-900">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
