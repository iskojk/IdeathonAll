/**
 * Ideathon Konya Anasayfa
 * Slug: ideathon-konya
 * Emlak Konut Ideathon Konya — Akıllı Dikey Ulaşım ve Robotik Yapı Teknolojileri
 */

import Head from 'next/head'
import Script from 'next/script'
import Layout from '@/components/Layout'
import HeroSectionKonya from '@/components/sections/ideathon-konya/HeroSectionKonya'
import AboutSectionKonya from '@/components/sections/ideathon-konya/AboutSectionKonya'
import PartnersSectionKonya from '@/components/sections/ideathon-konya/PartnersSectionKonya'
import ProgramsSectionKonya from '@/components/sections/ideathon-konya/ProgramsSectionKonya'
import TimelineSectionKonya from '@/components/sections/ideathon-konya/TimelineSectionKonya'
import AwardsSectionKonya from '@/components/sections/ideathon-konya/AwardsSectionKonya'
import SupportSection from '@/components/sections/SupportSection'
import FAQSectionKonya from '@/components/sections/ideathon-konya/FAQSectionKonya'
import ContactSection from '@/components/sections/ContactSection'
import { useSetIdeathonSlug } from '@/context/IdeathonContext'

const IDEATHON_SLUG = 'ideathon-konya'

export default function IdeathonKonyaHome() {
    useSetIdeathonSlug(IDEATHON_SLUG)

    return (
        <>
            <Head>
                <title>Emlak Konut Ideathon Konya</title>
                <meta name="description" content="Emlak Konut Ideathon Konya, akıllı dikey ulaşım sistemleri ve robotik yapı teknolojileri alanında yenilikçi çözümlerin geliştirilmesini destekleyen fikir maratonudur." />
                <meta name="keywords" content="Emlak Konut, Ideathon Konya, akıllı dikey ulaşım, robotik yapı, inovasyon, teknoloji, Konya" />
                <meta name="author" content="EKA Enerji ve Teknoloji A.Ş." />
                <meta name="robots" content="index, follow" />
                <meta name="language" content="tr-TR" />

                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://ideathon.anahtarfikirler.com/ideathon-konya" />
                <meta property="og:title" content="Emlak Konut Ideathon Konya" />
                <meta property="og:description" content="Emlak Konut Ideathon Konya, akıllı dikey ulaşım sistemleri ve robotik yapı teknolojileri alanında yenilikçi çözümlerin geliştirilmesini destekleyen fikir maratonudur." />
                <meta property="og:image" content="https://ideathon.anahtarfikirler.com/img/konya/ideathon-konya.jpg" />
                <meta property="og:site_name" content="Emlak Konut Ideathon" />

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Emlak Konut Ideathon Konya" />
                <meta name="twitter:description" content="Emlak Konut Ideathon Konya, akıllı dikey ulaşım sistemleri ve robotik yapı teknolojileri alanında yenilikçi çözümlerin geliştirilmesini destekleyen fikir maratonudur." />
                <meta name="twitter:image" content="https://ideathon.anahtarfikirler.com/img/konya/ideathon-konya.jpg" />

                <link rel="canonical" href="https://ideathon.anahtarfikirler.com/ideathon-konya" />

                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Event",
                            "@id": "https://ideathon.anahtarfikirler.com/ideathon-konya#event",
                            "name": "Emlak Konut Ideathon Konya",
                            "description": "Akıllı dikey ulaşım sistemleri ve robotik yapı teknolojileri alanında yenilikçi çözümlerin geliştirilmesini destekleyen fikir maratonu.",
                            "url": "https://ideathon.anahtarfikirler.com/ideathon-konya",
                            "startDate": "2026-03-23",
                            "endDate": "2026-04-25",
                            "eventStatus": "https://schema.org/EventScheduled",
                            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                            "location": {
                                "@type": "Place",
                                "name": "Konya",
                                "address": {
                                    "@type": "PostalAddress",
                                    "addressLocality": "Konya",
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
                                "validFrom": "2026-03-23",
                                "url": "https://ideathon.anahtarfikirler.com/ideathon-konya"
                            },
                            "image": "https://ideathon.anahtarfikirler.com/img/konya/ideathon-konya.jpg"
                        })
                    }}
                />
            </Head>

            <Layout>
                <div className="box-layout">
                    <HeroSectionKonya />
                    <AboutSectionKonya />
                    <PartnersSectionKonya />
                    <ProgramsSectionKonya />
                    <TimelineSectionKonya />
                    <AwardsSectionKonya />
                    <SupportSection />
                    <FAQSectionKonya />
                </div>
                <ContactSection />
            </Layout>
            <Script src="/js/main.js" strategy="afterInteractive" />
        </>
    )
}
