"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Tabs,
  Tab,
  Grid,
  Paper,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import {
  IconStar,
  IconEdit,
  IconUser,
  IconCalendarEvent,
  IconMessage,
  IconTrophy,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import {
  getMyGivenFeedbacks,
  getReceivedFeedbacks,
  updateFeedback,
} from "@/utils/api/mentor";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

const FeedbackManagementView = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [myGivenFeedbacks, setMyGivenFeedbacks] = useState([]);
  const [receivedFeedbacks, setReceivedFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Dialog
  const [editDialog, setEditDialog] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [editForm, setEditForm] = useState({
    rating: 5,
    comment: "",
    wouldMeetAgain: true,
    suggestions: "",
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const [givenRes, receivedRes] = await Promise.all([
        getMyGivenFeedbacks(),
        getReceivedFeedbacks(),
      ]);

      if (givenRes.success) {
        setMyGivenFeedbacks(givenRes.data || []);
      }

      if (receivedRes.success) {
        setReceivedFeedbacks(receivedRes.data || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = (feedback) => {
    setEditingFeedback(feedback);
    setEditForm({
      rating: feedback.rating,
      comment: feedback.comment || "",
      wouldMeetAgain: feedback.wouldMeetAgain !== undefined ? feedback.wouldMeetAgain : true,
      suggestions: feedback.suggestions || "",
    });
    setEditDialog(true);
  };

  const handleUpdateFeedback = async () => {
    if (!editForm.rating) {
      toast.error("Lütfen puan verin");
      return;
    }

    setUpdating(true);
    try {
      const response = await updateFeedback(editingFeedback._id, editForm);
      if (response.success) {
        toast.success("Değerlendirme güncellendi!");
        setEditDialog(false);
        loadFeedbacks(); // Refresh
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Güncelleme başarısız");
    } finally {
      setUpdating(false);
    }
  };

  const calculateAverageRating = () => {
    if (receivedFeedbacks.length === 0) return 0;
    const sum = receivedFeedbacks.reduce((acc, fb) => acc + fb.rating, 0);
    return (sum / receivedFeedbacks.length).toFixed(1);
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
          <Stack 
            direction={{ xs: "column", sm: "row" }} 
            justifyContent="space-between" 
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
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
                <IconStar size={40} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Değerlendirme Yönetimi
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Aldığınız ve verdiğiniz değerlendirmeleri yönetin
                </Typography>
              </Box>
            </Stack>
            
            {/* Average Rating Badge */}
            <Paper
              sx={{
                p: 2,
                bgcolor: "rgba(255, 255, 255, 0.95)",
                borderRadius: 2,
                textAlign: "center",
                minWidth: { xs: "100%", sm: 160 },
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <IconTrophy size={24} color="#FFB400" />
                <Typography variant="h3" sx={{ fontWeight: 700, color: "#FFB400" }}>
                  {calculateAverageRating()}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Ortalama Puanınız
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                ({receivedFeedbacks.length} değerlendirme)
              </Typography>
            </Paper>
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ borderRadius: 2, border: "1px solid #E0E0E0" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 600,
              },
            }}
          >
            <Tab 
              label={`Aldığım Değerlendirmeler (${receivedFeedbacks.length})`}
              icon={<IconStar size={18} />}
              iconPosition="start"
            />
            <Tab 
              label={`Verdiğim Değerlendirmeler (${myGivenFeedbacks.length})`}
              icon={<IconEdit size={18} />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Tab 1: Aldığım Değerlendirmeler */}
          {activeTab === 0 && (
            <Box>
              {receivedFeedbacks.length === 0 ? (
                <Alert severity="info">
                  Henüz değerlendirme almadınız
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {receivedFeedbacks.map((feedback) => (
                    <Grid item xs={12} md={6} key={feedback._id}>
                      <Paper
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          height: "100%",
                        }}
                      >
                        {/* Header */}
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                            <Avatar sx={{ bgcolor: feedback.isAnonymous ? "#9E9E9E" : "primary.main" }}>
                              {feedback.isAnonymous ? "?" : (feedback.filledByUserId?.name?.charAt(0) || "?")}
                            </Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                                  {feedback.isAnonymous ? "Anonim Katılımcı" : (feedback.filledByUserId?.name || "Bilinmeyen")}
                                </Typography>
                                {feedback.isAnonymous && (
                                  <Chip
                                    label="Anonim"
                                    size="small"
                                    sx={{
                                      bgcolor: "#FFF3E0",
                                      color: "#E65100",
                                      fontWeight: 600,
                                      height: 20,
                                      fontSize: "0.7rem",
                                    }}
                                  />
                                )}
                              </Stack>
                              {!feedback.isAnonymous && (
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {feedback.filledByUserId?.email}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                          
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="h5" sx={{ fontWeight: 700, color: "warning.main" }}>
                              {feedback.rating}
                            </Typography>
                            <IconStar size={20} color="orange" />
                          </Stack>
                        </Stack>

                        {/* Meeting Info - Sadece anonim değilse göster */}
                        {!feedback.isAnonymous && feedback.meetingId && feedback.meetingId.startAt && feedback.meetingId.startAt !== "*******" && (
                          <Paper sx={{ p: 1.5, bgcolor: "grey.50", borderRadius: 1, mb: 2 }}>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
                              <IconCalendarEvent size={16} />
                              <Typography variant="caption" color="text.secondary">
                                {format(parseISO(feedback.meetingId.startAt), "d MMMM yyyy - HH:mm", { locale: tr })}
                              </Typography>
                            </Stack>
                          </Paper>
                        )}
                        
                        {/* Anonim Bilgilendirme */}
                        {feedback.isAnonymous && (
                          <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
                            <Typography variant="caption">
                              Katılımcı anonim kalmayı tercih ettiği için kişisel bilgiler gizlenmiştir.
                            </Typography>
                          </Alert>
                        )}

                        {/* Comment */}
                        {feedback.comment && (
                          <>
                            <Divider sx={{ my: 1.5 }} />
                            <Typography variant="body2" sx={{ fontStyle: "italic", mb: 1 }}>
                              &quot;{feedback.comment}&quot;
                            </Typography>
                          </>
                        )}

                        {/* Badges */}
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" gap={1}>
                          {feedback.wouldMeetAgain && (
                            <Chip
                              label="Tekrar görüşmek ister"
                              size="small"
                              color="success"
                              sx={{ fontSize: "0.75rem" }}
                            />
                          )}
                          {feedback.isAnonymous && (
                            <Chip
                              label="Anonim"
                              size="small"
                              color="default"
                              sx={{ fontSize: "0.75rem" }}
                            />
                          )}
                        </Stack>

                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                          {format(parseISO(feedback.createdAt), "d MMMM yyyy - HH:mm", { locale: tr })}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Tab 2: Verdiğim Değerlendirmeler */}
          {activeTab === 1 && (
            <Box>
              {myGivenFeedbacks.length === 0 ? (
                <Alert severity="info">
                  Henüz değerlendirme vermediniz
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {myGivenFeedbacks.map((feedback) => (
                    <Grid item xs={12} md={6} key={feedback._id}>
                      <Paper
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          height: "100%",
                          position: "relative",
                        }}
                      >
                        {/* Edit Button */}
                        <Button
                          size="small"
                          startIcon={<IconEdit size={16} />}
                          onClick={() => handleOpenEditDialog(feedback)}
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            minWidth: "auto",
                            px: 1.5,
                          }}
                        >
                          Düzenle
                        </Button>

                        {/* Header */}
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2, pr: 10 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                            <Avatar sx={{ bgcolor: "secondary.main" }}>
                              {feedback.meetingId?.participantUserId?.name?.charAt(0) || "?"}
                            </Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                                {feedback.meetingId?.participantUserId?.name}
                              </Typography>
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Typography variant="h6" sx={{ fontWeight: 700, color: "warning.main" }}>
                                  {feedback.rating}
                                </Typography>
                                <IconStar size={18} color="orange" />
                              </Stack>
                            </Box>
                          </Stack>
                        </Stack>

                        {/* Meeting Info */}
                        {feedback.meetingId && (
                          <Paper sx={{ p: 1.5, bgcolor: "grey.50", borderRadius: 1, mb: 2 }}>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
                              <IconCalendarEvent size={16} />
                              <Typography variant="caption" color="text.secondary">
                                {format(parseISO(feedback.meetingId.startAt), "d MMMM yyyy - HH:mm", { locale: tr })}
                              </Typography>
                            </Stack>
                          </Paper>
                        )}

                        {/* Comment */}
                        {feedback.comment && (
                          <>
                            <Divider sx={{ my: 1.5 }} />
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              &quot;{feedback.comment}&quot;
                            </Typography>
                          </>
                        )}

                        {/* Suggestions */}
                        {feedback.suggestions && (
                          <>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Öneriler:
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: "0.875rem", mb: 1 }}>
                              {feedback.suggestions}
                            </Typography>
                          </>
                        )}

                        {/* Badges */}
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" gap={1}>
                          {feedback.wouldMeetAgain !== undefined && (
                            <Chip
                              label={feedback.wouldMeetAgain ? "Tekrar görüşmek ister" : "Tekrar görüşmek istemez"}
                              size="small"
                              color={feedback.wouldMeetAgain ? "success" : "default"}
                              sx={{ fontSize: "0.75rem" }}
                            />
                          )}
                        </Stack>

                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                          {format(parseISO(feedback.createdAt), "d MMMM yyyy - HH:mm", { locale: tr })}
                          {feedback.updatedAt !== feedback.createdAt && " (Düzenlendi)"}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Edit Feedback Dialog */}
      <Dialog
        open={editDialog}
        onClose={() => !updating && setEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#005DAD", color: "white" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconEdit size={24} />
            <Typography variant="h6">Değerlendirmeyi Düzenle</Typography>
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
                  value={editForm.rating}
                  onChange={(e, newValue) =>
                    setEditForm((prev) => ({ ...prev, rating: newValue }))
                  }
                  size="large"
                />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {editForm.rating}/5
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
                value={editForm.comment}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, comment: e.target.value }))
                }
                placeholder="Katılımcı hakkında yorumlarınızı paylaşın..."
              />
            </Box>

            {/* Would Meet Again */}
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editForm.wouldMeetAgain}
                    onChange={(e) =>
                      setEditForm((prev) => ({
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
                value={editForm.suggestions}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, suggestions: e.target.value }))
                }
                placeholder="Katılımcıya önerileriniz..."
              />
            </Box>

            <Alert severity="warning">
              Rating değişirse mentor istatistikleriniz otomatik yeniden hesaplanacaktır.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialog(false)} disabled={updating}>
            İptal
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateFeedback}
            disabled={updating || !editForm.rating}
            sx={{
              bgcolor: "#005DAD",
              "&:hover": { bgcolor: "#004080" },
            }}
          >
            {updating ? "Güncelleniyor..." : "Güncelle"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FeedbackManagementView;














