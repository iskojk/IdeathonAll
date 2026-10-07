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
  CircularProgress,
  Alert,
  Paper,
  Divider,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from "@mui/material";
import {
  IconUser,
  IconUsers,
  IconMail,
  IconPhone,
  IconMapPin,
  IconSearch,
  IconMessageCircle,
  IconEye,
  IconId,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { getParticipants } from "@/utils/api/mentor";
import { useRouter } from "next/navigation";

const MentorParticipantsView = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    setLoading(true);
    try {
      const response = await getParticipants();
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Katılımcılar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (participant) => {
    // ✅ Backend'den gelen userId'yi kullan (applicationId değil!)
    const participantUserId = participant.userId;
    
    if (!participantUserId) {
      toast.error("Katılımcı kullanıcı bilgisi bulunamadı. Lütfen sayfayı yenileyin.");
      return;
    }
    
    
    router.push(`/mentor/messages?participantId=${participantUserId}`);
  };

  const handleViewDetails = (participant) => {
    setSelectedParticipant(participant);
    setDetailDialogOpen(true);
  };

  const getFilteredParticipants = () => {
    if (!data?.participants) return [];
    
    let filtered = data.participants;

    // Arama terimine göre filtrele
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.fullName?.toLowerCase().includes(term) ||
          p.email?.toLowerCase().includes(term) ||
          p.phone?.includes(term) ||
          p.teamName?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (!data) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Katılımcı verileri yüklenemedi
      </Alert>
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
            direction="row" 
            spacing={2} 
            alignItems="center"
          >
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
              <IconUsers size={40} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                Katılımcılar
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Onaylanmış katılımcıları görüntüleyin ve mesaj gönderin
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Arama */}
      <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="İsim, email, telefon veya takım ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={20} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Katılımcılar Tablosu */}
      <Card sx={{ borderRadius: 2, border: "1px solid #E0E0E0" }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Katılımcı</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>İletişim</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Şehir</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Takım</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    İşlemler
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredParticipants().map((participant) => (
                  <TableRow key={participant.applicationId} hover>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: "#005DAD" }}>
                          {participant.firstName?.charAt(0)}
                          {participant.lastName?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {participant.fullName}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <IconMail size={14} />
                          <Typography variant="body2">{participant.email}</Typography>
                        </Stack>
                        {participant.phone && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <IconPhone size={14} />
                            <Typography variant="body2">{participant.phone}</Typography>
                          </Stack>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <IconMapPin size={16} />
                        <Typography variant="body2">{participant.city || "-"}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={participant.role}
                        size="small"
                        color={
                          participant.isTeamOwner
                            ? "success"
                            : participant.isIndividual
                            ? "warning"
                            : "default"
                        }
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      {participant.teamName ? (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#2196F3" }}>
                          {participant.teamName}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<IconEye size={16} />}
                          onClick={() => handleViewDetails(participant)}
                          sx={{
                            borderColor: "#005DAD",
                            color: "#005DAD",
                            "&:hover": {
                              borderColor: "#004080",
                              bgcolor: "#E6F2FF",
                            },
                            textTransform: "none",
                            fontSize: "0.8rem",
                          }}
                        >
                          Görüntüle
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<IconMessageCircle size={16} />}
                          onClick={() => handleSendMessage(participant)}
                          sx={{
                            bgcolor: "#2196F3",
                            "&:hover": { bgcolor: "#1976D2" },
                            textTransform: "none",
                            fontSize: "0.8rem",
                          }}
                        >
                          Mesaj
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {getFilteredParticipants().length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Katılımcı bulunamadı
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Katılımcı Detay Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#005DAD", color: "white" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconUser size={24} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Katılımcı Detayları
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedParticipant && (
            <Stack spacing={3}>
              {/* Temel Bilgiler */}
              <Paper sx={{ p: 2, bgcolor: "#F5F5F5", borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: "#005DAD", width: 56, height: 56 }}>
                    {selectedParticipant.firstName?.charAt(0)}
                    {selectedParticipant.lastName?.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedParticipant.fullName}
                    </Typography>
                    <Chip 
                      label={selectedParticipant.role} 
                      size="small" 
                      color={
                        selectedParticipant.isTeamOwner
                          ? "success"
                          : selectedParticipant.isIndividual
                          ? "warning"
                          : "default"
                      }
                      sx={{ mt: 0.5 }} 
                    />
                  </Box>
                </Stack>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconMail size={18} />
                    <Typography variant="body2">{selectedParticipant.email}</Typography>
                  </Stack>
                  {selectedParticipant.phone && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconPhone size={18} />
                      <Typography variant="body2">{selectedParticipant.phone}</Typography>
                    </Stack>
                  )}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconMapPin size={18} />
                    <Typography variant="body2">{selectedParticipant.city || "-"}</Typography>
                  </Stack>
                </Stack>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<IconMessageCircle size={16} />}
                  onClick={() => {
                    handleSendMessage(selectedParticipant);
                    setDetailDialogOpen(false);
                  }}
                  sx={{
                    bgcolor: "#2196F3",
                    "&:hover": { bgcolor: "#1976D2" },
                    textTransform: "none",
                    mt: 2,
                  }}
                >
                  Mesaj Gönder
                </Button>
              </Paper>

              {/* Takım Bilgileri */}
              {selectedParticipant.teamName && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: "#005DAD" }}>
                    Takım Bilgileri
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: "#E3F2FD", borderRadius: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <IconUsers size={20} color="#2196F3" />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: "#2196F3" }}>
                        {selectedParticipant.teamName}
                      </Typography>
                    </Stack>
                    
                    {/* Takım üyeleri varsa göster */}
                    {data.teams && (
                      <>
                        {data.teams
                          .filter(team => team.teamName === selectedParticipant.teamName)
                          .map(team => (
                            <Box key={team.teamName}>
                              {/* Takım Sahibi Bilgileri */}
                              {team.teamOwner && (
                                <>
                                  <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mt: 1, mb: 1 }}>
                                    Takım Sahibi
                                  </Typography>
                                  <Paper sx={{ p: 1.5, bgcolor: "white", borderRadius: 1, mb: 2 }}>
                                    <Stack spacing={0.5}>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {team.teamOwner.firstName} {team.teamOwner.lastName}
                                      </Typography>
                                      <Stack direction="row" spacing={0.5} alignItems="center">
                                        <IconMail size={14} />
                                        <Typography variant="caption">{team.teamOwner.email}</Typography>
                                      </Stack>
                                      {team.teamOwner.city && (
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                          <IconMapPin size={14} />
                                          <Typography variant="caption">{team.teamOwner.city}</Typography>
                                        </Stack>
                                      )}
                                    </Stack>
                                  </Paper>
                                </>
                              )}
                              
                              <Divider sx={{ my: 2 }} />
                              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Takım Üyeleri ({team.totalMembers})
                              </Typography>
                              <List dense>
                                {team.teamMembers?.map((member, index) => (
                                  <ListItem key={index}>
                                    <ListItemAvatar>
                                      <Avatar sx={{ bgcolor: "#2196F3", width: 32, height: 32 }}>
                                        {member.firstName?.charAt(0)}
                                        {member.lastName?.charAt(0)}
                                      </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={member.fullName}
                                      secondary={member.role}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          ))}
                      </>
                    )}
                  </Paper>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailDialogOpen(false)} sx={{ textTransform: "none" }}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MentorParticipantsView;
