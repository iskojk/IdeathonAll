"use client";

import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import { SuperadminMentorProvider } from "@/app/context/SuperadminMentorContext";
import SuperadminMentorList from "@/app/components/superadmin-mentors/SuperadminMentorList";

const BCrumb = [
  {
    to: "/",
    title: "Anasayfa",
  },
  {
    title: "Mentor Istatistikleri",
  },
];

const SuperadminMentorsPage = () => {
  return (
    <SuperadminMentorProvider>
      <PageContainer
        title="Mentor Istatistikleri"
        description="Superadmin mentor istatistikleri, performans analizi ve raporlama"
      >
        <SuperadminMentorList />
      </PageContainer>
    </SuperadminMentorProvider>
  );
};

export default SuperadminMentorsPage;

