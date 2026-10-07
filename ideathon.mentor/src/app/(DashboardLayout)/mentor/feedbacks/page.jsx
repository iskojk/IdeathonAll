"use client";

import React from "react";
import PageContainer from "@/app/components/container/PageContainer";
import FeedbackManagementView from "@/app/components/mentor/FeedbackManagementView";

const FeedbackManagementPage = () => {
  return (
    <PageContainer 
      title="Değerlendirmeler | Emlak Konut Mentor Paneli" 
      description="Aldığınız ve verdiğiniz değerlendirmeleri yönetin"
    >
      <FeedbackManagementView />
    </PageContainer>
  );
};

export default FeedbackManagementPage;














