"use client";

import React from "react";
import PageContainer from "@/app/components/container/PageContainer";
import MentorParticipantsView from "@/app/components/mentor/MentorParticipantsView";

const MentorParticipantsPage = () => {
  return (
    <PageContainer
      title="Katılımcılar | Mentor Paneli"
      description="Onaylanmış katılımcıları görüntüleyin ve mesaj gönderin"
    >
      <MentorParticipantsView />
    </PageContainer>
  );
};

export default MentorParticipantsPage;



