import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import ParticipantList from "@/app/components/participants/Participant-list/index";
import { ParticipantProvider } from "@/app/context/ParticipantContext/index";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";

const BCrumb = [
    {
        to: "/",
        title: "Anasayfa",
    },
    {
        title: "Katılımcılar",
    },
];

const ParticipantsListing = () => {
    return (
        <ParticipantProvider>
            <PageContainer title="Katılımcılar" description="Tüm Katılımcılar listesi">
                <Breadcrumb title="Tüm Katılımcıları Yönet" items={BCrumb} />
                <BlankCard>
                    <CardContent>
                        <ParticipantList />
                    </CardContent>
                </BlankCard>
            </PageContainer>
        </ParticipantProvider>
    );
}
export default ParticipantsListing;



