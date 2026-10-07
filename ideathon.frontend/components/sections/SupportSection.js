export default function SupportSection() {
  return (
    <section id="support" className="py-120px md-py-100px sm-py-80px support-section position-relative overflow-hidden">
      {/* Background Pattern */}
      <div className="position-absolute top-0 left-0 w-100 h-100 opacity-3">
        <div className="position-absolute top-10 right-10 w-200px h-200px border border-primary-blue border-radius-50"></div>
        <div className="position-absolute bottom-20 left-10 w-150px h-150px border border-accent-blue border-radius-50"></div>
        <div className="position-absolute top-50 left-20 w-100px h-100px bg-primary-blue-transparent border-radius-50"></div>
      </div>

      <div className="container position-relative z-index-2">
        {/* Hero Header */}
        <div className="row justify-content-center mb-80px md-mb-60px">
          <div className="col-lg-8 col-md-10 text-center">
            <div className="inline-block mb-30px">
              <span className="ps-25px pe-25px pt-8px pb-8px text-uppercase alt-font text-primary-blue fs-13 lh-28 fw-600 border-radius-100px bg-primary-blue-light d-inline-flex align-items-center">
                <i className="bi bi-stars fs-30 me-8px"></i>
              </span>
            </div>
            <h2 className="alt-font text-dark-gray fw-700 mb-25px lh-52 md-lh-44 sm-lh-60">
              Potansiyelinizi <span className="text-primary-blue">Gerçeğe Dönüştürün</span>
            </h2>
          </div>
        </div>

        {/* Main Support Programs */}
        <div className="row justify-content-center mt-50px">
          <div className="col-lg-10 col-md-12">
            <div className="row g-50px">

              {/* Program 1: Mentorluk */}
              <div 
                className="col-lg-4 col-md-6" 
               
              >
                <div className="support-program-card h-100 p-35px border-radius-16px bg-white box-shadow-large position-relative overflow-hidden hover-lift" style={{maxWidth: '380px', margin: '0 auto'}}>
                  <div className="position-absolute top-0 right-0 w-120px h-120px bg-gradient-primary-blue opacity-1 border-radius-25px transform-rotate-45 translate-middle-x translate-middle-y"></div>
                  <div className="position-relative z-index-1 h-100 d-flex flex-column">
                    <div className="flex-shrink-0">
                      <div className="w-70px h-70px bg-gradient-primary-blue border-radius-20px d-flex align-items-center justify-content-center mb-30px">
                        <i className="bi bi-person-check-fill text-white fs-28"></i>
                      </div>
                      <h4 className="alt-font text-dark-gray fw-600 mb-20px fs-24 lh-32">Mentörlük</h4>
                      <p className="text-medium-gray lh-28 mb-30px flex-grow-1">
                        Deneyimli sektör liderlerinden birebir rehberlik alarak projelerinizi uzman gözüyle değerlendirin ve geliştirin.
                      </p>
                    </div>
                    <div className="mt-auto">
                      <div className="row g-20px">
                        <div className="col-12">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-check-circle-fill text-primary-blue fs-18 me-10px"></i>
                            <span className="text-dark-gray fw-500 fs-15">Teknik Rehberlik</span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-check-circle-fill text-primary-blue fs-18 me-10px"></i>
                            <span className="text-dark-gray fw-500 fs-15">
                            Deneyim Aktarımı</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Program 2: Eğitim ve Atolyeler */}
              <div 
                className="col-lg-4 col-md-6" 
               
              >
                <div className="support-program-card h-100 p-35px border-radius-16px bg-white box-shadow-large position-relative overflow-hidden hover-lift" style={{maxWidth: '380px', margin: '0 auto'}}>
                  <div className="position-absolute top-0 right-0 w-120px h-120px bg-gradient-accent-blue opacity-1 border-radius-25px transform-rotate-45 translate-middle-x translate-middle-y"></div>
                  <div className="position-relative z-index-1 h-100 d-flex flex-column">
                    <div className="flex-shrink-0">
                      <div className="w-70px h-70px bg-gradient-accent-blue border-radius-20px d-flex align-items-center justify-content-center mb-30px">
                        <i className="bi bi-mortarboard-fill text-white fs-28"></i>
                      </div>
                      <h4 className="alt-font text-dark-gray fw-600 mb-20px fs-24 lh-32">Eğitim ve Atölyeler</h4>
                      <p className="text-medium-gray lh-28 mb-30px flex-grow-1">
                        Teknoloji ve inovasyon alanında uzman eğitmenlerle pratik odaklı eğitim programlarına katılın.
                      </p>
                    </div>
                    <div className="mt-auto">
                      <div className="row g-20px">
                        <div className="col-12">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-check-circle-fill text-accent-blue fs-18 me-10px"></i>
                            <span className="text-dark-gray fw-500 fs-15">
                            Takım Çalışması Atölyesi</span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-check-circle-fill text-accent-blue fs-18 me-10px"></i>
                            <span className="text-dark-gray fw-500 fs-15">
                            İş Modeli Eğitimleri</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Program 3: Ortak Ürün Geliştirme */}
              <div 
                className="col-lg-4 col-md-12" 
               
              >
                <div className="support-program-card h-100 p-35px border-radius-16px bg-white box-shadow-large position-relative overflow-hidden hover-lift" style={{maxWidth: '380px', margin: '0 auto'}}>
                  <div className="position-absolute top-0 right-0 w-120px h-120px bg-gradient-base-color opacity-1 border-radius-25px transform-rotate-45 translate-middle-x translate-middle-y"></div>
                  <div className="position-relative z-index-1 h-100 d-flex flex-column">
                    <div className="flex-shrink-0">
                      <div className="w-70px h-70px bg-gradient-base-color border-radius-20px d-flex align-items-center justify-content-center mb-30px">
                        <i className="bi bi-diagram-3-fill text-white fs-28"></i>
                      </div>
                      <h4 className="alt-font text-dark-gray fw-600 mb-20px fs-24 lh-32">Ortak Ürün Geliştirme</h4>
                      <p className="text-medium-gray lh-28 mb-30px flex-grow-1">
                        Sektör liderleri ve teknoloji firmalarıyla stratejik ortaklıklar kurarak ürünlerinizi pazara taşıyın.
                      </p>
                    </div>
                    <div className="mt-auto">
                      <div className="row g-20px">
                        <div className="col-12">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-check-circle-fill text-base-color fs-18 me-10px"></i>
                            <span className="text-dark-gray fw-500 fs-15">
                            Takım Çalışmaları</span>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-check-circle-fill text-base-color fs-18 me-10px"></i>
                            <span className="text-dark-gray fw-500 fs-15">Pilot Uygulamalar</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

