export default function TimelineSectionKonya() {
  return (
    <section id="timeline" className="br-sk py-120px md-py-100px sm-py-80px position-relative bg-light-gray">
      <div className="container">
        <div className="row justify-content-center mb-80px md-mb-60px">
          <div className="col-lg-8 col-md-10 text-center">
            <div className="inline-block mb-30px">
              <span className="ps-25px pe-25px pt-8px pb-8px text-uppercase alt-font text-primary-blue fs-13 lh-28 fw-600 border-radius-100px bg-primary-blue-light d-inline-flex align-items-center">
                <i className="bi bi-calendar-event fs-30 me-10px"></i>
              </span>
            </div>
            <h2 className="alt-font text-dark-gray fw-700 mb-25px lh-52 md-lh-44 sm-lh-60">
              Program <span className="text-primary-blue">Takvimi</span>
            </h2>
          </div>
        </div>

        <div className="timeline-simple">
          <div className="timeline-line-simple"></div>

          <div className="timeline-item-simple">
            <div className="timeline-date-simple">
              <div className="date-number">23</div>
              <div className="date-month">Mart</div>
              <div className="date-day">Pazartesi</div>
            </div>
            <div className="timeline-content-simple">
              <h4 className="timeline-title-simple">Başvuruların Alınması</h4>
              <div className="timeline-category category-platform">Başlangıç</div>
            </div>
          </div>

          <div className="timeline-item-simple">
            <div className="timeline-date-simple">
              <div className="date-number">10</div>
              <div className="date-month">Nisan</div>
              <div className="date-day">Cuma</div>
            </div>
            <div className="timeline-content-simple">
              <h4 className="timeline-title-simple">Son Başvuru Tarihi</h4>
              <div className="timeline-category category-deadline">Son Tarih</div>
            </div>
          </div>

          <div className="timeline-item-simple">
            <div className="timeline-date-simple">
              <div className="date-number">13</div>
              <div className="date-month">Nisan</div>
              <div className="date-day">Pazartesi</div>
            </div>
            <div className="timeline-content-simple">
              <div className="timeline-event">
                <h4 className="timeline-title-simple">18:30 - 19:15 | Problemden Çözüme Fikir Geliştirme</h4>
                <div className="timeline-category category-education" style={{ marginRight: '10px', marginBottom: '10px' }}>ONLINE Eğitim</div>
                <div className="timeline-category category-platform">Eğitmen: Serhat DUYAR</div>
              </div>
            </div>
          </div>

          <div className="timeline-item-simple">
            <div className="timeline-date-simple">
              <div className="date-number">14</div>
              <div className="date-month">Nisan</div>
              <div className="date-day">Salı</div>
            </div>
            <div className="timeline-content-simple">
              <div className="timeline-event">
                <h4 className="timeline-title-simple">18:30 - 19:15 | Girişimcilik ve İnovasyon Yaklaşımları</h4>
                <div className="timeline-category category-education" style={{ marginRight: '10px', marginBottom: '10px' }}>ONLINE Eğitim</div>
                <div className="timeline-category category-platform">Eğitmen: Dr. Hakan Aslan</div>
              </div>
              <div className="timeline-event">
                <h4 className="timeline-title-simple">19:15 - 20:00 | Yarının Binaları İçin Dikey Ulaşım Teknolojileri</h4>
                <div className="timeline-category category-webinar" style={{ marginRight: '10px', marginBottom: '10px' }}>Webinar</div>
                <div className="timeline-category category-platform">Konuşmacı: Dağhan ATAKAY</div>
              </div>
            </div>
          </div>

          <div className="timeline-item-simple">
            <div className="timeline-date-simple">
              <div className="date-number">15</div>
              <div className="date-month">Nisan</div>
              <div className="date-day">Çarşamba</div>
            </div>
            <div className="timeline-content-simple">
              <div className="timeline-event">
                <h4 className="timeline-title-simple">18:30 - 19:15 | Sunum Hazırlama Eğitimi</h4>
                <div className="timeline-category category-education" style={{ marginRight: '10px', marginBottom: '10px' }}>ONLINE Eğitim</div>
              </div>
              <div className="timeline-event">
                <h4 className="timeline-title-simple">19:15 - 20:00 | Webinar</h4>
                <div className="timeline-category category-webinar" style={{ marginRight: '10px', marginBottom: '10px' }}>Webinar</div>
              </div>
            </div>
          </div>

          <div className="timeline-item-simple">
            <div className="timeline-date-simple">
              <div className="date-number">21</div>
              <div className="date-month">Nisan</div>
              <div className="date-day">Salı</div>
            </div>
            <div className="timeline-content-simple">
              <h4 className="timeline-title-simple">Katılım Hakkı Kazananların İlanı</h4>
              <div className="timeline-category category-announcement">Sonuç İlanı</div>
            </div>
          </div>

          <div className="timeline-item-simple">
            <div className="timeline-date-simple">
              <div className="date-number">22</div>
              <div className="date-month">Nisan</div>
              <div style={{ width: '24px', height: '2px', background: '#cbd5e1', margin: '6px auto' }}></div>
              <div className="date-number" style={{ fontSize: '22px' }}>24</div>
              <div className="date-month">Nisan</div>
            </div>
            <div className="timeline-content-simple">
              <h4 className="timeline-title-simple">Mentör Görüşmeleri</h4>
              <div className="timeline-category category-education" style={{ marginRight: '10px', marginBottom: '10px' }}>ONLINE</div>
            </div>
          </div>

          <div className="timeline-item-simple featured">
            <div className="timeline-date-simple featured">
              <div className="date-number featured">25</div>
              <div className="date-month">Nisan</div>
              <div className="date-day">Cumartesi</div>
            </div>
            <div className="timeline-content-simple">
              <h4 className="timeline-title-simple featured">Ideathon - Final Programı</h4>
              <p className="timeline-description-simple">Konya</p>
              <div className="timeline-program-details">
                <div className="program-item">
                  <div className="program-time">08.30 – 09.00</div>
                  <div className="program-activity">Kayıt, Karşılama ve Kahvaltı</div>
                </div>
                <div className="program-item">
                  <div className="program-time">09.00 – 09.30</div>
                  <div className="program-activity">Açılış Konuşmaları</div>
                </div>
                <div className="program-item">
                  <div className="program-time">09.30 – 10.00</div>
                  <div className="program-activity">Program Akışı ve Kuralların Paylaşımı</div>
                </div>
                <div className="program-item">
                  <div className="program-time">10.00 – 12.30</div>
                  <div className="program-activity">Ideathon Çalışma Oturumları &amp; Mentör Görüşmeleri</div>
                </div>
                <div className="program-item">
                  <div className="program-time">12.30 – 13.30</div>
                  <div className="program-activity">Öğle Yemeği</div>
                </div>
                <div className="program-item">
                  <div className="program-time">13.30 – 15.00</div>
                  <div className="program-activity">Ideathon Çalışma Oturumları &amp; Sunum hazırlıkları</div>
                </div>
                <div className="program-item">
                  <div className="program-time">15.00 – 15.30</div>
                  <div className="program-activity">Proje Teslimi ve Jüri Öncesi Hazırlık</div>
                </div>
                <div className="program-item">
                  <div className="program-time">15.30 – 17.30</div>
                  <div className="program-activity">
                    Final Sunumları ve Jüri Değerlendirmesi
                    <span className="program-note">Takımlar, fikirlerini 5 dakikalık sunumlarla jüriye aktarır.</span>
                  </div>
                </div>
                <div className="program-item">
                  <div className="program-time">17.30 – 18.30</div>
                  <div className="program-activity">Ara ve Networking</div>
                </div>
                <div className="program-item">
                  <div className="program-time">18.30 – 19.00</div>
                  <div className="program-activity">Sonuçların Açıklanması Kapanış, Ödül ve Sertifika Töreni</div>
                </div>
              </div>
              <div className="timeline-category category-main-event mt-4">Ideathon Final Programı</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
