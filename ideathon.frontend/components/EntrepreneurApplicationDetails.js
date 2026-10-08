import styles from '@/styles/entrepreneur.module.css';

function Answer({ question, value }) {
  if (question.type === 'consent') return <p className={styles.submittedAnswer}>{value === true ? 'Onaylandı' : 'Onay verilmedi'}</p>;
  if (Array.isArray(value)) return value.length ? <ul className={styles.submittedChoices}>{value.map((item, index) => <li key={index}>{String(item)}</li>)}</ul> : <p className={styles.submittedEmpty}>Yanıt verilmedi.</p>;
  if (value === undefined || value === null || value === '') return <p className={styles.submittedEmpty}>Yanıt verilmedi.</p>;
  const date = question.inputType === 'date' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  return <p className={styles.submittedAnswer}>{date ? value.split('-').reverse().join('.') : String(value)}</p>;
}

function Question({ question, number, answers, documents, onDownload, onReadAgreement, busy, agreement }) {
  const files = documents.filter(document => document.questionId === question.id);
  return <details className={styles.submittedQuestion}>
    <summary>
      {number && <span className={styles.submittedQuestionNumber}>{String(number).padStart(2, '0')}</span>}
      <h3>{question.label}</h3>
      <i className={`bi bi-chevron-down ${styles.submittedQuestionChevron}`} aria-hidden="true" />
    </summary>
    <div className={styles.submittedQuestionBody}>
      {question.help && <p className={question.type === 'consent' ? styles.privacyText : styles.submittedHelp}>{question.help}</p>}
      {question.type === 'file' ? files.length ? files.map(document => <div key={document._id} className={styles.document}>
        <i className="bi bi-file-earmark-check" aria-hidden="true" />
        <div><strong>{document.name}</strong><small>{(document.size / 1024).toFixed(0)} KB</small></div>
        <button type="button" disabled={busy} onClick={() => onDownload(document)} aria-label={`${document.name} dosyasını ${document.mimeType === 'application/pdf' ? 'önizle' : 'indir'}`}>{document.mimeType === 'application/pdf' ? 'Önizle' : 'İndir'}</button>
      </div>) : <p className={styles.submittedEmpty}>Evrak eklenmedi.</p> : <Answer question={question} value={answers[question.id]} />}
      {agreement && <button type="button" className={styles.legalLink} onClick={() => onReadAgreement(question)}>Metni görüntüle</button>}
    </div>
  </details>;
}

export default function EntrepreneurApplicationDetails({ form, answers, documents, onDownload, onReadAgreement, busy }) {
  const questions = form.questions || [];
  const sections = (form.sections || []).map(section => ({ ...section, questions: questions.filter(question => question.section === section.id && question.type !== 'consent') })).filter(section => section.questions.length);
  const consents = [...new Map([...questions.filter(question => question.type === 'consent'), ...(form.agreements || [])].map(question => [question.id, question])).values()];
  const groups = consents.length ? [...sections, { id: 'submitted-privacy', title: 'Gizlilik ve Kullanım Onayları', questions: consents, privacy: true }] : sections;

  return <div className={styles.submittedSections}>
    {groups.map((section, index) => <details key={section.id} className={styles.submittedSection}>
      <summary>
        <span className={styles.submittedSectionNumber}>{section.privacy ? <i className="bi bi-shield-check" aria-hidden="true" /> : index + 1}</span>
        <h2>{section.title}</h2>
        <i className={`bi bi-chevron-down ${styles.submittedSectionChevron}`} aria-hidden="true" />
      </summary>
      <div className={styles.submittedSectionBody}>
        {section.description && <p className={styles.submittedHelp}>{section.description}</p>}
        {section.questions.map(question => <Question key={question.id} question={question} number={!section.privacy && questions.findIndex(item => item.id === question.id) + 1} answers={answers} documents={documents} onDownload={onDownload} onReadAgreement={onReadAgreement} busy={busy} agreement={!!form.agreements?.some(item => item.id === question.id)} />)}
      </div>
    </details>)}
  </div>;
}
