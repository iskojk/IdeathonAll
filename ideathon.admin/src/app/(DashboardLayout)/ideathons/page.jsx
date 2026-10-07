import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import IdeathonManagement from "@/app/components/ideathons/IdeathonManagement";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";

const BCrumb = [
  {
    to: "/",
    title: "Anasayfa",
  },
  {
    title: "İdeathon Yönetimi",
  },
];

const IdeathonsPage = () => {
  return (
    <PageContainer
      title="İdeathon Yönetimi"
      description="İdeathon'ları oluşturun, düzenleyin ve yönetin"
    >
      <BlankCard>
        <CardContent sx={{ p: 0 }}>
          <IdeathonManagement />
        </CardContent>
      </BlankCard>
    </PageContainer>
  );
};

export default IdeathonsPage;







