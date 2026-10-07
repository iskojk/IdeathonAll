export default function FAQSectionKonya() {
  return (
    <section id="faq" className="py-80px md-py-100px sm-py-80px position-relative overflow-hidden">
      <div className="position-absolute top-0 left-0 w-100 h-100 opacity-1">
        <div className="position-absolute top-15 right-15 w-250px h-250px border border-primary-blue border-radius-50 opacity-02"></div>
        <div className="position-absolute bottom-20 left-15 w-180px h-180px border border-accent-blue border-radius-50 opacity-02"></div>
      </div>

      <div className="container position-relative z-index-2">
        <div className="row justify-content-center mb-80px md-mb-60px">
          <div className="col-lg-8 col-md-10 text-center">
            <div className="inline-block mb-30px">
              <span className="ps-25px pe-25px pt-8px pb-8px text-uppercase alt-font text-primary-blue fs-12 lh-26 fw-600 border-radius-100px bg-primary-blue-light d-inline-flex align-items-center">
                <i className="bi bi-question-circle-fill fs-30 me-5px"></i>
              </span>
            </div>
            <h2 className="alt-font text-dark-gray fw-700 mb-25px lh-52 md-lh-44 sm-lh-60">
              Merak Ettikleriniz <span className="text-primary-blue">Burada</span>
            </h2>
            <p className="w-70 md-w-90 mx-auto text-dark-gray lh-28">
              Emlak Konut Ideathon Konya hakkında sıkça sorulan soruların yanıtlarını burada bulabilirsiniz.
            </p>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10">
            <div className="accordion faq-accordion" id="faqAccordionKonya">

              <div className="accordion-item faq-item">
                <h2 className="accordion-header" id="headingKnyOne">
                  <button className="accordion-button faq-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseKnyOne" aria-expanded="false" aria-controls="collapseKnyOne">
                    <div className="faq-button-content">
                      <div className="faq-number">01</div>
                      <span className="faq-question">Ulaşım ve konaklama imkanı sağlanacak mı?</span>
                    </div>
                    <div className="faq-toggle-icon">
                      <i className="bi bi-chevron-down"></i>
                    </div>
                  </button>
                </h2>
                <div id="collapseKnyOne" className="accordion-collapse collapse" aria-labelledby="headingKnyOne" data-bs-parent="#faqAccordionKonya">
                  <div className="accordion-body faq-answer">
                  Program Konya Kapsül Teknoloji Platformu’nda gerçekleşecektir. Katılımcıların ulaşım ve konaklama süreçleri kendilerine aittir.
                  </div>
                </div>
              </div>

              <div className="accordion-item faq-item">
                <h2 className="accordion-header" id="headingKnyTwo">
                  <button className="accordion-button faq-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseKnyTwo" aria-expanded="false" aria-controls="collapseKnyTwo">
                    <div className="faq-button-content">
                      <div className="faq-number">02</div>
                      <span className="faq-question">Fikri mülkiyet hakları kime ait olacak?</span>
                    </div>
                    <div className="faq-toggle-icon">
                      <i className="bi bi-chevron-down"></i>
                    </div>
                  </button>
                </h2>
                <div id="collapseKnyTwo" className="accordion-collapse collapse" aria-labelledby="headingKnyTwo" data-bs-parent="#faqAccordionKonya">
                  <div className="accordion-body faq-answer">
                    Emlak Konut Ideathon kapsamında geliştirilen tüm fikir, proje ve çıktılara ilişkin fikri mülkiyet hakları Emlak Konut GYO&apos;a ait olacaktır. Katılımcılar, programa başvurarak bu koşulu kabul etmiş sayılır.
                  </div>
                </div>
              </div>

              <div className="accordion-item faq-item">
                <h2 className="accordion-header" id="headingKnyThree">
                  <button className="accordion-button faq-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseKnyThree" aria-expanded="false" aria-controls="collapseKnyThree">
                    <div className="faq-button-content">
                      <div className="faq-number">03</div>
                      <span className="faq-question">Programa kimler katılabilir?</span>
                    </div>
                    <div className="faq-toggle-icon">
                      <i className="bi bi-chevron-down"></i>
                    </div>
                  </button>
                </h2>
                <div id="collapseKnyThree" className="accordion-collapse collapse" aria-labelledby="headingKnyThree" data-bs-parent="#faqAccordionKonya">
                  <div className="accordion-body faq-answer">
                    Girişimciler, üniversite öğrencileri ve 18 yaşından büyük yenilikçi fikir sahibi herkes programa bireysel veya ekip olarak başvuru yapabilir.
                  </div>
                </div>
              </div>

              <div className="accordion-item faq-item">
                <h2 className="accordion-header" id="headingKnyFour">
                  <button className="accordion-button faq-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseKnyFour" aria-expanded="false" aria-controls="collapseKnyFour">
                    <div className="faq-button-content">
                      <div className="faq-number">04</div>
                      <span className="faq-question">Katılım ücreti var mı?</span>
                    </div>
                    <div className="faq-toggle-icon">
                      <i className="bi bi-chevron-down"></i>
                    </div>
                  </button>
                </h2>
                <div id="collapseKnyFour" className="accordion-collapse collapse" aria-labelledby="headingKnyFour" data-bs-parent="#faqAccordionKonya">
                  <div className="accordion-body faq-answer">
                    Emlak Konut Ideathon tamamen ücretsizdir. Katılımcılardan herhangi bir başvuru veya katılım ücreti talep edilmez.
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
