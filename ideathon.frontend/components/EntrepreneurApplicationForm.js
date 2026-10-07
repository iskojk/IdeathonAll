import { Fragment, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { entrepreneurAPI } from '@/lib/api';
import { readDraft, storeDraft, clearDraft, canRestoreDraft } from '@/lib/entrepreneurDraft';
import SearchableSelect from '@/components/SearchableSelect';
import EntrepreneurApplicationSummary from '@/components/EntrepreneurApplicationSummary';
import styles from '@/styles/entrepreneur.module.css';

function answered(question, answers, documents) {
  if (question.type === 'file') return documents.some(doc => doc.questionId === question.id);
  if (question.type === 'consent') return answers[question.id] === true;
  const value = answers[question.id];
  return Array.isArray(value) ? value.length > 0 : typeof value === 'string' && value.trim().length > 0;
}

const typeLabels = { text: 'Kısa yanıt', textarea: 'Uzun yanıt', singleChoice: 'Tek seçim', multipleChoice: 'Çoklu seçim', file: 'Evrak yükleme', consent: 'Aydınlatma ve onay' };

export default function EntrepreneurApplicationForm() {
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [application, setApplication] = useState(null);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false);
  const [retry, setRetry] = useState(0);
  const [autoSavePaused, setAutoSavePaused] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState(null);
  const answersRef = useRef({});
  const applicationRef = useRef(null);
  const operation = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    entrepreneurAPI.getMyApplication().then(({ data }) => {
      if (cancelled) return;
      setForm(data.form);
      setApplication(data.application);
      const initial = {};
      if (!data.application) {
        data.form.questions.forEach(question => {
          if (question.prefill && user?.[question.prefill]) initial[question.id] = user[question.prefill];
        });
      }
      const backup = readDraft(user?._id);
      const restore = canRestoreDraft(backup, data.form, data.application);
      const unchanged = backup && JSON.stringify(backup.answers) === JSON.stringify(data.application?.answers);
      if (unchanged) clearDraft(user?._id);
      setRecoveryDraft(backup && !restore && !unchanged ? backup : null);
      const loadedAnswers = restore ? backup.answers : data.application?.answers || initial;
      answersRef.current = loadedAnswers;
      applicationRef.current = data.application;
      setAnswers(loadedAnswers);
      setDirty(restore && !unchanged);
      setAutoSavePaused(false);
      if (restore && !unchanged) setNotice('Kaydedilmemiş yanıtlarınız bu sekmeden geri yüklendi.');
    }).catch(err => { if (!cancelled) setError(err.message || 'Başvuru yüklenemedi.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?._id, retry]);

  useEffect(() => {
    if (!dirty && !busy) return;
    const warnOnUnload = event => { event.preventDefault(); event.returnValue = ''; };
    const warnOnLink = event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.('a[href]');
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const destination = new URL(link.href, window.location.href);
      if (!['http:', 'https:'].includes(destination.protocol)) return;
      if (destination.origin === location.origin && destination.pathname === location.pathname && destination.search === location.search) return;
      if (!window.confirm('Yanıtlarınızın kaydı henüz tamamlanmadı. Bu sayfadan ayrılmak istiyor musunuz?')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', warnOnUnload);
    document.addEventListener('click', warnOnLink, true);
    return () => {
      window.removeEventListener('beforeunload', warnOnUnload);
      document.removeEventListener('click', warnOnLink, true);
    };
  }, [dirty, busy]);

  useEffect(() => {
    if (!dirty || loading || busy || autoSavePaused || recoveryDraft || !form || (application && application.status !== 'draft')) return;
    const timer = setTimeout(() => save(false, true), 1500);
    return () => clearTimeout(timer);
  }, [answers, dirty, loading, busy, autoSavePaused, recoveryDraft, form, application]);

  const documents = application?.documents || [];
  const consentMissing = [...(form?.questions || []), ...(form?.agreements || [])].some(question => question.type === 'consent' && question.required && answers[question.id] !== true);
  const submitted = !!application && application.status !== 'draft';
  const ApplicationView = submitted ? EntrepreneurApplicationSummary : Fragment;
  const locked = (!!busy && busy !== 'autosave') || submitted || !!recoveryDraft;
  const sections = form?.sections.filter(section => form.questions.some(question => question.section === section.id)) || [];
  const currentSection = sections[step];
  const currentQuestions = form?.questions.filter(question => question.section === currentSection?.id) || [];
  const completed = form?.questions.filter(question => answered(question, answers, documents)).length || 0;

  function changeAnswer(id, value) {
    const next = { ...answersRef.current, [id]: value };
    answersRef.current = next;
    setAnswers(next);
    storeDraft(user?._id, form, applicationRef.current, next);
    setErrors(previous => ({ ...previous, [id]: '' }));
    setDirty(true);
    setAutoSavePaused(false);
    setNotice('');
  }

  function handleError(err) {
    setError(err.message || 'İşlem tamamlanamadı. Lütfen tekrar deneyin.');
    if (err.errors) {
      setErrors(err.errors);
      const firstQuestion = form.questions.find(question => err.errors[question.id]);
      if (firstQuestion) {
        setStep(sections.findIndex(section => section.id === firstQuestion.section));
        setTimeout(() => document.getElementById(`question-${firstQuestion.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      }
      else if (form.agreements?.some(agreement => err.errors[agreement.id])) setStep(sections.length - 1);
    }
  }

  async function persist(submit = false) {
    const snapshot = answersRef.current;
    const response = await entrepreneurAPI.saveApplication({ answers: snapshot, submit, revision: applicationRef.current?.revision, formVersion: form.version });
    const saved = response.data.application;
    // A response from a page we left must not clear a newer page's recovery copy.
    if (!mounted.current) return saved;
    applicationRef.current = saved;
    setApplication(saved);
    // Typing can continue during autosave. An older response must not erase it.
    if (answersRef.current === snapshot) {
      answersRef.current = saved.answers;
      setAnswers(saved.answers);
      setDirty(false);
      clearDraft(user?._id);
    } else {
      storeDraft(user?._id, form, saved, answersRef.current);
    }
    setErrors({});
    return saved;
  }

  async function save(submit = false, automatic = false) {
    if (operation.current || recoveryDraft) return;
    operation.current = true;
    setBusy(submit ? 'submit' : automatic ? 'autosave' : 'save');
    setError('');
    setNotice('');
    try {
      await persist(submit);
      if (!mounted.current) return;
      setNotice(submit ? 'Başvurunuz girişimci havuzuna iletildi.' : automatic ? '' : 'Taslağınız kaydedildi. Daha sonra buradan devam edebilirsiniz.');
      if (submit) window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (!mounted.current) return;
      setAutoSavePaused(true);
      if (automatic) {
        if (err.errors) setErrors(err.errors);
        setError(`Otomatik kayıt tamamlanamadı. ${err.message || 'Bağlantınızı kontrol edip Taslağı Kaydet ile tekrar deneyin.'}`);
      }
      else handleError(err);
    }
    finally { operation.current = false; if (mounted.current) setBusy(''); }
  }

  async function upload(question, event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (operation.current || recoveryDraft) return;
    setError('');
    if (file.size > form.maxFileSize) { setError('Dosya boyutu en fazla 10 MB olabilir.'); return; }
    if (!form.acceptedFileTypes.includes(file.type)) { setError('PDF, PNG veya JPEG biçiminde bir dosya seçin.'); return; }
    operation.current = true;
    setBusy(question.id);
    setNotice('');
    try {
      const saved = await persist();
      const response = await entrepreneurAPI.uploadDocument(question.id, file, saved.revision);
      if (!mounted.current) return;
      applicationRef.current = response.data.application;
      setApplication(response.data.application);
      setNotice('Evrak yüklendi ve taslağınıza kaydedildi.');
    } catch (err) { handleError(err); }
    finally { operation.current = false; setBusy(''); }
  }

  async function remove(document) {
    if (operation.current || recoveryDraft) return;
    operation.current = true;
    setBusy(document._id);
    setError('');
    try {
      const response = await entrepreneurAPI.removeDocument(document._id, application.revision);
      if (!mounted.current) return;
      applicationRef.current = response.data.application;
      setApplication(response.data.application);
      if (dirty) storeDraft(user?._id, form, response.data.application, answersRef.current);
      setNotice('Evrak kaldırıldı.');
    } catch (err) { handleError(err); }
    finally { operation.current = false; setBusy(''); }
  }

  async function download(document) {
    setError('');
    try {
      const blob = await entrepreneurAPI.downloadDocument(document._id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { handleError(err); }
  }

  if (loading) return <div className={styles.loading} role="status"><div className="spinner-border text-primary" /><p>Başvurunuz yükleniyor...</p></div>;
  if (!form) return <div className={styles.loading}><p role="alert">{error}</p><button type="button" className="submit-btn-primary" onClick={() => setRetry(value => value + 1)}>Tekrar Dene</button></div>;

  return (
    <div className={styles.workspace}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>GİRİŞİMCİLER {form.isMock && <span>Örnek soru seti</span>}</span>
          <h1>{submitted ? 'Girişimci Başvurum' : form.title}</h1>
          <p>{submitted ? 'Başvurunuzun durumunu buradan takip edebilir, gönderdiğiniz yanıtları inceleyebilirsiniz.' : `${form.description} Taslağınızı kaydedip daha sonra devam edebilirsiniz.`}</p>
        </div>
        <div className={styles.account}><i className="bi bi-person-circle" aria-hidden="true" /><div><strong>{user?.name}</strong><span>{user?.email}</span></div></div>
      </header>

      {form.isMock && !submitted && <div className={styles.demoNotice}>Bu form örnek sorular içerir. Gerçek başvuru soru seti hazır olduğunda güncellenecektir.</div>}
      {error && <div className={styles.error} role="alert">{error}</div>}
      {notice && <div className={submitted ? 'visually-hidden' : styles.success} role="status">{notice}</div>}
      {recoveryDraft && <div className={styles.error} role="alert">
        <p>Başvurunuz başka bir yerde güncellenmiş. Eski kaydedilmemiş yanıtlarınız güncel başvurunun üzerine yazılmadı. Devam etmeden önce bu yanıtları indirebilirsiniz.</p>
        <button type="button" className={styles.secondaryButton} onClick={() => {
          const url = URL.createObjectURL(new Blob([JSON.stringify(recoveryDraft.answers, null, 2)], { type: 'application/json' }));
          const link = document.createElement('a'); link.href = url; link.download = 'kaydedilmemis-yanitlar.json'; link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}>Yanıtları indir</button>{' '}
        <button type="button" className={styles.secondaryButton} onClick={() => { clearDraft(user?._id); setRecoveryDraft(null); }}>Güncel başvuruyla devam et</button>
      </div>}

      {!!application?.previousVersions?.length && <details className={styles.previousAnswers}><summary>Önceki örnek formdaki yanıtlarınız korundu</summary><p>Sorular Word belgesine göre güncellendi. Aktarılan yanıtları kontrol edin; önceki yanıtlarınıza aşağıdan erişebilirsiniz.</p>{application.previousVersions.map((snapshot, index) => <div key={index}>{snapshot.form.questions.filter(q => q.type !== 'file' && snapshot.answers?.[q.id] !== undefined).map(q => <div key={q.id}><strong>{q.label}</strong><p>{Array.isArray(snapshot.answers[q.id]) ? snapshot.answers[q.id].join(', ') : String(snapshot.answers[q.id])}</p></div>)}</div>)}</details>}
      <ApplicationView {...(submitted ? { application, form, user } : {})}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.progressHeader}><strong>Başvuru adımları</strong><span>{completed}/{form.questions.length} soru</span></div>
          <progress value={completed} max={form.questions.length} aria-label="Yanıtlanan soru sayısı" />
          <nav aria-label="Başvuru bölümleri">
            {sections.map((section, index) => {
              const questions = form.questions.filter(question => question.section === section.id);
              const count = questions.filter(question => answered(question, answers, documents)).length;
              const invalid = questions.some(question => errors[question.id]);
              return <button key={section.id} type="button" disabled={!!busy} onClick={() => setStep(index)} className={`${styles.step} ${step === index ? styles.activeStep : ''} ${invalid ? styles.invalidStep : ''}`} aria-current={step === index ? 'step' : undefined}>
                <span className={styles.stepNumber}>{count === questions.length ? <i className="bi bi-check-lg" /> : index + 1}</span>
                <span><strong>{section.title}</strong><small>{count}/{questions.length} soru tamamlandı</small></span>
              </button>;
            })}
          </nav>
          <div className={styles.savedStatus} role="status">{busy ? 'İşlem sürüyor...' : submitted ? 'Başvuru gönderildi' : dirty ? 'Kaydedilmemiş değişiklikler var' : application ? `Son kayıt: ${new Date(application.updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : 'Henüz taslak kaydedilmedi'}</div>
        </aside>

        <form className={styles.formCard} noValidate onSubmit={event => { event.preventDefault(); if (!submitted) save(true); }}>
          <div className={styles.sectionHeading}><span>BÖLÜM {step + 1} / {sections.length}</span><h2>{currentSection?.title}</h2><p>{currentSection?.description} {currentQuestions.some(question => question.required) && <span>* Zorunlu alan</span>}</p></div>
          {currentQuestions.map(question => {
            const questionDocuments = documents.filter(document => document.questionId === question.id);
            const value = answers[question.id] || (question.type === 'multipleChoice' ? [] : '');
            const fieldId = `answer-${question.id}`;
            const helpId = `help-${question.id}`;
            const errorId = `error-${question.id}`;
            const inputProps = { id: fieldId, disabled: locked, 'aria-required': question.required, 'aria-invalid': !!errors[question.id], 'aria-describedby': `${helpId}${errors[question.id] ? ` ${errorId}` : ''}` };
            return <fieldset key={question.id} id={`question-${question.id}`} className={`${styles.question} ${errors[question.id] ? styles.invalidQuestion : ''}`}>
              <legend><span>{form.questions.findIndex(item => item.id === question.id) + 1}.</span> {question.label}{question.required && <b aria-label="zorunlu"> *</b>}</legend>
              <div id={helpId} className={styles.questionHelp}><span>{question.type === 'text' && question.inputType === 'date' ? 'Tarih' : typeLabels[question.type]}{(question.type === 'file' || question.inputType === 'date') && !question.required ? ' · İsteğe bağlı' : ''}</span>{question.help && question.type !== 'consent' && <p>{question.help}</p>}</div>
              {question.type === 'consent' && <>
                {question.privacyDraft && <p className={styles.demoNotice}>KVKK metni taslaktır; kurum bilgileri henüz tamamlanmamıştır.</p>}
                <div className={styles.privacyText} tabIndex={0} aria-label="KVKK Aydınlatma Metni">{question.help}</div>
                <label className={styles.consentLabel}><input {...inputProps} type="checkbox" checked={value === true} onChange={event => changeAnswer(question.id, event.target.checked)} /><span>{question.options?.[0] || 'KVKK Aydınlatma Metni’ni okudum ve bilgilendirildim.'}</span></label>
              </>}
              {(question.type === 'text' || question.type === 'textarea') && <>
                <label htmlFor={fieldId} className="visually-hidden">{question.label}</label>
                {question.type === 'textarea' ? <textarea {...inputProps} rows={4} maxLength={question.maxLength} value={value} placeholder={question.placeholder || 'Yanıtınızı yazın...'} onChange={event => changeAnswer(question.id, event.target.value)} /> : <input {...inputProps} type={question.inputType || 'text'} maxLength={question.maxLength} value={value} placeholder={question.placeholder || 'Yanıtınızı yazın'} onChange={event => changeAnswer(question.id, event.target.value)} />}
                {question.type === 'textarea' && <small className={styles.characterCount}>{value.length}/{question.maxLength}</small>}
              </>}
              {question.type === 'singleChoice' && question.options.length > 12 && <SearchableSelect {...inputProps} options={question.options} value={value} label={question.label} placeholder={question.placeholder} searchPlaceholder={question.searchPlaceholder} onChange={selected => changeAnswer(question.id, selected)} />}
              {(question.type === 'multipleChoice' || (question.type === 'singleChoice' && question.options.length <= 12)) && <div className={styles.options}>
                {question.options.map((option, index) => {
                  const checked = question.type === 'multipleChoice' ? value.includes(option) : value === option;
                  return <label key={option} className={checked ? styles.selectedOption : ''}>
                    <input {...inputProps} id={`${fieldId}-${index}`} name={question.id} type={question.type === 'multipleChoice' ? 'checkbox' : 'radio'} checked={checked} onChange={event => changeAnswer(question.id, question.type === 'multipleChoice' ? event.target.checked ? [...value, option] : value.filter(item => item !== option) : option)} />
                    <span>{option}</span>
                  </label>;
                })}
              </div>}
              {question.type === 'file' && <>
                {!submitted && <div className={styles.uploadBox}>
                  <i className="bi bi-cloud-arrow-up" aria-hidden="true" />
                  <label htmlFor={fieldId}>{busy === question.id ? 'Dosya yükleniyor...' : 'Evrak seçin ve yükleyin'}</label>
                  <span>PDF, PNG, JPG · Dosya başına en fazla 10 MB · En fazla {question.maxFiles} dosya</span>
                  <input {...inputProps} type="file" accept=".pdf,.png,.jpg,.jpeg" disabled={locked || !!busy || questionDocuments.length >= question.maxFiles} onChange={event => upload(question, event)} />
                </div>}
                {questionDocuments.map(document => <div key={document._id} className={styles.document}>
                  <i className="bi bi-file-earmark-check" aria-hidden="true" />
                  <div><strong>{document.name}</strong><small>{(document.size / 1024).toFixed(0)} KB · Yüklendi</small></div>
                  <button type="button" onClick={() => download(document)} disabled={!!busy} aria-label={`${document.name} dosyasını indir`}><i className="bi bi-download" /></button>
                  {!submitted && <button type="button" onClick={() => remove(document)} disabled={!!busy || !!recoveryDraft} aria-label={`${document.name} dosyasını kaldır`}><i className="bi bi-trash" /></button>}
                </div>)}
                {submitted && !questionDocuments.length && <p>Evrak eklenmedi.</p>}
              </>}
              {errors[question.id] && <p className={styles.fieldError} id={errorId}>{errors[question.id]}</p>}
            </fieldset>;
          })}
          {step === sections.length - 1 && !!form.agreements?.length && <div className={styles.legalAgreements} aria-label="Gizlilik ve kullanım onayları">
            {form.agreements.map(agreement => <div key={agreement.id} id={`question-${agreement.id}`}>
              <label className={styles.consentLabel}>
                <input id={`answer-${agreement.id}`} type="checkbox" checked={answers[agreement.id] === true} disabled={locked} aria-required="true" aria-invalid={!!errors[agreement.id]} aria-describedby={errors[agreement.id] ? `error-${agreement.id}` : undefined} onChange={event => changeAnswer(agreement.id, event.target.checked)} />
                <span><a href={agreement.url} target="_blank" rel="noopener noreferrer">{agreement.label}</a> metnini okudum ve kabul ediyorum. <b aria-label="zorunlu">*</b></span>
              </label>
              {errors[agreement.id] && <p className={styles.fieldError} id={`error-${agreement.id}`}>{errors[agreement.id]}</p>}
            </div>)}
            {!submitted && <p className={styles.questionHelp}>Başvuruyu göndermek için yukarıdaki onayları işaretleyin. Metinler yeni sekmede açılır.</p>}
          </div>}
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} disabled={step === 0 || !!busy} onClick={() => setStep(value => value - 1)}><i className="bi bi-arrow-left" /> Geri</button>
            {!submitted && <button type="button" className={styles.saveButton} disabled={!!busy || !!recoveryDraft} onClick={() => save(false)}>{busy === 'save' ? 'Kaydediliyor...' : 'Taslağı Kaydet'}</button>}
            {step < sections.length - 1 ? <button type="button" className={styles.primaryButton} disabled={!!busy} onClick={() => { setStep(value => value + 1); document.getElementById('entrepreneur-form-top')?.scrollIntoView({ behavior: 'smooth' }); }}>Devam Et <i className="bi bi-arrow-right" /></button> : !submitted && <button type="submit" className={styles.primaryButton} disabled={!!busy || !!recoveryDraft || consentMissing}>{busy === 'submit' ? 'Gönderiliyor...' : 'Başvuruyu Gönder'} <i className="bi bi-send" /></button>}
          </div>
        </form>
      </div>
      </ApplicationView>
    </div>
  );
}
