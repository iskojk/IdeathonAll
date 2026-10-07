/**
 * Ideathon Kahramanmaraş Anasayfa
 * Slug: ideathon-kahramanmaras
 * Emlak Konut Ideathon Kahramanmaraş — Afetlere Dayanıklı Yapılar ve Akıllı Afet Yönetimi
 */

import Head from 'next/head'
import Script from 'next/script'
import Layout from '@/components/Layout'
import HeroSectionKahramanmaras from '@/components/sections/ideathon-kahramanmaras/HeroSectionKahramanmaras'
import AboutSectionKahramanmaras from '@/components/sections/ideathon-kahramanmaras/AboutSectionKahramanmaras'
import PartnersSectionKahramanmaras from '@/components/sections/ideathon-kahramanmaras/PartnersSectionKahramanmaras'
import ProgramsSectionKahramanmaras from '@/components/sections/ideathon-kahramanmaras/ProgramsSectionKahramanmaras'
import TimelineSectionKahramanmaras from '@/components/sections/ideathon-kahramanmaras/TimelineSectionKahramanmaras'
import AwardsSectionKahramanmaras from '@/components/sections/ideathon-kahramanmaras/AwardsSectionKahramanmaras'
import SupportSection from '@/components/sections/SupportSection'
import FAQSectionKahramanmaras from '@/components/sections/ideathon-kahramanmaras/FAQSectionKahramanmaras'
import ContactSection from '@/components/sections/ContactSection'
import { useSetIdeathonSlug } from '@/context/IdeathonContext'

const IDEATHON_SLUG = 'ideathon-kahramanmaras'

export default function IdeathonKahramanmarasHome() {
    useSetIdeathonSlug(IDEATHON_SLUG)

    return (
        <>
            <Head>
                <title>Emlak Konut Ideathon Kahramanmaraş</title>
                <meta name="description" content="Emlak Konut Ideathon Kahramanmaraş, afetlere dayanıklı yapı teknolojileri ve akıllı afet yönetimi çözümleri alanında yenilikçi fikirlerin geliştirilmesini destekleyen fikir maratonudur." />
                <meta name="keywords" content="Emlak Konut, Ideathon Kahramanmaraş, afetlere dayanıklı yapılar, akıllı afet yönetimi, inovasyon, teknoloji, Kahramanmaraş" />
                <meta name="author" content="EKA Enerji ve Teknoloji A.Ş." />
                <meta name="robots" content="index, follow" />
                <meta name="language" content="tr-TR" />

                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://ideathon.anahtarfikirler.com/ideathon-kahramanmaras" />
                <meta property="og:title" content="Emlak Konut Ideathon Kahramanmaraş" />
                <meta property="og:description" content="Emlak Konut Ideathon Kahramanmaraş, afetlere dayanıklı yapı teknolojileri ve akıllı afet yönetimi çözümleri alanında yenilikçi fikirlerin geliştirilmesini destekleyen fikir maratonudur." />
                <meta property="og:image" content="https://ideathon.anahtarfikirler.com/img/maras/ideathon-maras.jpg" />
                <meta property="og:site_name" content="Emlak Konut Ideathon" />

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Emlak Konut Ideathon Kahramanmaraş" />
                <meta name="twitter:description" content="Emlak Konut Ideathon Kahramanmaraş, afetlere dayanıklı yapı teknolojileri ve akıllı afet yönetimi çözümleri alanında yenilikçi fikirlerin geliştirilmesini destekleyen fikir maratonudur." />
                <meta name="twitter:image" content="https://ideathon.anahtarfikirler.com/img/maras/ideathon-maras.jpg" />

                <link rel="canonical" href="https://ideathon.anahtarfikirler.com/ideathon-kahramanmaras" />

                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Event",
                            "@id": "https://ideathon.anahtarfikirler.com/ideathon-kahramanmaras#event",
                            "name": "Emlak Konut Ideathon Kahramanmaraş",
                            "description": "Afetlere dayanıklı yapı teknolojileri ve akıllı afet yönetimi çözümleri alanında yenilikçi fikirlerin geliştirilmesini destekleyen fikir maratonu.",
                            "url": "https://ideathon.anahtarfikirler.com/ideathon-kahramanmaras",
                            "startDate": "2026-04-13",
                            "endDate": "2026-05-09",
                            "eventStatus": "https://schema.org/EventScheduled",
                            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                            "location": {
                                "@type": "Place",
                                "name": "Kahramanmaraş Sütçü İmam Üniversitesi - Kahramanmaraş Teknokent",
                                "address": {
                                    "@type": "PostalAddress",
                                    "addressLocality": "Kahramanmaraş",
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
                                "validFrom": "2026-04-13",
                                "url": "https://ideathon.anahtarfikirler.com/ideathon-kahramanmaras"
                            },
                            "image": "https://ideathon.anahtarfikirler.com/img/maras/ideathon-maras.jpg"
                        })
                    }}
                />
            </Head>

            <Layout>
                <div className="box-layout">
                    <HeroSectionKahramanmaras />
                    <AboutSectionKahramanmaras />
                    <PartnersSectionKahramanmaras />
                    <ProgramsSectionKahramanmaras />
                    <TimelineSectionKahramanmaras />
                    <AwardsSectionKahramanmaras />
                    <SupportSection />
                    <FAQSectionKahramanmaras />
                </div>
                <ContactSection />
            </Layout>
            <Script src="/js/main.js" strategy="afterInteractive" />
        </>
    )
}
