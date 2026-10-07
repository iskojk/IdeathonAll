"use client";

import React from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  alpha,
  Skeleton,
  Divider,
} from "@mui/material";
import {
  IconUsers,
  IconCalendar,
  IconStar,
  IconCheck,
  IconClock,
  IconX,
  IconUserCheck,
  IconCalendarStats,
  IconChartBar,
} from "@tabler/icons-react";

const BRAND_COLOR = "#005DAD";

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 3,
        border: `1px solid ${alpha(color, 0.18)}`,
        backgroundColor: alpha(color, 0.03),
        transition: "all 0.2s ease",
        "&:hover": { borderColor: color },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              width: 54,
              height: 54,
              backgroundColor: alpha(color, 0.1),
              color: color,
            }}
          >
            <Icon size={28} />
          </Avatar>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: color, mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const MentorStatsCards = ({ stats }) => {
  if (!stats) {
    return (
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} lg={3} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const { mentors, meetings, ratings } = stats;
  const completionRate = meetings?.total > 0 ? Math.round((meetings?.completed / meetings?.total) * 100) : 0;

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Toplam Mentor"
            value={mentors?.total || 0}
            subtitle={`${mentors?.active || 0} aktif • ${mentors?.inactive || 0} pasif`}
            icon={IconUsers}
            color={BRAND_COLOR}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Toplam Görüşme"
            value={meetings?.total || 0}
            subtitle={`${meetings?.completed || 0} tamamlandı`}
            icon={IconCalendar}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Tamamlanma Oranı"
            value={`%${completionRate}`}
            subtitle={`${meetings?.scheduled || 0} zamanlanmış`}
            icon={IconCheck}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Ortalama Puan"
            value={(ratings?.overall || 0).toFixed(1)}
            subtitle={`${ratings?.totalFeedbacks || 0} değerlendirme`}
            icon={IconStar}
            color="#f59e0b"
          />
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, border: `1px solid ${alpha(BRAND_COLOR, 0.1)}` }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Avatar sx={{ bgcolor: alpha(BRAND_COLOR, 0.1), color: BRAND_COLOR, width: 40, height: 40 }}>
              <IconChartBar size={20} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Görüşme Dağılımı
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aylık ve haftalık özetler
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Stack spacing={1} alignItems="center">
                <Avatar sx={{ width: 44, height: 44, backgroundColor: alpha("#3b82f6", 0.1), color: "#3b82f6" }}>
                  <IconCalendarStats size={22} />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#3b82f6" }}>
                  {meetings?.thisMonth || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Bu Ay
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Stack spacing={1} alignItems="center">
                <Avatar sx={{ width: 44, height: 44, backgroundColor: alpha("#06b6d4", 0.1), color: "#06b6d4" }}>
                  <IconClock size={22} />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#06b6d4" }}>
                  {meetings?.thisWeek || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Bu Hafta
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Stack spacing={1} alignItems="center">
                <Avatar sx={{ width: 44, height: 44, backgroundColor: alpha("#ef4444", 0.1), color: "#ef4444" }}>
                  <IconX size={22} />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#ef4444" }}>
                  {meetings?.cancelled || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  İptal
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Stack spacing={1} alignItems="center">
                <Avatar sx={{ width: 44, height: 44, backgroundColor: alpha("#f97316", 0.1), color: "#f97316" }}>
                  <IconUserCheck size={22} />
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#f97316" }}>
                  {meetings?.noShow || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Katılmayan
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MentorStatsCards;
