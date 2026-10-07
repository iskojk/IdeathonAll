import React from "react";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import ContactList from "@/app/components/contacts/Contact-list/index";
import { ContactProvider } from "@/app/context/ContactContext/index";
import BlankCard from "@/app/components/shared/BlankCard";
import { CardContent } from "@mui/material";

const BCrumb = [
    {
        to: "/",
        title: "Anasayfa",
    },
    {
        title: "İletişim Yönetimi",
    },
];

const ContactListing = () => {
    return (
        <ContactProvider>
            <PageContainer title="İletişim Yönetimi" description="İletişim formu mesajlarını yönetin">
                <BlankCard>
                    <CardContent>
                        <ContactList />
                    </CardContent>
                </BlankCard>
            </PageContainer>
        </ContactProvider>
    );
}

export default ContactListing;

