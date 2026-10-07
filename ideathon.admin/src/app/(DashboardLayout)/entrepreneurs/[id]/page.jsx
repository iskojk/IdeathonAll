import PageContainer from '@/app/components/container/PageContainer';
import EntrepreneurAccess from '@/app/components/entrepreneurs/EntrepreneurAccess';
import EntrepreneurDetail from '@/app/components/entrepreneurs/EntrepreneurDetail';

export default async function EntrepreneurDetailPage({ params }) {
  const { id } = await params;
  return <PageContainer title="Girişimci Başvuru Detayı" description="Başvuru cevapları ve evrakları">
    <EntrepreneurAccess><EntrepreneurDetail id={id} /></EntrepreneurAccess>
  </PageContainer>;
}
