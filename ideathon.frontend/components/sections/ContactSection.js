import { useState } from 'react'
import { contactAPI } from '@/lib/api'
import { toast } from '@/components/Toast'

export default function ContactSection() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const formatPhone = (value) => {
    let digits = value.replace(/\D/g, '')
    if (digits.length > 0 && !digits.startsWith('0')) {
      digits = '0' + digits
    }
    if (digits.length > 11) {
      digits = digits.substring(0, 11)
    }
    let formatted = digits
    if (digits.length > 4) {
      formatted = digits.substring(0, 4) + ' ' + digits.substring(4)
    }
    if (digits.length > 7) {
      formatted = digits.substring(0, 4) + ' ' + digits.substring(4, 7) + ' ' + digits.substring(7)
    }
    return formatted
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value)
    setFormData(prev => ({ ...prev, phone: formatted }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    const newErrors = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'Bu alan zorunludur'
    if (!formData.lastName.trim()) newErrors.lastName = 'Bu alan zorunludur'
    if (!formData.email.trim()) {
      newErrors.email = 'Bu alan zorunludur'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz'
    }
    if (!formData.phone.trim()) newErrors.phone = 'Bu alan zorunludur'
    if (!formData.message.trim()) newErrors.message = 'Bu alan zorunludur'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      // API çağrısı yap
      const response = await contactAPI.submitContactForm(formData)

      if (response.success) {
        // Başarılı toast bildirimi
        toast.success('Mesajınız başarıyla gönderildi! ✨')
        toast.info('Size en kısa sürede dönüş yapacağız.')

        // Formu sıfırla
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          message: ''
        })

        // Success modal göster (opsiyonel, toast yeterli olabilir)
        setShowSuccess(true)
      } else {
        // API başarı döndürdü ama beklenmedik durum
        toast.error('Bir hata oluştu. Lütfen tekrar deneyiniz.')
      }
    } catch (error) {
      console.error('Contact form submission error:', error)

      // Hata mesajını kullanıcı dostu şekilde göster
      let errorMessage = 'Mesajınız gönderilemedi. Lütfen tekrar deneyiniz.'

      if (error.message) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'İnternet bağlantınızı kontrol edin ve tekrar deneyiniz.'
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Çok fazla istek gönderdiniz. Bir süre bekledikten sonra tekrar deneyiniz.'
        } else {
          errorMessage = error.message
        }
      }

      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeSuccessModal = () => {
    setShowSuccess(false)
  }

  return (
    <>
      <section id="contact" className="contact-section position-relative">
        {/* Background Pattern */}
        <div className="position-absolute top-0 left-0 w-100 h-100 opacity-1">
          <div className="position-absolute top-15 right-15 w-250px h-250px border border-primary-blue border-radius-50 opacity-02"></div>
          <div className="position-absolute bottom-20 left-15 w-180px h-180px border border-accent-blue border-radius-50 opacity-02"></div>
        </div>

        <div className="container position-relative z-index-2">
          {/* Section Header */}
          <div className="row justify-content-center mb-80px md-mb-60px">
            <div className="col-lg-8 col-md-10 text-center">
              <div className="inline-block mb-30px">
                <span className="ps-25px pe-25px pt-8px pb-8px text-uppercase alt-font text-primary-blue fs-13 lh-28 fw-600 border-radius-100px bg-primary-blue-light d-inline-flex align-items-center">
                  <i className="bi bi-envelope-fill fs-30 me-10px"></i>
                </span>
              </div>
              <h2 className="alt-font text-dark-gray fw-700 mb-25px lh-52 md-lh-44 sm-lh-60">
                Sorularınız mı Var? <span className="text-primary-blue">İletişime Geçin</span>
              </h2>
              <p className="w-70 md-w-90 mx-auto text-dark-gray lh-28">
                Emlak Konut Ideathon hakkında detaylı bilgi almak, işbirliği fırsatlarını keşfetmek veya sorularınızı sormak için bizimle iletişime geçin.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10">
              <form onSubmit={handleSubmit} className="contact-form bg-white border-radius-20px box-shadow-large p-50px md-p-40px sm-p-10px">
                
                {/* Form Header */}
                <div className="form-header text-center mb-40px">
                  <h3 className="alt-font text-dark-gray fw-600 fs-24 mb-10px">İletişim Formu</h3>
        
                </div>

                {/* Form Fields */}
                <div className="row g-30px">
                  {/* Ad */}
                  <div className="col-md-6 mb-4">
                    <div className="form-group">
                      <label htmlFor="contact-firstName" className="form-label text-dark-gray fw-500 mb-10px">
                        Adınız <span className="text-red">*</span>
                      </label>
                      <input
                        type="text"
                        id="contact-firstName"
                        name="firstName"
                        className={`form-control border-radius-8px ${errors.firstName ? 'error-field' : ''}`}
                        placeholder="Adınızı giriniz"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                      {errors.firstName && <div className="field-error">{errors.firstName}</div>}
                    </div>
                  </div>

                  {/* Soyad */}
                  <div className="col-md-6 mb-4">
                    <div className="form-group">
                      <label htmlFor="contact-lastName" className="form-label text-dark-gray fw-500 mb-10px">
                        Soyadınız <span className="text-red">*</span>
                      </label>
                      <input
                        type="text"
                        id="contact-lastName"
                        name="lastName"
                        className={`form-control border-radius-8px ${errors.lastName ? 'error-field' : ''}`}
                        placeholder="Soyadınızı giriniz"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                      {errors.lastName && <div className="field-error">{errors.lastName}</div>}
                    </div>
                  </div>

                  {/* E-posta */}
                  <div className="col-md-6 mb-4">
                    <div className="form-group">
                      <label htmlFor="contact-email" className="form-label text-dark-gray fw-500 mb-10px">
                        E-posta <span className="text-red">*</span>
                      </label>
                      <input
                        type="email"
                        id="contact-email"
                        name="email"
                        className={`form-control border-radius-8px ${errors.email ? 'error-field' : ''}`}
                        placeholder="ornek@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      {errors.email && <div className="field-error">{errors.email}</div>}
                    </div>
                  </div>

                  {/* Telefon */}
                  <div className="col-md-6 mb-4">
                    <div className="form-group">
                      <label htmlFor="contact-phone" className="form-label text-dark-gray fw-500 mb-10px">
                        Telefon <span className="text-red">*</span>
                      </label>
                      <input
                        type="tel"
                        id="contact-phone"
                        name="phone"
                        className={`form-control border-radius-8px ${errors.phone ? 'error-field' : ''}`}
                        placeholder="05XX XXX XX XX"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        required
                      />
                      {errors.phone && <div className="field-error">{errors.phone}</div>}
                    </div>
                  </div>

                  {/* Mesaj */}
                  <div className="col-12">
                    <div className="form-group">
                      <label htmlFor="contact-message" className="form-label text-dark-gray fw-500 mb-10px">
                        Mesajınız <span className="text-red">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        className={`form-control border-radius-8px ${errors.message ? 'error-field' : ''}`}
                        rows="5"
                        placeholder="Mesajınızı buraya yazınız..."
                        value={formData.message}
                        onChange={handleChange}
                        required
                      ></textarea>
                      {errors.message && <div className="field-error">{errors.message}</div>}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="form-actions text-center mt-40px">
                  <button type="submit" className="contact-submit-btn" disabled={isSubmitting}>
                    <span>{isSubmitting ? 'Yükleniyor...' : 'Mesajı Gönder'}</span>
                    <i className={`bi ${isSubmitting ? 'bi-arrow-repeat spinning' : 'bi-send'}`}></i>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Success Modal */}
      {showSuccess && (
        <div className="success-modal-overlay" style={{ display: 'flex' }} onClick={closeSuccessModal}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-modal-content">
              <div className="success-icon">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <h2 className="success-title">Mesajınız Gönderildi!</h2>
              <p className="success-message">Mesajınız için teşekkür ederiz. Size en kısa sürede dönüş yapacağız.</p>
              <button className="success-close-btn" onClick={closeSuccessModal}>
                <span>Anladım</span>
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

