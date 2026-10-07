/**
 * Toast Notification Component
 * Başarılı/Hata mesajları için
 */

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

let toastId = 0
const toastQueue = []
let setToastsGlobal = null

export const toast = {
  success: (message, duration = 4000) => {
    showToast(message, 'success', duration)
  },
  error: (message, duration = 5000) => {
    showToast(message, 'error', duration)
  },
  info: (message, duration = 3000) => {
    showToast(message, 'info', duration)
  },
  warning: (message, duration = 4000) => {
    showToast(message, 'warning', duration)
  },
}

function showToast(message, type, duration) {
  const id = toastId++
  const newToast = { id, message, type, duration }
  
  if (setToastsGlobal) {
    setToastsGlobal(prev => [...prev, newToast])
  } else {
    toastQueue.push(newToast)
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setToastsGlobal = setToasts
    
    // Queue'daki toast'ları göster
    if (toastQueue.length > 0) {
      setToasts(toastQueue.splice(0))
    }

    // 401 Unauthorized event listener
    const handleUnauthorized = (event) => {
      const message = event.detail?.message || 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.'
      toast.warning(message, 4000)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    
    return () => {
      setToastsGlobal = null
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [])

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  useEffect(() => {
    toasts.forEach(toast => {
      const timer = setTimeout(() => {
        removeToast(toast.id)
      }, toast.duration)
      
      return () => clearTimeout(timer)
    })
  }, [toasts])

  if (!mounted) return null

  return createPortal(
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          <div className="toast-icon">
            {toast.type === 'success' && <i className="bi bi-check-circle-fill"></i>}
            {toast.type === 'error' && <i className="bi bi-x-circle-fill"></i>}
            {toast.type === 'warning' && <i className="bi bi-exclamation-triangle-fill"></i>}
            {toast.type === 'info' && <i className="bi bi-info-circle-fill"></i>}
          </div>
          <div className="toast-message">{toast.message}</div>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>
            <i className="bi bi-x"></i>
          </button>
        </div>
      ))}

      <style jsx global>{`
        .toast-container {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          pointer-events: none;
        }

        .toast {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 320px;
          max-width: 500px;
          padding: 18px 22px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
          animation: slideIn 0.3s ease-out;
          pointer-events: all;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s, box-shadow 0.2s;
        }

        .toast:hover {
          transform: translateX(-4px) scale(1.02);
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.1);
        }

        .toast-success {
          border-left: 4px solid #10b981;
        }

        .toast-error {
          border-left: 4px solid #ef4444;
        }

        .toast-warning {
          border-left: 4px solid #f59e0b;
        }

        .toast-info {
          border-left: 4px solid #3b82f6;
        }

        .toast-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .toast-success .toast-icon {
          color: #10b981;
        }

        .toast-error .toast-icon {
          color: #ef4444;
        }

        .toast-warning .toast-icon {
          color: #f59e0b;
        }

        .toast-info .toast-icon {
          color: #3b82f6;
        }

        .toast-message {
          flex: 1;
          font-size: 15px;
          line-height: 1.5;
          color: #111827;
          font-weight: 600;
        }

        .toast-close {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: color 0.2s;
          flex-shrink: 0;
        }

        .toast-close:hover {
          color: #4b5563;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (max-width: 640px) {
          .toast-container {
            right: 10px;
            left: 10px;
            top: 70px;
          }

          .toast {
            min-width: auto;
            width: 100%;
          }
        }
      `}</style>
    </div>,
    document.body
  )
}







