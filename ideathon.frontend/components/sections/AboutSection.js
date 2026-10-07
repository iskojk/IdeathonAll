export default function AboutSection() {
  return (
    <section id="about" className=" mt-3 pt-40px pb-40px">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10 text-center">
            {/* Section Badge */}
            <div 
              className="ps-20px pe-20px pt-5px pb-5px mb-20px text-uppercase alt-font text-primary-blue fs-12 lh-26 fw-600 border-radius-100px bg-primary-blue-light d-inline-flex align-items-center" 
            >
              <i className="bi bi-info-circle fs-30 me-5px"></i>
            </div>

            {/* Main Heading */}
            <h2 
              className="alt-font text-dark-gray fw-700 mb-35px lh-48 md-lh-44 sm-lh-60" 
            >
              Emlak Konut Ideathon ile Geleceği Şekillendiriyoruz
            </h2>

            {/* Main Content */}
            <div 
              className="text-center" 
            >
              <p
                className="text-dark-gray lh-28 mb-25px fs-16"
              >
                <strong>Emlak Konut Ideathon</strong>, şehirlerin geleceğini teknolojiyle, sürdürülebilirlikle ve yaşama değer katacak yenilikçi fikirlerle şekillendiren bir fikir maratonudur.
              </p>

              <p
                className="text-dark-gray lh-28 mb-25px fs-16"
              >
                <em>&quot;Birlikte Düşün, Birlikte Geliştir, Birlikte Deneyimle.&quot;</em>
              </p>

              <p
                className="text-dark-gray lh-28 mb-25px fs-16"
              >
                Bu yolculukta üretilen fikirler; pilot uygulama süreçleriyle sahada test edilir, Emlak Konut projelerinde gerçeğe dönüşme fırsatı bulur.
              </p>

              <h3
                className="alt-font text-dark-gray fw-600 mb-25px fs-20"
              >
                Yaşam Kalitesini Artıran Akıllı Site Yönetimi Çözümleri
              </h3>

              <p
                className="text-dark-gray lh-28 mb-25px fs-16"
              >
                Emlak Konut Ideathon I ile şehir yaşamını daha konforlu, güvenli, verimli ve sürdürülebilir kılacak yenilikçi fikirlerin geliştirilmesini destekliyoruz.
              </p>

              <p
                className="text-dark-gray lh-28 mb-25px fs-16"
              >
                Bu süreçte, <strong>&quot;Yaşam Kalitesini Artıran Akıllı Site Yönetimi Çözümleri&quot;</strong> odağında teknolojiyi ve insan odaklı yaklaşımları bir araya getirerek toplu yaşam alanlarında kalite ve verimliliği artırmayı hedefliyoruz.
              </p>

              <p
                className="text-dark-gray lh-28 mb-0 fs-16"
              >
                Genç yeteneklerin, girişimcilerin ve uzmanların katkısıyla geleceğin şehir yaşamına yön verecek uygulanabilir projelerin ortaya çıkmasını amaçlıyoruz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

