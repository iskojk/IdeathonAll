/**
 * Ideathon 2025 Anasayfa
 * Slug: ideathon-2025
 * İlk Emlak Konut Ideathon — Akıllı Site Yönetimi Çözümleri
 */

import Head from 'next/head'
import Script from 'next/script'
import Layout from '@/components/Layout'
import HeroSection2 from '@/components/sections/HeroSection2'
import AboutSection from '@/components/sections/AboutSection'
import ProgramsSection from '@/components/sections/ProgramsSection'
import TimelineSection from '@/components/sections/TimelineSection'
import AwardsSection from '@/components/sections/AwardsSection'
import SupportSection from '@/components/sections/SupportSection'
import FAQSection from '@/components/sections/FAQSection'
import ContactSection from '@/components/sections/ContactSection'
import { useSetIdeathonSlug } from '@/context/IdeathonContext'

const IDEATHON_SLUG = 'ideathon-2025'

export default function Ideathon2025Home() {
    // Sayfa yüklendiğinde slug'ı set et
    useSetIdeathonSlug(IDEATHON_SLUG)

    return (
        <>
            <Head>
                <title>Emlak Konut Ideathon İstanbul</title>
                <meta name="description" content="Emlak Konut Ideathon, şehirlerin geleceğini teknolojiyle, sürdürülebilirlikle ve yaşama değer katacak yenilikçi fikirlerle şekillendiren bir fikir maratonudur." />
                <meta name="keywords" content="Emlak Konut, Ideathon İstanbul, PropTech, ConTech, akıllı şehir, inovasyon, teknoloji, toplu yaşam, site yönetimi" />
                <meta name="author" content="EKA Enerji ve Teknoloji A.Ş." />
                <meta name="robots" content="index, follow" />
                <meta name="language" content="tr-TR" />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://ideathon.anahtarfikirler.com/ideathon-2025" />
                <meta property="og:title" content="Emlak Konut Ideathon İstanbul" />
                <meta property="og:description" content="Emlak Konut Ideathon, şehirlerin geleceğini teknolojiyle, sürdürülebilirlikle ve yaşama değer katacak yenilikçi fikirlerle şekillendiren bir fikir maratonudur." />
                <meta property="og:image" content="https://ideathon.anahtarfikirler.com/img/slider-photo.webp" />
                <meta property="og:site_name" content="Emlak Konut Ideathon" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Emlak Konut Ideathon İstanbul" />
                <meta name="twitter:description" content="Emlak Konut Ideathon, şehirlerin geleceğini teknolojiyle, sürdürülebilirlikle ve yaşama değer katacak yenilikçi fikirlerle şekillendiren bir fikir maratonudur." />
                <meta name="twitter:image" content="https://ideathon.anahtarfikirler.com/img/slider-photo.webp" />

                {/* Canonical URL */}
                <link rel="canonical" href="https://ideathon.anahtarfikirler.com/ideathon-2025" />

                {/* Structured Data / JSON-LD */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Event",
                            "@id": "https://ideathon.anahtarfikirler.com/ideathon-2025#event",
                            "name": "Emlak Konut Ideathon İstanbul",
                            "description": "Toplu yaşam alanlarında günlük hayatı kolaylaştıracak, tesis yönetimi süreçlerini iyileştirecek ve kullanıcı deneyimini güçlendirecek çözüm fikirlerini görünür kılmak ve geliştirmek.",
                            "url": "https://ideathon.anahtarfikirler.com/ideathon-2025",
                            "startDate": "2025-12-06",
                            "endDate": "2025-12-07",
                            "eventStatus": "https://schema.org/EventScheduled",
                            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                            "location": {
                                "@type": "Place",
                                "name": "Emlak Konut Genel Müdürlüğü",
                                "address": {
                                    "@type": "PostalAddress",
                                    "addressLocality": "Ataşehir",
                                    "addressRegion": "İstanbul",
                                    "addressCountry": "TR"
                                }
                            },
                            "organizer": {
                                "@type": "Organization",
                                "name": "Emlak Konut GYO",
                                "url": "https://ideathon.anahtarfikirler.com/"
                            },
                            "performer": {
                                "@type": "Organization",
                                "name": "Emlak Konut GYO"
                            },
                            "offers": {
                                "@type": "Offer",
                                "price": "0",
                                "priceCurrency": "TRY",
                                "availability": "https://schema.org/InStock",
                                "validFrom": "2025-12-06",
                                "url": "https://ideathon.anahtarfikirler.com/ideathon-2025"
                            },
                            "image": "https://ideathon.anahtarfikirler.com/img/slider.webp"
                        })
                    }}
                />
            </Head>

            <Layout>
                <div className="box-layout">
                    <HeroSection2 />
                    <AboutSection />
                    <ProgramsSection />
                    <TimelineSection />
                    <AwardsSection />
                    <SupportSection />
                    <FAQSection />
                </div>
                <ContactSection />
            </Layout>
            <Script src="/js/main.js" strategy="afterInteractive" />
        </>
    )
}

