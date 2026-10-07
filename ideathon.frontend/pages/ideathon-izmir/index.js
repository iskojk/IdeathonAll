/**
 * Ideathon İzmir Anasayfa
 * Slug: ideathon-izmir
 * Emlak Konut Ideathon İzmir — Enerji Verimli Yapılar ve Akıllı Mobilite
 */

import Head from 'next/head'
import Script from 'next/script'
import Layout from '@/components/Layout'
import HeroSectionIzmir from '@/components/sections/ideathon-izmir/HeroSectionIzmir'
import AboutSectionIzmir from '@/components/sections/ideathon-izmir/AboutSectionIzmir'
import PartnersSectionIzmir from '@/components/sections/ideathon-izmir/PartnersSectionIzmir'
import ProgramsSectionIzmir from '@/components/sections/ideathon-izmir/ProgramsSectionIzmir'
import TimelineSectionIzmir from '@/components/sections/ideathon-izmir/TimelineSectionIzmir'
import AwardsSectionIzmir from '@/components/sections/ideathon-izmir/AwardsSectionIzmir'
import SupportSection from '@/components/sections/SupportSection'
import FAQSectionIzmir from '@/components/sections/ideathon-izmir/FAQSectionIzmir'
import ContactSection from '@/components/sections/ContactSection'
import { useSetIdeathonSlug } from '@/context/IdeathonContext'

const IDEATHON_SLUG = 'ideathon-izmir'

export default function IdeathonIzmirHome() {
    useSetIdeathonSlug(IDEATHON_SLUG)

    return (
        <>
            <Head>
                <title>Emlak Konut Ideathon İzmir</title>
                <meta name="description" content="Emlak Konut Ideathon, şehirlerin geleceğini teknolojiyle, sürdürülebilirlikle ve yaşama değer katacak yenilikçi fikirlerle şekillendiren bir fikir maratonudur." />
                <meta name="keywords" content="Emlak Konut, Ideathon İzmir, enerji verimliliği, akıllı mobilite, sürdürülebilir yaşam, İzmir" />
                <meta name="author" content="EKA Enerji ve Teknoloji A.Ş." />
                <meta name="robots" content="index, follow" />
                <meta name="language" content="tr-TR" />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://ideathon.anahtarfikirler.com/ideathon-izmir" />
                <meta property="og:title" content="Emlak Konut Ideathon İzmir" />
                <meta property="og:description" content="Emlak Konut Ideathon, şehirlerin geleceğini teknolojiyle, sürdürülebilirlikle ve yaşama değer katacak yenilikçi fikirlerle şekillendiren bir fikir maratonudur." />
                <meta property="og:image" content="https://ideathon.anahtarfikirler.com/img/izmir/ideathon-izmir.jpg" />
                <meta property="og:site_name" content="Emlak Konut Ideathon" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Emlak Konut Ideathon İzmir" />
                <meta name="twitter:description" content="Emlak Konut Ideathon, şehirlerin geleceğini teknolojiyle, sürdürülebilirlikle ve yaşama değer katacak yenilikçi fikirlerle şekillendiren bir fikir maratonudur." />
                <meta name="twitter:image" content="https://ideathon.anahtarfikirler.com/img/izmir/ideathon-izmir.jpg" />

                {/* Canonical URL */}
                <link rel="canonical" href="https://ideathon.anahtarfikirler.com/ideathon-izmir" />

                {/* Structured Data / JSON-LD */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Event",
                            "@id": "https://ideathon.anahtarfikirler.com/ideathon-izmir#event",
                            "name": "Emlak Konut Ideathon İzmir",
                            "description": "Enerji verimli yapılar ve akıllı mobilite entegrasyonu ile sürdürülebilir yaşam odağında yenilikçi fikirlerin şekillendiği fikir maratonu.",
                            "url": "https://ideathon.anahtarfikirler.com/ideathon-izmir",
                            "startDate": "2026-03-06",
                            "endDate": "2026-04-11",
                            "eventStatus": "https://schema.org/EventScheduled",
                            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                            "location": {
                                "@type": "Place",
                                "name": "İzmir, Konak",
                                "address": {
                                    "@type": "PostalAddress",
                                    "addressLocality": "İzmir",
                                    "addressRegion": "Konak",
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
                                "validFrom": "2026-03-06",
                                "url": "https://ideathon.anahtarfikirler.com/ideathon-izmir"
                            },
                            "image": "https://ideathon.anahtarfikirler.com/img/izmir/ideathon-izmir.jpg"
                        })
                    }}
                />
            </Head>

            <Layout>
                <div className="box-layout">
                    <HeroSectionIzmir />
                    <AboutSectionIzmir />
                    <PartnersSectionIzmir />
                    <ProgramsSectionIzmir />
                    <TimelineSectionIzmir />
                    <AwardsSectionIzmir />
                    <SupportSection />
                    <FAQSectionIzmir />
                </div>
                <ContactSection />
            </Layout>
            <Script src="/js/main.js" strategy="afterInteractive" />
        </>
    )
}
