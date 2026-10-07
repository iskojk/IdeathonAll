"use client";
import React from "react";
import Grid from "@mui/material/Grid2";
import StatCard from "@/app/components/dashboards/_shared/StatCard";
import {
  IconBriefcase,
  IconCheck,
  IconClock,
  IconUsers,
  IconMail,
  IconFileCv,
  IconTrendingUp,
  IconBuilding,
} from "@tabler/icons-react";
import { useHome } from "@/app/context/HomeContext";

const StatCardsRow = () => {
  const { kpis } = useHome() || {};
  if (!kpis) return null;

  const trendText =
    typeof kpis.applications_trend?.pct === "number"
      ? `7g değişim: ${kpis.applications_trend.pct >= 0 ? "+" : ""}${kpis.applications_trend.pct}%`
      : null;

  const items = [
    { title: "İlan (Toplam)", value: kpis.jobs_total ?? 0, icon: <IconBriefcase size={22} />, color: "primary" },
    { title: "Aktif İlan", value: kpis.jobs_active ?? 0, icon: <IconCheck size={22} />, color: "success" },
    { title: "Onay Bekleyen İlan", value: kpis.jobs_pendingApproval ?? 0, icon: <IconClock size={22} />, color: "warning" },
    { title: "Bugün Başvuru", value: kpis.applications_today ?? 0, icon: <IconTrendingUp size={22} />, color: "secondary", subtitle: trendText },
    { title: "Firmalar", value: kpis.companies_total ?? 0, icon: <IconUsers size={22} />, color: "info" },
    { title: "Onay Bekleyen Firma", value: kpis.companies_pendingApproval ?? 0, icon: <IconBuilding size={22} />, color: "warning" },
    { title: "Aday Havuzu", value: kpis.seekers_total ?? 0, icon: <IconFileCv size={22} />, color: "primary", subtitle: `CV'li: ${kpis.seekers_withCv ?? 0}` },
    { title: "Okunmamış Mesaj", value: kpis.contacts_unread ?? 0, icon: <IconMail size={22} />, color: "error" },
  ];

  return (
    <Grid container spacing={2}>
      {items.map((it, idx) => (
        <Grid key={idx} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <StatCard {...it} />
        </Grid>
      ))}
    </Grid>
  );
};

export default StatCardsRow;
