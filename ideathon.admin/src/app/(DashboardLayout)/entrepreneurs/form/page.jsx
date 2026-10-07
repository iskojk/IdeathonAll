import PageContainer from '@/app/components/container/PageContainer';
import EntrepreneurAccess from '@/app/components/entrepreneurs/EntrepreneurAccess';
import EntrepreneurFormEditor from '@/app/components/entrepreneurs/EntrepreneurFormEditor';

export default function EntrepreneurFormPage() {
  return <PageContainer title="Girişimci Soru Seti" description="Girişimci başvuru sorularını düzenleyin">
    <EntrepreneurAccess superadminOnly><EntrepreneurFormEditor /></EntrepreneurAccess>
  </PageContainer>;
}
