export default function TimelineSection() {
  return (
    <section id="timeline" className="br-sk py-120px md-py-100px sm-py-80px position-relative bg-light-gray">
      <div className="container">
        {/* Section Header */}
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

        {/* Timeline Container */}
        <div className="timeline-simple">
          {/* Timeline Line */}
          <div className="timeline-line-simple"></div>

          {/* Timeline Items */}
          <div className="timeline-item-simple">
            <div className="timeline-date-simple">
              <div className="date-number">11</div>
              <div className="date-month">Kasım</div>
              <div className="date-day">Salı</div>
            </div>
            <div className="timeline-content-simple">
              <h4 className="timeline-title-simple">Başvuruların Alınması</h4>
              <div className="timeline-category category-platform">Başlangıç</div>
            </div>
          </div>

          <div className="timeline-item-simple">
            <div className="timeline-date-simple">
              <div className="date-number">25</div>
              <div className="date-month">Kasım</div>
              <div className="date-day">Salı</div>
            </div>
            <div className="timeline-content-simple">
              <h4 className="timeline-title-simple">Son Başvuru Tarihi</h4>
              <div className="timeline-category category-deadline">Son Tarih</div>
            </div>
          </div>

          <div className="timeline-item-simple">
            <div className="timeline-date-simple">
              <div className="date-number">26</div>
              <div className="date-month">Kasım</div>
              <div className="date-day">Çarşamba</div>
            </div>
            <div className="timeline-content-simple">
              <div className="timeline-event">
                <h4 className="timeline-title-simple">18:30 - 19:30 | Girişimcilik ve İnovasyon Yaklaşımları</h4>
                <div className="timeline-category category-education" style={{ marginRight: '10px', marginBottom: '10px' }}>ONLINE Eğitim</div>
                <div className="timeline-category category-platform">Eğitmen: Dr. Hakan Aslan</div>
              </div>
              <div className="timeline-event">
                <h4 className="timeline-title-simple">19:30 - 20:30 | Webinar: Site Yönetimi Süreçleri</h4>
                <div className="timeline-category category-webinar" style={{ marginRight: '10px', marginBottom: '10px' }}>Webinar</div>
                <div className="timeline-category category-platform">Eğitmen: Ali Sıroğlu</div>
              </div>
            </div>
          </div>

          <div className="timeline-item-simple">
            <div className="timeline-date-simple">
              <div className="date-number">27</div>
              <div className="date-month">Kasım</div>
              <div className="date-day">Perşembe</div>
            </div>
            <div className="timeline-content-simple">
              <div className="timeline-event">
                <h4 className="timeline-title-simple">18:30 - 19:30 | Problemden Çözüme Fikir Geliştirme</h4>
                <div className="timeline-category category-education" style={{ marginRight: '10px', marginBottom: '10px' }}>ONLINE Eğitim</div>
                <div className="timeline-category category-platform">Eğitmen: Serhat DUYAR</div>
              </div>
              <div className="timeline-event">
                <h4 className="timeline-title-simple">19:30 - 20:30 | Webinar: Akıllı Tesis Yönetimi, Operasyon Verimliliği</h4>
                <div className="timeline-category category-webinar" style={{ marginRight: '10px', marginBottom: '10px' }}>Webinar</div>
                <div className="timeline-category category-platform">Eğitmen: Serdar Yıldırım</div>
              </div>
            </div>
          </div>

          <div className="timeline-item-simple">
            <div className="timeline-date-simple">
              <div className="date-number">28</div>
              <div className="date-month">Kasım</div>
              <div className="date-day">Cuma</div>
            </div>
            <div className="timeline-content-simple">
              <div className="timeline-event">
                <h4 className="timeline-title-simple">20:00 - 20:30 | Sunum Hazırlama Eğitimi</h4>
                <div className="timeline-category category-education" style={{ marginRight: '10px', marginBottom: '10px' }}>ONLINE Eğitim</div>
                <div className="timeline-category category-platform">Eğitmen: Senanur Tellioğlu</div>
              </div>
            </div>
          </div>


          <div className="timeline-item-simple">
            <div className="timeline-date-simple">
              <div className="date-number">3</div>
              <div className="date-month">Aralık</div>
              <div className="date-day">Çarşamba</div>
            </div>
            <div className="timeline-content-simple">
              <h4 className="timeline-title-simple">Katılım Hakkı Kazananların İlanı</h4>
              <div className="timeline-category category-announcement">Sonuç İlanı</div>
            </div>
          </div>

          {/* 1. GÜN - 6 Aralık 2025 */}
          <div className="timeline-item-simple featured">
            <div className="timeline-date-simple featured">
              <div className="date-number featured">6</div>
              <div className="date-month">Aralık</div>
              <div className="date-day">Cumartesi</div>
            </div>
            <div className="timeline-content-simple">
              <h4 className="timeline-title-simple featured">1. Gün - Ideathon Başlangıcı</h4>
              <p className="timeline-description-simple">Emlak Konut Genel Müdürlüğü (Ataşehir, İstanbul)</p>
              <div className="timeline-program-details">
                <div className="program-item">
                  <div className="program-time">09.00 – 10.00</div>
                  <div className="program-activity">Kayıt, Karşılama ve Kahvaltı</div>
                </div>
                <div className="program-item">
                  <div className="program-time">10.00 – 10.30</div>
                  <div className="program-activity">Açılış Konuşmaları</div>
                </div>
                <div className="program-item">
                  <div className="program-time">10.30 – 11.00</div>
                  <div className="program-activity">Takımların İlanı, Program Akışı ve Kuralların Paylaşımı</div>
                </div>
                <div className="program-item">
                  <div className="program-time">11.00 – 11.30</div>
                  <div className="program-activity">Takımların Tanışması</div>
                </div>
                <div className="program-item">
                  <div className="program-time">11.30 – 13.30</div>
                  <div className="program-activity">Eğitim: Fikir Geliştirme ve Takım Çalışması Atölyesi</div>
                </div>
                <div className="program-item">
                  <div className="program-time">13.30 – 14.30</div>
                  <div className="program-activity">Öğle Yemeği</div>
                </div>
                <div className="program-item">
                  <div className="program-time">14.30 – 18.00</div>
                  <div className="program-activity">Mentör Görüşmeleri & Ideathon Çalışma Oturumları</div>
                </div>
                <div className="program-item">
                  <div className="program-time">18.00 – 19.00</div>
                  <div className="program-activity">Akşam Yemeği</div>
                </div>
                <div className="program-item">
                  <div className="program-time">19.00 – 21.00</div>
                  <div className="program-activity">Takım İçi Sunum Hazırlıkları</div>
                </div>
              </div>
              <div className="timeline-category category-main-event mt-4">Ana Etkinlik - 1. Gün</div>
            </div>
          </div>

          {/* 2. GÜN - 7 Aralık 2025 */}
          <div className="timeline-item-simple featured">
            <div className="timeline-date-simple featured">
              <div className="date-number featured">7</div>
              <div className="date-month">Aralık</div>
              <div className="date-day">Pazar</div>
            </div>
            <div className="timeline-content-simple">
              <h4 className="timeline-title-simple featured">2. Gün - Ideathon Final Günü</h4>
              <p className="timeline-description-simple">Emlak Konut Genel Müdürlüğü (Ataşehir, İstanbul)</p>
              <div className="timeline-program-details">
                <div className="program-item">
                  <div className="program-time">09.00 – 09.30</div>
                  <div className="program-activity">Kahvaltı ve Gün Başlangıcı</div>
                </div>
                <div className="program-item">
                  <div className="program-time">09.30 – 11.30</div>
                  <div className="program-activity">Eğitim: Sunum İçeriği Oluşturma ve Sahnede Sunum Teknikleri</div>
                </div>
                <div className="program-item">
                  <div className="program-time">11.30 – 13.00</div>
                  <div className="program-activity">Proje Teslimi ve Jüri Öncesi Hazırlık</div>
                </div>
                <div className="program-item">
                  <div className="program-time">13.00 – 14.00</div>
                  <div className="program-activity">Öğle Yemeği</div>
                </div>
                <div className="program-item">
                  <div className="program-time">14.00 – 16.00</div>
                  <div className="program-activity">Final Sunumları ve Jüri Değerlendirmesi</div>
                </div>
                <div className="program-item">
                  <div className="program-time">16.00 – 16.30</div>
                  <div className="program-activity">Ara ve Networking</div>
                </div>
                <div className="program-item">
                  <div className="program-time">16.30 – 17.30</div>
                  <div className="program-activity">Sonuçların Açıklanması ve Ödül Töreni</div>
                </div>
                <div className="program-item">
                  <div className="program-time">17.30 – 18.00</div>
                  <div className="program-activity">Kapanış & Sertifika Töreni</div>
                </div>
              </div>
              <div className="timeline-category category-main-event mt-4">Ana Etkinlik - 2. Gün</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

