"use client";

import React, { useContext, useEffect, useState } from "react";
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
  Card,
  CardContent,
  Grid,
  Divider,
  useTheme,
  Alert,
  Autocomplete,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  alpha,
  CircularProgress,
} from "@mui/material";
import {
  IconSearch,
  IconEye,
  IconEdit,
  IconX,
  IconBrandLinkedin,
  IconCalendar,
  IconStar,
  IconUsers,
  IconTrash,
  IconAlertTriangle,
  IconUsersGroup,
  IconBuilding,
  IconMail,
  IconPhone,
  IconUser,
  IconCheck,
  IconRefresh,
} from "@tabler/icons-react";
import { MentorNetContext } from "@/app/context/MentorNetContext";
import { toast } from "react-toastify";
import moment from "moment";
import "moment/locale/tr";

moment.locale("tr");

// Uzmanlik alanlari listesi
const EXPERTISE_OPTIONS = [
  "Satis", "Pazarlama", "SEO (Arama Motoru Optimizasyonu)", "Sosyal Medya Pazarlamasi",
  "Icerik Pazarlamasi", "Dijital Pazarlama", "E-Ticaret", "B2B Pazarlama", "B2C Pazarlama",
  "CRM (Musteri Iliskileri Yonetimi)", "Fiyatlandirma Stratejileri", "Marka Yonetimi",
  "Urun Yonetimi", "Pazar Arastirmasi", "Reklam ve Tanitim", "Halkla Iliskiler",
  "Etkinlik Pazarlamasi", "Is Gelistirme", "Muzakere Teknikleri", "Musteri Deneyimi (CX)",
  "Muhasebe", "Finansal Planlama", "Butceleme ve Maliyet Kontrolu", "Yatirim Yonetimi",
  "Risk Yonetimi", "Vergi Planlamasi", "Finansal Raporlama", "Finansal Analiz",
  "Hibeler ve Fon Yonetimi", "Yatirimci Iliskileri", "Finansal Teknolojiler (FinTech)",
  "Dis Ticaret", "Uluslararasi Is Iliskileri", "Ihracat ve Ithalat Yonetimi",
  "Yazilim Gelistirme", "Mobil Uygulamalar", "Web Gelistirme",
  "Kullanici Deneyimi (UX) ve Kullanici Arayuzu (UI)", "Veri Tabani Yonetimi",
  "Bulut Bilisim", "Siber Guvenlik", "Veri Analitigi ve Buyuk Veri",
  "Yapay Zeka (AI) ve Makine Ogrenimi", "Blokzincir ve Kripto Para Teknolojileri",
  "Girisimcilik ve Start-Up Mentorlugu", "Inovasyon ve Yaraticilik",
  "Proje Yonetimi", "Degisim Yonetimi", "Kriz Yonetimi",
  "Gayrimenkul Yatirimi ve Emlak Yonetimi", "Sanat, Kultur ve Yaratici Endustriler",
  "IK Teknolojileri", "Diger",
];

const MentorProfileList = ({ refreshTrigger, ideathons = [] }) => {
  const theme = useTheme();
  const { 
    fetchMentorProfiles, 
    getMentorStats, 
    deleteMentorProfile,
    updateMentorProfile,
    fetchAssignedUsers,
    updateAssignedUsers,
    loading 
  } = useContext(MentorNetContext);

  const [profiles, setProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedStats, setSelectedStats] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // User assignment state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignmentData, setAssignmentData] = useState(null); // { mentor, ideathon, users, summary }
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [assignSearchTerm, setAssignSearchTerm] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignApprovedOnly, setAssignApprovedOnly] = useState(true);

  // Edit form state — now includes userInfo and ideathonId
  const [editFormData, setEditFormData] = useState({
    title: '',
    about: '',
    linkedin: '',
    expertiseTags: [],
    isActive: true,
    ideathonId: '',
    userInfo: {
      name: '',
      email: '',
      phone: '',
    },
  });

  useEffect(() => {
    loadProfiles();
  }, [refreshTrigger]);

  const loadProfiles = async () => {
    const result = await fetchMentorProfiles();
    if (result?.success) {
      setProfiles(result.data || []);
    } else {
      toast.error(result?.message || "Mentor profilleri yuklenemedi");
    }
  };

  const handleViewDetail = async (profile) => {
    setSelectedProfile(profile);
    
    const statsResult = await getMentorStats(profile.userId._id);
    if (statsResult?.success) {
      setSelectedStats(statsResult.data);
    }
    
    setDetailOpen(true);
  };

  const handleEditClick = (profile) => {
    setSelectedProfile(profile);
    setEditFormData({
      title: profile.title || '',
      about: profile.about || '',
      linkedin: profile.linkedin || '',
      expertiseTags: profile.expertiseTags || [],
      isActive: profile.isActive !== undefined ? profile.isActive : true,
      ideathonId: typeof profile.ideathonId === 'object' ? profile.ideathonId?._id : (profile.ideathonId || ''),
      userInfo: {
        name: profile.userId?.name || '',
        email: profile.userId?.email || '',
        phone: profile.userId?.phone || '',
      },
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedProfile) return;

    // Validation
    if (!editFormData.title || editFormData.title.trim().length < 2) {
      toast.error("Unvan en az 2 karakter olmalidir");
      return;
    }
    if (!editFormData.about || editFormData.about.trim().length < 10) {
      toast.error("Hakkinda bilgisi en az 10 karakter olmalidir");
      return;
    }
    if (editFormData.expertiseTags.length === 0) {
      toast.error("En az 1 uzmanlik alani secmelisiniz");
      return;
    }
    if (!editFormData.userInfo.name || editFormData.userInfo.name.trim().length < 2) {
      toast.error("Kullanici adi en az 2 karakter olmalidir");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editFormData.userInfo.email || !emailRegex.test(editFormData.userInfo.email)) {
      toast.error("Gecerli bir e-posta adresi girin");
      return;
    }

    // Build payload with userInfo
    const payload = {
      title: editFormData.title,
      about: editFormData.about,
      linkedin: editFormData.linkedin,
      expertiseTags: editFormData.expertiseTags,
      isActive: editFormData.isActive,
      userInfo: {
        name: editFormData.userInfo.name,
        email: editFormData.userInfo.email,
        phone: editFormData.userInfo.phone,
      },
    };

    // Include ideathonId if changed
    if (editFormData.ideathonId) {
      payload.ideathonId = editFormData.ideathonId;
    }

    const result = await updateMentorProfile(selectedProfile.userId._id, payload);

    if (result.success) {
      toast.success("Mentor profili basariyla guncellendi");
      setEditDialogOpen(false);
      setSelectedProfile(null);
      loadProfiles();
    } else {
      toast.error(result.message);
    }
  };

  const handleDeleteClick = (profile) => {
    setSelectedProfile(profile);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProfile) return;

    const result = await deleteMentorProfile(selectedProfile.userId._id, true);

    if (result.success) {
      toast.success(result.message);
      setDeleteDialogOpen(false);
      setSelectedProfile(null);
      loadProfiles();
    } else {
      toast.error(result.message);
    }
  };

  // ========== USER ASSIGNMENT ==========

  const handleOpenAssignDialog = async (profile) => {
    setSelectedProfile(profile);
    setAssignLoading(true);
    setAssignDialogOpen(true);
    setAssignSearchTerm("");
    setAssignApprovedOnly(true);

    const result = await fetchAssignedUsers(profile.userId._id);
    
    if (result?.success) {
      setAssignmentData(result.data);
      // Pre-select assigned users
      const assignedIds = (result.data.users || [])
        .filter(u => u.isAssigned)
        .map(u => u._id);
      setSelectedUserIds(assignedIds);
    } else {
      toast.error("Kullanici listesi yuklenemedi");
      setAssignDialogOpen(false);
    }
    setAssignLoading(false);
  };

  const handleToggleUser = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const allIds = filteredAssignUsers.map(u => u._id);
    setSelectedUserIds(prev => [...new Set([...prev, ...allIds])]);
  };

  const handleDeselectAll = () => {
    setSelectedUserIds([]);
  };

  const handleSaveAssignments = async () => {
    if (!selectedProfile) return;

    setAssignLoading(true);
    const result = await updateAssignedUsers(selectedProfile.userId._id, selectedUserIds);

    if (result?.success) {
      toast.success(result.message);
      setAssignDialogOpen(false);
      setAssignmentData(null);
      loadProfiles();
    } else {
      toast.error(result?.message || "Atama guncellenemedi");
    }
    setAssignLoading(false);
  };

  const filteredAssignUsers = assignmentData?.users?.filter(u => {
    if (assignApprovedOnly && u.applicationStatus !== 'approved') return false;
    if (!assignSearchTerm) return true;
    const s = assignSearchTerm.toLowerCase();
    return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.teamName?.toLowerCase().includes(s);
  }) || [];

  // ========== FILTERING ==========

  const filteredProfiles = profiles.filter((profile) => {
    if (statusFilter === "active" && !profile.isActive) return false;
    if (statusFilter === "inactive" && profile.isActive) return false;

    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      profile.userId?.name?.toLowerCase().includes(searchLower) ||
      profile.title?.toLowerCase().includes(searchLower) ||
      profile.about?.toLowerCase().includes(searchLower) ||
      profile.expertiseTags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
      profile.ideathonId?.name?.toLowerCase().includes(searchLower)
    );
  });

  // ========== RENDER ==========

  return (
    <Box>
      {/* Ust Baslik ve Filtreler */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Mentor Profilleri
            </Typography>
            <Divider orientation="vertical" flexItem />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {filteredProfiles.length} / {profiles.length} mentor
            </Typography>
          </Stack>
        </Stack>

        {/* Arama ve Filtre */}
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            variant="outlined"
            placeholder="Mentor ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={18} />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, maxWidth: 400 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Durum</InputLabel>
            <Select
              value={statusFilter}
              label="Durum"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tumu</MenuItem>
              <MenuItem value="active">Aktif</MenuItem>
              <MenuItem value="inactive">Pasif</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {/* Liste Tablosu */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box sx={{ overflowX: "auto", width: "100%" }}>
          <Table
            sx={{
              whiteSpace: "nowrap",
              minWidth: 900,
              "& thead th": {
                position: "sticky",
                top: 0,
                background: theme.palette.background.paper,
                zIndex: 1,
                fontWeight: 700,
              },
              "& tbody tr:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Mentor</TableCell>
                <TableCell>Unvan</TableCell>
                <TableCell>Ideathon</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Olusturulma</TableCell>
                <TableCell align="right">Islem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProfiles.map((profile) => (
                <TableRow key={profile._id}>
                  {/* Mentor Bilgileri */}
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        src={profile.photoUrl || undefined}
                        sx={{ width: 50, height: 50 }}
                      >
                        {profile.userId?.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600}>
                          {profile.userId?.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {profile.userId?.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  {/* Unvan */}
                  <TableCell>
                    <Typography variant="body2">
                      {profile.title}
                    </Typography>
                  </TableCell>

                  {/* Ideathon */}
                  <TableCell>
                    {profile.ideathonId && typeof profile.ideathonId === 'object' ? (
                      <Chip
                        label={profile.ideathonId.name}
                        size="small"
                        icon={<IconBuilding size={14} />}
                        sx={{
                          fontWeight: 500,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: theme.palette.primary.main,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>

                  {/* Durum */}
                  <TableCell>
                    <Chip
                      size="small"
                      label={profile.isActive ? "Aktif" : "Pasif"}
                      color={profile.isActive ? "success" : "error"}
                      variant="filled"
                    />
                  </TableCell>

                  {/* Tarih */}
                  <TableCell>
                    <Typography variant="body2">
                      {moment(profile.createdAt).format("DD.MM.YYYY")}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {moment(profile.createdAt).format("HH:mm")}
                    </Typography>
                  </TableCell>

                  {/* Islemler */}
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Detay Goruntule">
                        <IconButton
                          onClick={() => handleViewDetail(profile)}
                          sx={{ borderRadius: 2 }}
                          size="small"
                        >
                          <IconEye size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Duzenle">
                        <IconButton
                          onClick={() => handleEditClick(profile)}
                          sx={{ borderRadius: 2 }}
                          color="primary"
                          size="small"
                        >
                          <IconEdit size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Kullanici Ata">
                        <IconButton
                          onClick={() => handleOpenAssignDialog(profile)}
                          sx={{ borderRadius: 2 }}
                          color="info"
                          size="small"
                        >
                          <IconUsersGroup size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Kalici Sil">
                        <IconButton
                          onClick={() => handleDeleteClick(profile)}
                          sx={{ borderRadius: 2 }}
                          color="error"
                          size="small"
                        >
                          <IconTrash size={18} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {filteredProfiles.length === 0 && (
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
                      <Typography sx={{ mb: 1 }}>
                        {searchTerm
                          ? "Arama kriterlerine uygun mentor bulunamadi."
                          : "Henuz mentor profili bulunmuyor."}
                      </Typography>
                      {searchTerm && (
                        <Button
                          variant="outlined"
                          onClick={() => setSearchTerm("")}
                          sx={{ textTransform: "none" }}
                        >
                          Aramayi Temizle
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* ===================== DETAY MODAL ===================== */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                src={selectedProfile?.photoUrl || undefined}
                sx={{ bgcolor: "primary.main", width: 60, height: 60 }}
              >
                {selectedProfile?.userId?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedProfile?.userId?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedProfile?.title}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                label={selectedProfile?.isActive ? "Aktif" : "Pasif"}
                color={selectedProfile?.isActive ? "success" : "error"}
                variant="filled"
              />
              <IconButton onClick={() => setDetailOpen(false)} size="small">
                <IconX size={20} />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {selectedProfile && (
            <Stack spacing={3}>
              {/* Istatistikler */}
              {selectedStats && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.06), border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`, textAlign: "center" }}>
                      <IconCalendar size={28} color={theme.palette.primary.main} />
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                          {selectedStats.totalMeetings || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                        Toplam Toplanti
                        </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: alpha(theme.palette.success.main, 0.06), border: `1px solid ${alpha(theme.palette.success.main, 0.12)}`, textAlign: "center" }}>
                      <IconStar size={28} color={theme.palette.success.main} />
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                          {selectedStats.averageRating ? selectedStats.averageRating.toFixed(1) : "N/A"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ortalama Puan
                        </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: alpha(theme.palette.warning.main, 0.06), border: `1px solid ${alpha(theme.palette.warning.main, 0.12)}`, textAlign: "center" }}>
                      <IconUsers size={28} color={theme.palette.warning.main} />
                        <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                          {selectedStats.totalParticipants || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                        Katilimci Sayisi
                        </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}

              <Divider />

              {/* Ideathon Bilgisi */}
              {selectedProfile.ideathonId && typeof selectedProfile.ideathonId === 'object' && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconBuilding size={16} /> Ideathon
                  </Typography>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedProfile.ideathonId.name}</Typography>
                      {selectedProfile.ideathonId.status && (
                        <Chip
                          label={selectedProfile.ideathonId.status === "active" ? "Aktif" : selectedProfile.ideathonId.status}
                          size="small"
                          sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600, bgcolor: selectedProfile.ideathonId.status === "active" ? alpha("#51CF66", 0.15) : alpha("#FFD43B", 0.15), color: selectedProfile.ideathonId.status === "active" ? "#51CF66" : "#FFD43B" }}
                        />
                      )}
                    </Stack>
                    {selectedProfile.assignedUsers && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                        {selectedProfile.assignedUsers.length} kullanici atanmis
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Hakkinda */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                  <IconUser size={16} /> Hakkinda
                </Typography>
                <Paper elevation={0} sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedProfile.about}
                  </Typography>
                </Paper>
              </Box>

              {/* Uzmanlik Alanlari */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1 }}>
                  Uzmanlik Alanlari
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {selectedProfile.expertiseTags?.map((tag, index) => (
                    <Chip key={index} label={tag} color="primary" variant="outlined" size="small" />
                  ))}
                </Stack>
              </Box>

              {/* LinkedIn */}
              {selectedProfile.linkedin && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1 }}>
                    LinkedIn
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<IconBrandLinkedin size={18} />}
                    href={selectedProfile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{ textTransform: "none" }}
                  >
                    LinkedIn Profilini Goruntule
                  </Button>
                </Box>
              )}

              {/* Kullanici Bilgileri */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1 }}>
                  Kullanici Bilgileri
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">E-posta</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedProfile.userId?.email}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">Telefon</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedProfile.userId?.phone || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">Olusturulma Tarihi</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {moment(selectedProfile.createdAt).format("DD MMMM YYYY, HH:mm")}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDetailOpen(false)} variant="outlined" sx={{ textTransform: "none" }}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== DUZENLEME MODAL ===================== */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Mentor Profilini Duzenle
            </Typography>
            <IconButton onClick={() => setEditDialogOpen(false)} size="small">
              <IconX size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            {/* Kullanici Bilgileri Bolumu */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.info.main, mb: 1.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconUser size={16} /> Kullanici Bilgileri
              </Typography>
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: alpha(theme.palette.info.main, 0.03), border: `1px solid ${alpha(theme.palette.info.main, 0.1)}` }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
            <TextField
              fullWidth
                      size="small"
                      label="Ad Soyad"
                      required
                      value={editFormData.userInfo.name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, userInfo: { ...prev.userInfo, name: e.target.value } }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><IconUser size={16} color={theme.palette.text.secondary} /></InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="E-posta"
                      required
                      type="email"
                      value={editFormData.userInfo.email}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, userInfo: { ...prev.userInfo, email: e.target.value } }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><IconMail size={16} color={theme.palette.text.secondary} /></InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Telefon"
                      value={editFormData.userInfo.phone}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, userInfo: { ...prev.userInfo, phone: e.target.value } }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><IconPhone size={16} color={theme.palette.text.secondary} /></InputAdornment>
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Box>

            <Divider />

            {/* Ideathon Degistir */}
            <FormControl fullWidth>
              <InputLabel>Ideathon</InputLabel>
              <Select
                value={editFormData.ideathonId}
                label="Ideathon"
                onChange={(e) => setEditFormData(prev => ({ ...prev, ideathonId: e.target.value }))}
                sx={{ borderRadius: 2 }}
              >
                {ideathons.map((idt) => (
                  <MenuItem key={idt._id} value={idt._id}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconBuilding size={16} color={theme.palette.text.secondary} />
                      <Typography sx={{ fontWeight: 500, fontSize: "0.875rem" }}>{idt.name}</Typography>
                      <Chip
                        label={idt.status === "active" ? "Aktif" : idt.status === "draft" ? "Taslak" : idt.status}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          bgcolor: idt.status === "active" ? alpha("#51CF66", 0.15) : alpha("#FFD43B", 0.15),
                          color: idt.status === "active" ? "#51CF66" : "#FFD43B",
                        }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider />

            {/* Profil Bilgileri Bolumu */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconEdit size={16} /> Profil Bilgileri
            </Typography>

            <TextField
              fullWidth
              label="Unvan"
              required
              value={editFormData.title}
              onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Orn: Kidemli Yazilim Gelistirici"
              inputProps={{ maxLength: 200 }}
            />

            <TextField
              fullWidth
              label="Hakkinda"
              multiline
              rows={4}
              required
              value={editFormData.about}
              onChange={(e) => setEditFormData(prev => ({ ...prev, about: e.target.value }))}
              placeholder="Mentorun deneyimi, uzmanlik alanlari ve yetenekleri hakkinda bilgi..."
              inputProps={{ maxLength: 1000 }}
            />

            <TextField
              fullWidth
              label="LinkedIn Profil Linki"
              value={editFormData.linkedin}
              onChange={(e) => setEditFormData(prev => ({ ...prev, linkedin: e.target.value }))}
              placeholder="https://linkedin.com/in/kullaniciadi"
              inputProps={{ maxLength: 200 }}
            />

            <Autocomplete
              multiple
              freeSolo
              options={EXPERTISE_OPTIONS}
              value={editFormData.expertiseTags}
              onChange={(event, newValue) => {
                setEditFormData(prev => ({ ...prev, expertiseTags: newValue }));
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip key={key} variant="outlined" label={option} {...tagProps} color="primary" />
                  );
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Uzmanlik Alanlari"
                  placeholder="Secin veya yazin"
                  required={editFormData.expertiseTags.length === 0}
                />
              )}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  color="primary"
                />
              }
              label="Aktif Mentor"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)} variant="outlined" sx={{ textTransform: "none" }}>
            Iptal
          </Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
            sx={{ textTransform: "none", boxShadow: "none", "&:hover": { boxShadow: "none" } }}
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== KULLANICI ATAMA MODAL ===================== */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => { setAssignDialogOpen(false); setAssignmentData(null); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack spacing={0.3}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Kullanici Ata
              </Typography>
              {assignmentData?.mentor && (
                <Typography variant="body2" color="text.secondary">
                  {assignmentData.mentor.userId?.name} — {assignmentData.ideathon?.name}
                </Typography>
              )}
            </Stack>
            <IconButton onClick={() => { setAssignDialogOpen(false); setAssignmentData(null); }} size="small">
              <IconX size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {assignLoading && !assignmentData ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : assignmentData ? (
            <Stack spacing={2}>
              {/* Summary */}
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Chip
                  label={`Toplam: ${filteredAssignUsers.length}`}
                  size="small"
                  sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.08), color: theme.palette.primary.main }}
                />
                <Chip
                  label={`Secili: ${selectedUserIds.length}`}
                  size="small"
                  sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.success.main, 0.08), color: theme.palette.success.main }}
                />
                <Chip
                  label={`Atanmamis: ${filteredAssignUsers.length - selectedUserIds.length}`}
                  size="small"
                  sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.warning.main, 0.08), color: theme.palette.warning.main }}
                />
              </Box>

              {/* Filtre + Arama */}
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  placeholder="Ad, email veya takim ara..."
                  value={assignSearchTerm}
                  onChange={(e) => setAssignSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>,
                  }}
                  sx={{ flex: 1 }}
                />
                <Chip
                  label="Onaylilar"
                  size="small"
                  variant={assignApprovedOnly ? "filled" : "outlined"}
                  color={assignApprovedOnly ? "success" : "default"}
                  onClick={() => setAssignApprovedOnly(prev => !prev)}
                  sx={{ fontWeight: 600, cursor: "pointer" }}
                />
              </Stack>

              {/* Toplu Secim Butonlari */}
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={handleSelectAll} sx={{ textTransform: "none", fontSize: "0.75rem" }}>
                  Tumunu Sec
                </Button>
                <Button size="small" variant="outlined" color="secondary" onClick={handleDeselectAll} sx={{ textTransform: "none", fontSize: "0.75rem" }}>
                  Tumunu Kaldir
                </Button>
              </Stack>

              {/* Kullanici Listesi */}
              <Box sx={{ maxHeight: 400, overflowY: "auto", border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                {filteredAssignUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user._id);
                  return (
                    <Box
                      key={user._id}
                      onClick={() => handleToggleUser(user._id)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.5,
                        cursor: "pointer",
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.04) : "transparent",
                        transition: "all 0.15s",
                        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                        "&:last-child": { borderBottom: 0 },
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        size="small"
                        sx={{ p: 0 }}
                      />
                      <Avatar sx={{ width: 32, height: 32, fontSize: "0.8rem", bgcolor: isSelected ? theme.palette.primary.main : theme.palette.grey[400] }}>
                        {user.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 400 }} noWrap>
                          {user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {user.email}
                        </Typography>
                        {user.teamName && (
                          <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 500, display: "block" }} noWrap>
                            {user.teamName}
                          </Typography>
                        )}
                      </Box>
                      {user.phone && (
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                          {user.phone}
                        </Typography>
                      )}
                    </Box>
                  );
                })}

                {filteredAssignUsers.length === 0 && (
                  <Box sx={{ p: 4, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      {assignSearchTerm ? "Arama sonucu bulunamadi" : "Kullanici bulunamadi"}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => { setAssignDialogOpen(false); setAssignmentData(null); }} 
            variant="outlined" 
            sx={{ textTransform: "none" }}
          >
            Iptal
          </Button>
          <Button
            onClick={handleSaveAssignments}
            variant="contained"
            disabled={assignLoading}
            startIcon={assignLoading ? <CircularProgress size={16} /> : <IconCheck size={18} />}
            sx={{ textTransform: "none", boxShadow: "none", "&:hover": { boxShadow: "none" } }}
          >
            {assignLoading ? "Kaydediliyor..." : `${selectedUserIds.length} Kullanici Ata`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== SILME ONAY MODAL ===================== */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.error.main, 0.08),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconAlertTriangle size={28} color={theme.palette.error.main} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Mentor Profilini Kalici Sil
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2}>
            <Typography>
              <strong>{selectedProfile?.userId?.name}</strong> adli mentoru kalici olarak silmek istediginizden emin misiniz?
            </Typography>

            <Alert severity="error">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                DIKKAT: Bu islem geri alinamaz!
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Profil kalici olarak silinecek ve tum veriler kaybolacaktir.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined" sx={{ textTransform: "none" }}>
            Iptal
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            disabled={loading}
            sx={{ textTransform: "none", boxShadow: "none", "&:hover": { boxShadow: "none" } }}
          >
            {loading ? 'Siliniyor...' : 'Kalici Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MentorProfileList;
