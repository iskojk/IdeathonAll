import Header from './Header'
import Footer from './Footer'
import FloatingApplyButton from './FloatingApplyButton'

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <FloatingApplyButton />
    </>
  )
}

