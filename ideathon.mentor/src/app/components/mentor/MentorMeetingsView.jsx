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
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  IconCalendarEvent,
  IconUsers,
  IconClock,
  IconCheck,
  IconX,
  IconVideo,
  IconNotes,
  IconRefresh,
  IconClockCancel,
  IconChevronRight,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { getMyMeetings, joinMeeting, cancelMeeting, rescheduleMeeting, getCancelledMeetings, getCompletedMeetings } from "@/utils/api/mentor";
import { format, parseISO, isPast, isFuture } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { getStatusLabel, getStatusColor } from "@/utils/statusHelpers";

const MentorMeetingsView = () => {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");

  useEffect(() => {
    loadMeetings();
  }, [tabValue]);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      let response;
      
      if (tabValue === 2) {
        // İptal Edilenler sekmesi
        response = await getCancelledMeetings({});
      } else if (tabValue === 3) {
        // Tamamlanmışlar sekmesi (YENİ)
        response = await getCompletedMeetings({});
      } else {
        // Yaklaşan veya Geçmiş sekmesi
        const type = tabValue === 0 ? "upcoming" : "past";
        response = await getMyMeetings({ type });
      }

      if (response.success) {
        setMeetings(response.data || []);
      } else {
        toast.error("Toplantılar yüklenirken hata oluştu");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Toplantılar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = async (meeting) => {
    try {
      const result = await joinMeeting(meeting._id);
      const url = result?.data?.meetingUrl || meeting.meetingUrl;
      if (url) {
        window.open(url, "_blank");
      }
      toast.success("Toplantıya katılım kaydedildi");
    } catch (error) {
      toast.error(error.response?.data?.message || "Toplantıya katılım kaydedilemedi");
    }
  };

  const handleOpenCancelDialog = (meeting) => {
    setSelectedMeeting(meeting);
    setCancellationReason("");
    setCancelDialog(true);
  };

  const handleCloseCancelDialog = () => {
    setCancelDialog(false);
    setSelectedMeeting(null);
    setCancellationReason("");
  };

  const handleCancelMeeting = async () => {
    if (!cancellationReason.trim()) {
      toast.error("Lütfen iptal sebebini belirtin");
      return;
    }

    try {
      const response = await cancelMeeting(selectedMeeting._id, {
        cancellationReason: cancellationReason.trim(),
      });

      if (response.success) {
        toast.success("Toplantı iptal edildi ve katılımcıya bildirim gönderildi");
        handleCloseCancelDialog();
        loadMeetings();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Toplantı iptal edilemedi");
    }
  };

  const handleViewDetails = (meetingId) => {
    router.push(`/mentor/meetings/${meetingId}`);
  };

  const canJoinMeeting = (meeting) => {
    return meeting.status === "scheduled";
  };

  const canCancelMeeting = (meeting) => {
    return meeting.status === "scheduled" && isFuture(parseISO(meeting.startAt));
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
      {/* Header */}
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
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.2)",
                borderRadius: 2,
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconCalendarEvent size={40} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                Toplantılarım
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Geçmiş ve gelecek toplantılarınızı görüntüleyin
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Yaklaşan Toplantılar" />
          <Tab label="Geçmiş Toplantılar" />
          <Tab label="İptal Edilenler" />
          <Tab label="Tamamlanmışlar" />
        </Tabs>
      </Card>

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {tabValue === 0
            ? "Yaklaşan toplantınız bulunmuyor."
            : tabValue === 1
            ? "Geçmiş toplantı kaydı bulunmuyor."
            : tabValue === 2
            ? "İptal edilmiş toplantı bulunmuyor."
            : "Tamamlanmış toplantı bulunmuyor."}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {meetings.map((meeting) => (
            <Grid item xs={12} key={meeting._id}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: "2px solid",
                  borderColor: canJoinMeeting(meeting) ? "#2E7D32" : "#E0E0E0",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    borderColor: "#005DAD",
                  },
                }}
              >
                <CardContent>
                  <Grid container spacing={3}>
                    {/* Sol Taraf: Tarih ve Zaman */}
                    <Grid item xs={12} md={3}>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: "primary.lighter",
                          borderRadius: 2,
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="h4" sx={{ fontWeight: 700, color: "primary.main" }}>
                          {format(parseISO(meeting.startAt), "d")}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "primary.main" }}>
                          {format(parseISO(meeting.startAt), "MMMM yyyy", { locale: tr })}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                          <IconClock size={16} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {format(parseISO(meeting.startAt), "HH:mm")} -{" "}
                            {format(parseISO(meeting.endAt), "HH:mm")}
                          </Typography>
                        </Stack>
                      </Paper>
                    </Grid>

                    {/* Orta: Katılımcı Bilgileri */}
                    <Grid item xs={12} md={6}>
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            sx={{
                              width: 56,
                              height: 56,
                              bgcolor: "secondary.main",
                              fontSize: "1.5rem",
                            }}
                          >
                            {meeting.participantUserId?.name?.charAt(0) || "?"}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {meeting.participantUserId?.name || "Bilinmeyen Katılımcı"}
                              </Typography>
                              {meeting.participantUserId?.teamName && (
                                <Chip
                                  label={meeting.participantUserId.teamName}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: "0.7rem",
                                    bgcolor: "#E3F2FD",
                                    color: "#2196F3",
                                    fontWeight: 600,
                                    "& .MuiChip-label": {
                                      px: 1,
                                    },
                                  }}
                                />
                              )}
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {meeting.participantUserId?.email}
                            </Typography>
                          </Box>
                        </Stack>

                        {meeting.participantApplicationId && (
                          <Paper sx={{ p: 1.5, bgcolor: "grey.50", borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Proje
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {meeting.participantApplicationId.projectName}
                            </Typography>
                            {meeting.participantApplicationId.applicationCode && (
                              <Typography variant="caption" color="text.secondary">
                                Kod: {meeting.participantApplicationId.applicationCode}
                              </Typography>
                            )}
                          </Paper>
                        )}

                        <Stack spacing={1}>
                          <Chip
                            label={
                              meeting.status === "scheduled" && isPast(parseISO(meeting.startAt))
                                ? "Devam Ediyor"
                                : getStatusLabel(meeting.status)
                            }
                            color={
                              meeting.status === "scheduled" && isPast(parseISO(meeting.startAt))
                                ? "success"
                                : getStatusColor(meeting.status)
                            }
                            size="small"
                            sx={{ alignSelf: "flex-start" }}
                          />
                          
                          {/* İptal Bilgileri - Sadece İptal Edilenler sekmesinde */}
                          {tabValue === 2 && meeting.cancellationReason && (
                            <Paper sx={{ p: 1.5, bgcolor: "#FFF3E0", borderRadius: 1, border: "1px solid #FFB74D" }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: "#E65100", display: "block", mb: 0.5 }}>
                                İptal Sebebi:
                              </Typography>
                              <Typography variant="body2" sx={{ fontStyle: "italic", color: "#E65100" }}>
                                &quot;{meeting.cancellationReason}&quot;
                              </Typography>
                              {meeting.cancelledBy && (
                                <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#E65100" }}>
                                  İptal Eden: {meeting.cancelledBy.name} ({meeting.cancelledBy.role === "mentor" ? "Mentor" : "Katılımcı"})
                                </Typography>
                              )}
                              {meeting.cancelledAt && (
                                <Typography variant="caption" sx={{ display: "block", color: "#E65100" }}>
                                  İptal Tarihi: {format(parseISO(meeting.cancelledAt), "d MMMM yyyy - HH:mm", { locale: tr })}
                                </Typography>
                              )}
                            </Paper>
                          )}
                          
                          {/* Tamamlanma Bilgileri - Sadece Tamamlanmışlar sekmesinde */}
                          {tabValue === 3 && (
                            <Paper sx={{ p: 1.5, bgcolor: "#E8F5E9", borderRadius: 1, border: "1px solid #81C784" }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: "#2E7D32", display: "block", mb: 0.5 }}>
                                ✓ Toplantı Tamamlandı
                              </Typography>
                              {meeting.completedBy && (
                                <Typography variant="caption" sx={{ display: "block", color: "#2E7D32" }}>
                                  Tamamlayan: {meeting.completedBy.name} ({meeting.completedBy.role === "mentor" ? "Mentor" : "Katılımcı"})
                                </Typography>
                              )}
                              {meeting.completedAt && (
                                <Typography variant="caption" sx={{ display: "block", color: "#2E7D32" }}>
                                  Tamamlanma: {format(parseISO(meeting.completedAt), "d MMMM yyyy - HH:mm", { locale: tr })}
                                </Typography>
                              )}
                              {meeting.attendance && (
                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                  {meeting.attendance.mentorJoined && (
                                    <Chip 
                                      label="Mentor Katıldı" 
                                      size="small" 
                                      sx={{ 
                                        height: 20, 
                                        fontSize: "0.65rem",
                                        bgcolor: "#C8E6C9",
                                        color: "#2E7D32"
                                      }} 
                                    />
                                  )}
                                  {meeting.attendance.participantJoined && (
                                    <Chip 
                                      label="Katılımcı Katıldı" 
                                      size="small" 
                                      sx={{ 
                                        height: 20, 
                                        fontSize: "0.65rem",
                                        bgcolor: "#C8E6C9",
                                        color: "#2E7D32"
                                      }} 
                                    />
                                  )}
                                </Stack>
                              )}
                            </Paper>
                          )}
                        </Stack>
                      </Stack>
                    </Grid>

                    {/* Sağ: Aksiyonlar */}
                    <Grid item xs={12} md={3}>
                      <Stack spacing={1.5}>
                        {canJoinMeeting(meeting) && (
                          <Button
                            variant="contained"
                            color="success"
                            fullWidth
                            startIcon={<IconVideo size={18} />}
                            onClick={() => handleJoinMeeting(meeting)}
                          >
                            Toplantıya Katıl
                          </Button>
                        )}

                        {canCancelMeeting(meeting) && (
                          <Button
                            variant="outlined"
                            color="error"
                            fullWidth
                            startIcon={<IconClockCancel size={18} />}
                            onClick={() => handleOpenCancelDialog(meeting)}
                          >
                            İptal Et
                          </Button>
                        )}

                        <Button
                          variant="outlined"
                          fullWidth
                          endIcon={<IconChevronRight size={18} />}
                          onClick={() => handleViewDetails(meeting._id)}
                        >
                          Detaylar
                        </Button>

                        {meeting.status === "completed" && (
                          <Button
                            variant="outlined"
                            color="info"
                            fullWidth
                            startIcon={<IconNotes size={18} />}
                            onClick={() => router.push(`/mentor/meetings/${meeting._id}#notes`)}
                          >
                            Notlar
                          </Button>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onClose={handleCloseCancelDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Toplantıyı İptal Et</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Toplantıyı iptal etmek istediğinize emin misiniz? Katılımcıya bildirim gönderilecektir.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="İptal Sebebi (Zorunlu)"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Lütfen iptal sebebini belirtin..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} startIcon={<IconX size={16} />}>
            Vazgeç
          </Button>
          <Button
            onClick={handleCancelMeeting}
            variant="contained"
            color="error"
            startIcon={<IconCheck size={16} />}
            disabled={!cancellationReason.trim()}
          >
            İptal Et ve Bildir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MentorMeetingsView;


