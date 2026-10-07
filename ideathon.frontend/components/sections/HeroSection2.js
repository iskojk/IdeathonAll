import { useState, useEffect } from 'react'

export default function HeroSection2() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 500)
    }

    // İlk yükleme
    checkIsMobile()

    // Resize listener
    window.addEventListener('resize', checkIsMobile)

    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const imageSrc = isMobile ? '/img/slider-mobil.webp' : '/img/slider-photo.webp'
  return (
    <section id="home" className="pb-0px" style={{ marginTop: '70px', paddingBottom: '0px !important' }}>
      <img
        src={imageSrc}
        alt="Emlak Konut Ideathon - Akıllı Şehir Teknolojileri"
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: isMobile ? '10px' : '15px',
          display: 'block',
          cursor: 'default'
        }}
      />
    </section>
  )
}
