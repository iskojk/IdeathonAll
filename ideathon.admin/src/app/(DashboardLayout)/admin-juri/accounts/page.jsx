import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import AdminJuriAccounts from "@/app/components/admin-juri/AdminJuriAccounts/index";
import AdminJuriProvider from "@/app/context/AdminJuriContext";
import { IdeathonProvider } from "@/app/context/IdeathonContext";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";

const BCrumb = [
    {
        to: "/",
        title: "Anasayfa",
    },
    {
        to: "/admin-juri",
        title: "Admin/Juri Yönetimi",
    },
    {
        title: "Hesap Yönetimi",
    },
];

const AdminJuriAccountsPage = () => {
    return (
        <IdeathonProvider>
            <AdminJuriProvider>
                <PageContainer title="Admin/Juri Hesap Yönetimi" description="Admin ve Juri hesaplarını yönetin">
                    <BlankCard>
                        <CardContent sx={{ p: 0 }}>
                            <AdminJuriAccounts />
                        </CardContent>
                    </BlankCard>
                </PageContainer>
            </AdminJuriProvider>
        </IdeathonProvider>
    );
}

export default AdminJuriAccountsPage;



