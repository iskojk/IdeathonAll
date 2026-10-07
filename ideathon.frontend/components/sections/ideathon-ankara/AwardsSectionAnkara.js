export default function AwardsSectionAnkara() {
  return (
    <section id="awards" className="py-120px md-py-100px sm-py-80px position-relative">
      <div className="container">
        {/* Section Header */}
        <div className="row justify-content-center mb-80px md-mb-60px">
          <div className="col-lg-8 col-md-10 text-center">
            <div className="inline-block mb-30px">
              <span className="ps-25px pe-25px pt-8px pb-8px text-uppercase alt-font text-primary-blue fs-12 lh-26 fw-600 border-radius-100px bg-primary-blue-light d-inline-flex align-items-center">
                <i className="bi bi-trophy-fill fs-30 me-5px"></i>
              </span>
            </div>
            <h2 className="alt-font text-dark-gray fw-700 mb-25px lh-52 md-lh-44 sm-lh-60">
              Başarılarınızı <span className="text-primary-blue">Ödüllendiriyoruz</span>
            </h2>
          </div>
        </div>

        {/* Awards Elegant Grid */}
        <div className="awards-elegant-grid">
          {/* Awards Row */}
          <div className="awards-row">
            <div className="award-card award-card-premium">
              <div className="award-card-inner">
                <div className="award-rank">
                  <span className="rank-number">1</span>
                </div>
                <div className="award-card-content">
                  <div className="award-amount">100.000 TL</div>
                  <div className="award-desc">Birinci Takım</div>
                </div>
              </div>
            </div>

            <div className="award-card award-card-excellence">
              <div className="award-card-inner">
                <div className="award-rank">
                  <span className="rank-number">2</span>
                </div>
                <div className="award-card-content">
                  <div className="award-amount">75.000 TL</div>
                  <div className="award-desc">İkinci Takım</div>
                </div>
              </div>
            </div>

            <div className="award-card award-card-success">
              <div className="award-card-inner">
                <div className="award-rank">
                  <span className="rank-number">3</span>
                </div>
                <div className="award-card-content">
                  <div className="award-amount">50.000 TL</div>
                  <div className="award-desc">Üçüncü Takım</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Opportunities */}
        <div className="awards-opportunities mt-80px">
          <div className="row justify-content-center">
            <div className="col-lg-10 col-md-12">

              {/* Opportunity 1 */}
              <div className="opportunity-item opportunity-item-primary mb-40px">
                <div className="opportunity-icon">
                  <i className="bi bi-megaphone"></i>
                </div>
                <div className="opportunity-content">
                  <h4 className="opportunity-title">İlk 3 Projeye Anahtar Fikirler Zirvesinde Sahne Sunumu</h4>
                  <p className="opportunity-description">
                    İlk 3 projeye Anahtar Fikirler Zirvesi etkinliğinde sahnesinde sunum fırsatı verilecektir.
                  </p>
                </div>
              </div>

              {/* Opportunity 2 */}
              <div className="opportunity-item opportunity-item-excellence">
                <div className="opportunity-icon">
                  <i className="bi bi-rocket-takeoff"></i>
                </div>
                <div className="opportunity-content">
                  <h4 className="opportunity-title">Pilot Uygulama İmkanı</h4>
                  <p className="opportunity-description">
                    Başarılı projelerin Emlak Konut projelerinde pilot veya PoC olarak uygulanması sağlanacaktır.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
