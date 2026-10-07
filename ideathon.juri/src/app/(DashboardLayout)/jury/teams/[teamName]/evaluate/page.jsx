import React from "react";
import PageContainer from "@/app/components/container/PageContainer";
import TeamEvaluationForm from "@/app/components/jury/TeamEvaluationForm";

const TeamEvaluatePage = async ({ params }) => {
    const resolvedParams = await params;
    const teamName = decodeURIComponent(resolvedParams.teamName);
    
    return (
        <PageContainer 
            title={`${teamName} - Değerlendirme`} 
            description="Takımı değerlendirin"
        >
            <TeamEvaluationForm teamName={teamName} />
        </PageContainer>
    );
}

export default TeamEvaluatePage;

