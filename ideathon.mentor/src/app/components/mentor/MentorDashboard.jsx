"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  Avatar,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  LinearProgress,
} from "@mui/material";
import {
  IconCalendarEvent,
  IconUsers,
  IconStar,
  IconTrophy,
  IconClock,
  IconChevronRight,
  IconCalendar,
  IconBriefcase,
  IconMessageCircle,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { getMentorProfile, getMyMeetings } from "@/utils/api/mentor";
import { format, parseISO, isFuture } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

const MentorDashboard = () => {
  const router = useRouter();
  const { user, mentorProfile } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [profileRes, meetingsRes] = await Promise.all([
        getMentorProfile(),
        getMyMeetings({ type: "upcoming", limit: 5 }),
      ]);

      if (profileRes.success) {
        setProfile(profileRes.data);
      }

      if (meetingsRes.success) {
        setUpcomingMeetings(meetingsRes.data || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Header */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 2,
          background: "linear-gradient(135deg, #005DAD 0%, #004080 100%)",
          color: "white",
          boxShadow: "0 4px 12px rgba(0, 93, 173, 0.15)",
        }}
      >
        <CardContent sx={{ py: 3 }}>
          <Stack 
            direction={{ xs: "column", sm: "row" }} 
            spacing={3} 
            alignItems="center"
          >
            <Avatar
              src={mentorProfile?.photoUrl}
              sx={{
                width: 80,
                height: 80,
                border: "4px solid rgba(255,255,255,0.3)",
                fontSize: "2rem",
                fontWeight: 700,
              }}
            >
              {user?.name?.charAt(0) || "M"}
            </Avatar>
            <Box sx={{ flex: 1, textAlign: { xs: "center", sm: "left" } }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                Hoş Geldiniz, {user?.name}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
                {mentorProfile?.title || "Mentor"}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent={{ xs: "center", sm: "flex-start" }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Profil Tamamlanma
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={mentorProfile?.profileCompleteness || 0}
                      sx={{
                        width: 120,
                        height: 6,
                        borderRadius: 3,
                        bgcolor: "rgba(255,255,255,0.3)",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: "white",
                        },
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {mentorProfile?.profileCompleteness || 0}%
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
            <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
              <Button
                variant="contained"
                fullWidth
                sx={{
                  bgcolor: "white",
                  color: "primary.main",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.9)",
                  },
                }}
                onClick={() => router.push("/mentor/my-profile")}
              >
                Profili Düzenle
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              height: "100%",
              background: "#FFFFFF",
              border: "1px solid #E0E0E0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Box
                sx={{
                  bgcolor: "#E6F2FF",
                  borderRadius: 2,
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  flexShrink: 0,
                }}
              >
                <IconUsers size={32} color="#005DAD" />
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: "#005DAD", mb: 0.5 }}>
                  {profile?.stats?.totalMeetings || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Toplam Toplantı
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              height: "100%",
              background: "#FFFFFF",
              border: "1px solid #E0E0E0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Box
                sx={{
                  bgcolor: "#E8F5E9",
                  borderRadius: 2,
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  flexShrink: 0,
                }}
              >
                <IconTrophy size={32} color="#2E7D32" />
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: "#2E7D32", mb: 0.5 }}>
                  {profile?.stats?.completedMeetings || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tamamlanan
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              height: "100%",
              background: "#FFFFFF",
              border: "1px solid #E0E0E0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Box
                sx={{
                  bgcolor: "#FFF8E1",
                  borderRadius: 2,
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  flexShrink: 0,
                }}
              >
                <IconStar size={32} color="#F57C00" />
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: "#F57C00", mb: 0.5 }}>
                  {profile?.stats?.averageRating?.toFixed(1) || "0.0"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ortalama Puan
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              height: "100%",
              background: "#FFFFFF",
              border: "1px solid #E0E0E0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Box
                sx={{
                  bgcolor: "#E6F2FF",
                  borderRadius: 2,
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  flexShrink: 0,
                }}
              >
                <IconCalendar size={32} color="#005DAD" />
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: "#005DAD", mb: 0.5 }}>
                  {upcomingMeetings?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yaklaşan Toplantı
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

      </Grid>

      <Grid container spacing={3}>
        {/* Yaklaşan Toplantılar */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, border: "1px solid #E0E0E0" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#005DAD" }}>
                  Yaklaşan Toplantılar
                </Typography>
                <Button
                  size="small"
                  endIcon={<IconChevronRight size={16} />}
                  onClick={() => router.push("/mentor/meetings")}
                >
                  Tümünü Gör
                </Button>
              </Stack>
              <Divider sx={{ mb: 2 }} />

              {upcomingMeetings.length === 0 ? (
                <Alert severity="info">Yaklaşan toplantınız bulunmuyor</Alert>
              ) : (
                <Stack spacing={2}>
                  {upcomingMeetings.map((meeting) => (
                    <Paper
                      key={meeting._id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": {
                          boxShadow: 3,
                          borderColor: "primary.main",
                        },
                      }}
                      onClick={() => router.push(`/mentor/meetings/${meeting._id}`)}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            bgcolor: "primary.lighter",
                            borderRadius: 2,
                            p: 1.5,
                            textAlign: "center",
                            minWidth: 70,
                          }}
                        >
                          <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>
                            {format(parseISO(meeting.startAt), "d")}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "primary.main" }}>
                            {format(parseISO(meeting.startAt), "MMM", { locale: tr })}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {meeting.participantUserId?.name || "Bilinmeyen"}
                            </Typography>
                            {meeting.participantUserId?.teamName && (
                              <Chip
                                label={meeting.participantUserId.teamName}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: "0.65rem",
                                  bgcolor: "#E3F2FD",
                                  color: "#2196F3",
                                  fontWeight: 600,
                                  "& .MuiChip-label": {
                                    px: 0.8,
                                  },
                                }}
                              />
                            )}
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <IconClock size={14} />
                            <Typography variant="body2" color="text.secondary">
                              {format(parseISO(meeting.startAt), "HH:mm")} -{" "}
                              {format(parseISO(meeting.endAt), "HH:mm")}
                            </Typography>
                          </Stack>
                          {meeting.participantApplicationId && (
                            <Typography variant="caption" color="text.secondary">
                              {meeting.participantApplicationId.projectName}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={
                            meeting.status === "scheduled" && new Date(meeting.startAt) <= new Date()
                              ? "Devam Ediyor"
                              : meeting.status === "scheduled"
                                ? "Planlandı"
                                : "Diğer"
                          }
                          color={
                            meeting.status === "scheduled" && new Date(meeting.startAt) <= new Date()
                              ? "success"
                              : "primary"
                          }
                          size="small"
                        />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Hızlı Aksiyonlar ve İstatistikler */}
        <Grid item xs={12} md={4}>
          {/* Hızlı Aksiyonlar */}
          <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#005DAD" }}>
                Hızlı İşlemler
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<IconCalendar size={18} />}
                  onClick={() => router.push("/mentor/availability")}
                >
                  Müsaitlik Ayarla
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<IconUsers size={18} />}
                  onClick={() => router.push("/mentor/meetings")}
                >
                  Toplantılarım
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<IconBriefcase size={18} />}
                  onClick={() => router.push("/mentor/my-profile")}
                >
                  Profil Düzenle
                </Button>
              </Stack>
            </CardContent>
          </Card>

        </Grid>
      </Grid>

      {/* Son Feedback'ler - Backend'den geldiğinde aktif olacak */}
      {false && (
        <Card sx={{ mt: 3, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              <IconStar size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />
              Son Değerlendirmeler
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default MentorDashboard;

