import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertCircle, Star, Tag, Copy, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  bookmark: Star,
  tag: Tag,
  copy: Copy,
}

const COLORS = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  bookmark: 'bg-amber-50 border-amber-200 text-amber-800',
  tag: 'bg-violet-50 border-violet-200 text-violet-800',
  copy: 'bg-blue-50 border-blue-200 text-blue-800',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success', duration = 2500) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] || ICONS.success
          const color = COLORS[toast.type] || COLORS.success
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg text-sm font-medium animate-[slideUp_0.3s_ease-out] ${color}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{toast.message}</span>
              <button onClick={() => dismissToast(toast.id)} className="ml-1 opacity-50 hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
