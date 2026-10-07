export default function ProgramsSectionIzmir() {
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
            <h2 className="alt-font text-dark-gray fw-700 mb-15px">
              Emlak Konut Ideathon&ndash;İzmir
              <br />
              Odak Alanımız
            </h2>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="unified-program-cards izmir-programs-grid">

              {/* 1. Enerji Verimli Bina Teknolojileri */}
              <div className="unified-card site-management-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-building-gear"></i>
                  </div>
                  <h3 className="unified-program-title">Enerji Verimli Bina Teknolojileri</h3>
                  <div className="unified-program-description">Akıllı Yapı Tasarımı ve Enerji Optimizasyonu</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>Yüksek yalıtım performansına sahip yeni nesil yapı çözümleri</li>
                        <li>Pasif bina tasarımı ile enerji tüketimini azaltan mimari yaklaşımlar</li>
                        <li>Düşük enerji tüketimli yapı malzemeleri ve sistemleri</li>
                        <li>Yapay zekâ destekli bina enerji performans analizleri</li>
                        <li>Akıllı sensörler ile enerji kayıp noktalarının tespiti</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Bina Entegre Yenilenebilir Enerji Sistemleri */}
              <div className="unified-card security-access-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-sun"></i>
                  </div>
                  <h3 className="unified-program-title">Bina Entegre Yenilenebilir Enerji Sistemleri</h3>
                  <div className="unified-program-description">Yerinde Enerji Üretimi ve Depolama Teknolojileri</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>Binalara entegre güneş enerjisi (BIPV) çözümleri</li>
                        <li>Rüzgâr ve hibrit yenilenebilir enerji sistemleri</li>
                        <li>Enerji depolama ve batarya yönetim teknolojileri</li>
                        <li>Yerinde enerji üretimi ile enerji maliyet optimizasyonu</li>
                        <li>Akıllı enerji üretim–tüketim dengeleme sistemleri</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Elektrikli Araç Şarj ve Enerji Entegrasyonu */}
              <div className="unified-card predictive-maintenance-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-ev-front"></i>
                  </div>
                  <h3 className="unified-program-title">Elektrikli Araç Şarj ve Enerji Entegrasyonu</h3>
                  <div className="unified-program-description">Akıllı Şarj Altyapısı ve Enerji Yönetimi</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>Akıllı ve hızlı elektrikli araç şarj istasyonları</li>
                        <li>Bina–araç enerji entegrasyonu (Vehicle-to-Building / V2B)</li>
                        <li>Dinamik enerji yönetimi ile şarj optimizasyonu</li>
                        <li>Site ve konut projeleri için entegre şarj altyapısı</li>
                        <li>Şarj altyapısında enerji tüketimi ve maliyet analitiği</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Sürdürülebilir Enerji ve Kaynak Yönetimi */}
              <div className="unified-card energy-sustainability-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-recycle"></i>
                  </div>
                  <h3 className="unified-program-title">Sürdürülebilir Enerji ve Kaynak Yönetimi</h3>
                  <div className="unified-program-description">Döngüsel Kaynak Yönetimi Platformları</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>Binalarda enerji, su ve atık yönetimi sistemleri</li>
                        <li>Karbon ayak izi ölçüm ve azaltım çözümleri</li>
                        <li>Döngüsel ekonomi temelli kaynak yönetimi teknolojileri</li>
                        <li>Su tüketimi ve geri kazanım sistemleri</li>
                        <li>Sürdürülebilir yaşam alanları için veri tabanlı yönetim</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Dijital Enerji Yönetimi ve Veri Analitiği */}
              <div className="unified-card data-platform-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-cpu"></i>
                  </div>
                  <h3 className="unified-program-title">Dijital Enerji Yönetimi ve Veri Analitiği</h3>
                  <div className="unified-program-description">IoT ve Yapay Zekâ Destekli Enerji Platformları</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>IoT sensörleri ile gerçek zamanlı enerji izleme sistemleri</li>
                        <li>Yapay zekâ ile enerji tüketim tahmini ve optimizasyonu</li>
                        <li>Enerji verimliliği için veri analitiği ve karar destek sistemleri</li>
                        <li>Akıllı bina yönetim platformları</li>
                        <li>Enerji tüketimi için merkezi kontrol panelleri</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Akıllı Enerji Altyapıları ve Enerji Paylaşım Sistemleri */}
              <div className="unified-card mobile-community-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-lightning-charge"></i>
                  </div>
                  <h3 className="unified-program-title">Akıllı Enerji Altyapıları ve Enerji Paylaşım Sistemleri</h3>
                  <div className="unified-program-description">Mikro Şebeke ve Dağıtık Enerji Ekosistemleri</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>Mikro şebeke (microgrid) ve yerel enerji yönetim sistemleri</li>
                        <li>Binalar arası enerji paylaşımı ve topluluk enerjisi modelleri</li>
                        <li>Akıllı şebeke (smart grid) entegrasyonu ve enerji dengeleme</li>
                        <li>Peer-to-peer enerji ticareti ve blokzincir tabanlı enerji platformları</li>
                        <li>Enerji üretimi, depolama ve tüketimin entegre yönetimi</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .izmir-programs-grid {
          display: flex !important;
          flex-wrap: wrap;
          justify-content: center;
          gap: 30px;
          padding: 0;
          margin: 60px 0;
        }
        .izmir-programs-grid :global(.unified-card) {
          width: calc(33.333% - 20px);
          flex-shrink: 0;
        }
        @media (max-width: 1200px) {
          .izmir-programs-grid :global(.unified-card) {
            width: calc(50% - 15px);
          }
        }
        @media (max-width: 768px) {
          .izmir-programs-grid {
            gap: 20px;
            margin: 40px 0;
          }
          .izmir-programs-grid :global(.unified-card) {
            width: 100%;
          }
        }
      `}</style>
    </section>
  )
}
