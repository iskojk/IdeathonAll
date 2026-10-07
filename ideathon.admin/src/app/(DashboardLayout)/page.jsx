"use client";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import LinearProgress from "@mui/material/LinearProgress";
import { alpha, useTheme } from "@mui/material/styles";
import PageContainer from "@/app/components/container/PageContainer";
import {
  IconUsers,
  IconFileDescription,
  IconMail,
  IconUserStar,
  IconUsersGroup,
  IconBulb,
  IconClipboardCheck,
  IconClock,
  IconCheck,
  IconX,
  IconEye,
  IconUserPlus,
} from "@tabler/icons-react";
import api from "@/utils/api/axios";

const statusLabels = {
  pending: "Beklemede",
  under_review: "İnceleniyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  withdrawn: "Geri Çekildi",
};

const statusColors = {
  pending: "warning",
  under_review: "info",
  approved: "success",
  rejected: "error",
  withdrawn: "default",
};

const contactStatusLabels = {
  new: "Yeni",
  read: "Okundu",
  replied: "Yanıtlandı",
  closed: "Kapatıldı",
};

function StatCard({ icon: Icon, title, value, subtitle, color, loading }) {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 25px ${alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.15)}`,
          borderColor: alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.3),
        },
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: alpha(
                theme.palette[color]?.main || theme.palette.primary.main,
                0.12
              ),
              color:
                theme.palette[color]?.main || theme.palette.primary.main,
            }}
          >
            <Icon size={28} stroke={1.5} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 0.5, fontWeight: 500 }}
            >
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={60} height={36} />
            ) : (
              <Typography variant="h4" fontWeight={700}>
                {typeof value === "number" ? value.toLocaleString("tr-TR") : value}
              </Typography>
            )}
            {subtitle && !loading && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ApplicationBreakdown({ data, loading }) {
  const theme = useTheme();
  const total = data?.total || 0;

  const items = [
    { key: "pending", label: "Beklemede", color: theme.palette.warning.main, icon: IconClock },
    { key: "under_review", label: "İnceleniyor", color: theme.palette.info.main, icon: IconEye },
    { key: "approved", label: "Onaylanan", color: theme.palette.success.main, icon: IconCheck },
    { key: "rejected", label: "Reddedilen", color: theme.palette.error.main, icon: IconX },
  ];

  return (
    <Card
      elevation={0}
      sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, height: "100%" }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Başvuru Durumları
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {loading ? (
          <Stack spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={40} />
            ))}
          </Stack>
        ) : (
          <Stack spacing={2}>
            {items.map((item) => {
              const count = data?.byStatus?.[item.key] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <Box key={item.key}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 0.5 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <item.icon size={16} color={item.color} />
                      <Typography variant="body2" fontWeight={500}>
                        {item.label}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight={600}>
                      {count}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(item.color, 0.12),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 3,
                        bgcolor: item.color,
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivity({ applications, contacts, loading }) {
  const theme = useTheme();

  const activities = [];

  (applications || []).forEach((a) => {
    activities.push({
      type: "application",
      name: a.name || "Bilinmiyor",
      status: a.status,
      date: a.createdAt,
    });
  });

  (contacts || []).forEach((c) => {
    activities.push({
      type: "contact",
      name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Bilinmiyor",
      status: c.status,
      date: c.createdAt,
    });
  });

  activities.sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatDate = (d) => {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Az önce";
    if (mins < 60) return `${mins} dk önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} gün önce`;
    return new Date(d).toLocaleDateString("tr-TR");
  };

  return (
    <Card
      elevation={0}
      sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, height: "100%" }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Son Aktiviteler
        </Typography>
        <Divider sx={{ mb: 1 }} />
        {loading ? (
          <Stack spacing={1}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={50} />
            ))}
          </Stack>
        ) : activities.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            Henüz aktivite yok
          </Typography>
        ) : (
          <List dense disablePadding>
            {activities.slice(0, 8).map((act, i) => (
              <ListItem
                key={i}
                disablePadding
                sx={{
                  py: 1,
                  borderBottom: i < activities.length - 1 ? `1px solid ${theme.palette.divider}` : "none",
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: alpha(
                        act.type === "application"
                          ? theme.palette.primary.main
                          : theme.palette.secondary.main,
                        0.12
                      ),
                      color:
                        act.type === "application"
                          ? theme.palette.primary.main
                          : theme.palette.secondary.main,
                    }}
                  >
                    {act.type === "application" ? (
                      <IconFileDescription size={18} />
                    ) : (
                      <IconMail size={18} />
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" fontWeight={500} noWrap>
                        {act.name}
                      </Typography>
                      <Chip
                        label={
                          act.type === "application"
                            ? statusLabels[act.status] || act.status
                            : contactStatusLabels[act.status] || act.status
                        }
                        size="small"
                        color={
                          act.type === "application"
                            ? statusColors[act.status] || "default"
                            : act.status === "new"
                              ? "warning"
                              : "default"
                        }
                        sx={{ height: 20, fontSize: "0.7rem" }}
                      />
                    </Stack>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {act.type === "application" ? "Başvuru" : "İletişim"} &middot;{" "}
                      {formatDate(act.date)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

const DashboardContent = () => {
  const theme = useTheme();
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/dashboard/stats");
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Dashboard stats fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getRoleTurkish = (role) => {
    const map = {
      superadmin: "Süper Administrator",
      admin: "Yönetici",
      juri: "Jüri",
      mentor: "Mentor",
      support: "Destek",
    };
    return map[role] || "Kullanıcı";
  };

  return (
    <PageContainer
      title="Emlak Konut Ideathon SuperAdmin Paneli"
      description="Emlak Konut Ideathon SuperAdmin Paneli"
    >
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* Welcome Card */}
          <Grid size={{ xs: 12 }}>
            <Card
              elevation={0}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                borderRadius: 3,
                color: "#fff",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  bgcolor: alpha("#fff", 0.06),
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: -60,
                  right: 80,
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  bgcolor: alpha("#fff", 0.04),
                }}
              />
              <CardContent sx={{ py: 4, px: 4, position: "relative", zIndex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={2.5}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: alpha("#fff", 0.2),
                      fontSize: 24,
                      fontWeight: 700,
                      border: "2px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    {user?.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "?"}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700} sx={{ color: "#fff" }}>
                      Hoş geldin, {user?.name?.split(" ")[0] || "Admin"}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: alpha("#fff", 0.8), mt: 0.5 }}
                    >
                      {getRoleTurkish(user?.role)} &middot; Ideathon Yönetim Paneli
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Stat Cards */}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon={IconUsers}
              title="Toplam Üye"
              value={stats?.users?.total}
              color="primary"
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon={IconFileDescription}
              title="Toplam Başvuru"
              value={stats?.applications?.total}
              subtitle={`${stats?.applications?.byStatus?.pending || 0} beklemede`}
              color="info"
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon={IconMail}
              title="İletişim Mesajları"
              value={stats?.contacts?.total}
              subtitle={
                stats?.contacts?.new > 0
                  ? `${stats.contacts.new} yeni mesaj`
                  : "Yeni mesaj yok"
              }
              color={stats?.contacts?.new > 0 ? "warning" : "success"}
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon={IconUserStar}
              title="Aktif Mentorlar"
              value={stats?.mentors?.total}
              color="success"
              loading={loading}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon={IconUsersGroup}
              title="Toplam Takım"
              value={stats?.teams?.total}
              subtitle={`${stats?.teams?.totalMembers || 0} toplam kişi`}
              color="secondary"
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon={IconBulb}
              title="Ideathon"
              value={stats?.ideathons?.total}
              subtitle={`${stats?.ideathons?.byStatus?.active || 0} aktif`}
              color="warning"
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon={IconClipboardCheck}
              title="Değerlendirme"
              value={stats?.evaluations?.submitted}
              subtitle="Tamamlanan"
              color="info"
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon={IconUserPlus}
              title="Onaylanan Başvuru"
              value={stats?.applications?.byStatus?.approved}
              subtitle={
                stats?.applications?.total > 0
                  ? `%${Math.round(((stats?.applications?.byStatus?.approved || 0) / stats.applications.total) * 100)} onay oranı`
                  : undefined
              }
              color="success"
              loading={loading}
            />
          </Grid>

          {/* Breakdown Cards */}
          <Grid size={{ xs: 12, md: 6 }}>
            <ApplicationBreakdown data={stats?.applications} loading={loading} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <RecentActivity
              applications={stats?.recent?.applications}
              contacts={stats?.recent?.contacts}
              loading={loading}
            />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default function Dashboard() {
  return <DashboardContent />;
}
