import Head from 'next/head'
import Layout from '@/components/Layout'

export default function GizlilikPolitikasi() {
  return (
    <>
      <Head>
        <title>Gizlilik Politikası - Emlak Konut Ideathon</title>
        <meta name="description" content="Emlak Konut Ideathon platformu gizlilik politikası" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Layout>
        <section className="legal-page" style={{ marginTop: '140px' }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 col-md-10">
                <div className="legal-card">
                  <h1 className="legal-title">Gizlilik Politikası (Privacy Policy)</h1>

                  <div className="legal-section">
                    <h2>1. Giriş</h2>
                    <p>
                      Bu Gizlilik Politikası, Emlak Konut Gayrimenkul Yatırım Ortaklığı A.Ş. tarafından
                      düzenlenen ideathon programı kapsamında kullanılan dijital platformların (bundan sonra
                      &quot;Platform&quot; olarak anılacaktır) kullanımında kişisel verilerin nasıl toplandığını, işlendiğini ve
                      korunduğunu açıklamaktadır.
                    </p>
                    <p>
                      Platformu kullanarak işbu Gizlilik Politikası&apos;nda belirtilen uygulamaları kabul etmiş
                      sayılırsınız.
                    </p>
                    <p>
                      Bu politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) başta olmak üzere
                      ilgili mevzuata uygun olarak hazırlanmıştır.
                    </p>
                  </div>

                  <div className="legal-section">
                    <h2>2. Veri Sorumlusu</h2>
                    <p>Kişisel verileriniz aşağıdaki veri sorumlusu tarafından işlenmektedir:</p>
                    <div className="legal-address">
                      <p><strong>Emlak Konut Gayrimenkul Yatırım Ortaklığı A.Ş.</strong></p>
                      <p>Barbaros Mah. Mor Sümbül Sok. No:7/2 B</p>
                      <p>Ataşehir / İstanbul</p>
                      <p>Türkiye</p>
                    </div>
                  </div>

                  <div className="legal-section">
                    <h2>3. Toplanan Kişisel Veriler</h2>
                    <p>Platformu kullanmanız halinde aşağıdaki kişisel verileriniz işlenebilir:</p>

                    <h3>Kimlik Bilgileri</h3>
                    <ul>
                      <li>Ad</li>
                      <li>Soyad</li>
                      <li>Doğum tarihi (varsa)</li>
                    </ul>

                    <h3>İletişim Bilgileri</h3>
                    <ul>
                      <li>E-posta adresi</li>
                      <li>Telefon numarası</li>
                    </ul>

                    <h3>Hesap Bilgileri</h3>
                    <ul>
                      <li>Kullanıcı adı</li>
                      <li>Şifre (hashlenmiş olarak)</li>
                    </ul>

                    <h3>Başvuru Bilgileri</h3>
                    <ul>
                      <li>Eğitim durumu</li>
                      <li>Okul / Bölüm bilgileri</li>
                      <li>Deneyim ve yetkinlik alanları</li>
                      <li>Takım bilgileri</li>
                      <li>Proje ve portfolyo linkleri</li>
                    </ul>

                    <h3>Teknik Veriler</h3>
                    <ul>
                      <li>IP adresi</li>
                      <li>Tarayıcı bilgileri</li>
                      <li>Oturum verileri</li>
                    </ul>
                  </div>

                  <div className="legal-section">
                    <h2>4. Verilerin İşlenme Amaçları</h2>
                    <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
                    <ul>
                      <li>Ideathon başvurularının alınması ve değerlendirilmesi</li>
                      <li>Kullanıcı hesaplarının oluşturulması ve yönetimi</li>
                      <li>Etkinlik süreçlerinin planlanması ve yürütülmesi</li>
                      <li>Mentör eşleştirme ve toplantı organizasyonu</li>
                      <li>İletişim ve bilgilendirme faaliyetleri</li>
                      <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                    </ul>
                  </div>

                  <div className="legal-section">
                    <h2>5. Verilerin Paylaşımı</h2>
                    <p>Kişisel verileriniz aşağıdaki durumlar dışında üçüncü kişilerle paylaşılmaz:</p>
                    <ul>
                      <li>Yasal zorunluluklar kapsamında yetkili kurumlarla</li>
                      <li>Etkinlik organizasyonu için görevlendirilmiş iş ortaklarıyla</li>
                      <li>Jüri değerlendirme süreçleri kapsamında jüri üyeleriyle</li>
                    </ul>
                  </div>

                  <div className="legal-section">
                    <h2>6. Verilerin Korunması</h2>
                    <p>
                      Kişisel verilerinizin güvenliği için uygun teknik ve idari tedbirler alınmaktadır.
                      Veriler şifrelenmiş bağlantılar üzerinden iletilir ve güvenli sunucularda saklanır.
                    </p>
                  </div>

                  <div className="legal-section">
                    <h2>7. Haklarınız</h2>
                    <p>KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
                    <ul>
                      <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                      <li>İşlenmiş ise buna ilişkin bilgi talep etme</li>
                      <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                      <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
                      <li>Verilerin silinmesini veya yok edilmesini isteme</li>
                      <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                    </ul>
                  </div>

                  <div className="legal-section">
                    <h2>8. İletişim</h2>
                    <p>
                      Gizlilik politikamız ile ilgili sorularınız için{' '}
                      <a href="mailto:info@anahtarfikirler.com">info@anahtarfikirler.com</a>{' '}
                      adresinden bizimle iletişime geçebilirsiniz.
                    </p>
                  </div>

                  <div className="legal-section">
                    <h2>9. Değişiklikler</h2>
                    <p>
                      Bu gizlilik politikası gerektiğinde güncellenebilir. Güncellemeler platformda
                      yayınlandığı tarihten itibaren geçerli olur.
                    </p>
                    <p className="legal-date">Son güncelleme: Mart 2026</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>

      <style jsx>{`
        .legal-page {
          padding: 40px 0 80px;
          background: linear-gradient(180deg, #f8faff 0%, #ffffff 100%);
        }

        .legal-card {
          background: white;
          border-radius: 20px;
          padding: 48px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }

        .legal-title {
          font-family: var(--alt-font);
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
        }

        .legal-section {
          margin-bottom: 36px;
        }

        .legal-section h2 {
          font-family: var(--alt-font);
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 16px;
        }

        .legal-section h3 {
          font-size: 17px;
          font-weight: 600;
          color: #1e293b;
          margin: 20px 0 10px;
        }

        .legal-section p {
          font-size: 15px;
          line-height: 1.8;
          color: #475569;
          margin-bottom: 12px;
        }

        .legal-section ul {
          padding-left: 24px;
          margin-bottom: 16px;
        }

        .legal-section ul li {
          font-size: 15px;
          line-height: 1.8;
          color: #475569;
          margin-bottom: 4px;
        }

        .legal-section a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
        }

        .legal-section a:hover {
          text-decoration: underline;
        }

        .legal-address {
          background: #f8fafc;
          border-left: 4px solid #2563eb;
          padding: 16px 20px;
          border-radius: 0 8px 8px 0;
          margin: 12px 0;
        }

        .legal-address p {
          margin-bottom: 4px;
          color: #334155;
        }

        .legal-date {
          font-style: italic;
          color: #94a3b8 !important;
          font-size: 14px !important;
        }

        @media (max-width: 768px) {
          .legal-card {
            padding: 28px 20px;
          }

          .legal-title {
            font-size: 24px;
          }

          .legal-section h2 {
            font-size: 19px;
          }
        }
      `}</style>
    </>
  )
}
