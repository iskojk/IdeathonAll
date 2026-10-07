/**
 * Skeleton Loading Components
 * Yükleme durumları için
 */

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-header">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-info">
          <div className="skeleton-line skeleton-title"></div>
          <div className="skeleton-line skeleton-subtitle"></div>
        </div>
      </div>
      <div className="skeleton-body">
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line short"></div>
      </div>
      <div className="skeleton-tags">
        <div className="skeleton-tag"></div>
        <div className="skeleton-tag"></div>
        <div className="skeleton-tag"></div>
      </div>
      <div className="skeleton-footer">
        <div className="skeleton-button"></div>
      </div>
      <style jsx>{`
        .skeleton-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
          border: 1px solid #f3f4f6;
        }
        .skeleton-header {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 18px;
        }
        .skeleton-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .skeleton-info {
          flex: 1;
        }
        .skeleton-line {
          height: 14px;
          border-radius: 7px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          margin-bottom: 8px;
        }
        .skeleton-title {
          width: 60%;
          height: 18px;
        }
        .skeleton-subtitle {
          width: 40%;
          height: 14px;
        }
        .skeleton-body {
          margin-bottom: 16px;
        }
        .skeleton-line.short {
          width: 70%;
        }
        .skeleton-tags {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
        }
        .skeleton-tag {
          width: 70px;
          height: 28px;
          border-radius: 999px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .skeleton-footer {
          display: flex;
          gap: 10px;
        }
        .skeleton-button {
          flex: 1;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function SkeletonMentorDetail() {
  return (
    <div className="skeleton-detail">
      <div className="skeleton-profile-card">
        <div className="skeleton-profile-header">
          <div className="skeleton-avatar-large"></div>
          <div className="skeleton-profile-info">
            <div className="skeleton-line skeleton-name"></div>
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-email"></div>
          </div>
        </div>
        <div className="skeleton-about">
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line short"></div>
        </div>
        <div className="skeleton-tags">
          <div className="skeleton-tag"></div>
          <div className="skeleton-tag"></div>
          <div className="skeleton-tag"></div>
          <div className="skeleton-tag"></div>
        </div>
      </div>

      <div className="skeleton-availability">
        <div className="skeleton-section-header">
          <div className="skeleton-line skeleton-section-title"></div>
        </div>
        <div className="skeleton-slots">
          <div className="skeleton-slot"></div>
          <div className="skeleton-slot"></div>
          <div className="skeleton-slot"></div>
        </div>
      </div>

      <style jsx>{`
        .skeleton-detail {
          width: 100%;
        }
        .skeleton-profile-card {
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
          border: 1px solid #f3f4f6;
          margin-bottom: 32px;
        }
        .skeleton-profile-header {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .skeleton-avatar-large {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          flex-shrink: 0;
        }
        .skeleton-profile-info {
          flex: 1;
        }
        .skeleton-line {
          height: 14px;
          border-radius: 7px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          margin-bottom: 10px;
        }
        .skeleton-name {
          width: 50%;
          height: 28px;
        }
        .skeleton-title {
          width: 30%;
          height: 16px;
        }
        .skeleton-email {
          width: 40%;
          height: 14px;
        }
        .skeleton-about {
          margin-bottom: 20px;
        }
        .skeleton-line.short {
          width: 60%;
        }
        .skeleton-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .skeleton-tag {
          width: 90px;
          height: 32px;
          border-radius: 999px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .skeleton-availability {
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
          border: 1px solid #f3f4f6;
        }
        .skeleton-section-header {
          margin-bottom: 28px;
        }
        .skeleton-section-title {
          width: 200px;
          height: 24px;
        }
        .skeleton-slots {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }
        .skeleton-slot {
          height: 160px;
          border-radius: 16px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (max-width: 768px) {
          .skeleton-profile-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .skeleton-profile-info {
            width: 100%;
          }
          .skeleton-name, .skeleton-title, .skeleton-email {
            margin-left: auto;
            margin-right: auto;
          }
        }
      `}</style>
    </div>
  );
}

export function SkeletonMeetingCard() {
  return (
    <div className="skeleton-meeting-card">
      <div className="skeleton-meeting-header">
        <div className="skeleton-meeting-info">
          <div className="skeleton-line skeleton-meeting-title"></div>
          <div className="skeleton-line skeleton-meeting-subtitle"></div>
        </div>
        <div className="skeleton-badge"></div>
      </div>
      <div className="skeleton-meeting-body">
        <div className="skeleton-line"></div>
        <div className="skeleton-line short"></div>
      </div>
      <div className="skeleton-meeting-actions">
        <div className="skeleton-action-btn"></div>
        <div className="skeleton-action-btn"></div>
      </div>
      <style jsx>{`
        .skeleton-meeting-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
          border: 1px solid #f3f4f6;
        }
        .skeleton-meeting-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }
        .skeleton-meeting-info {
          flex: 1;
        }
        .skeleton-line {
          height: 14px;
          border-radius: 7px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          margin-bottom: 8px;
        }
        .skeleton-meeting-title {
          width: 40%;
          height: 18px;
        }
        .skeleton-meeting-subtitle {
          width: 30%;
          height: 12px;
        }
        .skeleton-badge {
          width: 80px;
          height: 28px;
          border-radius: 999px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .skeleton-meeting-body {
          margin-bottom: 18px;
        }
        .skeleton-line.short {
          width: 50%;
        }
        .skeleton-meeting-actions {
          display: flex;
          gap: 10px;
        }
        .skeleton-action-btn {
          width: 100px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export default { SkeletonCard, SkeletonMentorDetail, SkeletonMeetingCard };














