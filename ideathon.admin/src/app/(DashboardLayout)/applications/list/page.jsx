import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import ApplicationList from "@/app/components/applications/Application-list/index";
import { ApplicationProvider } from "@/app/context/ApplicationContext/index";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";

const BCrumb = [
    {
        to: "/",
        title: "Anasayfa",
    },
    {
        title: "Başvurular",
    },
];

const ApplicationsListing = () => {
    return (
        <ApplicationProvider>
            <PageContainer title="Başvurular" description="Tüm Başvurular listesi">
                <BlankCard>
                    <CardContent>
                        <ApplicationList />
                    </CardContent>
                </BlankCard>
            </PageContainer>
        </ApplicationProvider>
    );
}
export default ApplicationsListing;
