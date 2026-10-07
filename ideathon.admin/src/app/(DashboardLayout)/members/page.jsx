import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import ChatUsers from "@/app/components/chat-users/ChatUsers";
import ChatUsersProvider from "@/app/context/ChatUsersContext";
import { IdeathonProvider } from "@/app/context/IdeathonContext";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";

const BCrumb = [
    {
        to: "/",
        title: "Anasayfa",
    },
    {
        title: "Üyeler",
    },
];

const MembersPage = () => {
    return (
        <IdeathonProvider>
            <ChatUsersProvider>
                <PageContainer title="Üyeler Yönetimi" description="Üyeleri yönetin">
                    <Breadcrumb title="Üyeler Yönetimi" items={BCrumb} />
                    <BlankCard>
                        <CardContent sx={{ p: 0 }}>
                            <ChatUsers />
                        </CardContent>
                    </BlankCard>
                </PageContainer>
            </ChatUsersProvider>
        </IdeathonProvider>
    );
};

export default MembersPage;
