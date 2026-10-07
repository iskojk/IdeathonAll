import React from "react";
import PageContainer from "@/app/components/container/PageContainer";
import MyEvaluationsList from "@/app/components/jury/MyEvaluationsList";

const MyEvaluationsPage = () => {
    return (
        <PageContainer 
            title="Değerlendirmelerim" 
            description="Yaptığım değerlendirmeleri görüntüleyin"
        >
            <MyEvaluationsList />
        </PageContainer>
    );
}

export default MyEvaluationsPage;


