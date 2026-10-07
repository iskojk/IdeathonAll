import { useState } from 'react';

export default function KvkkModal({ isOpen, onClose, onAccept }) {
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
            KVKK AYDINLATMA METNİ
          </h3>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '16px',
            fontWeight: '400',
            textAlign: 'center',
            opacity: '0.9'
          }}>
            Kişisel Verilerin İşlenmesi ve Korunması Hakkında
          </p>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{
          padding: '24px 32px',
          maxHeight: 'calc(90vh - 200px)',
          overflowY: 'auto',
          lineHeight: '1.6'
        }}>
          <div className="kvkk-content" style={{ fontSize: '14px', color: '#374151' }}>

            <div style={{ marginBottom: '20px' }}>
              <p>Kişisel verilerin işlenmesinde başta özel hayatın gizliliği olmak üzere kişilerin temel hak ve özgürlüklerini korumak ve kişisel verileri işleyen gerçek ve tüzel kişilerin yükümlülükleri belirlemek amacıyla 7 Nisan 2016 tarihli ve 29677 Sayılı Resmî Gazete'de yayımlanan 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") hususunda Emlak Konut Gayrimenkul Yatırım Ortaklığı A.Ş. olarak Veri Sorumlusu sıfatıyla Kanun'un "Veri Sorumlusunun Aydınlatma Yükümlülüğü" başlıklı 10. maddesi uyarınca sizleri bilgilendirmek isteriz.</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#042070', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                VERİ SORUMLUSU VE TEMSİLCİSİ
              </h4>
              <p>Kanun uyarınca "Barbaros Mah. Mor Sümbül Sok. No:7/2 B (Batı Ataşehir) Ataşehir - İstanbul" adresinde faaliyet gösteren "Emlak Konut Gayrimenkul Yatırım Ortaklığı A.Ş." (Bundan böyle kısaca "Şirket" veya "Emlak Konut" olarak anılacaktır.) Veri Sorumlusudur.</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#042070', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                İŞLENEN KİŞİSEL VERİLERİNİZ
              </h4>
              <p>Şirketimizin ürünlerinden ve hizmetlerinden faydalanmanız kapsamında aşağıda yer verilen kişisel verileriniz işlenmektedir:</p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li><strong>Kimlik Bilgileriniz:</strong> adınız, soyadınız, T.C. kimlik numaranız, doğum tarihiniz, anne-baba adınız, cinsiyetiniz</li>
                <li><strong>İletişim Bilgileriniz:</strong> adresiniz, cep telefonunuz, elektronik posta adresiniz</li>
                <li><strong>Finansal Verileriniz:</strong> banka hesap numaranız, IBAN numaranız, ödeme bilgileriniz</li>
                <li><strong>Müşteri İşlem:</strong> çağrı merkezi kayıtları, fatura bilgileri, sipariş bilgisi, talep bilgisi</li>
                <li><strong>Görsel İşitsel Kayıtlar:</strong> etkinlik sırasında çekilen fotoğraflar ve videolar</li>
                <li><strong>İşlem Güvenliği:</strong> web sitesi gezinme bilgileri, IP adresi, giriş/çıkış bilgileri</li>
              </ul>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#042070', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                KİŞİSEL VERİLERİN İŞLENME AMACI
              </h4>
              <p>Kişisel verileriniz, Emlak Konut olarak sunduğumuz hizmetlerden yararlanabilmeniz amacıyla KVKK ve ilgili mevzuatta düzenlenen temel prensiplere uygun olarak işlenmektedir.</p>
              <p style={{ marginTop: '8px' }}>Kişisel verileriniz aşağıdaki amaçlarla işlenir:</p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li>Mal/hizmet satış süreçlerinin yürütülmesi</li>
                <li>Müşteri ilişkileri yönetimi</li>
                <li>Müşteri memnuniyetine yönelik aktiviteler</li>
                <li>Talep/şikayetlerin takibi</li>
                <li>Ticari elektronik ileti gönderimi (onaylı ise)</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                <li>Hukuki süreçlerin yönetilmesi</li>
              </ul>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#042070', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                KİŞİSEL VERİLERİN TOPLANMA YÖNTEMİ
              </h4>
              <p>Kişisel verileriniz; internet siteleri, satış birimleri, telefon görüşmeleri, başvuru formları ve sözleşmeler vasıtasıyla sözlü, yazılı veya elektronik ortamda toplanmaktadır.</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#042070', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                VERİLERİN AKTARILDIĞI TARAFLAR
              </h4>
              <p>Kişisel verileriniz; iş ortaklarımız, sigorta şirketleri, bankalar, kamu kurumları ve hizmet sağlayıcılarımıza aktarılabilmektedir.</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#042070', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                KİŞİSEL VERİSİ İŞLENEN İLGİLİ KİŞİNİN HAKLARI
              </h4>
              <p>KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li>Kişisel veri işlenip işlenmediğini öğrenme</li>
                <li>Kişisel verilerin işlenme amacını öğrenme</li>
                <li>Yurt içi/dışında aktarıldığı üçüncü kişileri bilme</li>
                <li>Kişisel verilerin düzeltilmesini isteme</li>
                <li>Kişisel verilerin silinmesini/yok edilmesini isteme</li>
                <li>Kanuna aykırı işlenme halinde zararın giderilmesini isteme</li>
              </ul>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#042070', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                İLETİŞİM BİLGİLERİ
              </h4>
              <p>Haklarınızı kullanmak için:</p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                <li><strong>E-posta:</strong> info@emlakkonut.com.tr</li>
                <li><strong>KEP:</strong> emlakkonut@hs01.kep.tr</li>
                <li><strong>Adres:</strong> Barbaros Mah. Mor Sümbül Sok. No:7/2 B (Batı Ataşehir) Ataşehir - İstanbul</li>
              </ul>
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
              id="acceptKvkk"
              checked={isAccepted}
              onChange={(e) => setIsAccepted(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: '#0092f3'
              }}
            />
            <label htmlFor="acceptKvkk" style={{
              margin: 0,
              fontSize: '14px',
              color: '#374151',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              KVKK Aydınlatma Metni'ni okudum, anladım ve kişisel verilerimin işlenmesine onay veriyorum.
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
              Okudum, Anladım ve Onaylıyorum
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
