"use client";

import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
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
  alpha,
} from "@mui/material";
import { useSelector } from "react-redux";
import {
  IconSearch,
  IconTrash,
  IconEdit,
  IconPlus,
  IconEye,
  IconUser,
  IconShield,
  IconX,
  IconMail,
  IconLock,
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconCalendar,
  IconBuildingSkyscraper,
  IconRefresh,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { AdminJuriContext } from "@/app/context/AdminJuriContext";
import { useIdeathon } from "@/app/context/IdeathonContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-toastify";
import moment from "moment";
import "moment/locale/tr";
moment.locale("tr");

/* ------------------------- Helpers ------------------------- */

const getRoleColor = (role, primaryColor, secondaryColor) => {
  switch (role) {
    case "admin": return primaryColor;
    case "juri": return secondaryColor;
    default: return "#95A5A6";
  }
};

const getRoleIcon = (role) => {
  switch (role) {
    case "admin": return IconShield;
    case "juri": return IconUserCheck;
    default: return IconUser;
  }
};

const getRoleLabel = (role) => {
  switch (role) {
    case "admin": return "Admin";
    case "juri": return "Juri";
    default: return role;
  }
};

const getStatusLabel = (isActive) => {
  return isActive ? "Aktif" : "Pasif";
};

/* ─── Ideathon bilgisi helper ─── */
const getIdeathonName = (account) => {
  if (account.ideathonRoles && account.ideathonRoles.length > 0) {
    const activeRole = account.ideathonRoles.find(r => r.isActive) || account.ideathonRoles[0];
    return activeRole?.ideathonId?.name || "\u2014";
  }
  return "\u2014";
};

/* ------------------------- Main Component ------------------------- */

const AdminJuriAccounts = () => {
  const {
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    fetchStats,
  } = useContext(AdminJuriContext);

  const { ideathons, fetchDropdownIdeathons } = useIdeathon();

  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const isSuperAdmin = user?.role === 'superadmin';

  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedIdeathonFilter, setSelectedIdeathonFilter] = useState("all");
  const [stats, setStats] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [pagination, setPagination] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "juri",
    isActive: true,
    ideathonId: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated || !isSuperAdmin) return;
    fetchDropdownIdeathons();
  }, [isAuthenticated, isSuperAdmin, fetchDropdownIdeathons]);

  useEffect(() => {
    if (!isAuthenticated || !isSuperAdmin) return;
    loadData();
    loadStats();
  }, [isAuthenticated, isSuperAdmin, searchTerm, selectedRole, selectedStatus, selectedIdeathonFilter, currentPage, itemsPerPage]);

  const loadData = async () => {
    const filters = {
      search: searchTerm || undefined,
      role: selectedRole !== "all" ? selectedRole : undefined,
      isActive: selectedStatus !== "all" ? selectedStatus === "active" : undefined,
      ideathonId: selectedIdeathonFilter !== "all" ? selectedIdeathonFilter : undefined,
    };

    const result = await fetchAccounts(currentPage, itemsPerPage, filters);
    if (result?.success) {
      setAccounts(result.data || []);
      setPagination(result.pagination || {});
    }
  };

  const loadStats = async () => {
    const result = await fetchStats();
    if (result?.success) {
      setStats(result.data || {});
    }
  };

  // Sadece juri icin ideathonId zorunlu
  const isIdeathonRequired = (role) => role === "juri";

  const handleFormSubmit = async () => {
    const errors = {};

    if (!formData.name?.trim()) errors.name = "Isim zorunludur";
    if (!formData.email?.trim()) errors.email = "Email zorunludur";
    if (!formData.password?.trim() && !selectedAccount) errors.password = "Sifre zorunludur";
    if (!formData.role) errors.role = "Rol zorunludur";

    if (isIdeathonRequired(formData.role) && !formData.ideathonId) {
      errors.ideathonId = "Juri icin ideathon secimi zorunludur";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = "Gecerli bir email adresi girin";
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const submitData = { ...formData };
    if (selectedAccount && !submitData.password) {
      delete submitData.password;
    }
    if (!isIdeathonRequired(submitData.role)) {
      delete submitData.ideathonId;
    }

    let result;
    if (selectedAccount) {
      result = await updateAccount(selectedAccount._id, submitData);
    } else {
      result = await createAccount(submitData);
    }

    if (result.success) {
      loadData();
      loadStats();
      handleCloseModal();
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;

    const result = await deleteAccount(selectedAccount._id);
    if (result.success) {
      loadData();
      loadStats();
      setOpenDeleteModal(false);
      setSelectedAccount(null);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedAccount(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "juri",
      isActive: true,
      ideathonId: "",
    });
    setFormErrors({});
    setOpenCreateModal(true);
  };

  const handleOpenEditModal = (account) => {
    setSelectedAccount(account);
    const activeIdeathonRole = account.ideathonRoles?.find(r => r.isActive) || account.ideathonRoles?.[0];
    setFormData({
      name: account.name || "",
      email: account.email || "",
      password: "",
      role: account.role || "juri",
      isActive: account.isActive !== undefined ? account.isActive : true,
      ideathonId: activeIdeathonRole?.ideathonId?._id || activeIdeathonRole?.ideathonId || "",
    });
    setFormErrors({});
    setOpenEditModal(true);
  };

  const handleCloseModal = () => {
    setOpenCreateModal(false);
    setOpenEditModal(false);
    setOpenDetailModal(false);
    setSelectedAccount(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "juri",
      isActive: true,
      ideathonId: "",
    });
    setFormErrors({});
  };

  // Artık filtreleme backend'de yapılıyor, client-side filter gerekmiyor
  const filteredAccounts = accounts;

  /* ─── Stat card helper ─── */
  const statCards = [
    { label: "Toplam", value: stats.total || 0, icon: IconUsers, color: theme.palette.primary.main },
    { label: "Aktif", value: stats.active || 0, icon: IconUserCheck, color: theme.palette.success.main },
    { label: "Pasif", value: stats.inactive || 0, icon: IconUserX, color: theme.palette.error.main },
    { label: "Admin", value: stats.byRole?.admin?.total || 0, icon: IconShield, color: theme.palette.primary.main },
    { label: "Juri", value: stats.byRole?.juri?.total || 0, icon: IconUserCheck, color: theme.palette.secondary.main },
  ];

  /* ─── Role filter chips ─── */
  const roleFilters = [
    { value: "all", label: "Tumu" },
    { value: "admin", label: "Admin" },
    { value: "juri", label: "Juri" },
  ];

  const statusFilters = [
    { value: "all", label: "Tumu" },
    { value: "active", label: "Aktif" },
    { value: "inactive", label: "Pasif" },
  ];

  if (!isAuthenticated || !isSuperAdmin) {
    return (
      <Fade in={true} timeout={500}>
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
          }}
        >
          <IconX size={80} color={theme.palette.error.main} style={{ marginBottom: 24 }} />
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Yetkisiz Erisim
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
            Bu sayfaya erismek icin Super Admin yetkisine sahip olmaniz gerekir.
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.history.back()}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: "none",
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}
          >
            Geri Don
          </Button>
        </Box>
      </Fade>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>

        {/* ─── Minimal Stat Cards ─── */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 3,
            flexWrap: "wrap",
          }}
        >
          {statCards.map((card, idx) => {
            const CardIcon = card.icon;
            return (
              <Box
                key={idx}
                sx={{
                  flex: "1 1 140px",
                  minWidth: 120,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  borderRadius: 2.5,
                  bgcolor: alpha(card.color, 0.06),
                  border: `1px solid ${alpha(card.color, 0.12)}`,
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: alpha(card.color, 0.1),
                    borderColor: alpha(card.color, 0.25),
                  },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(card.color, 0.12),
                  }}
                >
                  <CardIcon size={18} color={card.color} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: card.color, lineHeight: 1.2 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.7rem" }}>
                    {card.label}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* ─── Minimal Filter & Search ─── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 3,
            flexWrap: "wrap",
          }}
        >
          {/* Search */}
          <TextField
            size="small"
            placeholder="Isim veya email ile ara..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={18} color={theme.palette.text.secondary} />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setSearchTerm(""); setCurrentPage(1); }}>
                    <IconX size={16} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              flex: 1,
              minWidth: 220,
              maxWidth: 360,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.5,
                bgcolor: theme.palette.background.paper,
              },
            }}
          />

          {/* Role Chips */}
          <Stack direction="row" spacing={0.5}>
            {roleFilters.map((rf) => (
              <Chip
                key={rf.value}
                label={rf.label}
                size="small"
                variant={selectedRole === rf.value ? "filled" : "outlined"}
                color={selectedRole === rf.value ? "primary" : "default"}
                onClick={() => { setSelectedRole(rf.value); setCurrentPage(1); }}
                sx={{
                  fontWeight: 500,
                  fontSize: "0.75rem",
                  borderRadius: 2,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              />
            ))}
          </Stack>

          {/* Status Chips */}
          <Stack direction="row" spacing={0.5}>
            {statusFilters.map((sf) => (
              <Chip
                key={sf.value}
                label={sf.label}
                size="small"
                variant={selectedStatus === sf.value ? "filled" : "outlined"}
                color={selectedStatus === sf.value ? (sf.value === "active" ? "success" : sf.value === "inactive" ? "error" : "primary") : "default"}
                onClick={() => { setSelectedStatus(sf.value); setCurrentPage(1); }}
                sx={{
                  fontWeight: 500,
                  fontSize: "0.75rem",
                  borderRadius: 2,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              />
            ))}
          </Stack>

          {/* Ideathon Filter */}
          {ideathons.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={selectedIdeathonFilter}
                onChange={(e) => { setSelectedIdeathonFilter(e.target.value); setCurrentPage(1); }}
                displayEmpty
                sx={{
                  borderRadius: 2.5,
                  bgcolor: theme.palette.background.paper,
                  fontSize: "0.8rem",
                  "& .MuiSelect-select": { py: 0.8 },
                }}
                startAdornment={
                  <InputAdornment position="start">
                    <IconBuildingSkyscraper size={16} color={theme.palette.text.secondary} />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>Tum Ideathonlar</Typography>
                </MenuItem>
                {ideathons.map((ideathon) => (
                  <MenuItem key={ideathon._id} value={ideathon._id}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{ideathon.name}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Refresh */}
          <Tooltip title="Yenile">
            <IconButton
              onClick={() => { loadData(); loadStats(); }}
              size="small"
              sx={{
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper,
              }}
            >
              <IconRefresh size={18} />
            </IconButton>
          </Tooltip>

          {/* New Account */}
          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={handleOpenCreateModal}
            sx={{
              textTransform: "none",
              boxShadow: "none",
              borderRadius: 2.5,
              px: 2.5,
              fontWeight: 600,
              bgcolor: theme.palette.primary.main,
              "&:hover": {
                boxShadow: "none",
                bgcolor: theme.palette.primary.dark,
              },
            }}
          >
            Yeni Hesap
          </Button>
        </Box>

        {/* ─── Account Cards ─── */}
        <Grid container spacing={2.5}>
          {filteredAccounts.map((account) => {
            const RoleIcon = getRoleIcon(account.role);
            const roleColor = getRoleColor(account.role, theme.palette.primary.main, theme.palette.secondary.main);
            return (
              <Grid item xs={12} sm={6} lg={4} key={account._id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: alpha(roleColor, 0.4),
                      bgcolor: alpha(roleColor, 0.02),
                    },
                  }}
                >
                  {/* Header */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: alpha(roleColor, 0.12),
                        color: roleColor,
                        mr: 1.5,
                        fontSize: "1.1rem",
                        fontWeight: 700,
                      }}
                    >
                      {account.name?.charAt(0)?.toUpperCase() || "?"}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
                        {account.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {account.email}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Chips */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5, flexWrap: "wrap" }}>
                    <Chip
                      icon={<RoleIcon size={14} />}
                      label={getRoleLabel(account.role)}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        bgcolor: alpha(roleColor, 0.1),
                        color: roleColor,
                        "& .MuiChip-icon": { color: roleColor },
                      }}
                    />
                    <Chip
                      label={getStatusLabel(account.isActive)}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        bgcolor: account.isActive ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                        color: account.isActive ? theme.palette.success.main : theme.palette.error.main,
                      }}
                    />
                  </Box>

                  {/* Ideathon info — only for juri */}
                  {account.role === "juri" && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1.5 }}>
                      <IconBuildingSkyscraper size={14} color={theme.palette.text.secondary} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {getIdeathonName(account)}
                      </Typography>
                    </Box>
                  )}

                  {/* Footer */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
                      <IconCalendar size={13} />
                      {moment(account.createdAt).format("DD MMM YYYY")}
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Detay">
                        <IconButton
                          size="small"
                          onClick={() => { setSelectedAccount(account); setOpenDetailModal(true); }}
                          sx={{ borderRadius: 1.5, color: theme.palette.text.secondary, "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08), color: theme.palette.primary.main } }}
                        >
                          <IconEye size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Duzenle">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditModal(account)}
                          sx={{ borderRadius: 1.5, color: theme.palette.text.secondary, "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08), color: theme.palette.primary.main } }}
                        >
                          <IconEdit size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton
                          size="small"
                          onClick={() => { setSelectedAccount(account); setOpenDeleteModal(true); }}
                          sx={{ borderRadius: 1.5, color: theme.palette.text.secondary, "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.08), color: theme.palette.error.main } }}
                        >
                          <IconTrash size={16} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* Empty state */}
        {filteredAccounts.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              px: 3,
              borderRadius: 3,
              border: `2px dashed ${theme.palette.divider}`,
              mt: 2,
            }}
          >
            <IconUsers size={56} color={theme.palette.text.disabled} style={{ marginBottom: 12 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
              Hesap bulunamadi
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Yeni bir admin veya juri hesabi olusturmak icin butona tiklayin.
            </Typography>
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={handleOpenCreateModal}
              sx={{
                textTransform: "none",
                boxShadow: "none",
                borderRadius: 2.5,
                px: 3,
                bgcolor: theme.palette.primary.main,
                "&:hover": { boxShadow: "none", bgcolor: theme.palette.primary.dark },
              }}
            >
              Ilk Hesabi Olustur
            </Button>
          </Box>
        )}

        {/* Pagination */}
        {pagination && filteredAccounts.length > 0 && (
          <Box sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mt: 3,
          }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Sayfa basina:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(e.target.value); setCurrentPage(1); }}
                  sx={{ borderRadius: 2, "& .MuiSelect-select": { py: 1 } }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary">
                Toplam: {pagination.totalAccounts || pagination.total || 0}
              </Typography>
            </Stack>

            {(pagination.totalPages || 0) > 1 && (
              <Pagination
                count={pagination.totalPages}
                page={currentPage}
                onChange={(event, page) => setCurrentPage(page)}
                color="primary"
                size="large"
                sx={{
                  "& .MuiPaginationItem-root": { borderRadius: 2, fontWeight: 500 },
                }}
              />
            )}
          </Box>
        )}

        {/* ─── Create / Edit Modal ─── */}
        <Dialog
          open={openCreateModal || openEditModal}
          onClose={handleCloseModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedAccount ? "Hesabi Duzenle" : "Yeni Hesap Olustur"}
              </Typography>
              <IconButton onClick={handleCloseModal} size="small">
                <IconX size={20} />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="Isim"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!!formErrors.name}
                helperText={formErrors.name}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><IconUser size={18} color={theme.palette.text.secondary} /></InputAdornment>,
                }}
              />

              <TextField
                fullWidth
                size="small"
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={!!formErrors.email}
                helperText={formErrors.email}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><IconMail size={18} color={theme.palette.text.secondary} /></InputAdornment>,
                }}
              />

              <TextField
                fullWidth
                size="small"
                label={selectedAccount ? "Yeni Sifre (bos birakirsaniz degismez)" : "Sifre"}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={!!formErrors.password}
                helperText={formErrors.password}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><IconLock size={18} color={theme.palette.text.secondary} /></InputAdornment>,
                }}
              />

              {/* Rol — sadece Admin ve Juri */}
              <FormControl fullWidth size="small" error={!!formErrors.role}>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.role}
                  label="Rol"
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setFormData({
                      ...formData,
                      role: newRole,
                      ideathonId: isIdeathonRequired(newRole) ? formData.ideathonId : "",
                    });
                  }}
                >
                  <MenuItem value="admin">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconShield size={16} color={theme.palette.primary.main} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Admin</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="juri">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconUserCheck size={16} color={theme.palette.secondary.main} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Juri</Typography>
                    </Box>
                  </MenuItem>
                </Select>
                {formErrors.role && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                    {formErrors.role}
                  </Typography>
                )}
              </FormControl>

              {/* Ideathon — Sadece Juri icin */}
              {isIdeathonRequired(formData.role) && (
                <FormControl fullWidth size="small" error={!!formErrors.ideathonId}>
                  <InputLabel>Ideathon *</InputLabel>
                  <Select
                    value={formData.ideathonId}
                    label="Ideathon *"
                    onChange={(e) => setFormData({ ...formData, ideathonId: e.target.value })}
                    startAdornment={
                      <InputAdornment position="start">
                        <IconBuildingSkyscraper size={18} color={theme.palette.text.secondary} />
                      </InputAdornment>
                    }
                  >
                    {ideathons.map((ideathon) => (
                      <MenuItem key={ideathon._id} value={ideathon._id}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{ideathon.name}</Typography>
                          <Chip
                            label={ideathon.status === "active" ? "Aktif" : ideathon.status === "draft" ? "Taslak" : ideathon.status}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                              fontWeight: 600,
                              bgcolor: ideathon.status === "active" ? alpha("#51CF66", 0.15) : alpha("#FFD43B", 0.15),
                              color: ideathon.status === "active" ? "#51CF66" : "#FFD43B",
                            }}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.ideathonId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                      {formErrors.ideathonId}
                    </Typography>
                  )}
                </FormControl>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    color="primary"
                  />
                }
                label="Hesap Aktif"
                sx={{ "& .MuiFormControlLabel-label": { fontWeight: 500, fontSize: "0.875rem" } }}
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button
              onClick={handleCloseModal}
              variant="outlined"
              sx={{ textTransform: "none", borderRadius: 2, px: 3 }}
            >
              Iptal
            </Button>
            <Button
              onClick={handleFormSubmit}
              variant="contained"
              sx={{
                textTransform: "none",
                boxShadow: "none",
                borderRadius: 2,
                px: 3,
                bgcolor: theme.palette.primary.main,
                "&:hover": { boxShadow: "none", bgcolor: theme.palette.primary.dark },
              }}
            >
              {selectedAccount ? "Guncelle" : "Olustur"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ─── Detail Modal ─── */}
        <Dialog
          open={openDetailModal}
          onClose={handleCloseModal}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Hesap Detaylari
              </Typography>
              <IconButton onClick={handleCloseModal} size="small">
                <IconX size={20} />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent>
            {selectedAccount && (
              <Stack spacing={2.5}>
                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, pt: 1 }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: alpha(getRoleColor(selectedAccount.role, theme.palette.primary.main, theme.palette.secondary.main), 0.12),
                      color: getRoleColor(selectedAccount.role, theme.palette.primary.main, theme.palette.secondary.main),
                      fontSize: "1.5rem",
                      fontWeight: 700,
                    }}
                  >
                    {selectedAccount.name?.charAt(0)?.toUpperCase() || "?"}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedAccount.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedAccount.email}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                {/* Info Grid */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Rol</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={getRoleLabel(selectedAccount.role)}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          bgcolor: alpha(getRoleColor(selectedAccount.role, theme.palette.primary.main, theme.palette.secondary.main), 0.1),
                          color: getRoleColor(selectedAccount.role, theme.palette.primary.main, theme.palette.secondary.main),
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Durum</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={getStatusLabel(selectedAccount.isActive)}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          bgcolor: selectedAccount.isActive ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                          color: selectedAccount.isActive ? theme.palette.success.main : theme.palette.error.main,
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Olusturulma</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                      {moment(selectedAccount.createdAt).format("DD MMM YYYY, HH:mm")}
                    </Typography>
                  </Grid>
                  {selectedAccount.createdBy && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Olusturan</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                        {selectedAccount.createdBy?.name || "\u2014"}
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                {/* Ideathon info — only for juri */}
                {selectedAccount.role === "juri" && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                        <IconBuildingSkyscraper size={16} /> Ideathon Atamalari
                      </Typography>
                      {selectedAccount.ideathonRoles && selectedAccount.ideathonRoles.length > 0 ? (
                        <Stack spacing={0.75}>
                          {selectedAccount.ideathonRoles.map((role, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                p: 1,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.04),
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                                {role.ideathonId?.name || "\u2014"}
                              </Typography>
                              <Chip
                                label={role.role}
                                size="small"
                                sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600 }}
                              />
                              <Chip
                                label={role.isActive ? "Aktif" : "Pasif"}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.65rem",
                                  fontWeight: 600,
                                  bgcolor: role.isActive ? alpha("#51CF66", 0.15) : alpha("#FF6B6B", 0.15),
                                  color: role.isActive ? "#51CF66" : "#FF6B6B",
                                }}
                              />
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Atama yok</Typography>
                      )}
                    </Box>
                  </>
                )}
              </Stack>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button
              onClick={handleCloseModal}
              variant="outlined"
              sx={{ textTransform: "none", borderRadius: 2, px: 3 }}
            >
              Kapat
            </Button>
          </DialogActions>
        </Dialog>

        {/* ─── Delete Confirmation Modal ─── */}
        <Dialog
          open={openDeleteModal}
          onClose={() => setOpenDeleteModal(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconAlertTriangle size={24} color={theme.palette.error.main} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Hesabi Sil
              </Typography>
            </Stack>
          </DialogTitle>

          <DialogContent>
            <Typography sx={{ mt: 1 }}>
              <strong>{selectedAccount?.name}</strong> hesabini silmek istediginizden emin misiniz?
              Bu islem geri alinamaz.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button
              onClick={() => setOpenDeleteModal(false)}
              variant="outlined"
              sx={{ textTransform: "none", borderRadius: 2, px: 3 }}
            >
              Iptal
            </Button>
            <Button
              onClick={handleDelete}
              variant="contained"
              color="error"
              sx={{
                textTransform: "none",
                boxShadow: "none",
                borderRadius: 2,
                px: 3,
                "&:hover": { boxShadow: "none" },
              }}
            >
              Sil
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default AdminJuriAccounts;
