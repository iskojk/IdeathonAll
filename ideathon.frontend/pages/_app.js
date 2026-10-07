import { useEffect } from 'react'
import Script from 'next/script'
import { AuthProvider } from '@/context/AuthContext'
import { IdeathonProvider } from '@/context/IdeathonContext'
import { SocketProvider } from '@/context/SocketContext'
import { NotificationProvider } from '@/components/Notification'
import '@/styles/auth.css'
import '@/styles/main.css'
import '@/styles/mentornet.css'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Remove no-js class
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('no-js')
    }
  }, [])

  return (
    <>
      {/* jQuery */}
      <Script src="/js/jquery.js" strategy="beforeInteractive" />

      {/* Anime.js - Load before other scripts */}
      <Script src="/js/vendors/anime.min.js" strategy="beforeInteractive" />

      {/* Vendor Scripts */}
      <Script src="/js/vendors.min.js" strategy="afterInteractive" />

      {/* Main Scripts */}
      <Script src="/js/main.js" strategy="afterInteractive" />
      <Script src="/js/custom.js" strategy="afterInteractive" />

      <IdeathonProvider>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <Component {...pageProps} />
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
      </IdeathonProvider>
    </>
  )
}