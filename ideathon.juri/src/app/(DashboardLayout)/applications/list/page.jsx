import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import JuriApplicationList from "@/app/components/applications/Juri-Application-List/index";

const BCrumb = [
    {
        to: "/",
        title: "Anasayfa",
    },
    {
        title: "Ön Değerlendirme",
    },
];

const ApplicationsListing = () => {
    return (
        <PageContainer title="Ön Değerlendirme" description="Başvuruları Ön Değerlendir">
            <JuriApplicationList />
        </PageContainer>
    );
}
export default ApplicationsListing;
