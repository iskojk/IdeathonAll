import React from "react";
import PageContainer from "@/app/components/container/PageContainer";
import MentorIntegrationsView from "@/app/components/mentor/MentorIntegrationsView";

const MentorIntegrationsPage = () => {
  return (
    <PageContainer
      title="Entegrasyonlar | Emlak Konut Mentor Paneli"
      description="Google Meet, Microsoft Teams ve Zoom entegrasyonları"
    >
      <MentorIntegrationsView />
    </PageContainer>
  );
};

export default MentorIntegrationsPage;

