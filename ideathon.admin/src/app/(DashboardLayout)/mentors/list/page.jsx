import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import MentorList from "@/app/components/mentors/Mentor-list/index";
import { MentorProvider } from "@/app/context/MentorContext/index";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";

const BCrumb = [
    {
        to: "/",
        title: "Anasayfa",
    },
    {
        title: "Mentor Yönetimi",
    },
];

const MentorListing = () => {
    return (
        <MentorProvider>
            <PageContainer title="Mentor Yönetimi" description="Mentorları yönetin ve düzenleyin">
                <BlankCard>
                    <CardContent>
                        <MentorList />
                    </CardContent>
                </BlankCard>
            </PageContainer>
        </MentorProvider>
    );
}

export default MentorListing;

