import React from "react";
import PageContainer from "@/app/components/container/PageContainer";
import MentorProfileView from "@/app/components/mentor/MentorProfileView";

const MentorProfilePage = () => {
    return (
        <PageContainer title="Profil Yönetimi" description="Mentor profil bilgilerinizi yönetin">
            <MentorProfileView />
        </PageContainer>
    );
}

export default MentorProfilePage;



