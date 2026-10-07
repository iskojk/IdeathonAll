"use client";

import { Box } from "@mui/material";
import PageContainer from "@/app/components/container/PageContainer";
import NotificationSettingsView from "@/app/components/mentor/NotificationSettingsView";

const NotificationSettingsPage = () => {
  return (
    <PageContainer
      title="Bildirim Ayarları - Emlak Konut Mentor Paneli"
      description="Email bildirim tercihlerinizi yönetin"
    >
      <Box>
        <NotificationSettingsView />
      </Box>
    </PageContainer>
  );
};

export default NotificationSettingsPage;

















