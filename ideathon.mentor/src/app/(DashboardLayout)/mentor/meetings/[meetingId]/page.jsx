import React from "react";
import PageContainer from "@/app/components/container/PageContainer";
import MentorMeetingDetailView from "@/app/components/mentor/MentorMeetingDetailView";

const MentorMeetingDetailPage = async ({ params }) => {
    const { meetingId } = await params;
    
    return (
        <PageContainer title="Toplantı Detayları" description="Toplantı detaylarını görüntüleyin">
            <MentorMeetingDetailView meetingId={meetingId} />
        </PageContainer>
    );
}

export default MentorMeetingDetailPage;



