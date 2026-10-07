/**
 * Inline Notification Component
 * Sayfa içi bildirimler için
 */

import { useState, useEffect, useCallback } from 'react';

// Global notification state
let notificationId = 0;
let addNotificationGlobal = null;

export const notify = {
  success: (message) => {
    if (addNotificationGlobal) {
      addNotificationGlobal({ id: ++notificationId, type: 'success', message });
    }
  },
  error: (message) => {
    if (addNotificationGlobal) {
      addNotificationGlobal({ id: ++notificationId, type: 'error', message });
    }
  },
  warning: (message) => {
    if (addNotificationGlobal) {
      addNotificationGlobal({ id: ++notificationId, type: 'warning', message });
    }
  },
  info: (message) => {
    if (addNotificationGlobal) {
      addNotificationGlobal({ id: ++notificationId, type: 'info', message });
    }
  },
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [...prev, notification]);
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    addNotificationGlobal = addNotification;
    return () => {
      addNotificationGlobal = null;
    };
  }, [addNotification]);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return 'bi-check-circle-fill';
      case 'error': return 'bi-x-circle-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      case 'info': return 'bi-info-circle-fill';
      default: return 'bi-info-circle-fill';
    }
  };

  return (
    <>
      {children}
      {notifications.length > 0 && (
        <div className="notification-container">
          {notifications.map((n) => (
            <div key={n.id} className={`notification notification-${n.type}`}>
              <i className={`bi ${getIcon(n.type)}`}></i>
              <span>{n.message}</span>
              <button onClick={() => removeNotification(n.id)} className="notification-close">
                <i className="bi bi-x"></i>
              </button>
            </div>
          ))}
        </div>
      )}
      <style jsx global>{`
        .notification-container {
          position: fixed;
          top: 100px;
          right: 24px;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 400px;
        }
        .notification {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: white;
          border-radius: 14px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          animation: notifySlideIn 0.3s ease-out;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }
        .notification i:first-child {
          font-size: 20px;
          flex-shrink: 0;
        }
        .notification span {
          flex: 1;
          line-height: 1.4;
        }
        .notification-close {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #9ca3af;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .notification-close:hover {
          color: #374151;
        }
        .notification-success {
          border-left: 4px solid #10b981;
        }
        .notification-success i:first-child {
          color: #10b981;
        }
        .notification-error {
          border-left: 4px solid #ef4444;
        }
        .notification-error i:first-child {
          color: #ef4444;
        }
        .notification-warning {
          border-left: 4px solid #f59e0b;
        }
        .notification-warning i:first-child {
          color: #f59e0b;
        }
        .notification-info {
          border-left: 4px solid #3b82f6;
        }
        .notification-info i:first-child {
          color: #3b82f6;
        }
        @keyframes notifySlideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @media (max-width: 480px) {
          .notification-container {
            right: 12px;
            left: 12px;
            max-width: none;
          }
        }
      `}</style>
    </>
  );
}

export default NotificationProvider;














