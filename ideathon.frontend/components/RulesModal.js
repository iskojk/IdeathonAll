import { useState } from 'react';

export default function RulesModal({ isOpen, onClose, onAccept }) {
  const [isAccepted, setIsAccepted] = useState(false);

  const handleAccept = () => {
    if (isAccepted) {
      onAccept();
      onClose();
      setIsAccepted(false);
    }
  };

  const handleClose = () => {
    onClose();
    setIsAccepted(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div className="modal-content" style={{
        background: 'white',
        borderRadius: '16px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        animation: 'modalSlideIn 0.3s ease-out'
      }}>
        {/* Modal Header */}
        <div className="modal-header" style={{
          padding: '24px 32px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #042070 0%, #0092f3 100%)',
          color: 'white'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            textAlign: 'center',
            fontFamily: 'var(--primary-font, inherit)'
          }}>
            EMLAK KONUT IDEATHON ETKINLIK KURALLARI
          </h3>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{
          padding: '24px 32px',
          maxHeight: 'calc(90vh - 200px)',
          overflowY: 'auto',
          lineHeight: '1.6'
        }}>
          <div className="rules-content" style={{ fontSize: '14px', color: '#374151' }}>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: '#042070', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                GENEL KURALLAR
              </h4>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Emlak Konut Ideathon&#39;a katılım gönüllülük esasına dayanır.</li>
                <li>Katılımcılar en az 18 yaşında olmalıdır.</li>
                <li>Katılım ekip halinde (maksimum 5 kişi) gerçekleştirilebilir.</li>
                <li>Etkinlik dili Türkçe&#39;dir.</li>
              </ul>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: '#042070', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                DEĞERLENDİRME VE ÖDÜLLENDİRME
              </h4>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Fikirler jüri tarafından inovasyon, uygulanabilirlik, sürdürülebilirlik ve etki potansiyeli açısından değerlendirilir.</li>
                <li>Jüri kararları kesindir ve itiraz edilemez.</li>
                <li>Ödüller nakdi veya ayni olabilir ve Emlak Konut tarafından belirlenir.</li>
                <li>Ödüller devredilemez, nakde çevrilemez veya değiştirilemez.</li>
              </ul>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: '#042070', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                FIKRI MÜLKİYET HAKLARI
              </h4>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Geliştirilen tüm fikirler Emlak Konut&#39;a aittir.</li>
                <li>Katılımcılar, fikirlerinin özgün olduğunu taahhüt eder.</li>
                <li>Üçüncü kişilerin haklarına tecavüz eden fikirler diskalifiye edilir.</li>
              </ul>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: '#042070', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                KATILIMCI YÜKÜMLÜLÜKLERİ
              </h4>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Katılımcılar etkinliğe etik kurallar çerçevesinde katılmakla yükümlüdür.</li>
                <li>Hile, etik ihlal veya etkinlik düzenini bozucu davranışlarda bulunan katılımcılar diskalifiye edilir.</li>
                <li>Katılımcılar, etkinlik sırasında çekilen görsel ve işitsel kayıtların Emlak Konut tarafından kullanılmasını kabul eder.</li>
                <li>Etkinlik süresince verilen talimatlara uyulması zorunludur.</li>
              </ul>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: '#042070', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                İLETİŞİM VE BİLDİRİM
              </h4>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Tüm duyurular resmi web sitesi üzerinden yapılır.</li>
                <li>Katılımcıların iletişim bilgilerini güncel tutması zorunludur.</li>
                <li>Önemli değişiklikler katılımcılara önceden bildirilir.</li>
              </ul>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: '#042070', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                İPTAL VE DEĞİŞİKLİK HAKKI
              </h4>
              <p>Emlak Konut, mücbir sebepler (doğal afet, teknik sorun vb.) nedeniyle etkinliği iptal etme, erteleme veya kapsamını değiştirme hakkına sahiptir. Bu durumda katılımcılara önceden bilgi verilir ve gerekirse katılım ücretleri iade edilir.</p>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{
          padding: '24px 32px',
          borderTop: '1px solid #e5e7eb',
          background: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Acceptance Checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <input
              type="checkbox"
              id="acceptRules"
              checked={isAccepted}
              onChange={(e) => setIsAccepted(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: '#0092f3'
              }}
            />
            <label htmlFor="acceptRules" style={{
              margin: 0,
              fontSize: '14px',
              color: '#374151',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              Etkinlik kurallarını okudum, anladım ve kabul ediyorum.
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={handleClose}
              style={{
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                background: 'white',
                color: '#374151',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#f9fafb';
                e.target.style.borderColor = '#9ca3af';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'white';
                e.target.style.borderColor = '#d1d5db';
              }}
            >
              Vazgeç
            </button>
            <button
              onClick={handleAccept}
              disabled={!isAccepted}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: isAccepted ? 'linear-gradient(135deg, #042070 0%, #0092f3 100%)' : '#d1d5db',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isAccepted ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                opacity: isAccepted ? '1' : '0.6'
              }}
            >
              Okudum, Anladım ve Kabul Ediyorum
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 768px) {
          .modal-content {
            margin: 20px;
            max-height: 95vh;
          }
          .modal-header, .modal-body, .modal-footer {
            padding: 16px 20px !important;
          }
          .modal-footer {
            flex-direction: column !important;
          }
          .modal-footer > div:last-child {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}
