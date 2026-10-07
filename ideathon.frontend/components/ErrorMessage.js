/**
 * Error Message Component
 * Hata mesajları göstermek için
 */

export default function ErrorMessage({ message, onClose, type = 'error' }) {
  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'bi-check-circle-fill';
      case 'warning':
        return 'bi-exclamation-triangle-fill';
      case 'info':
        return 'bi-info-circle-fill';
      default:
        return 'bi-x-circle-fill';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#ef4444';
    }
  };

  return (
    <div className="error-message">
      <div className="error-content">
        <i className={`bi ${getIcon()}`}></i>
        <span className="error-text">{message}</span>
      </div>
      {onClose && (
        <button className="error-close" onClick={onClose} aria-label="Kapat">
          <i className="bi bi-x"></i>
        </button>
      )}
      <style jsx>{`
        .error-message {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-radius: 10px;
          background: ${getColor()}15;
          border: 1px solid ${getColor()}40;
          margin-bottom: 20px;
          animation: slideIn 0.3s ease-out;
        }
        .error-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        .error-content i {
          color: ${getColor()};
          font-size: 20px;
          flex-shrink: 0;
        }
        .error-text {
          color: #333;
          font-size: 14px;
          line-height: 1.5;
        }
        .error-close {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #666;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
          margin-left: 12px;
        }
        .error-close:hover {
          color: #333;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}







