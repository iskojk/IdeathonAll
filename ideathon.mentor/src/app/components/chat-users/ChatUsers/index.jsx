"use client";

import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Stack,
  Paper,
  useMediaQuery,
  useTheme,
  Fade,
  Switch,
  FormControlLabel,
  InputAdornment,
  Tooltip,
  Divider,
  Pagination,
} from "@mui/material";
import {
  IconSearch,
  IconTrash,
  IconEdit,
  IconEye,
  IconUser,
  IconUsers,
  IconFilter,
  IconX,
  IconMail,
  IconCalendar,
  IconCheck,
  IconX as IconClose,
  IconPhone,
} from "@tabler/icons-react";
import { ChatUsersContext } from "@/app/context/ChatUsersContext";
import { useAuth } from "@/hooks/useAuth";
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

/* ------------------------- Main Component ------------------------- */

const ChatUsers = () => {
  const {
    fetchUsers,
    updateUser,
    deleteUser,
    fetchStats,
  } = useContext(ChatUsersContext);

  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [stats, setStats] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedStatus, currentPage]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadData = async () => {
    const filters = {};

    // Sadece gerçek değerleri filtreye ekle
    if (searchTerm && searchTerm.trim()) {
      filters.search = searchTerm.trim();
    }

    if (selectedStatus !== "all") {
      filters.isActive = selectedStatus === "active";
    }

    const result = await fetchUsers(currentPage, 10, filters);
    if (result?.success) {
      setUsers(result.data || []);
      setPagination(result.pagination || {});
    }
  };

  const loadStats = async () => {
    const result = await fetchStats();
    if (result?.success) {
      setStats(result.data || {});
    }
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleFormSubmit = async () => {
    // Validation
    const errors = {};

    if (!formData.name?.trim()) errors.name = "İsim zorunludur";
    if (!formData.email?.trim()) errors.email = "Email zorunludur";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = "Geçerli bir email adresi girin";
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    const result = await updateUser(selectedUser._id, formData);

    if (result.success) {
      loadData();
      loadStats();
      handleCloseModal();
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    const result = await deleteUser(selectedUser._id);
    if (result.success) {
      loadData();
      loadStats();
      setOpenDeleteModal(false);
      setSelectedUser(null);
    }
  };

  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      isActive: user.isActive !== undefined ? user.isActive : true,
    });
    setFormErrors({});
    setOpenEditModal(true);
  };

  const handleCloseModal = () => {
    setOpenEditModal(false);
    setOpenDeleteModal(false);
    setOpenDetailModal(false);
    setSelectedUser(null);
    setFormData({
      name: "",
      email: "",
      isActive: true,
    });
    setFormErrors({});
  };

  return (
    <Fade in={true} timeout={500}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>

        {/* İstatistik Kartları */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Toplam Üyeler */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <CardContent sx={{ p: 1, textAlign: 'center' }}>
                <Box display="flex" alignItems="center" justifyContent="center" gap={3} sx={{ color: theme.palette.primary.main, mb: 2 }}>
                  <IconUsers size={26} />
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: theme.palette.primary.main }}>
                  {stats.total || 0}
                </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Toplam Üye
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Aktif Üyeler */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                  borderColor: theme.palette.success.main,
                },
              }}
            >
              <CardContent sx={{ p: 1, textAlign: 'center' }}>
                <Box display="flex" alignItems="center" justifyContent="center" gap={3} sx={{ color: theme.palette.success.main, mb: 2 }}>
                  <IconCheck size={26} />
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: theme.palette.success.main }}>
                  {stats.active || 0}
                </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Aktif Üye
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Pasif Üyeler */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                  borderColor: theme.palette.error.main,
                },
              }}
            >
              <CardContent sx={{ p: 1, textAlign: 'center' }}>
                <Box display="flex" alignItems="center" justifyContent="center" gap={3} sx={{ color: theme.palette.error.main, mb: 2 }}>
                  <IconClose size={26} />
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: theme.palette.error.main }}>
                  {stats.inactive || 0}
                </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Pasif Üye
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtreler ve Aksiyonlar */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="İsim veya email ile ara..."
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
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Durum"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  sx={{
                    borderRadius: 3,
                    backgroundColor: 'white',
                  }}
                >
                  <MenuItem value="all">Tümü</MenuItem>
                  <MenuItem value="active">Aktif</MenuItem>
                  <MenuItem value="inactive">Pasif</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<IconFilter />}
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStatus("all");
                  setCurrentPage(1);
                }}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  fontWeight: 600,
                }}
              >
                Temizle
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Üye Kartları */}
        <Grid container spacing={3}>
          {users.map((user) => (
            <Grid item xs={12} sm={6} lg={4} key={user._id}>
              <Card
                sx={{
                  borderRadius: 4,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)',
                  },
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${user.isActive ? theme.palette.success.main : theme.palette.error.main} 0%, ${user.isActive ? theme.palette.success.main : theme.palette.error.main}dd 100%)`,
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: user.isActive ? theme.palette.success.main : theme.palette.error.main,
                        mr: 2,
                        fontSize: '1.5rem',
                        fontWeight: 600
                      }}
                    >
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {user.name}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <IconMail size={14} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {user.email}
                        </Typography>
                      </Stack>
                      {user.phone && (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <IconPhone size={14} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            {user.phone}
                          </Typography>
                        </Stack>
                      )}
                      <Chip
                        label={getStatusLabel(user.isActive)}
                        size="small"
                        color={getStatusColor(user.isActive)}
                        variant="filled"
                        sx={{ fontSize: '0.7rem', fontWeight: 500 }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      <IconCalendar size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {moment(user.createdAt).format('DD MMM YYYY')}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Detayları Görüntüle">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser(user);
                            setOpenDetailModal(true);
                          }}
                          sx={{
                            bgcolor: 'primary.light',
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.main', color: 'white' }
                          }}
                        >
                          <IconEye size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Düzenle">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditModal(user)}
                          sx={{
                            bgcolor: 'warning.light',
                            color: 'warning.main',
                            '&:hover': { bgcolor: 'warning.main', color: 'white' }
                          }}
                        >
                          <IconEdit size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser(user);
                            setOpenDeleteModal(true);
                          }}
                          sx={{
                            bgcolor: 'error.light',
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.main', color: 'white' }
                          }}
                        >
                          <IconTrash size={16} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
            <Pagination
              count={pagination.totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 2,
                  fontWeight: 500,
                },
                '& .Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                },
              }}
            />
          </Box>
        )}

        {/* Boş durum */}
        {users.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 3,
              borderRadius: 4,
              bgcolor: 'grey.50',
            }}
          >
            <IconUsers size={64} color="#bdbdbd" style={{ marginBottom: 16 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Henüz üye bulunmuyor
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Chat sistemi için kayıtlı üyeler burada görünecek.
            </Typography>
          </Box>
        )}

        {/* Düzenleme Modal */}
        <Dialog
          open={openEditModal}
          onClose={handleCloseModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 4 }
          }}
        >
          <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
            Üye Düzenle
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="İsim"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconMail size={20} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Üye Aktif"
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      fontWeight: 500
                    }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={handleCloseModal}
              variant="outlined"
              sx={{ borderRadius: 3, px: 3 }}
            >
              İptal
            </Button>
            <Button
              onClick={handleFormSubmit}
              variant="contained"
              sx={{
                borderRadius: 3,
                px: 3,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)',
                }
              }}
            >
              Güncelle
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detay Modal */}
        <Dialog
          open={openDetailModal}
          onClose={handleCloseModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 4 }
          }}
        >
          <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
            Üye Detayları
          </DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Grid container spacing={2}>
                <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: selectedUser.isActive ? theme.palette.success.main : theme.palette.error.main,
                      mx: 'auto',
                      fontSize: '2rem',
                      fontWeight: 600,
                      mb: 2
                    }}
                  >
                    {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedUser.name}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedUser.email}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Durum
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedUser.isActive)}
                    color={getStatusColor(selectedUser.isActive)}
                    variant="filled"
                    sx={{ fontWeight: 500 }}
                  />
                </Grid>
                {selectedUser.phone && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Telefon
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedUser.phone}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Oluşturulma
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {moment(selectedUser.createdAt).format('DD MMMM YYYY')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Son Güncelleme
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {moment(selectedUser.updatedAt).format('DD MMMM YYYY')}
                  </Typography>
                </Grid>
                {selectedUser.createdBy && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Oluşturan
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedUser.createdBy.name}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={handleCloseModal}
              variant="outlined"
              sx={{ borderRadius: 3, px: 3 }}
            >
              Kapat
            </Button>
          </DialogActions>
        </Dialog>

        {/* Silme Onay Dialog */}
        <Dialog
          open={openDeleteModal}
          onClose={() => setOpenDeleteModal(false)}
          PaperProps={{
            sx: { borderRadius: 4 }
          }}
        >
          <DialogTitle sx={{ pb: 1, fontWeight: 600, color: 'error.main' }}>
            Üyeyi Sil
          </DialogTitle>
          <DialogContent>
            <Typography>
              <strong>{selectedUser?.name}</strong> adlı üyeyi silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz ve üye pasif duruma alınacaktır.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={() => setOpenDeleteModal(false)}
              variant="outlined"
              sx={{ borderRadius: 3, px: 3 }}
            >
              İptal
            </Button>
            <Button
              onClick={handleDelete}
              variant="contained"
              color="error"
              sx={{ borderRadius: 3, px: 3 }}
            >
              Sil
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default ChatUsers;
