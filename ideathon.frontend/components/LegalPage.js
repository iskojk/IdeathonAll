import Head from 'next/head';
import Layout from '@/components/Layout';
import LegalDocumentContent, { legalDocuments } from '@/components/LegalDocumentContent';
import styles from '@/styles/legal.module.css';

export default function LegalPage({ documentId }) {
  const document = legalDocuments[documentId];
  return <>
    <Head>
      <title>{document.title} - Emlak Konut Ideathon</title>
      <meta name="description" content={`Emlak Konut Ideathon platformu ${document.title.toLocaleLowerCase('tr-TR')}`} />
      <meta name="robots" content="noindex, nofollow" />
    </Head>
    <Layout>
      <section className={styles.page}>
        <div className="container"><div className="row justify-content-center"><div className="col-lg-8 col-md-10">
          <div className={styles.card}>
            <h1 className={styles.pageTitle}>{document.title} ({document.subtitle})</h1>
            <LegalDocumentContent documentId={documentId} />
          </div>
        </div></div></div>
      </section>
    </Layout>
  </>;
}
