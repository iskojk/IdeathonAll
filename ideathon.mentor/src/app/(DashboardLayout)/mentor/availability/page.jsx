import React from "react";
import PageContainer from "@/app/components/container/PageContainer";
import MentorAvailabilityView from "@/app/components/mentor/MentorAvailabilityView";

const MentorAvailabilityPage = () => {
    return (
        <PageContainer title="Müsaitlik Yönetimi" description="Müsaitliklerinizi yönetin">
            <MentorAvailabilityView />
        </PageContainer>
    );
}

export default MentorAvailabilityPage;



