import Link from 'next/link'

export default function ProgramsSection() {
  return (
    <section id="programs" className="py-100px md-py-80px sm-py-60px">
      <div className="container">
        <div className="row">
          <div className="col-12 text-center mb-50px">
            <span
              className="ps-20px pe-20px pt-5px pb-5px mb-20px text-uppercase alt-font text-primary-blue fs-12 lh-26 fw-600 border-radius-100px bg-primary-blue-light d-inline-flex"

            >
              <i className="bi bi-rocket fs-30 me-5px"></i>
            </span>
            <h2
              className="alt-font text-dark-gray fw-700 mb-15px"

            >
              Emlak Konut Ideathon-1
              <br />
              Odak Alanımız
            </h2>
      
          
          </div>
        </div>

        {/* Unified Responsive Program Cards */}
        <div
          className="row"

        >
          <div className="col-12">
            <div className="unified-program-cards">

              {/* Site Yönetiminin Dijitalleşmesi */}
              <div className="unified-card site-management-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-display"></i>
                  </div>
                  <h3 className="unified-program-title">Site Yönetiminin Dijitalleşmesi</h3>
                  <div className="unified-program-description">Akıllı Yönetim Platformları</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>Dijital yönetim panelleri ve mobil yönetici konsolları</li>
                        <li>Aidat, duyuru, bakım ve hizmet süreçlerinin dijitalleştirilmesi</li>
                        <li>Şikâyet ve talep süreçlerinin anlık takibi</li>
                        <li>Site Yönetimi iletişiminin dijitalleştirilmesi</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobil Yaşam ve Topluluk */}
              <div className="unified-card mobile-community-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-phone"></i>
                  </div>
                  <h3 className="unified-program-title">Mobil Yaşam ve Topluluk</h3>
                  <div className="unified-program-description">Dijital Topluluk Deneyimi</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>Mobil uygulama tabanlı topluluk iletişim platformları</li>
                        <li>Ortak alan rezervasyon ve etkinlik planlama modülleri</li>
                        <li>Komşuluk ekonomisi (paylaşım, takas, ortak kullanım) çözümleri</li>
                        <li>Topluluk yönetimi ve saha iletişim araçları</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Güvenlik ve Erişim Yönetimi */}
              <div className="unified-card security-access-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <h3 className="unified-program-title">Güvenlik ve Erişim Yönetimi</h3>
                  <div className="unified-program-description">Akıllı Güvenlik Sistemleri</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>Akıllı kart, QR, plaka tanıma ve biyometrik erişim sistemleri</li>
                        <li>Misafir, kargo ve hizmet sağlayıcı giriş süreçlerinin kontrolü</li>
                        <li>Güvenlik kameraları ve sensörler ile entegre yönetim paneli</li>
                        <li>Acil durum iletişim sistemleri</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prediktif Bakım ve Saha Operasyonları */}
              <div className="unified-card predictive-maintenance-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-gear"></i>
                  </div>
                  <h3 className="unified-program-title">Prediktif Bakım ve Saha Operasyonları</h3>
                  <div className="unified-program-description">Akıllı Bakım Sistemleri</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>BMS tabanlı sensör, ekipman ve cihazların durum izleme süreçleri</li>
                        <li>Arıza ve bakım ihtiyaçları için erken uyarı modelleri</li>
                        <li>İş emri planlama, saha ekibi koordinasyonu ve rota optimizasyonu</li>
                        <li>Operasyon süreçlerinin mobil yönetimi</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enerji Verimliliği ve Sürdürülebilirlik */}
              <div className="unified-card energy-sustainability-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-lightning"></i>
                  </div>
                  <h3 className="unified-program-title">Enerji Verimliliği ve Sürdürülebilirlik</h3>
                  <div className="unified-program-description">Yeşil Teknoloji Çözümleri</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>Ortak alan enerji tüketim analiz sistemleri</li>
                        <li>Aydınlatma, ısıtma-soğutma otomasyon çözümleri</li>
                        <li>Su tüketiminin izlenmesi ve geri kazanım uygulamaları</li>
                        <li>Karbon ayak izini azaltan düşük tüketimli yapı teknolojileri</li>
                        <li>Atık yönetimi ve geri kazanım çözümleri</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Veri Platformu ve Entegrasyonlar */}
              <div className="unified-card data-platform-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-database"></i>
                  </div>
                  <h3 className="unified-program-title">Veri Platformu ve Entegrasyonlar</h3>
                  <div className="unified-program-description">Akıllı Veri Yönetimi</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>Tüm yönetim süreçlerinin tek platformda merkezi izlenmesi</li>
                        <li>IoT sensör ağları ve otomasyon sistemlerinin veri gölü entegrasyonu</li>
                        <li>KPI, SLA, analitik tablo, dashboard ve karar destek modelleri</li>
                        <li>ERP, CRM ve saha operasyon yazılımlarıyla entegrasyon</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
       {/*  <div
          className="row mt-50px"

        >
          <div className="col-12 text-center">
            <div
              className="bg-gradient-primary-blue border-radius-20px p-40px md-p-30px box-shadow-large"

            >
              <h4
                className="alt-font text-white fw-700 mb-15px"

              >
                Şimdi Başvuru Yap
              </h4>
              <p
                className="text-white opacity-9 mb-30px lh-28"

              >
                Emlak Konut Ideathon-1 ile toplu yaşam alanlarının geleceğini birlikte şekillendirelim.
              </p>
              <Link
                href="/basvuru"
                className="btn btn-large btn-white btn-rounded text-transform-none"

              >
                <span className="btn-double-text" data-text="Başvur Yap">Başvur Yap</span>
              </Link>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  )
}

