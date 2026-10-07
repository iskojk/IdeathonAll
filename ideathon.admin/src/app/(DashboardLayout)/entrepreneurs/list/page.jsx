import PageContainer from '@/app/components/container/PageContainer';
import EntrepreneurAccess from '@/app/components/entrepreneurs/EntrepreneurAccess';
import EntrepreneurPool from '@/app/components/entrepreneurs/EntrepreneurPool';

export default function EntrepreneurPoolPage() {
  return <PageContainer title="Girişimci Havuzu" description="Gönderilen girişimci başvuruları">
    <EntrepreneurAccess><EntrepreneurPool /></EntrepreneurAccess>
  </PageContainer>;
}
