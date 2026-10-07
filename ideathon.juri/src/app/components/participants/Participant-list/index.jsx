"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  InputAdornment,
  Stack,
  Typography,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Paper,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  IconSearch,
  IconEye,
  IconCheck,
  IconX,
  IconInfoCircle,
} from "@tabler/icons-react";
import { ParticipantContext } from "@/app/context/ParticipantContext";
import { toast } from "react-toastify";
import moment from "moment";
import "moment/locale/tr";
moment.locale("tr");

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api";

/* ------------------------- Helpers ------------------------- */
const getStatusColor = (status) => {
  switch (status) {
    case "approved": return "success";
    case "rejected": return "error";
    case "pending": return "warning";
    default: return "default";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "approved": return "Onaylandı";
    case "rejected": return "Reddedildi";
    case "pending": return "Bekliyor";
    default: return status;
  }
};

const getParticipantTypeLabel = (type) => {
  switch (type) {
    case "student": return "Öğrenci";
    case "entrepreneur": return "Girişimci";
    case "employee": return "Çalışan";
    case "recent_graduate": return "Yeni Mezun";
    case "other": return "Diğer";
    default: return type;
  }
};

/* ------------------------- Main List ------------------------- */
const ParticipantList = () => {
  const { fetchParticipants, updateParticipantStatus } = useContext(ParticipantContext);

  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    loadData();
  }, [searchTerm]);

  const loadData = async () => {
    const result = await fetchParticipants();
    if (result?.success) {
      setParticipants(result.data || []);
    }
  };

  const handleApprove = async () => {
    if (!selectedParticipant) return;
    const result = await updateParticipantStatus(selectedParticipant._id, 'approve');
    if (result.success) {
      toast.success(result.message);
      loadData();
    } else {
      toast.error(result.message);
    }
    setOpenApproveDialog(false);
  };

  const handleReject = async () => {
    if (!selectedParticipant) return;
    const result = await updateParticipantStatus(selectedParticipant._id, 'reject', rejectReason);
    if (result.success) {
      toast.success(result.message);
      loadData();
    } else {
      toast.error(result.message);
    }
    setOpenRejectDialog(false);
    setRejectReason("");
  };

  const filteredParticipants = useMemo(() => {
    return (participants || []).filter((participant) => {
      const personalInfo = participant.personalInfo || {};
      const fullName = `${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim();

      const matchesSearch =
        String(fullName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(personalInfo.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(participant.applicationNumber || "").toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [participants, searchTerm]);

  const totalCount = participants.length;
  const filteredCount = filteredParticipants.length;

  return (
    <Box>
      {/* Üst Başlık & Filtreler */}
      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={isMobile ? 2 : 3}
        justifyContent="space-between"
        alignItems={isMobile ? "stretch" : "center"}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Katılımcılar
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {filteredCount}/{totalCount} kayıt gösteriliyor
          </Typography>
        </Stack>

        <Stack direction={isMobile ? "column" : "row"} spacing={1.5} alignItems="center" sx={{ width: isMobile ? "100%" : "auto" }}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="İsim, e-posta veya başvuru no ara"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconSearch size={18} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
        </Stack>
      </Stack>

      {/* Liste Kartı */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          overflow: "hidden",
          borderRadius: 2,
          "& .MuiTable-root": {
            minWidth: 800,
          },
          "& thead th": {
            position: "sticky",
            top: 0,
            background: theme.palette.background.paper,
            zIndex: 1,
            fontWeight: 700,
          },
          "& tbody tr:nth-of-type(odd)": {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Katılımcı</TableCell>
              <TableCell>İletişim</TableCell>
              <TableCell>Tip</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>Kayıt Tarihi</TableCell>
              <TableCell align="right">İşlem</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredParticipants.map((participant) => {
              const personalInfo = participant.personalInfo || {};
              const profileInfo = participant.profileInfo || {};

              const initial = String(personalInfo.firstName || "?").charAt(0).toUpperCase();
              const fullName = `${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim();

              return (
                <TableRow key={participant._id} hover>
                  {/* Katılımcı */}
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar>{initial}</Avatar>
                      <Box>
                        <Typography fontWeight={600}>
                          {fullName || "-"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          #{participant.applicationNumber}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  {/* İletişim */}
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2">{personalInfo.email || "-"}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {personalInfo.phone || "-"}
                      </Typography>
                    </Stack>
                  </TableCell>

                  {/* Tip */}
                  <TableCell>
                    <Typography>
                      {getParticipantTypeLabel(profileInfo.participantType) || "-"}
                    </Typography>
                  </TableCell>

                  {/* Durum */}
                  <TableCell>
                    <Chip
                      size="small"
                      label={getStatusLabel(participant.participantStatus)}
                      color={getStatusColor(participant.participantStatus)}
                      variant="filled"
                    />
                  </TableCell>

                  {/* Kayıt Tarihi */}
                  <TableCell>
                    <Typography>
                      {moment(participant.createdAt).format("DD.MM.YYYY")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {moment(participant.createdAt).format("HH:mm")}
                    </Typography>
                  </TableCell>

                  {/* İşlemler */}
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Detay Görüntüle">
                        <IconButton
                          onClick={() => {
                            setSelectedParticipant(participant);
                            setOpenDetailDialog(true);
                          }}
                          sx={{ borderRadius: 2 }}
                        >
                          <IconEye size={18} />
                        </IconButton>
                      </Tooltip>
                      {participant.participantStatus === "pending" && (
                        <>
                          <Tooltip title="Onayla">
                            <IconButton
                              onClick={() => {
                                setSelectedParticipant(participant);
                                setOpenApproveDialog(true);
                              }}
                              sx={{ borderRadius: 2, color: "success.main" }}
                            >
                              <IconCheck size={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reddet">
                            <IconButton
                              onClick={() => {
                                setSelectedParticipant(participant);
                                setOpenRejectDialog(true);
                              }}
                              sx={{ borderRadius: 2, color: "error.main" }}
                            >
                              <IconX size={18} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}

            {filteredParticipants.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box
                    py={6}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexDirection="column"
                    sx={{ color: "text.secondary" }}
                  >
                    <Typography sx={{ mb: 1 }}>Kayıt bulunamadı.</Typography>
                    {searchTerm && (
                      <Button
                        variant="outlined"
                        onClick={() => setSearchTerm("")}
                      >
                        Aramayı Temizle
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Onay Modal */}
      <Dialog
        open={openApproveDialog}
        onClose={() => setOpenApproveDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Katılımcıyı Onayla</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{selectedParticipant?.personalInfo?.firstName} {selectedParticipant?.personalInfo?.lastName}</strong> adlı katılımcıyı onaylamak istediğinizden emin misiniz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApproveDialog(false)}>İptal</Button>
          <Button onClick={handleApprove} color="success" variant="contained">
            Onayla
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reddet Modal */}
      <Dialog
        open={openRejectDialog}
        onClose={() => setOpenRejectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Katılımcıyı Reddet</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>
              <strong>{selectedParticipant?.personalInfo?.firstName} {selectedParticipant?.personalInfo?.lastName}</strong> adlı katılımcıyı reddetmek istediğinizden emin misiniz?
            </Typography>
            <TextField
              label="Reddetme Nedeni (İsteğe bağlı)"
              multiline
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reddetme nedenini belirtin..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)}>İptal</Button>
          <Button onClick={handleReject} color="error" variant="contained">
            Reddet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detay Modal */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: "primary.main", width: 50, height: 50 }}>
                {String(selectedParticipant?.personalInfo?.firstName || "?").charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedParticipant?.personalInfo?.firstName} {selectedParticipant?.personalInfo?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Başvuru No: {selectedParticipant?.applicationNumber}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Chip
                size="small"
                label={getStatusLabel(selectedParticipant?.participantStatus)}
                color={getStatusColor(selectedParticipant?.participantStatus)}
                variant="filled"
              />
              <IconButton onClick={() => setOpenDetailDialog(false)} size="small">
                <IconEye size={20} />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ maxHeight: 'calc(90vh - 140px)', overflowY: 'auto', pr: 1 }}>
            {selectedParticipant ? (
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  {/* Kişisel Bilgiler */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={1} sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                          👤 Kişisel Bilgiler
                        </Typography>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              E-posta
                            </Typography>
                            <Typography variant="body1">
                              {selectedParticipant.personalInfo?.email || "-"}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Telefon
                            </Typography>
                            <Typography variant="body1">
                              {selectedParticipant.personalInfo?.phone || "-"}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              TC Kimlik / Doğum Tarihi
                            </Typography>
                            <Typography variant="body1">
                              {selectedParticipant.personalInfo?.tcIdentity || "-"} / {selectedParticipant.personalInfo?.birthDate ? moment(selectedParticipant.personalInfo.birthDate).format("DD.MM.YYYY") : "-"}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Şehir
                            </Typography>
                            <Typography variant="body1">
                              {selectedParticipant.personalInfo?.city || "-"}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Profil Bilgileri */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={1} sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                          📋 Profil Bilgileri
                        </Typography>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Katılımcı Tipi
                            </Typography>
                            <Typography variant="body1">
                              {getParticipantTypeLabel(selectedParticipant.profileInfo?.participantType) || "-"}
                            </Typography>
                          </Box>
                          {selectedParticipant.profileInfo?.studentInfo && (
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Öğrenci Bilgileri
                              </Typography>
                              <Typography variant="body1">
                                {selectedParticipant.profileInfo.studentInfo.school} - {selectedParticipant.profileInfo.studentInfo.department}
                              </Typography>
                            </Box>
                          )}
                          {selectedParticipant.profileInfo?.professionalInfo && (
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Profesyonel Bilgiler
                              </Typography>
                              <Typography variant="body1">
                                {selectedParticipant.profileInfo.professionalInfo.educationLevel} - {selectedParticipant.profileInfo.professionalInfo.field}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* İlgi Alanları */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={1} sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                          🎯 İlgi Alanları
                        </Typography>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              İlgi Alanı
                            </Typography>
                            <Typography variant="body1">
                              {selectedParticipant.interestsInfo?.observationField || "-"}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Önceki Deneyim
                            </Typography>
                            <Typography variant="body1">
                              {selectedParticipant.interestsInfo?.hasPreviousExperience ? "Evet" : "Hayır"}
                            </Typography>
                          </Box>
                          {selectedParticipant.interestsInfo?.previousExperienceDescription && (
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Deneyim Açıklaması
                              </Typography>
                              <Typography variant="body1">
                                {selectedParticipant.interestsInfo.previousExperienceDescription}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Yetkinlikler */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={1} sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                          🛠️ Yetkinlikler
                        </Typography>
                        <Stack spacing={2}>
                          {selectedParticipant.competenciesInfo?.competencies && (
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Yetenekler
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                {selectedParticipant.competenciesInfo.competencies.map((comp, index) => (
                                  <Chip key={index} size="small" label={comp} variant="outlined" color="primary" />
                                ))}
                              </Stack>
                            </Box>
                          )}
                          {selectedParticipant.competenciesInfo?.selfDescription && (
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Kendini Tanımlama
                              </Typography>
                              <Typography variant="body1">
                                {selectedParticipant.competenciesInfo.selfDescription}
                              </Typography>
                            </Box>
                          )}
                          {selectedParticipant.competenciesInfo?.otherCompetency && (
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                Diğer Yetkinlik
                              </Typography>
                              <Typography variant="body1">
                                {selectedParticipant.competenciesInfo.otherCompetency}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Motivasyon */}
                  <Grid item xs={12}>
                    <Card elevation={1}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                          🔥 Motivasyon
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                          {selectedParticipant.competenciesInfo?.motivation || "Motivasyon bilgisi bulunmuyor."}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Stack>
            ) : (
              <Typography color="text.secondary">Kayıt yok.</Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ParticipantList;



