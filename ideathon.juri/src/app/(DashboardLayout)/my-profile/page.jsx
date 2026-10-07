import React from "react";
import PageContainer from '@/app/components/container/PageContainer';
import ProfileContent from '@/app/components/profile/index';
import { ProfileProvider } from "@/app/context/ProfileContext/index";
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import AppCard from '@/app/components/shared/AppCard';

const UserProfile = () => {
    return (
        <ProfileProvider>
            <PageContainer title="Profil İşlemleri" description="Profil Düzenleme İşlemleri">
                <Breadcrumb title="Profil Ayarlarım" subtitle="Profil İşlemlerim" />
                <AppCard>
                    <ProfileContent />
                </AppCard>
            </PageContainer>
        </ProfileProvider>
    );
};

export default UserProfile;
