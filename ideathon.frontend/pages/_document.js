import { Html, Head, Main, NextScript } from 'next/document'
import Script from 'next/script'

export default function Document() {
  return (
    <Html lang="tr" className="no-js">
      <Head>
        {/* Favicon and Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/img/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/img/favicon.png" />
        <link rel="shortcut icon" href="/img/favicon.png" />
        
        {/* Google Fonts Preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* CSS Files with Cache Optimization */}
        <link rel="preload" href="/css/vendors.min.css" as="style" />
        <link rel="preload" href="/css/icon.min.css" as="style" />
        <link rel="preload" href="/css/style.css" as="style" />
        <link rel="preload" href="/css/responsive.css" as="style" />
        <link rel="preload" href="/css/main.css" as="style" />

        <link rel="stylesheet" href="/css/vendors.min.css" />
        <link rel="stylesheet" href="/css/icon.min.css" />
        <link rel="stylesheet" href="/css/style.css" />
        <link rel="stylesheet" href="/css/responsive.css" />
        <link rel="stylesheet" href="/css/main.css" />
      </Head>
      <body className="background-position-center-top">
        <Main />
        <NextScript />
        <Script src="/js/vendors/jquery.appear.js" strategy="beforeInteractive" />
        <Script src="/js/vendors/jquery-cookie.js" strategy="beforeInteractive" />
        <Script src="/js/vendors/jquery.count-to.js" strategy="beforeInteractive" />
        <Script src="/js/vendors/jquery.magnific-popup.js" strategy="beforeInteractive" />
        <Script src="/js/vendors/isotope.pkgd.js" strategy="beforeInteractive" />
      </body>
    </Html>
  )
}

