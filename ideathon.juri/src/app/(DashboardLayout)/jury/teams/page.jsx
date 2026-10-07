import React from "react";
import PageContainer from "@/app/components/container/PageContainer";
import JuryTeamsList from "@/app/components/jury/JuryTeamsList";

const JuryTeamsPage = () => {
    return (
        <PageContainer title="Final Değerlendirme - Takımlar" description="Takımları değerlendirin">
            <JuryTeamsList />
        </PageContainer>
    );
}

export default JuryTeamsPage;


