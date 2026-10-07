"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Stack,
  Chip,
  Divider,
  LinearProgress,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
} from "@mui/material";
import {
  IconX,
  IconStar,
  IconCalendar,
  IconCheck,
  IconUsers,
  IconClock,
  IconTrendingUp,
  IconMail,
  IconBrandLinkedin,
  IconExternalLink,
  IconChevronDown,
  IconChartBar,
  IconCalendarTime,
} from "@tabler/icons-react";
import { useSuperadminMentor } from "@/app/context/SuperadminMentorContext";
import { toast } from "react-toastify";
import moment from "moment";
import "moment/locale/tr";

moment.locale("tr");

const BRAND_COLOR = "#005DAD";

const StatBox = ({ label, value, color, icon: Icon }) => (
  <Card
    sx={{
      borderRadius: 3,
      border: `1px solid ${alpha(color, 0.2)}`,
      backgroundColor: alpha(color, 0.04),
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        {Icon && (
          <Avatar
            sx={{
              width: 44,
              height: 44,
              backgroundColor: alpha(color, 0.1),
              color: color,
            }}
          >
            <Icon size={20} />
          </Avatar>
        )}
        <Box flex={1}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: color }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const MentorDetailModal = ({ open, onClose, mentor }) => {
  const theme = useTheme();
  const { fetchMentorStats, loading } = useSuperadminMentor();
  const [detailStats, setDetailStats] = useState(null);

  useEffect(() => {
    if (open && mentor?._id) {
      loadDetailStats();
    }
  }, [open, mentor]);

  const loadDetailStats = async () => {
    const result = await fetchMentorStats(mentor._id);
    if (result.success) {
      setDetailStats(result.data);
    } else {
      toast.error(result.message);
    }
  };

  if (!mentor) return null;

  const resolvedMentor = detailStats?.mentor || mentor;
  const photoUrl = resolvedMentor.photoUrl || "/images/profile/user-1.jpg";
  const mentorName = resolvedMentor.userId?.name || resolvedMentor.displayName || resolvedMentor.name || "Bilinmeyen";
  const mentorEmail = resolvedMentor.userId?.email || resolvedMentor.email || "-";
  const linkedInUrl = resolvedMentor.linkedin;
  const ratingAverage = detailStats?.rating?.averageRating ?? detailStats?.rating?.average ?? 0;
  const ratingTotal = detailStats?.rating?.totalFeedbacks ?? detailStats?.rating?.total ?? 0;
  const ratingDistribution = detailStats?.rating?.ratingDistribution ?? detailStats?.rating?.distribution ?? {};
  const recentFeedbacks = detailStats?.rating?.recentFeedbacks ?? [];
  const meetingStats = detailStats?.meetingStats || {};
  const meetingStatus = meetingStats.byStatus || {};
  const meetingTotal = meetingStats.total || 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ p: { xs: 2.5, md: 3 }, backgroundColor: alpha(BRAND_COLOR, 0.06) }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Mentor Detayları
            </Typography>
              <Typography variant="body2" color="text.secondary">
                Detaylı profil, istatistikler ve görüşme geçmişi
            </Typography>
          </Box>
            <IconButton onClick={onClose}>
              <IconX size={22} />
          </IconButton>
        </Stack>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 3 }}>
        {loading ? (
          <Box sx={{ py: 2 }}>
            <Card sx={{ borderRadius: 3, p: 3, mb: 3 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Skeleton variant="circular" width={88} height={88} />
                <Box flex={1}>
                  <Skeleton width="40%" height={28} />
                  <Skeleton width="60%" height={20} />
                  <Skeleton width="50%" height={20} />
                </Box>
              </Stack>
            </Card>
            <Grid container spacing={2}>
              {[1, 2, 3, 4].map((item) => (
                <Grid item xs={12} sm={6} md={3} key={item}>
                  <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 3 }} />
                </Grid>
              ))}
            </Grid>
            <LinearProgress sx={{ mt: 3 }} />
          </Box>
        ) : detailStats ? (
          <Box>
            <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, mb: 3 }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ xs: "flex-start", md: "center" }}>
              <Avatar
                src={photoUrl}
                    alt={mentorName}
                    sx={{ width: 96, height: 96, border: `3px solid ${alpha(BRAND_COLOR, 0.4)}` }}
                  />
                  <Box flex={1} minWidth={0}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }} noWrap>
                        {mentorName}
                  </Typography>
                  <Chip
                        label={resolvedMentor.isActive ? "Aktif" : "Pasif"}
                    size="small"
                    sx={{
                          backgroundColor: resolvedMentor.isActive ? alpha("#10b981", 0.12) : alpha("#ef4444", 0.12),
                          color: resolvedMentor.isActive ? "#10b981" : "#ef4444",
                      fontWeight: 600,
                    }}
                  />
                </Stack>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <IconChartBar size={16} color={theme.palette.text.secondary} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {resolvedMentor.title || "-"}
                </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <IconMail size={16} color={theme.palette.text.secondary} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {mentorEmail}
                  </Typography>
                    </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconCalendar size={16} color={theme.palette.text.secondary} />
                  <Typography variant="caption" color="text.secondary">
                        Kayıt: {moment(resolvedMentor.createdAt).format("DD MMMM YYYY")}
                  </Typography>
                </Stack>
              </Box>
                  <Stack direction="row" spacing={1}>
                    {linkedInUrl && (
                      <IconButton
                        component="a"
                        href={linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: BRAND_COLOR,
                          backgroundColor: alpha(BRAND_COLOR, 0.08),
                          "&:hover": { backgroundColor: alpha(BRAND_COLOR, 0.16) },
                        }}
                      >
                        <IconBrandLinkedin size={20} />
                      </IconButton>
                    )}
                  </Stack>
            </Stack>
          </CardContent>
        </Card>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatBox label="Toplam Görüşme" value={meetingTotal || 0} color={BRAND_COLOR} icon={IconCalendar} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatBox
                  label="Tamamlanan"
                  value={meetingStatus.completed || 0}
                  color="#10b981"
                  icon={IconCheck}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatBox label="Ortalama Puan" value={ratingAverage.toFixed(1)} color="#f59e0b" icon={IconStar} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatBox label="Katılımcı" value={detailStats.participants?.total || 0} color="#8b5cf6" icon={IconUsers} />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Accordion defaultExpanded elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Görüşme Durumu
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      {[
                        { label: "Tamamlanan", value: meetingStatus.completed || 0, color: "#10b981" },
                        { label: "Zamanlanmış", value: meetingStatus.scheduled || 0, color: "#3b82f6" },
                        { label: "İptal", value: meetingStatus.cancelled || 0, color: "#ef4444" },
                        { label: "Katılmayan", value: meetingStatus.noShow || 0, color: "#f97316" },
                        { label: "Ertelenen", value: meetingStatus.rescheduled || 0, color: BRAND_COLOR },
                      ].map((item) => (
                        <Box key={item.label}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography variant="body2">{item.label}</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: item.color }}>
                              {item.value}
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={(item.value / (meetingTotal || 1)) * 100}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: alpha(item.color, 0.08),
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 4,
                                backgroundColor: item.color,
                              },
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Tamamlanma Oranı
                      </Typography>
                      <Chip
                        label={`%${meetingStats.completionRate || 0}`}
                        sx={{
                          backgroundColor: alpha("#10b981", 0.1),
                          color: "#10b981",
                          fontWeight: 700,
                        }}
                      />
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              <Grid item xs={12} md={6}>
                <Accordion defaultExpanded elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Puan Dağılımı
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = ratingDistribution?.[rating] || 0;
                        const total = ratingTotal || 1;
                        const percentage = Math.round((count / total) * 100);
                        return (
                          <Box key={rating}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <IconStar size={16} fill="#f59e0b" color="#f59e0b" />
                                <Typography variant="body2">{rating} Yıldız</Typography>
                              </Stack>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                {count}
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={percentage}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: alpha("#f59e0b", 0.1),
                                "& .MuiLinearProgress-bar": {
                                  borderRadius: 4,
                                  backgroundColor: "#f59e0b",
                                },
                              }}
                            />
                          </Box>
                        );
                      })}
                    </Stack>
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Toplam Değerlendirme
                      </Typography>
                      <Chip
                        icon={<IconStar size={16} fill="#f59e0b" color="#f59e0b" />}
                        label={ratingTotal}
                        sx={{ backgroundColor: alpha("#f59e0b", 0.1), color: "#f59e0b", fontWeight: 700 }}
                      />
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              <Grid item xs={12} md={6}>
                <Accordion elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Katılımcı ve Performans
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                          <CardContent sx={{ p: 2.5 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar sx={{ bgcolor: alpha(BRAND_COLOR, 0.1), color: BRAND_COLOR }}>
                                <IconUsers size={18} />
                              </Avatar>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLOR }}>
                                  {detailStats.participants?.total || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Toplam Katılımcı
                                </Typography>
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                          <CardContent sx={{ p: 2.5 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar sx={{ bgcolor: alpha("#8b5cf6", 0.1), color: "#8b5cf6" }}>
                                <IconTrendingUp size={18} />
                              </Avatar>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: "#8b5cf6" }}>
                                  {detailStats.participants?.repeating || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Tekrar Eden
                                </Typography>
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12}>
                        <Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                          <CardContent sx={{ p: 2.5 }}>
                            <Stack spacing={1.5}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" color="text.secondary">
                                  Ortalama Süre (dakika)
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLOR }}>
                                  {meetingStats.averageDuration || 0}
                                </Typography>
                              </Stack>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" color="text.secondary">
                                  Ortalama Puan
                                </Typography>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <IconStar size={18} fill="#f59e0b" color="#f59e0b" />
                                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#f59e0b" }}>
                                    {ratingAverage.toFixed(2)}
                                  </Typography>
                                </Stack>
                              </Stack>
                    </Stack>
                  </CardContent>
                </Card>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              <Grid item xs={12} md={6}>
                <Accordion elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                  <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Hakkında ve Uzmanlıklar
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      {resolvedMentor.about && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Hakkında
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {resolvedMentor.about}
                          </Typography>
                        </Box>
                      )}
                      {resolvedMentor.expertiseTags?.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Uzmanlık Alanları
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5, mt: 0.5 }}>
                            {resolvedMentor.expertiseTags.map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag}
                                size="small"
                                sx={{
                                  height: 24,
                                  backgroundColor: alpha(BRAND_COLOR, 0.1),
                                  color: BRAND_COLOR,
                                  fontSize: "0.75rem",
                                }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {recentFeedbacks.length > 0 && (
                <Grid item xs={12}>
                  <Accordion elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                    <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Son Geri Bildirimler ({recentFeedbacks.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        {recentFeedbacks.map((feedback, index) => (
                          <Card key={index} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                            <CardContent sx={{ p: 2.5 }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                {[...Array(5)].map((_, i) => (
                                  <IconStar
                                    key={i}
                                    size={16}
                                    fill={i < feedback.rating ? "#f59e0b" : "none"}
                                    color={i < feedback.rating ? "#f59e0b" : "#d1d5db"}
                                  />
                                ))}
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {moment(feedback.createdAt).format("DD MMM YYYY")}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {feedback.comment}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              - {feedback.participantName}
                            </Typography>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              )}

              {detailStats.upcomingMeetings && detailStats.upcomingMeetings.length > 0 && (
                <Grid item xs={12}>
                  <Accordion elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                    <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Yaklaşan Görüşmeler ({detailStats.upcomingMeetings.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: alpha(BRAND_COLOR, 0.05) }}>
                              <TableCell sx={{ fontWeight: 600 }}>Katılımcı</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Başlık</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Tarih</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Saat</TableCell>
                              <TableCell sx={{ fontWeight: 600 }} align="center">
                                Bağlantı
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {detailStats.upcomingMeetings.map((meeting) => (
                              <TableRow key={meeting._id} hover>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {meeting.participant}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {meeting.participantEmail}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">{meeting.title || "-"}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">{moment(meeting.startAt).format("DD MMM YYYY")}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <IconCalendarTime size={14} />
                                  <Typography variant="body2">
                                    {moment(meeting.startAt).format("HH:mm")} - {moment(meeting.endAt).format("HH:mm")}
                                  </Typography>
                                  </Stack>
                                </TableCell>
                                <TableCell align="center">
                                  {meeting.meetingUrl && (
                                    <IconButton
                                      size="small"
                                      component="a"
                                      href={meeting.meetingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{ color: BRAND_COLOR }}
                                    >
                                      <IconExternalLink size={18} />
                                    </IconButton>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              )}
            </Grid>
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              Veri yüklenemedi
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MentorDetailModal;






