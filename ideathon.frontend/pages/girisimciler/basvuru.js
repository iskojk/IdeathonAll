import Head from 'next/head';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import EntrepreneurApplicationForm from '@/components/EntrepreneurApplicationForm';

export default function EntrepreneurApplication() {
  return <PrivateRoute>
    <Head><title>Girişimci Başvurusu - Emlak Konut Ideathon</title><meta name="robots" content="noindex, nofollow" /></Head>
    <Layout>
      <section id="entrepreneur-form-top" style={{ marginTop: '140px', background: '#f5f8fc', padding: 0 }}>
        <EntrepreneurApplicationForm />
      </section>
    </Layout>
  </PrivateRoute>;
}
