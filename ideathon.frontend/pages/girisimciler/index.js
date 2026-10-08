import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { entrepreneurAPI } from '@/lib/api';

export default function Entrepreneurs() {
  const { user, isAuthenticated, loading } = useAuth();
  const [applicationState, setApplicationState] = useState(null);
  const userId = user?._id;
  const currentState = applicationState?.userId === userId ? applicationState : null;
  const checkingApplication = loading || (isAuthenticated && (!currentState || currentState.loading));
  const submitted = isAuthenticated && ['submitted', 'pending_approval', 'approved'].includes(currentState?.status);
  const submittedDate = currentState?.submittedAt ? new Date(currentState.submittedAt) : null;
  const formattedSubmittedDate = submittedDate && !Number.isNaN(submittedDate.getTime())
    ? submittedDate.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'medium', timeStyle: 'short' }) : null;

  useEffect(() => {
    if (loading || !isAuthenticated || !userId) {
      setApplicationState(null);
      return;
    }
    let cancelled = false;
    setApplicationState({ userId, loading: true });
    entrepreneurAPI.getMyApplication().then(({ data }) => {
      if (!cancelled) setApplicationState({ userId, status: data.application?.status || 'draft', ventureName: data.application?.answers?.venture_name, submittedAt: data.application?.submittedAt, loading: false });
    }).catch(() => {
      if (!cancelled) setApplicationState({ userId, error: true, loading: false });
    });
    return () => { cancelled = true; };
  }, [loading, isAuthenticated, userId]);

  return (
    <>
      <Head>
        <title>Girişimciler - Emlak Konut Ideathon</title>
        <meta name="description" content="Girişiminizi tanıtın, başvuru sorularını yanıtlayın ve evraklarınızı yükleyin." />
      </Head>
      <Layout>
        <section className={`entrepreneur-section${submitted ? ' entrepreneur-section-submitted' : ''}`}>
          <div className="container">
            <div className={submitted ? 'entrepreneur-submitted-layout' : 'row align-items-center g-5'}>
              <div className={submitted ? 'entrepreneur-submitted-intro' : 'col-lg-6'}>
                {submitted ? <div className="entrepreneur-completed-intro">
                  <span className="entrepreneur-completed-label"><i className="bi bi-briefcase" aria-hidden="true" /> Girişimci Başvurusu</span>
                  <h1>Girişiminizin <span className="entrepreneur-heading-phrase">geleceği için</span> <span>ilk adımı attınız.</span></h1>
                  <p className="entrepreneur-intro">Girişiminizi, ekibinizi ve çözümünüzü tanıtan başvurunuz bize ulaştı. Başvuru dosyanızdaki tüm bilgilere hesabınızdan ulaşabilirsiniz.</p>
                </div> : <>
                  <span className="entrepreneur-label"><i className="bi bi-lightbulb" aria-hidden="true" /> Girişimciler</span>
                  <h1>Girişiminizle<br /><span>geleceğe katkı sunun.</span></h1>
                  <p className="entrepreneur-intro">Şehirlerin ve yaşam alanlarının geleceğine yönelik fikirlerinizi paylaşın. Girişimci olarak başvurunuzu buradan başlatın.</p>
                  <ol className="entrepreneur-steps">
                    <li><span>1</span> Hesabınıza giriş yapın veya kayıt olun.</li>
                    <li><span>2</span> Girişiminizle ilgili soruları yanıtlayın.</li>
                    <li><span>3</span> Evraklarınızı yükleyip başvurunuzu tamamlayın.</li>
                  </ol>
                </>}
              </div>
              <div className={submitted ? 'entrepreneur-submitted-aside' : 'col-lg-5 offset-lg-1'}>
                {submitted ? <div className="entrepreneur-card entrepreneur-submitted-card">
                  <div className="entrepreneur-completed-status" role="status"><span aria-hidden="true"><i className="bi bi-check-lg" /></span>Başvurunuz iletildi</div>
                  <h2>Başvuru dosyanız</h2>
                  <p className="entrepreneur-completed-description">Gönderdiğiniz bilgileri ve belgeleri tek bir yerden inceleyebilirsiniz.</p>
                  {(currentState?.ventureName || formattedSubmittedDate) && <dl className="entrepreneur-file-info">
                    {currentState?.ventureName && <div><dt>Girişim adı</dt><dd>{currentState.ventureName}</dd></div>}
                    {formattedSubmittedDate && <div><dt>Gönderim tarihi</dt><dd><time dateTime={currentState.submittedAt}>{formattedSubmittedDate}</time></dd></div>}
                  </dl>}
                  <div className="entrepreneur-view entrepreneur-completed-view"><Link href="/girisimciler/basvuru" className="entrepreneur-view-button">Başvurumu Görüntüle <i className="bi bi-arrow-right" aria-hidden="true" /></Link></div>
                </div> : <div className="entrepreneur-card">
                  <div className="entrepreneur-icon"><i className="bi bi-briefcase" aria-hidden="true" /></div>
                  <h2>Girişimci Başvurusu</h2>
                  <p>Metin, seçim ve evrak yükleme alanlarıyla başvurunuzu hazırlayın. Taslağınızı kaydedip daha sonra devam edebilirsiniz.</p>
                  {checkingApplication ? <div className="entrepreneur-status entrepreneur-status-loading" role="status">Başvuru durumunuz kontrol ediliyor...</div> : currentState?.error ? <div className="entrepreneur-status entrepreneur-status-loading" role="status">Başvuru durumunuz şu anda alınamadı. Başvurunuzu aşağıdan görüntüleyebilirsiniz.</div> : <Link href={isAuthenticated ? '/girisimciler/basvuru' : '/girisimciler/login'} className="submit-btn-primary w-100">
                    <span>{!loading && isAuthenticated ? 'Başvuruya Devam Et' : 'Giriş Yap ve Başvur'}</span>
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                  </Link>}
                  {!loading && !isAuthenticated && (
                    <p className="entrepreneur-register">Hesabınız yok mu? <Link href="/girisimciler/register">Kayıt Ol</Link></p>
                  )}
                  {!checkingApplication && isAuthenticated && <div className="entrepreneur-view"><Link href="/girisimciler/basvuru" className="entrepreneur-view-button">Başvurumu Görüntüle <i className="bi bi-arrow-right" aria-hidden="true" /></Link></div>}
                </div>}
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
        .entrepreneur-section-submitted { padding: 72px 0 84px; }
        .entrepreneur-submitted-layout { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr); align-items: center; gap: 48px; max-width: 1080px; margin: 0 auto; }
        .entrepreneur-submitted-intro, .entrepreneur-submitted-aside { min-width: 0; }
        .entrepreneur-completed-label { display: inline-flex; align-items: center; gap: 10px; color: #0065ae; font-size: 13px; font-weight: 500; margin-bottom: 22px; }
        .entrepreneur-completed-label i { display: grid; place-items: center; width: 36px; height: 36px; background: #e6f1fd; border: 1px solid #d6e8f9; border-radius: 10px; font-size: 18px; }
        .entrepreneur-completed-intro h1 { max-width: 540px; font-size: clamp(32px, 3vw, 42px); line-height: 1.25; font-weight: 600; letter-spacing: -0.7px; color: #243451; margin-bottom: 22px; }
        .entrepreneur-completed-intro h1 span { display: block; }
        .entrepreneur-completed-intro h1 .entrepreneur-heading-phrase { display: inline; white-space: nowrap; color: inherit; }
        .entrepreneur-completed-intro .entrepreneur-intro { margin-bottom: 0; font-size: 16px; line-height: 1.85; color: #59677e; }
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
        .entrepreneur-status { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px; border: 1px solid; border-radius: 12px; font-size: 15px; line-height: 1.6; text-align: center; }
        .entrepreneur-status-loading { background: #f5f8fc; border-color: #e0e7f1; color: #59677e; font-size: 13px; }
        .entrepreneur-view { display: flex; justify-content: center; margin-top: 16px; }
        .entrepreneur-view :global(.entrepreneur-view-button) { display: inline-flex; align-items: center; justify-content: center; gap: 8px; max-width: 100%; padding: 9px 14px; border: 1px solid #c9deef; border-radius: 8px; color: #0065ae; background: #f6faff; font-size: 13px; font-weight: 600; line-height: 1.6; text-align: center; }
        .entrepreneur-view :global(.entrepreneur-view-button:hover) { background: #eaf3fc; border-color: #8bbde0; }
        .entrepreneur-view :global(.entrepreneur-view-button:focus-visible) { outline: 3px solid #78bee9; outline-offset: 3px; }
        .entrepreneur-submitted-card { padding: 30px; border-radius: 18px; border-color: #d8e5f2; box-shadow: 0 12px 36px #163c630a; }
        .entrepreneur-completed-status { display: flex; align-items: center; gap: 9px; color: #15764e; font-size: 13px; font-weight: 500; margin-bottom: 22px; }
        .entrepreneur-completed-status > span { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: #e6f5ee; font-size: 15px; }
        .entrepreneur-submitted-card h2 { font-size: 25px; font-weight: 600; color: #243451; margin-bottom: 10px; }
        .entrepreneur-submitted-card .entrepreneur-completed-description { font-size: 14px; line-height: 1.8; margin-bottom: 0; color: #69778c; }
        .entrepreneur-file-info { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin: 22px 0 0; padding: 18px 20px; border: 1px solid #e5edf6; border-radius: 10px; background: #f7faff; }
        .entrepreneur-file-info div { min-width: 0; }
        .entrepreneur-file-info dt { font-size: 11px; font-weight: 400; line-height: 1.5; color: #69778c; margin-bottom: 4px; }
        .entrepreneur-file-info dd { margin: 0; color: #34435b; font-size: 14px; font-weight: 500; line-height: 1.6; overflow-wrap: anywhere; }
        .entrepreneur-file-info time { font-size: 13px; font-weight: 400; font-variant-numeric: tabular-nums; }
        .entrepreneur-completed-view { margin-top: 22px; }
        .entrepreneur-completed-view :global(.entrepreneur-view-button) { width: 60%; padding: 10px 16px; justify-content: center; gap: 10px; border-color: #0079ca; background: #0079ca; color: white; border-radius: 9px; font-size: 13px; font-weight: 500; }
        .entrepreneur-completed-view :global(.entrepreneur-view-button:hover) { background: #0065ae; border-color: #0065ae; color: white; }
        @media (max-width: 991px) { .entrepreneur-submitted-layout { max-width: 680px; grid-template-columns: 1fr; gap: 30px; } .entrepreneur-completed-intro h1 { max-width: 580px; } }
        @media (max-width: 767px) { .entrepreneur-section { padding: 45px 0 60px; } .entrepreneur-card { padding: 26px 22px; } }
        @media (max-width: 575px) { .entrepreneur-section-submitted { padding: 36px 0 48px; } .entrepreneur-completed-label { margin-bottom: 18px; } .entrepreneur-completed-intro h1 { font-size: 31px; } .entrepreneur-completed-intro .entrepreneur-intro { font-size: 14px; } .entrepreneur-submitted-card h2 { font-size: 23px; } .entrepreneur-file-info { grid-template-columns: 1fr; padding: 16px; gap: 14px; } .entrepreneur-completed-view :global(.entrepreneur-view-button) { gap: 8px; padding: 10px 13px; font-size: 12px; } }
      `}</style>
    </>
  );
}
