import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import { MentorNetProvider } from "@/app/context/MentorNetContext/index";
import { IdeathonProvider } from "@/app/context/IdeathonContext";
import MentorNetManagement from "@/app/components/mentornet/MentorNetManagement";

const BCrumb = [
    {
        to: "/",
        title: "Anasayfa",
    },
    {
        title: "Mentor Yonetimi",
    },
];

const MentorNetManagementPage = () => {
    return (
        <IdeathonProvider>
            <MentorNetProvider>
                <PageContainer title="Mentor Yonetimi" description="Mentor kullanicilarini ve profillerini yonetin">
                    <MentorNetManagement />
                </PageContainer>
            </MentorNetProvider>
        </IdeathonProvider>
    );
};

export default MentorNetManagementPage;
