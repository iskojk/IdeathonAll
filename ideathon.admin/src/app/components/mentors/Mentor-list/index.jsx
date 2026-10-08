"use client";

import React, { useContext, useEffect, useState, useRef } from "react";
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
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  useMediaQuery,
  useTheme,
  Tooltip,
  Paper,
  Chip,
  Divider,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
} from "@mui/material";
import {
  IconSearch,
  IconEye,
  IconEdit,
  IconTrash,
  IconPlus,
  IconFilter,
  IconPhoto,
  IconX,
} from "@tabler/icons-react";
import { MentorContext } from "@/app/context/MentorContext";
import { toast } from "react-toastify";
import moment from "moment";
import "moment/locale/tr";
moment.locale("tr");

/* ------------------------- Helpers ------------------------- */

const getStatusColor = (isActive) => {
  return isActive ? "success" : "error";
};

const getStatusLabel = (isActive) => {
  return isActive ? "Aktif" : "Pasif";
};

/* ------------------------- Main List ------------------------- */
const MentorList = () => {
  const {
    fetchMentors,
    deleteMentor,
    fetchStats,
    createMentor,
    updateMentor
  } = useContext(MentorContext);

  const [mentors, setMentors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    status: '',
    description: '',
    isActive: true
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    loadData();
    loadStats();
  }, [searchTerm, selectedStatus]);

  const loadData = async (page = 1) => {
    const filters = {
      search: searchTerm || undefined,
      isActive: selectedStatus !== "all" ? selectedStatus === "active" : undefined,
    };

    const result = await fetchMentors(page, 10, filters);
    if (result?.success) {
      setMentors(result.data || []);
      setPagination(result.pagination || {});
    }
  };

  const loadStats = async () => {
    const result = await fetchStats();
    if (result?.success) {
      setStats(result.data || {});
    }
  };

  const handleDelete = async () => {
    if (!selectedMentor) return;

    // Token kontrolü
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Önce giriş yapmanız gerekiyor");
      return;
    }

    const result = await deleteMentor(selectedMentor._id);
    if (result.success) {
      toast.success(result.message);
      loadData(pagination.currentPage);
      loadStats();
      setDeleteDialogOpen(false);
      setSelectedMentor(null);
    } else {
      toast.error(result.message);
    }
  };


  // Form handling functions
  const handleFormOpen = (mentor = null) => {
    if (mentor) {
      // Düzenleme modu
      setIsEditing(true);
      setSelectedMentor(mentor);
      setFormData({
        name: mentor.name || '',
        status: mentor.status || '',
        description: mentor.description || '',
        isActive: mentor.isActive !== undefined ? mentor.isActive : true
      });
      setPhotoPreview(mentor.photoUrl || null);
    } else {
      // Yeni ekleme modu
      setIsEditing(false);
      setSelectedMentor(null);
      setFormData({
        name: '',
        status: '',
        description: '',
        isActive: true
      });
      setPhotoPreview(null);
    }
    setSelectedFile(null);
    setFormErrors({});
    setFormDialogOpen(true);
  };

  const handleFormClose = () => {
    setFormDialogOpen(false);
    setFormData({
      name: '',
      status: '',
      description: '',
      isActive: true
    });
    setSelectedFile(null);
    setPhotoPreview(null);
    setFormErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Temel validasyon - sadece karakter limitleri için
    let error = '';
    if (field === 'name' && value && (value.length < 2 || value.length > 100)) {
      error = 'Mentör adı 2-100 karakter arasında olmalıdır';
    } else if (field === 'status' && value && value.length > 200) {
      error = 'Mentör statüsü maksimum 200 karakter olabilir';
    } else if (field === 'description' && value && value.length > 1000) {
      error = 'Mentör açıklaması maksimum 1000 karakter olabilir';
    }

    setFormErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Dosya tipi kontrolü
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setFormErrors(prev => ({
          ...prev,
          photo: 'Sadece JPEG, PNG ve WebP formatındaki resim dosyaları kabul edilir'
        }));
        setSelectedFile(null);
        setPhotoPreview(null);
        return;
      }

      // Dosya boyutu kontrolü (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setFormErrors(prev => ({
          ...prev,
          photo: 'Dosya boyutu çok büyük (max 5MB)'
        }));
        setSelectedFile(null);
        setPhotoPreview(null);
        return;
      }

      setSelectedFile(file);
      setFormErrors(prev => ({ ...prev, photo: '' }));

      // Preview oluştur
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      // Dosya seçimi iptal edildi
      setSelectedFile(null);
      setPhotoPreview(isEditing && selectedMentor ? selectedMentor.photoUrl : null);
      setFormErrors(prev => ({ ...prev, photo: '' }));
    }
  };


  const handleFormSubmit = async () => {
    const errors = {};

    // İsim validasyonu
    const nameTrimmed = formData.name?.trim() || '';
    if (!nameTrimmed) {
      errors.name = 'Mentör adı zorunludur';
    } else if (nameTrimmed.length < 2 || nameTrimmed.length > 100) {
      errors.name = 'Mentör adı 2-100 karakter arasında olmalıdır';
    }

    // Statü validasyonu
    const statusTrimmed = formData.status?.trim() || '';
    if (!statusTrimmed) {
      errors.status = 'Mentör statüsü zorunludur';
    } else if (statusTrimmed.length > 200) {
      errors.status = 'Mentör statüsü maksimum 200 karakter olabilir';
    }

    // Açıklama validasyonu
    const descriptionTrimmed = formData.description?.trim() || '';
    if (!descriptionTrimmed) {
      errors.description = 'Mentör açıklaması zorunludur';
    } else if (descriptionTrimmed.length > 1000) {
      errors.description = 'Mentör açıklaması maksimum 1000 karakter olabilir';
    }

    // Fotoğraf validasyonu (sadece yeni ekleme için)
    if (!isEditing && !selectedFile) {
      errors.photo = 'Mentör fotoğrafı zorunludur';
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      const submitData = new FormData();

      const name = formData.name.trim();
      const status = formData.status.trim();
      const description = formData.description.trim();

      submitData.append('name', name);
      submitData.append('status', status);
      submitData.append('description', description);
      submitData.append('isActive', formData.isActive.toString());

      const selectedIdeathonId = typeof window !== "undefined" ? localStorage.getItem("selectedIdeathonId") : null;
      if (selectedIdeathonId && selectedIdeathonId !== "null" && selectedIdeathonId !== "all") {
        submitData.append('ideathonId', selectedIdeathonId);
      }

      if (selectedFile) {
        submitData.append('photo', selectedFile);
      }

      let result;
      if (isEditing && selectedMentor) {
        result = await updateMentor(selectedMentor._id, submitData);
      } else {
        result = await createMentor(submitData);
      }

      if (result.success) {
        toast.success(result.message);
        loadData(pagination.currentPage);
        loadStats();
        handleFormClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Mentor kaydedilirken bir hata oluştu');
    }
  };

  const filteredMentors = mentors.filter((mentor) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      mentor.name?.toLowerCase().includes(searchLower) ||
      mentor.status?.toLowerCase().includes(searchLower) ||
      mentor.description?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Box>
      {/* Üst Başlık & Eylem Butonları */}
      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={2}
        sx={{ mb: 3 }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Mentorlar
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {stats.total || 0} toplam mentor
          </Typography>
        </Stack>

        {/* Eylem Butonları */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            sx={{ minWidth: 160 }}
            onClick={() => handleFormOpen()}
          >
            Yeni Mentor Ekle
          </Button>
        </Stack>
      </Stack>

      {/* Filtreler */}
      <Box sx={{ mb: 3 }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <TextField
            size="small"
            variant="outlined"
            placeholder="İsim, statü veya açıklama ara"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconSearch size={18} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300, flex: 1 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Durum</InputLabel>
            <Select
              value={selectedStatus}
              label="Durum"
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="all">Tümü</MenuItem>
              <MenuItem value="active">Aktif</MenuItem>
              <MenuItem value="inactive">Pasif</MenuItem>
            </Select>
          </FormControl>

          {(selectedStatus !== "all" || searchTerm) && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<IconFilter size={16} />}
              onClick={() => {
                setSelectedStatus("all");
                setSearchTerm("");
              }}
            >
              Temizle
            </Button>
          )}
        </Stack>
      </Box>

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
              minWidth: 800,
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
            <TableHead>
              <TableRow>
                <TableCell>Mentor</TableCell>
                <TableCell>Statü</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Tarih</TableCell>
                <TableCell align="right">İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMentors.map((mentor) => {
                const descriptionPreview = mentor.description?.substring(0, 100) + (mentor.description?.length > 100 ? "..." : "");

                return (
                  <TableRow key={mentor._id} hover>
                    {/* Mentor Bilgileri */}
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          sx={{ width: 50, height: 50 }}
                          key={mentor._id}
                        >
                          {mentor.photoUrl ? (
                            <img
                              src={mentor.photoUrl}
                              alt={mentor.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '50%'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            mentor.name?.charAt(0)?.toUpperCase()
                          )}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={600}>
                            {mentor.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                            {descriptionPreview}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* Statü */}
                    <TableCell>
                      <Typography variant="body2">
                        {mentor.status}
                      </Typography>
                    </TableCell>

                    {/* Durum */}
                    <TableCell>
                      <Chip
                        size="small"
                        label={getStatusLabel(mentor.isActive)}
                        color={getStatusColor(mentor.isActive)}
                        variant="filled"
                      />
                    </TableCell>

                    {/* Tarih */}
                    <TableCell>
                      <Typography>
                        {moment(mentor.createdAt).format("DD.MM.YYYY")}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {moment(mentor.createdAt).format("HH:mm")}
                      </Typography>
                    </TableCell>

                    {/* İşlemler */}
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Detay Görüntüle">
                          <IconButton
                            onClick={() => {
                              setSelectedMentor(mentor);
                              setDetailOpen(true);
                            }}
                            sx={{ borderRadius: 2 }}
                          >
                            <IconEye size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Düzenle">
                          <IconButton
                            onClick={() => handleFormOpen(mentor)}
                            sx={{ borderRadius: 2 }}
                          >
                            <IconEdit size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton
                            onClick={() => {
                              setSelectedMentor(mentor);
                              setDeleteDialogOpen(true);
                            }}
                            sx={{ borderRadius: 2 }}
                          >
                            <IconTrash size={18} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredMentors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box
                      py={6}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexDirection="column"
                      sx={{ color: "text.secondary" }}
                    >
                      <Typography sx={{ mb: 1 }}>
                        {searchTerm || selectedStatus !== "all"
                          ? "Arama kriterlerine uygun mentor bulunamadı."
                          : "Henüz mentor bulunmuyor."}
                      </Typography>
                      {(searchTerm || selectedStatus !== "all") && (
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setSearchTerm("");
                            setSelectedStatus("all");
                          }}
                        >
                          Filtreleri Temizle
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        {/* Sayfalama */}
        {pagination.totalPages > 1 && (
          <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
            <Stack direction="row" spacing={1}>
              <Button
                disabled={!pagination.hasPrev}
                onClick={() => loadData(pagination.currentPage - 1)}
              >
                Önceki
              </Button>
              <Typography sx={{ alignSelf: "center", mx: 2 }}>
                Sayfa {pagination.currentPage} / {pagination.totalPages}
              </Typography>
              <Button
                disabled={!pagination.hasNext}
                onClick={() => loadData(pagination.currentPage + 1)}
              >
                Sonraki
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Detay Modal */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
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
              <Avatar
                sx={{ bgcolor: "primary.main", width: 60, height: 60 }}
                key={selectedMentor?._id}
              >
                {selectedMentor?.photoUrl ? (
                  <img
                    src={selectedMentor.photoUrl}
                    alt={selectedMentor.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  selectedMentor?.name?.charAt(0)?.toUpperCase()
                )}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedMentor?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedMentor?.status}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Chip
                size="small"
                label={getStatusLabel(selectedMentor?.isActive)}
                color={getStatusColor(selectedMentor?.isActive)}
                variant="filled"
              />
              <IconButton onClick={() => setDetailOpen(false)} size="small">
                <IconEye size={20} />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ maxHeight: 'calc(90vh - 140px)', overflowY: 'auto', pr: 1 }}>
            {selectedMentor ? (
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  {/* Temel Bilgiler */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={1} sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                          👤 Temel Bilgiler
                        </Typography>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Ad Soyad
                            </Typography>
                            <Typography variant="body1">
                              {selectedMentor.name}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Statü
                            </Typography>
                            <Typography variant="body1">
                              {selectedMentor.status}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Durum
                            </Typography>
                            <Chip
                              size="small"
                              label={getStatusLabel(selectedMentor.isActive)}
                              color={getStatusColor(selectedMentor.isActive)}
                              variant="outlined"
                            />
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Sıralama
                            </Typography>
                            <Typography variant="body1">
                              {selectedMentor.order || 0}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Sistem Bilgileri */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={1} sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                          📊 Sistem Bilgileri
                        </Typography>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Oluşturulma Tarihi
                            </Typography>
                            <Typography variant="body1">
                              {moment(selectedMentor.createdAt).format("DD.MM.YYYY HH:mm")}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Son Güncelleme
                            </Typography>
                            <Typography variant="body1">
                              {moment(selectedMentor.updatedAt).format("DD.MM.YYYY HH:mm")}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Oluşturan
                            </Typography>
                            <Typography variant="body1">
                              {selectedMentor.createdBy?.name || "Bilinmiyor"}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Açıklama */}
                  <Grid item xs={12}>
                    <Card elevation={1}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                          📝 Açıklama
                        </Typography>
                        <Box
                          sx={{
                            backgroundColor: theme.palette.grey[50],
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          <Typography variant="body1">
                            {selectedMentor.description}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Fotoğraf */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={1}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                          📸 Profil Fotoğrafı
                        </Typography>
                        <Box sx={{ textAlign: 'center' }}>
                          <Avatar
                            sx={{
                              width: 150,
                              height: 150,
                              mx: 'auto',
                              mb: 2,
                              border: `3px solid ${theme.palette.primary.main}`
                            }}
                            key={selectedMentor?._id}
                          >
                            {selectedMentor?.photoUrl ? (
                              <img
                                src={selectedMentor.photoUrl}
                                alt={selectedMentor.name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  borderRadius: '50%'
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <IconPhoto size={50} />
                            )}
                          </Avatar>
                          <Typography variant="body2" color="text.secondary">
                            {selectedMentor.photo}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Stack>
            ) : (
              <Typography color="text.secondary">Mentor detayı yüklenemedi.</Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Mentor Silme</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{selectedMentor?.name}</strong> adlı mentoru pasif yapmak istediğinizden emin misiniz?
            Bu işlem geri alınabilir (mentor aktif edilebilir).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Sil (Pasif Yap)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mentor Ekle/Düzenle Form Dialog */}
      <Dialog
        open={formDialogOpen}
        onClose={handleFormClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {isEditing ? 'Mentor Düzenle' : 'Yeni Mentor Ekle'}
            </Typography>
            <IconButton onClick={handleFormClose} size="small">
              <IconX size={20} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ maxHeight: 'calc(90vh - 140px)', overflowY: 'auto', pr: 1 }}>
            <Stack spacing={3}>

              {/* Profil Fotoğrafı - Üstte */}
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                  👤 Profil Fotoğrafı
                </Typography>
                <Avatar
                  src={photoPreview}
                  sx={{
                    width: 100,
                    height: 100,
                    mx: 'auto',
                    mb: 2,
                    border: `3px solid ${theme.palette.primary.main}`,
                    boxShadow: 2
                  }}
                  key={isEditing ? selectedMentor?._id : 'new'}
                >
                  <IconPhoto size={30} />
                </Avatar>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<IconPhoto size={18} />}
                  size="small"
                >
                  {selectedFile ? 'Değiştir' : 'Fotoğraf Seç'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
                {selectedFile && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {selectedFile.name}
                  </Typography>
                )}
                {formErrors.photo && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    {formErrors.photo}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {isEditing ? '(İsteğe bağlı)' : 'Zorunlu'} • JPEG, PNG veya WebP • Max 5MB
                </Typography>
              </Box>

              <Divider />

              {/* Form Alanları */}
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  📝 Temel Bilgiler
                </Typography>

                {/* İsim */}
                <TextField
                  fullWidth
                  label="Mentör Adı Soyadı"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  inputProps={{ maxLength: 100 }}
                  placeholder="Örn: Ahmet Yılmaz"
                />

                {/* Statü */}
                <TextField
                  fullWidth
                  label="Uzmanlık Alanı"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  error={!!formErrors.status}
                  helperText={formErrors.status}
                  inputProps={{ maxLength: 200 }}
                  placeholder="Örn: Yazılım Geliştirme Mentoru"
                />

                {/* Açıklama */}
                <TextField
                  fullWidth
                  label="Hakkında"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                  inputProps={{ maxLength: 1000 }}
                  placeholder="Mentörün deneyimleri, uzmanlık alanları ve önemli bilgiler..."
                />
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-end' }}>
                  {formData.description.length}/1000 karakter
                </Typography>

                <Divider />

                {/* Ayarlar */}
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  ⚙️ Ayarlar
                </Typography>

                {/* Aktif/Pasif */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Aktif Mentor"
                />
              </Stack>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleFormClose}>
            İptal
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            color="primary"
          >
            {isEditing ? 'Güncelle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MentorList;

