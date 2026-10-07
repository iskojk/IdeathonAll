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
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
} from "@mui/material";
import {
  IconCalendarEvent,
  IconUser,
  IconMail,
  IconPhone,
  IconClock,
  IconVideo,
  IconNotes,
  IconStar,
  IconArrowLeft,
  IconCheck,
  IconPlus,
  IconMessageCircle,
  IconClockCancel,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import {
  getMeetingDetails,
  joinMeeting,
  getMeetingNotes,
  addMeetingNote,
  getMyMeetingFeedback,
  completeMeeting,
  submitFeedback,
  updateMeetingStatus,
  toggleAttendance,
} from "@/utils/api/mentor";
import { format, parseISO, isAfter } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { getStatusLabel, getStatusColor } from "@/utils/statusHelpers";

const MentorMeetingDetailView = ({ meetingId }) => {
  const router = useRouter();
  const [meeting, setMeeting] = useState(null);
  const [notes, setNotes] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  
  // Complete Meeting Dialog
  const [completeDialog, setCompleteDialog] = useState(false);
  const [completing, setCompleting] = useState(false);
  
  // Feedback Dialog
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comment: "",
    wouldMeetAgain: true,
    suggestions: "",
  });
  
  // Status Change Dialog
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [changingStatus, setChangingStatus] = useState(false);
  
  // Attendance
  const [togglingAttendance, setTogglingAttendance] = useState(false);

  useEffect(() => {
    if (meetingId) {
      loadMeetingData();
    }
  }, [meetingId]);

  const loadMeetingData = async () => {
    setLoading(true);
    try {
      const [meetingRes, notesRes] = await Promise.all([
        getMeetingDetails(meetingId),
        getMeetingNotes(meetingId),
      ]);

      if (meetingRes.success) {
        setMeeting(meetingRes.data);
      }

      if (notesRes.success) {
        setNotes(notesRes.data || []);
      }

      // Yeni API ile kendi feedback'imi getir
      if (meetingRes.success && meetingRes.data?.status === "completed") {
        try {
          const feedbackRes = await getMyMeetingFeedback(meetingId);
          if (feedbackRes.success && feedbackRes.data) {
            setFeedback([feedbackRes.data]);
          }
        } catch (error) {
          // 404 ise henüz feedback verilmemiş, normal
          if (error.response?.status !== 404) {
          }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = async () => {
    try {
      const result = await joinMeeting(meetingId);
      const url = result?.data?.meetingUrl || meeting.meetingUrl;
      if (url) {
        window.open(url, "_blank");
      }
      toast.success("Toplantıya katılım kaydedildi");
    } catch (error) {
      toast.error(error.response?.data?.message || "Katılım kaydedilemedi");
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Not boş olamaz");
      return;
    }

    setAddingNote(true);
    try {
      const response = await addMeetingNote(meetingId, {
        note: newNote.trim(),
        isPublic,
      });

      if (response.success) {
        toast.success("Not eklendi");
        setNotes((prev) => [...prev, response.data]);
        setNewNote("");
        setIsPublic(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Not eklenemedi");
    } finally {
      setAddingNote(false);
    }
  };

  const handleCompleteMeeting = async () => {
    setCompleting(true);
    try {
      const response = await completeMeeting(meetingId);
      if (response.success) {
        toast.success("Toplantı başarıyla tamamlandı!");
        setCompleteDialog(false);
        loadMeetingData(); // Refresh data
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Toplantı tamamlanamadı");
    } finally {
      setCompleting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackForm.rating) {
      toast.error("Lütfen puan verin");
      return;
    }

    setSubmittingFeedback(true);
    try {
      const response = await submitFeedback(meetingId, {
        ...feedbackForm,
        feedbackType: "mentor_to_participant",
      });
      if (response.success) {
        toast.success("Değerlendirme gönderildi!");
        setFeedbackDialog(false);
        setFeedback((prev) => [...prev, {
          ...response.data,
          feedbackType: "mentor_to_participant"
        }]);
        // Reset form
        setFeedbackForm({
          rating: 5,
          comment: "",
          wouldMeetAgain: true,
          suggestions: "",
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Değerlendirme gönderilemedi");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleOpenStatusDialog = (status) => {
    setNewStatus(status);
    setStatusReason("");
    setStatusDialog(true);
  };

  const handleChangeStatus = async () => {
    setChangingStatus(true);
    try {
      const response = await updateMeetingStatus(meetingId, {
        status: newStatus,
        reason: statusReason,
      });
      if (response.success) {
        toast.success(`Toplantı durumu '${getStatusLabel(newStatus)}' olarak güncellendi`);
        setStatusDialog(false);
        loadMeetingData(); // Refresh
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Durum değiştirilemedi");
    } finally {
      setChangingStatus(false);
    }
  };

  const handleToggleAttendance = async (attended) => {
    setTogglingAttendance(true);
    try {
      const response = await toggleAttendance(meetingId, { attended });
      if (response.success) {
        toast.success(attended ? "Katılım kaydedildi" : "Katılım kaldırıldı");
        
        if (response.data.autoCompleted) {
          toast.success("🎉 Toplantı otomatik tamamlandı!");
        }
        
        loadMeetingData(); // Refresh
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Katılım işlemi başarısız");
    } finally {
      setTogglingAttendance(false);
    }
  };


  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!meeting) {
    return (
      <Alert severity="error">
        Toplantı bulunamadı
      </Alert>
    );
  }

  return (
    <Box>
      {/* Back Button */}
      <Button
        startIcon={<IconArrowLeft size={18} />}
        onClick={() => router.back()}
        sx={{ mb: 2 }}
      >
        Geri Dön
      </Button>

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
          <Stack direction="row" justifyContent="space-between" alignItems="center">
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
                  Toplantı Detayları
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {format(parseISO(meeting.startAt), "d MMMM yyyy - HH:mm", { locale: tr })}
                </Typography>
              </Box>
            </Stack>
            <Chip
              label={getStatusLabel(meeting.status)}
              color={getStatusColor(meeting.status)}
              sx={{ color: "white", fontWeight: 600 }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Sol Taraf: Toplantı Bilgileri */}
        <Grid item xs={12} md={8}>
          {/* Katılımcı Bilgileri */}
          <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Katılımcı Bilgileri
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 2 }}>
                <Stack direction="row" spacing={3} alignItems="center" sx={{ flex: 1 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: "primary.main",
                      fontSize: "2rem",
                    }}
                  >
                    {meeting.participantUserId?.name?.charAt(0) || "?"}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {meeting.participantUserId?.name || "Bilinmeyen"}
                      </Typography>
                      {meeting.participantUserId?.teamName && (
                        <Chip
                          label={meeting.participantUserId.teamName}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: "0.75rem",
                            bgcolor: "#E3F2FD",
                            color: "#2196F3",
                            fontWeight: 600,
                            "& .MuiChip-label": {
                              px: 1.5,
                            },
                          }}
                        />
                      )}
                    </Stack>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <IconMail size={16} />
                        <Typography variant="body2" color="text.secondary">
                          {meeting.participantUserId?.email}
                        </Typography>
                      </Stack>
                      {meeting.participantUserId?.phone && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <IconPhone size={16} />
                          <Typography variant="body2" color="text.secondary">
                            {meeting.participantUserId.phone}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Box>
                </Stack>
                
                {/* Mesaj Gönder Butonu */}
                <Button
                  variant="contained"
                  startIcon={<IconMessageCircle size={18} />}
                  onClick={() => {
                    const participantId = meeting.participantUserId?._id;
                    if (!participantId) {
                      toast.error("Katılımcı bilgisi bulunamadı");
                      return;
                    }
                    router.push(`/mentor/messages?participantId=${participantId}`);
                  }}
                  sx={{
                    bgcolor: "#7B1FA2",
                    "&:hover": { bgcolor: "#6A1B9A" },
                    minWidth: { xs: "100%", sm: "auto" },
                    whiteSpace: "nowrap",
                  }}
                >
                  Mesaj Gönder
                </Button>
              </Stack>

              {meeting.participantApplicationId && (
                <Paper sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Proje Bilgileri
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {meeting.participantApplicationId.projectName}
                  </Typography>
                  {meeting.participantApplicationId.applicationCode && (
                    <Typography variant="body2" color="text.secondary">
                      Başvuru Kodu: {meeting.participantApplicationId.applicationCode}
                    </Typography>
                  )}
                  {meeting.participantApplicationId.category && (
                    <Chip
                      label={meeting.participantApplicationId.category}
                      size="small"
                      color="primary"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Paper>
              )}
            </CardContent>
          </Card>

          {/* Toplantı Notları */}
          <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid #E0E0E0" }} id="notes">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  <IconNotes size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />
                  Toplantı Notları
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {notes.length} not
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />

              {/* Not Ekle */}
              {meeting.status === "completed" && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Yeni Not Ekle
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Toplantı hakkında notlarınızı ekleyin..."
                    sx={{ mb: 1 }}
                  />
                  <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption">Katılımcı Görebilsin:</Typography>
                      <Button
                        size="small"
                        variant={isPublic ? "contained" : "outlined"}
                        onClick={() => setIsPublic(!isPublic)}
                      >
                        {isPublic ? "Evet" : "Hayır"}
                      </Button>
                    </Stack>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<IconPlus size={16} />}
                      onClick={handleAddNote}
                      disabled={addingNote || !newNote.trim()}
                    >
                      {addingNote ? "Ekleniyor..." : "Ekle"}
                    </Button>
                  </Stack>
                </Paper>
              )}

              {/* Notlar Listesi */}
              {notes.length === 0 ? (
                <Alert severity="info">Henüz not eklenmemiş</Alert>
              ) : (
                <Stack spacing={2}>
                  {notes.map((note) => (
                    <Paper key={note._id} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                            {note.authorUserId?.name?.charAt(0) || "?"}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {note.authorUserId?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(parseISO(note.createdAt), "d MMM yyyy - HH:mm", { locale: tr })}
                            </Typography>
                          </Box>
                        </Stack>
                        <Chip
                          label={note.isPublic ? "Katılımcı Görebilir" : "Sadece Benim"}
                          size="small"
                          color={note.isPublic ? "success" : "default"}
                        />
                      </Stack>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {note.note}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Feedback */}
          {feedback.length > 0 && (
            <Card sx={{ borderRadius: 2, border: "1px solid #E0E0E0" }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  <IconStar size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />
                  Değerlendirmeler
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Stack spacing={2}>
                  {feedback.map((fb) => (
                    <Paper key={fb._id} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {fb.feedbackType === "mentor_to_participant" 
                            ? "Sizin Değerlendirmeniz" 
                            : "Katılımcı Değerlendirmesi"}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="h6" sx={{ fontWeight: 700, color: "warning.main" }}>
                            {fb.rating}
                          </Typography>
                          <IconStar size={20} color="orange" />
                        </Stack>
                      </Stack>
                      
                      {fb.comment && (
                        <Typography variant="body2" sx={{ fontStyle: "italic", mb: 1 }}>
                          "{fb.comment}"
                        </Typography>
                      )}
                      
                      {fb.wouldMeetAgain !== undefined && (
                        <Chip
                          label={fb.wouldMeetAgain ? "Tekrar görüşmek ister" : "Tekrar görüşmek istemez"}
                          size="small"
                          color={fb.wouldMeetAgain ? "success" : "default"}
                          sx={{ mt: 1 }}
                        />
                      )}
                      
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        {format(parseISO(fb.createdAt), "d MMMM yyyy - HH:mm", { locale: tr })}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sağ Taraf: Aksiyon ve Detaylar */}
        <Grid item xs={12} md={4}>
          {/* Toplantı Linki ve Aksiyonlar */}
          {meeting.status === "scheduled" && (
            <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Toplantı Aksiyonları
                </Typography>
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<IconVideo />}
                    onClick={handleJoinMeeting}
                    sx={{
                      bgcolor: "#28a745",
                      "&:hover": { bgcolor: "#218838" },
                    }}
                  >
                    Toplantıya Katıl
                  </Button>
                  
                  <Paper sx={{ p: 1.5, bgcolor: "info.lighter", borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Toplantıya yukarıdaki &quot;Toplantıya Katıl&quot; butonu ile katılabilirsiniz.
                    </Typography>
                  </Paper>

                  {/* Tamamlama Butonu - Sadece Toplantı Bitiminden Sonra */}
                  {isAfter(new Date(), parseISO(meeting.endAt)) && (
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<IconCheck />}
                      onClick={() => setCompleteDialog(true)}
                      sx={{
                        borderColor: "#005DAD",
                        color: "#005DAD",
                        "&:hover": {
                          borderColor: "#004080",
                          bgcolor: "#E6F2FF",
                        },
                      }}
                    >
                      Toplantıyı Tamamla
                    </Button>
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2, textAlign: "center" }}>
                  {isAfter(new Date(), parseISO(meeting.endAt)) 
                    ? "Toplantı sona erdi, tamamlama işlemini gerçekleştirebilirsiniz" 
                    : "Toplantıya her zaman katılabilirsiniz"}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Feedback Butonu - Completed durumunda */}
          {meeting.status === "completed" && (
            <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Değerlendirme
                </Typography>
                {feedback.some(f => f.feedbackType === "mentor_to_participant") ? (
                  <Alert severity="success">
                    Katılımcıyı değerlendirdiniz
                  </Alert>
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Katılımcıyı değerlendirerek gelecekteki mentorluk deneyimlerine katkıda bulunun
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<IconStar />}
                      onClick={() => setFeedbackDialog(true)}
                      sx={{
                        bgcolor: "#005DAD",
                        "&:hover": { bgcolor: "#004080" },
                      }}
                    >
                      Katılımcıyı Değerlendir
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Toplantı Durumu Yönetimi */}
          <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Durum Yönetimi
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={2}>
                {/* Status Dropdown */}
                <FormControl fullWidth>
                  <InputLabel>Toplantı Durumu</InputLabel>
                  <Select
                    value={meeting.status}
                    label="Toplantı Durumu"
                    onChange={(e) => handleOpenStatusDialog(e.target.value)}
                    disabled={changingStatus}
                  >
                    <MenuItem value="scheduled">{getStatusLabel('scheduled')}</MenuItem>
                    <MenuItem value="completed">{getStatusLabel('completed')}</MenuItem>
                    <MenuItem value="cancelled">{getStatusLabel('cancelled')}</MenuItem>
                    <MenuItem value="no_show">{getStatusLabel('no_show')}</MenuItem>
                    <MenuItem value="rescheduled">{getStatusLabel('rescheduled')}</MenuItem>
                  </Select>
                </FormControl>

                {/* Attendance Toggle */}
                <Paper sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Katılım Durumu
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {meeting.attendance?.mentorJoined 
                          ? "Toplantıya katıldınız" 
                          : "Henüz katılmadınız"}
                      </Typography>
                    </Box>
                    <Switch
                      checked={meeting.attendance?.mentorJoined || false}
                      onChange={(e) => handleToggleAttendance(e.target.checked)}
                      disabled={togglingAttendance}
                      color="success"
                    />
                  </Stack>
                </Paper>
              </Stack>
            </CardContent>
          </Card>

          {/* İptal Bilgileri - Sadece cancelled durumunda */}
          {meeting.status === "cancelled" && meeting.cancellationReason && (
            <Card sx={{ mb: 3, borderRadius: 2, border: "2px solid #F57C00", bgcolor: "#FFF3E0" }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <IconClockCancel size={24} color="#E65100" />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#E65100" }}>
                    İptal Bilgileri
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 2, borderColor: "#FFB74D" }} />
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                      İptal Sebebi
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: "white", borderRadius: 1 }}>
                      <Typography variant="body1" sx={{ fontStyle: "italic", color: "#E65100" }}>
                        "{meeting.cancellationReason}"
                      </Typography>
                    </Paper>
                  </Box>
                  
                  {meeting.cancelledBy && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        İptal Eden
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "#F57C00" }}>
                          {meeting.cancelledBy.name?.charAt(0) || "?"}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {meeting.cancelledBy.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {meeting.cancelledBy.role === "mentor" ? "Mentor" : "Katılımcı"} - {meeting.cancelledBy.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}
                  
                  {meeting.cancelledAt && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        İptal Tarihi
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {format(parseISO(meeting.cancelledAt), "d MMMM yyyy - HH:mm", { locale: tr })}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Toplantı Detayları */}
          <Card sx={{ borderRadius: 2, border: "1px solid #E0E0E0" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Toplantı Detayları
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Başlangıç
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconCalendarEvent size={16} />
                    <Typography variant="body2">
                      {format(parseISO(meeting.startAt), "d MMMM yyyy - HH:mm", { locale: tr })}
                    </Typography>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Bitiş
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconClock size={16} />
                    <Typography variant="body2">
                      {format(parseISO(meeting.endAt), "HH:mm", { locale: tr })}
                    </Typography>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Platform
                  </Typography>
                  <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                    {meeting.meetingProvider || "Jitsi"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Zaman Dilimi
                  </Typography>
                  <Typography variant="body2">
                    {meeting.timezone || "Europe/Istanbul"}
                  </Typography>
                </Box>
                {meeting.description && meeting.description.trim() !== "" && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Katılımcı Notu
                  </Typography>
                  <Typography variant="body2">
                    {meeting.description}
                  </Typography>
                </Box>
                )}

                {meeting.attendance?.mentorJoinedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Katılım Zamanınız
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconCheck size={16} color="green" />
                      <Typography variant="body2">
                        {format(parseISO(meeting.attendance.mentorJoinedAt), "HH:mm", { locale: tr })}
                      </Typography>
                    </Stack>
                  </Box>
                )}

                {meeting.attendance?.participantJoinedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Katılımcı Katılım Zamanı
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconCheck size={16} color="green" />
                      <Typography variant="body2">
                        {format(parseISO(meeting.attendance.participantJoinedAt), "HH:mm", { locale: tr })}
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Complete Meeting Dialog */}
      <Dialog
        open={completeDialog}
        onClose={() => !completing && setCompleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#005DAD", color: "white" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconCheck size={24} />
            <Typography variant="h6">Toplantıyı Tamamla</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Toplantıyı tamamladığınızda:
          </Alert>
          <Stack spacing={1} sx={{ pl: 2 }}>
            <Typography variant="body2">
              • İstatistikleriniz otomatik güncellenecek
            </Typography>
            <Typography variant="body2">
              • Katılımcıya feedback isteği emaili gönderilecek
            </Typography>
            <Typography variant="body2">
              • Siz de katılımcıyı değerlendirebileceksiniz
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Bu işlem geri alınamaz. Toplantıyı tamamlamak istediğinizden emin misiniz?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCompleteDialog(false)} disabled={completing}>
            İptal
          </Button>
          <Button
            variant="contained"
            onClick={handleCompleteMeeting}
            disabled={completing}
            sx={{
              bgcolor: "#005DAD",
              "&:hover": { bgcolor: "#004080" },
            }}
          >
            {completing ? "Tamamlanıyor..." : "Evet, Tamamla"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialog}
        onClose={() => !changingStatus && setStatusDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#005DAD", color: "white" }}>
          Toplantı Durumunu Değiştir
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Toplantı durumunu <strong>'{getStatusLabel(newStatus)}'</strong> olarak değiştirmek üzeresiniz.
          </Alert>
          
          {(newStatus === "cancelled" || newStatus === "no_show") && (
            <TextField
              fullWidth
              label="Sebep (Opsiyonel)"
              multiline
              rows={3}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Durum değişikliği için sebep belirtebilirsiniz..."
              sx={{ mt: 2 }}
            />
          )}

          <Paper sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1, mt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 1 }}>
              Bu işlemde neler olur?
            </Typography>
            {newStatus === "completed" && (
              <Stack spacing={0.5}>
                <Typography variant="caption">✅ İstatistikleriniz güncellenir</Typography>
                <Typography variant="caption">📧 Katılımcıya feedback isteği emaili gönderilir</Typography>
              </Stack>
            )}
            {newStatus === "cancelled" && (
              <Stack spacing={0.5}>
                <Typography variant="caption">📧 İptal emaili gönderilir</Typography>
                <Typography variant="caption">🗑️ Slot silinir/cancelled olur</Typography>
              </Stack>
            )}
            {newStatus === "no_show" && (
              <Stack spacing={0.5}>
                <Typography variant="caption">⚠️ No-show kaydı tutulur</Typography>
                <Typography variant="caption">❌ İstatistikler güncellenmez</Typography>
              </Stack>
            )}
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setStatusDialog(false)} disabled={changingStatus}>
            İptal
          </Button>
          <Button
            variant="contained"
            onClick={handleChangeStatus}
            disabled={changingStatus}
            sx={{
              bgcolor: "#005DAD",
              "&:hover": { bgcolor: "#004080" },
            }}
          >
            {changingStatus ? "Değiştiriliyor..." : "Onayla"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackDialog}
        onClose={() => !submittingFeedback && setFeedbackDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#005DAD", color: "white" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconStar size={24} />
            <Typography variant="h6">Katılımcıyı Değerlendir</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Stack spacing={3}>
            {/* Rating */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Puan <span style={{ color: "red" }}>*</span>
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Rating
                  value={feedbackForm.rating}
                  onChange={(e, newValue) =>
                    setFeedbackForm((prev) => ({ ...prev, rating: newValue }))
                  }
                  size="large"
                />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {feedbackForm.rating}/5
                </Typography>
              </Stack>
            </Box>

            {/* Comment */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Yorumunuz
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={feedbackForm.comment}
                onChange={(e) =>
                  setFeedbackForm((prev) => ({ ...prev, comment: e.target.value }))
                }
                placeholder="Katılımcı hakkında yorumlarınızı paylaşın..."
              />
            </Box>

            {/* Would Meet Again */}
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={feedbackForm.wouldMeetAgain}
                    onChange={(e) =>
                      setFeedbackForm((prev) => ({
                        ...prev,
                        wouldMeetAgain: e.target.checked,
                      }))
                    }
                  />
                }
                label="Bu katılımcı ile tekrar görüşmek isterim"
              />
            </Box>

            {/* Suggestions */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Önerileriniz
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={feedbackForm.suggestions}
                onChange={(e) =>
                  setFeedbackForm((prev) => ({ ...prev, suggestions: e.target.value }))
                }
                placeholder="Katılımcıya önerileriniz..."
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setFeedbackDialog(false)} disabled={submittingFeedback}>
            İptal
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitFeedback}
            disabled={submittingFeedback || !feedbackForm.rating}
            sx={{
              bgcolor: "#005DAD",
              "&:hover": { bgcolor: "#004080" },
            }}
          >
            {submittingFeedback ? "Gönderiliyor..." : "Değerlendirmeyi Gönder"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MentorMeetingDetailView;


