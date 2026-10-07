/**
 * Ideathon Ankara Anasayfa
 * Slug: ideathon-ankara
 * Emlak Konut Ideathon Ankara — Başkentin İnovasyon Gücü
 */

import Head from 'next/head'
import Script from 'next/script'
import Layout from '@/components/Layout'
import HeroSectionAnkara from '@/components/sections/ideathon-ankara/HeroSectionAnkara'
import AboutSectionAnkara from '@/components/sections/ideathon-ankara/AboutSectionAnkara'
import PartnersSectionAnkara from '@/components/sections/ideathon-ankara/PartnersSectionAnkara'
import ProgramsSectionAnkara from '@/components/sections/ideathon-ankara/ProgramsSectionAnkara'
import TimelineSectionAnkara from '@/components/sections/ideathon-ankara/TimelineSectionAnkara'
import AwardsSectionAnkara from '@/components/sections/ideathon-ankara/AwardsSectionAnkara'
import SupportSection from '@/components/sections/SupportSection'
import FAQSectionAnkara from '@/components/sections/ideathon-ankara/FAQSectionAnkara'
import ContactSection from '@/components/sections/ContactSection'
import { useSetIdeathonSlug } from '@/context/IdeathonContext'

const IDEATHON_SLUG = 'ideathon-ankara'

export default function IdeathonAnkaraHome() {
    useSetIdeathonSlug(IDEATHON_SLUG)

    return (
        <>
            <Head>
                <title>Emlak Konut Ideathon Ankara</title>
                <meta name="description" content="Emlak Konut Ideathon, şehirlerin geleceğini teknolojiyle, sürdürülebilirlikle ve yaşama değer katacak yenilikçi fikirlerle şekillendiren bir fikir maratonudur." />
                <meta name="keywords" content="Emlak Konut, Ideathon Ankara, akıllı şehir, inovasyon, teknoloji, toplu yaşam, Ankara, başkent" />
                <meta name="author" content="EKA Enerji ve Teknoloji A.Ş." />
                <meta name="robots" content="index, follow" />
                <meta name="language" content="tr-TR" />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://ideathon.anahtarfikirler.com/ideathon-ankara" />
                <meta property="og:title" content="Emlak Konut Ideathon Ankara" />
                <meta property="og:description" content="Emlak Konut Ideathon, şehirlerin geleceğini teknolojiyle, sürdürülebilirlikle ve yaşama değer katacak yenilikçi fikirlerle şekillendiren bir fikir maratonudur." />
                <meta property="og:image" content="https://ideathon.anahtarfikirler.com/img/ankara/ideathon-ankara.jpg" />
                <meta property="og:site_name" content="Emlak Konut Ideathon" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Emlak Konut Ideathon Ankara" />
                <meta name="twitter:description" content="Emlak Konut Ideathon, şehirlerin geleceğini teknolojiyle, sürdürülebilirlikle ve yaşama değer katacak yenilikçi fikirlerle şekillendiren bir fikir maratonudur." />
                <meta name="twitter:image" content="https://ideathon.anahtarfikirler.com/img/ankara/ideathon-ankara.jpg" />

                {/* Canonical URL */}
                <link rel="canonical" href="https://ideathon.anahtarfikirler.com/ideathon-ankara" />

                {/* Structured Data / JSON-LD */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Event",
                            "@id": "https://ideathon.anahtarfikirler.com/ideathon-ankara#event",
                            "name": "Emlak Konut Ideathon Ankara",
                            "description": "Başkentin inovasyon gücüyle toplu yaşam alanlarının geleceğini teknolojiyle, sürdürülebilirlikle ve yenilikçi fikirlerle şekillendiren fikir maratonu.",
                            "url": "https://ideathon.anahtarfikirler.com/ideathon-ankara",
                            "startDate": "2026-03-03",
                            "endDate": "2026-04-04",
                            "eventStatus": "https://schema.org/EventScheduled",
                            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                            "location": {
                                "@type": "Place",
                                "name": "Ankara",
                                "address": {
                                    "@type": "PostalAddress",
                                    "addressLocality": "Ankara",
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
                                "validFrom": "2026-03-03",
                                "url": "https://ideathon.anahtarfikirler.com/ideathon-ankara"
                            },
                            "image": "https://ideathon.anahtarfikirler.com/img/ankara/ideathon-ankara.jpg"
                        })
                    }}
                />
            </Head>

            <Layout>
                <div className="box-layout">
                    <HeroSectionAnkara />
                    <AboutSectionAnkara />
                    <PartnersSectionAnkara />
                    <ProgramsSectionAnkara />
                    <TimelineSectionAnkara />
                    <AwardsSectionAnkara />
                    <SupportSection />
                    <FAQSectionAnkara />
                </div>
                <ContactSection />
            </Layout>
            <Script src="/js/main.js" strategy="afterInteractive" />
        </>
    )
}
