import Head from 'next/head'
import Layout from '@/components/Layout'

export default function KullanimSartlari() {
  return (
    <>
      <Head>
        <title>Kullanım Şartları - Emlak Konut Ideathon</title>
        <meta name="description" content="Emlak Konut Ideathon platformu kullanım şartları" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Layout>
        <section className="legal-page" style={{ marginTop: '140px' }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 col-md-10">
                <div className="legal-card">
                  <h1 className="legal-title">Kullanım Şartları (Terms of Service)</h1>

                  <div className="legal-section">
                    <h2>1. Genel Hükümler</h2>
                    <p>
                      Bu Kullanım Şartları, Emlak Konut Gayrimenkul Yatırım Ortaklığı A.Ş. tarafından
                      düzenlenen ideathon etkinliklerine yönelik olarak geliştirilen dijital platformun kullanımına
                      ilişkin kuralları belirlemektedir.
                    </p>
                    <p>
                      Platformu kullanarak bu şartları kabul etmiş sayılırsınız.
                    </p>
                  </div>

                  <div className="legal-section">
                    <h2>2. Platform Amacı</h2>
                    <p>Platform aşağıdaki faaliyetler için kullanılmaktadır:</p>
                    <ul>
                      <li>Ideathon başvurularının alınması</li>
                      <li>Takım oluşturma ve yönetimi</li>
                      <li>Proje sunumu ve değerlendirme süreçleri</li>
                      <li>Mentör ve jüri etkileşimleri</li>
                    </ul>
                  </div>

                  <div className="legal-section">
                    <h2>3. Kullanıcı Hesapları</h2>
                    <p>Platforma erişim için kullanıcı hesabı oluşturulması gerekmektedir.</p>
                    <p>Kullanıcılar:</p>
                    <ul>
                      <li>Doğru ve güncel bilgi vermekle</li>
                      <li>Hesap güvenliğini korumakla</li>
                      <li>Platform kurallarına uymakla</li>
                    </ul>
                    <p>yükümlüdür.</p>
                  </div>

                  <div className="legal-section">
                    <h2>4. Yasaklı Kullanımlar</h2>
                    <p>Platform aşağıdaki amaçlarla kullanılamaz:</p>
                    <ul>
                      <li>Sahte veya yanıltıcı bilgi sunmak</li>
                      <li>Platform güvenliğini ihlal etmek</li>
                      <li>Diğer kullanıcıların haklarını ihlal etmek</li>
                      <li>Kötü amaçlı yazılım veya saldırı girişiminde bulunmak</li>
                      <li>Telif hakkı veya fikri mülkiyet haklarını ihlal eden içerik paylaşmak</li>
                      <li>Spam veya istenmeyen iletişimde bulunmak</li>
                    </ul>
                  </div>

                  <div className="legal-section">
                    <h2>5. Fikri Mülkiyet Hakları</h2>
                    <p>
                      Platformdaki tüm içerik, tasarım, logo ve markalar Emlak Konut Gayrimenkul
                      Yatırım Ortaklığı A.Ş.&apos;ye aittir.
                    </p>
                    <p>
                      Ideathon sürecinde katılımcılar tarafından geliştirilen projelere ilişkin fikri mülkiyet
                      hakları, etkinlik kuralları ve katılım sözleşmesi çerçevesinde belirlenir.
                    </p>
                  </div>

                  <div className="legal-section">
                    <h2>6. Başvuru ve Değerlendirme</h2>
                    <p>
                      Ideathon başvuruları belirtilen süre ve koşullar dahilinde kabul edilir.
                      Değerlendirme süreci jüri tarafından yürütülür. Sonuçlara itiraz hakkı
                      etkinlik kuralları çerçevesinde belirlenir.
                    </p>
                  </div>

                  <div className="legal-section">
                    <h2>7. Sorumluluk Sınırları</h2>
                    <p>
                      Platform &quot;olduğu gibi&quot; sunulmaktadır. Emlak Konut, platformun kesintisiz veya hatasız
                      çalışacağını garanti etmez. Teknik sorunlardan kaynaklanan veri kayıplarından
                      sorumlu değildir.
                    </p>
                  </div>

                  <div className="legal-section">
                    <h2>8. Hesap Askıya Alma ve Sonlandırma</h2>
                    <p>
                      Kullanım şartlarını ihlal eden hesaplar önceden bildirim yapılmaksızın
                      askıya alınabilir veya sonlandırılabilir.
                    </p>
                  </div>

                  <div className="legal-section">
                    <h2>9. Uygulanacak Hukuk</h2>
                    <p>
                      Bu kullanım şartları Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda
                      İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
                    </p>
                  </div>

                  <div className="legal-section">
                    <h2>10. Değişiklikler</h2>
                    <p>
                      Bu kullanım şartları gerektiğinde güncellenebilir. Güncellemeler platformda
                      yayınlandığı tarihten itibaren geçerli olur.
                    </p>
                    <p className="legal-date">Son güncelleme: Mart 2026</p>
                  </div>

                  <div className="legal-section">
                    <h2>11. İletişim</h2>
                    <p>
                      Kullanım şartlarıyla ilgili sorularınız için{' '}
                      <a href="mailto:info@anahtarfikirler.com">info@anahtarfikirler.com</a>{' '}
                      adresinden bizimle iletişime geçebilirsiniz.
                    </p>
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
