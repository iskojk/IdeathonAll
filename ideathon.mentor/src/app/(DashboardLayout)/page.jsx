import React from "react";
import PageContainer from "@/app/components/container/PageContainer";
import MentorDashboard from "@/app/components/mentor/MentorDashboard";

const DashboardPage = () => {
    return (
        <PageContainer title="Dashboard" description="Mentor Dashboard">
            <MentorDashboard />
        </PageContainer>
    );
}

export default DashboardPage;
