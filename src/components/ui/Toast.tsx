import { CheckCircle2, X, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error'
type ToastItem = { id: number; type: ToastType; message: string }
type ToastContextValue = { showToast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, type, message }])
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000)
  }, [])

  return <ToastContext.Provider value={{ showToast }}><div className="toast-region" aria-live="polite" aria-atomic="true">{toasts.map((toast) => <div className={`toast toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'} key={toast.id}>{toast.type === 'error' ? <XCircle size={19} /> : <CheckCircle2 size={19} />}<span>{toast.message}</span><button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} aria-label="Dismiss notification"><X size={15} /></button></div>)}</div>{children}</ToastContext.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
