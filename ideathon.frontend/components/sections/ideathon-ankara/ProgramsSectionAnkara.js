export default function ProgramsSectionAnkara() {
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
              Emlak Konut Ideathon Ankara
              <br />
              Odak Alanlarımız
            </h2>
          </div>
        </div>

        {/* Unified Responsive Program Cards */}
        <div className="row">
          <div className="col-12">
            <div className="unified-program-cards ankara-programs-grid">

              {/* Akıllı Değerleme ve Yatırım Analitiği */}
              <div className="unified-card site-management-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-graph-up-arrow"></i>
                  </div>
                  <h3 className="unified-program-title">Akıllı Değerleme ve Yatırım Analitiği</h3>
                  <div className="unified-program-description">AI Tabanlı Değer Tahmini &amp; Pazar Öngörü Sistemleri</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>Yapay zekâ ile gayrimenkul değer tahmin modelleri</li>
                        <li>Lokasyon bazlı fiyat ve kira trend analizleri</li>
                        <li>Yatırım geri dönüş (ROI) ve risk skorlama algoritmaları</li>
                        <li>Mikro bölge bazlı talep tahminleme sistemleri</li>
                        <li>Büyük veri ile portföy optimizasyon çözümleri</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>


              {/* Veri Odaklı Kiralama & Satış Süreçleri */}
              <div className="unified-card security-access-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-bullseye"></i>
                  </div>
                  <h3 className="unified-program-title">Veri Odaklı Kiralama &amp; Satış Süreçleri</h3>
                  <div className="unified-program-description">AI ile Talep Eşleştirme ve Dinamik Fiyatlama</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>Akıllı müşteri eşleştirme motorları</li>
                        <li>Dinamik kira / satış fiyatı optimizasyonu</li>
                        <li>AI destekli müşteri segmentasyonu</li>
                        <li>Otomatik lead scoring sistemleri</li>
                        <li>Sanal asistan / chatbot ile satış dönüşüm artırma</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dijital Tapu, Hukuk ve Risk Analitiği */}
              <div className="unified-card predictive-maintenance-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-shield-lock"></i>
                  </div>
                  <h3 className="unified-program-title">Dijital Tapu, Hukuk ve Risk Analitiği</h3>
                  <div className="unified-program-description">RegTech &amp; Risk Skorlama Çözümleri</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>Tapu ve mülkiyet verilerinin analizi</li>
                        <li>Hukuki risk tahminleme modelleri</li>
                        <li>Fraud (sahtecilik) tespit sistemleri</li>
                        <li>Gayrimenkul kredilendirme skorlama motorları</li>
                        <li>Blockchain &amp; veri güvenliği entegrasyonları</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Şehir Ölçeğinde Veri Analitiği & Kentsel Zeka */}
              <div className="unified-card energy-sustainability-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-globe-americas"></i>
                  </div>
                  <h3 className="unified-program-title">Şehir Ölçeğinde Veri Analitiği &amp; Kentsel Zeka</h3>
                  <div className="unified-program-description">Urban Data Intelligence</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>Uydu verisi + AI ile kentsel gelişim analizi</li>
                        <li>Deprem risk haritalama modelleri</li>
                        <li>Trafik, nüfus, altyapı verisi ile yatırım simülasyonu</li>
                        <li>Akıllı şehir veri platformları</li>
                        <li>İklim ve sürdürülebilirlik skorları</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* ESG, Sürdürülebilirlik ve Karbon Analitiği */}
              <div className="unified-card data-platform-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-tree"></i>
                  </div>
                  <h3 className="unified-program-title">ESG, Sürdürülebilirlik ve Karbon Analitiği</h3>
                  <div className="unified-program-description">Yeşil Gayrimenkul için AI Çözümleri</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>Karbon ayak izi hesaplama modelleri</li>
                        <li>Enerji performans tahmin sistemleri</li>
                        <li>Yeşil bina sertifikasyon veri otomasyonu</li>
                        <li>ESG skor üretim algoritmaları</li>
                        <li>Sürdürülebilir portföy yönetimi</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Destekli Kullanıcı Deneyimi & Yaşam Analitiği */}
              <div className="unified-card mobile-community-card">
                <div className="unified-card-header">
                  <div className="unified-program-icon">
                    <i className="bi bi-people"></i>
                  </div>
                  <h3 className="unified-program-title">AI Destekli Kullanıcı Deneyimi &amp; Yaşam Analitiği</h3>
                  <div className="unified-program-description">Veriye Dayalı Konut Deneyimi</div>
                </div>
                <div className="unified-card-content">
                  <div className="unified-tech-categories">
                    <div className="unified-category">
                      <ul className="category-list">
                        <li>Site içi davranış analitiği</li>
                        <li>Topluluk etkileşim tahmini</li>
                        <li>Memnuniyet skoru üretimi</li>
                        <li>AI destekli sosyal alan optimizasyonu</li>
                        <li>Dijital yaşam asistanları</li>
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
        .ankara-programs-grid {
          display: flex !important;
          flex-wrap: wrap;
          justify-content: center;
          gap: 30px;
          padding: 0;
          margin: 60px 0;
        }
        .ankara-programs-grid :global(.unified-card) {
          width: calc(33.333% - 20px);
          flex-shrink: 0;
        }
        @media (max-width: 1200px) {
          .ankara-programs-grid :global(.unified-card) {
            width: calc(50% - 15px);
          }
        }
        @media (max-width: 768px) {
          .ankara-programs-grid {
            gap: 20px;
            margin: 40px 0;
          }
          .ankara-programs-grid :global(.unified-card) {
            width: 100%;
          }
        }
      `}</style>
    </section>
  )
}
