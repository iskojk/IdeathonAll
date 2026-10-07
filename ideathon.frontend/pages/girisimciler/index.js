import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';

export default function Entrepreneurs() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <>
      <Head>
        <title>Girişimciler - Emlak Konut Ideathon</title>
        <meta name="description" content="Girişiminizi tanıtın, başvuru sorularını yanıtlayın ve evraklarınızı yükleyin." />
      </Head>
      <Layout>
        <section className="entrepreneur-section">
          <div className="container">
            <div className="row align-items-center g-5">
              <div className="col-lg-6">
                <span className="entrepreneur-label"><i className="bi bi-lightbulb" aria-hidden="true" /> Girişimciler</span>
                <h1>Girişiminizle<br /><span>geleceğe katkı sunun.</span></h1>
                <p className="entrepreneur-intro">Şehirlerin ve yaşam alanlarının geleceğine yönelik fikirlerinizi paylaşın. Girişimci olarak başvurunuzu buradan başlatın.</p>
                <ol className="entrepreneur-steps">
                  <li><span>1</span> Hesabınıza giriş yapın veya kayıt olun.</li>
                  <li><span>2</span> Girişiminizle ilgili soruları yanıtlayın.</li>
                  <li><span>3</span> Evraklarınızı yükleyip başvurunuzu tamamlayın.</li>
                </ol>
              </div>
              <div className="col-lg-5 offset-lg-1">
                <div className="entrepreneur-card">
                  <div className="entrepreneur-icon"><i className="bi bi-briefcase" aria-hidden="true" /></div>
                  <h2>Girişimci Başvurusu</h2>
                  <p>Metin, seçim ve evrak yükleme alanlarıyla başvurunuzu hazırlayın. Taslağınızı kaydedip daha sonra devam edebilirsiniz.</p>
                  <Link href={isAuthenticated ? '/girisimciler/basvuru' : '/girisimciler/login'} className="submit-btn-primary w-100">
                    <span>{!loading && isAuthenticated ? 'Başvuruya Devam Et' : 'Giriş Yap ve Başvur'}</span>
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                  </Link>
                  {!loading && !isAuthenticated && (
                    <p className="entrepreneur-register">Hesabınız yok mu? <Link href="/girisimciler/register">Kayıt Ol</Link></p>
                  )}
                  {!loading && isAuthenticated && <Link href="/girisimciler/basvuru" className="entrepreneur-register d-block">Girişimci Başvurumu Görüntüle</Link>}
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
      <style jsx>{`
        .entrepreneur-section { margin-top: 140px; padding: 90px 0 100px; background: linear-gradient(140deg, #f1f6ff, #fff 70%); }
        .entrepreneur-label { display: inline-flex; align-items: center; gap: 8px; color: #0065ae; background: #e3f1ff; border-radius: 30px; padding: 8px 18px; font-weight: 600; margin-bottom: 24px; }
        h1 { font-size: clamp(34px, 3.4vw, 52px); line-height: 1.16; font-weight: 700; letter-spacing: -1px; margin-bottom: 24px; }
        h1 span { color: #0079ca; }
        .entrepreneur-intro { font-size: 18px; line-height: 1.8; color: #4a5568; max-width: 540px; }
        .entrepreneur-steps { padding: 0; margin: 32px 0 0; list-style: none; }
        .entrepreneur-steps li { display: flex; align-items: center; gap: 14px; margin: 16px 0; color: #34435b; }
        .entrepreneur-steps span { display: grid; place-items: center; flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; background: #e4edfc; color: #042070; font-weight: 700; }
        .entrepreneur-card { background: white; padding: 36px; border: 1px solid #dfe8f5; border-radius: 22px; box-shadow: 0 18px 50px #0420700d; }
        .entrepreneur-icon { display: grid; place-items: center; width: 56px; height: 56px; background: #edf5ff; color: #0079ca; border-radius: 16px; font-size: 26px; margin-bottom: 22px; }
        h2 { font-size: 27px; line-height: 1.3; font-weight: 700; margin-bottom: 12px; }
        .entrepreneur-card p { color: #4a5568; font-size: 15px; }
        .entrepreneur-register { margin: 22px 0 0; text-align: center; font-size: 15px; }
        .entrepreneur-register a { font-weight: 600; color: #0065ae; }
        .entrepreneur-notice { padding: 12px; background: #fff7e5; border-radius: 10px; }
        @media (max-width: 767px) { .entrepreneur-section { padding: 45px 0 60px; } .entrepreneur-card { padding: 26px 22px; } }
      `}</style>
    </>
  );
}
