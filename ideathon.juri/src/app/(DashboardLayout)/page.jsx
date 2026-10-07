"use client";
import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import PageContainer from "@/app/components/container/PageContainer";
import WelcomeCard from "@/app/components/dashboards/ecommerce/WelcomeCard";

const DashboardContent = () => {
  return (
    <PageContainer
      title="Emlak Konut Ideathon | Juri Paneli"
      description="Emlak Konut Ideathon Juri Değerlendirme Paneli"
    >
      <Box sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <WelcomeCard />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default function Dashboard() {
  return <DashboardContent />;
}
