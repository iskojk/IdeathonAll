/**
 * Loading Component
 * Yükleme animasyonu
 */

export default function Loading({ fullScreen = false, message = 'Yükleniyor...' }) {
  if (fullScreen) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-message">{message}</p>
        </div>
        <style jsx>{`
          .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          }
          .loading-content {
            text-align: center;
          }
          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #2563eb;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          .loading-message {
            color: #333;
            font-size: 16px;
            font-weight: 500;
            margin: 0;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="loading-inline">
      <div className="loading-spinner-small"></div>
      <span className="loading-text">{message}</span>
      <style jsx>{`
        .loading-inline {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        .loading-spinner-small {
          width: 24px;
          height: 24px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 12px;
        }
        .loading-text {
          color: #666;
          font-size: 14px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}







