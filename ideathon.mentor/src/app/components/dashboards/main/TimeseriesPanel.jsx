"use client";
import React, { useMemo, useState } from "react";
import SectionCard from "@/app/components/dashboards/_shared/SectionCard";
import ChartEmptyState from "@/app/components/dashboards/_shared/ChartEmptyState";
import { useHome } from "@/app/context/HomeContext";
import { Tabs, Tab, Box } from "@mui/material";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
} from "recharts";

const fmtTick = (s) => (s ? s.slice(5) : ""); // YYYY-MM-DD -> MM-DD

const TimeseriesPanel = () => {
  const { timeseries } = useHome() || {};
  const [tab, setTab] = useState("applications");

  const data = useMemo(() => {
    if (!timeseries) return [];
    return timeseries[tab] || [];
  }, [timeseries, tab]);

  return (
    <SectionCard
      title="Zaman Serileri"
      action={
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          sx={{
            minHeight: 36,
            "& .MuiTab-root": { minHeight: 36, textTransform: "none" },
          }}
        >
          <Tab label="Başvurular" value="applications" />
          <Tab label="İlanlar" value="jobs" />
          <Tab label="Mesajlar" value="contacts" />
        </Tabs>
      }
    >
      {data && data.length ? (
        <Box sx={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={fmtTick} minTickGap={20} />
              <YAxis allowDecimals={false} width={36} />
              <RTooltip formatter={(v) => [v, "Adet"]} labelFormatter={(l) => `Tarih: ${l}`} />
              <Line type="monotone" dataKey="count" dot={false} strokeWidth={2.2} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        <ChartEmptyState />
      )}
    </SectionCard>
  );
};

export default TimeseriesPanel;
