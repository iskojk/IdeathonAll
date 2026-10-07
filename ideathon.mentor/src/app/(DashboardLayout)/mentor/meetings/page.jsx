import React from "react";
import PageContainer from "@/app/components/container/PageContainer";
import MentorMeetingsView from "@/app/components/mentor/MentorMeetingsView";

const MentorMeetingsPage = () => {
    return (
        <PageContainer title="Toplantılarım" description="Geçmiş ve gelecek toplantılarınızı görüntüleyin">
            <MentorMeetingsView />
        </PageContainer>
    );
}

export default MentorMeetingsPage;



