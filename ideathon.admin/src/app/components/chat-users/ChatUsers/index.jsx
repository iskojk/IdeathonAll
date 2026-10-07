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
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  CircularProgress,
} from "@mui/material";
import {
  IconSearch,
  IconTrash,
  IconEdit,
  IconEye,
  IconUser,
  IconUsers,
  IconX,
  IconMail,
  IconCalendar,
  IconCheck,
  IconPhone,
  IconPlus,
  IconUserPlus,
  IconUsersGroup,
  IconBuilding,
  IconLock,
  IconId,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconMapPin,
  IconNotes,
  IconArrowsExchange,
} from "@tabler/icons-react";
import { ChatUsersContext } from "@/app/context/ChatUsersContext";
import { useIdeathon } from "@/app/context/IdeathonContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-toastify";
import moment from "moment";
import "moment/locale/tr";
moment.locale("tr");

/* ────────────────── Helpers ────────────────── */

const getStatusColor = (isActive) => (isActive ? "success" : "error");
const getStatusLabel = (isActive) => (isActive ? "Aktif" : "Pasif");

/* ────────────────── Empty Forms ────────────────── */

const emptyCreateForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  ideathonId: "",
  teamName: "",
  teamDescription: "",
  city: "",
  teamMembers: [],
};

const emptyMember = {
  name: "",
  email: "",
  tcIdentity: "",
  role: "",
};

/* ────────────────── Step Labels ────────────────── */
const createSteps = ["Kisisel Bilgiler", "Takim Bilgileri", "Takim Uyeleri"];

/* ────────────────── Main Component ────────────────── */

const ChatUsers = () => {
  const {
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    fetchStats,
    addTeamMember,
    updateTeam,
    updateTeamMember,
    removeTeamMember,
    loading: ctxLoading,
  } = useContext(ChatUsersContext);

  const { ideathons, fetchDropdownIdeathons } = useIdeathon();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [stats, setStats] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Create form
  const [createFormData, setCreateFormData] = useState({ ...emptyCreateForm });
  const [createFormErrors, setCreateFormErrors] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [createLoading, setCreateLoading] = useState(false);

  // Edit form — API sadece name, email, phone, isActive, ideathonId destekler
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    isActive: true,
    ideathonId: "",
  });
  const [editFormErrors, setEditFormErrors] = useState({});

  // Edit modal — takim yonetimi
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamMembers, setEditTeamMembers] = useState([]);
  const [editMemberErrors, setEditMemberErrors] = useState({});
  const [memberSaving, setMemberSaving] = useState(false);

  // Detail expanded
  const [teamExpanded, setTeamExpanded] = useState(false);

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedStatus, currentPage]);

  useEffect(() => {
    loadStats();
    fetchDropdownIdeathons();
  }, []);

  const loadData = async () => {
    const filters = {};
    if (searchTerm && searchTerm.trim()) {
      filters.search = searchTerm.trim();
    }
    if (selectedStatus !== "all") {
      filters.isActive = selectedStatus === "active";
    }
    const result = await fetchUsers(currentPage, 12, filters);
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

  /* ═══════════════ CREATE ═══════════════ */

  const handleOpenCreate = () => {
    const storedIdeathonId = localStorage.getItem("selectedIdeathonId");
    setCreateFormData({
      ...emptyCreateForm,
      ideathonId:
        storedIdeathonId && storedIdeathonId !== "null" && storedIdeathonId !== "all"
          ? storedIdeathonId
          : "",
    });
    setCreateFormErrors({});
    setActiveStep(0);
    setOpenCreateModal(true);
  };

  const handleCloseCreate = () => {
    setOpenCreateModal(false);
    setCreateFormData({ ...emptyCreateForm });
    setCreateFormErrors({});
    setActiveStep(0);
  };

  const handleAddTeamMember = () => {
    setCreateFormData((prev) => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { ...emptyMember }],
    }));
  };

  const handleRemoveTeamMember = (index) => {
    setCreateFormData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index),
    }));
  };

  const handleTeamMemberChange = (index, field, value) => {
    setCreateFormData((prev) => {
      const members = [...prev.teamMembers];
      members[index] = { ...members[index], [field]: value };
      return { ...prev, teamMembers: members };
    });
  };

  const validateStep = (step) => {
    const errors = {};
    if (step === 0) {
      if (!createFormData.name?.trim()) errors.name = "Isim zorunludur";
      if (!createFormData.email?.trim()) errors.email = "Email zorunludur";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (createFormData.email && !emailRegex.test(createFormData.email)) {
        errors.email = "Gecerli bir email adresi girin";
      }
      if (!createFormData.password?.trim()) errors.password = "Sifre zorunludur";
      if (createFormData.password && createFormData.password.length < 6) {
        errors.password = "Sifre en az 6 karakter olmalidir";
      }
      if (!createFormData.ideathonId) errors.ideathonId = "Ideathon secimi zorunludur";
    }
    if (step === 2) {
      createFormData.teamMembers.forEach((m, i) => {
        if (!m.name?.trim()) errors[`member_${i}_name`] = "Uye adi zorunludur";
        if (m.tcIdentity && !/^\d{11}$/.test(m.tcIdentity)) {
          errors[`member_${i}_tcIdentity`] = "TC Kimlik No 11 haneli olmalidir";
        }
      });
    }
    setCreateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => Math.min(prev + 1, 2));
    }
  };

  const handleBackStep = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleCreateSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setCreateLoading(true);
    const payload = {
      name: createFormData.name.trim(),
      email: createFormData.email.trim(),
      password: createFormData.password,
      ideathonId: createFormData.ideathonId,
    };

    if (createFormData.phone?.trim()) payload.phone = createFormData.phone.trim();
    if (createFormData.teamName?.trim()) {
      payload.teamName = createFormData.teamName.trim();
      if (createFormData.teamDescription?.trim())
        payload.teamDescription = createFormData.teamDescription.trim();
      if (createFormData.city?.trim()) payload.city = createFormData.city.trim();
      if (createFormData.teamMembers.length > 0) {
        payload.teamMembers = createFormData.teamMembers
          .filter((m) => m.name?.trim())
          .map((m) => {
            const member = { name: m.name.trim() };
            if (m.email?.trim()) member.email = m.email.trim();
            if (m.tcIdentity?.trim()) member.tcIdentity = m.tcIdentity.trim();
            if (m.role?.trim()) member.role = m.role.trim();
            return member;
          });
      }
    }

    const result = await createUser(payload);
    setCreateLoading(false);

    if (result.success) {
      handleCloseCreate();
      loadData();
      loadStats();
    }
  };

  /* ═══════════════ EDIT ═══════════════ */
  // PUT sadece: name, email, phone, isActive, ideathonId

  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setEditFormData({
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      isActive: u.isActive !== undefined ? u.isActive : true,
      ideathonId: u.ideathonId || u.ideathon?._id || "",
    });
    setEditFormErrors({});
    setEditMemberErrors({});
    setEditTeamName(u.team?.teamName || "");
    // Mevcut takim uyelerini editable formata cevir
    if (u.team?.members && u.team.members.length > 0) {
      setEditTeamMembers(
        u.team.members.map((m) => ({
          _id: m._id || null,
          name: m.name || "",
          email: m.email || "",
          tcIdentity: m.tcIdentity || "",
          role: m.role || "",
          isNew: false,
        }))
      );
    } else {
      setEditTeamMembers([]);
    }
    setOpenEditModal(true);
  };

  const handleCloseEdit = () => {
    setOpenEditModal(false);
    setSelectedUser(null);
    setEditFormData({ name: "", email: "", phone: "", isActive: true, ideathonId: "" });
    setEditFormErrors({});
    setEditTeamName("");
    setEditTeamMembers([]);
    setEditMemberErrors({});
  };

  const handleEditAddMember = () => {
    setEditTeamMembers((prev) => [
      ...prev,
      { _id: null, name: "", email: "", tcIdentity: "", role: "", isNew: true },
    ]);
  };

  const handleEditMemberChange = (index, field, value) => {
    setEditTeamMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveMember = async (index) => {
    const member = editTeamMembers[index];
    const teamId = selectedUser?.team?._id;
    if (!teamId) {
      toast.error("Takim bulunamadi");
      return;
    }
    if (!member.name?.trim()) {
      setEditMemberErrors((prev) => ({ ...prev, [`m_${index}_name`]: "Ad Soyad zorunludur" }));
      return;
    }
    if (member.tcIdentity && !/^\d{11}$/.test(member.tcIdentity)) {
      setEditMemberErrors((prev) => ({ ...prev, [`m_${index}_tcIdentity`]: "TC Kimlik 11 haneli olmalidir" }));
      return;
    }
    setEditMemberErrors({});
    setMemberSaving(true);

    const payload = { name: member.name.trim() };
    if (member.email?.trim()) payload.email = member.email.trim();
    if (member.tcIdentity?.trim()) payload.tcIdentity = member.tcIdentity.trim();
    if (member.role?.trim()) payload.role = member.role.trim();

    let result;
    if (member.isNew) {
      result = await addTeamMember(teamId, payload);
    } else {
      result = await updateTeamMember(teamId, member._id, payload);
    }

    setMemberSaving(false);
    if (result.success) {
      if (member.isNew && result.data?._id) {
        setEditTeamMembers((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], _id: result.data._id, isNew: false };
          return updated;
        });
      } else {
        setEditTeamMembers((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], isNew: false };
          return updated;
        });
      }
      loadData();
    }
  };

  const handleRemoveEditMember = async (index) => {
    const member = editTeamMembers[index];
    const teamId = selectedUser?.team?._id;

    if (member.isNew) {
      setEditTeamMembers((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    if (!teamId || !member._id) return;

    setMemberSaving(true);
    const result = await removeTeamMember(teamId, member._id);
    setMemberSaving(false);
    if (result.success) {
      setEditTeamMembers((prev) => prev.filter((_, i) => i !== index));
      loadData();
    }
  };

  const handleSaveTeamName = async () => {
    const teamId = selectedUser?.team?._id;
    if (!teamId) return;
    if (!editTeamName.trim()) {
      toast.error("Takim adi bos olamaz");
      return;
    }
    if (editTeamName.trim() === selectedUser.team.teamName) return;
    setMemberSaving(true);
    const result = await updateTeam(teamId, { teamName: editTeamName.trim() });
    setMemberSaving(false);
    if (result.success) {
      loadData();
    }
  };

  const handleEditSubmit = async () => {
    const errors = {};
    if (!editFormData.name?.trim()) errors.name = "Isim zorunludur";
    if (!editFormData.email?.trim()) errors.email = "Email zorunludur";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editFormData.email && !emailRegex.test(editFormData.email)) {
      errors.email = "Gecerli bir email adresi girin";
    }
    setEditFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // API desteklenen alanlar: name, email, phone, isActive, ideathonId
    const payload = {
      name: editFormData.name.trim(),
      email: editFormData.email.trim(),
      isActive: editFormData.isActive,
    };
    if (editFormData.phone?.trim()) payload.phone = editFormData.phone.trim();
    if (editFormData.ideathonId) payload.ideathonId = editFormData.ideathonId;

    const result = await updateUser(selectedUser._id, payload);
    if (result.success) {
      handleCloseEdit();
      loadData();
      loadStats();
    }
  };

  /* ═══════════════ DELETE ═══════════════ */

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

  const handleCloseModal = () => {
    setOpenEditModal(false);
    setOpenDeleteModal(false);
    setOpenDetailModal(false);
    setSelectedUser(null);
  };

  /* ────────────────── RENDER ────────────────── */

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2.5,
      bgcolor: alpha(theme.palette.background.paper, 0.8),
      "&:hover": { bgcolor: theme.palette.background.paper },
    },
  };

  return (
    <Fade in timeout={400}>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* ═══════════════ STAT CARDS ═══════════════ */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Toplam Uye", value: stats.total || 0, color: theme.palette.primary.main, icon: <IconUsers size={20} /> },
            { label: "Aktif Uye", value: stats.active || 0, color: theme.palette.success.main, icon: <IconCheck size={20} /> },
            { label: "Pasif Uye", value: stats.inactive || 0, color: theme.palette.error.main, icon: <IconX size={20} /> },
          ].map((stat) => (
            <Grid item xs={12} sm={4} key={stat.label}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  borderRadius: 3,
                  border: `1px solid ${alpha(stat.color, 0.15)}`,
                  bgcolor: alpha(stat.color, 0.04),
                  transition: "all 0.2s ease",
                  "&:hover": { bgcolor: alpha(stat.color, 0.08), borderColor: alpha(stat.color, 0.3) },
                }}
              >
                <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: alpha(stat.color, 0.1), color: stat.color }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color, lineHeight: 1.2 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* ═══════════════ FILTER & SEARCH BAR ═══════════════ */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            gap: 1.5,
            mb: 3,
            p: 2,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.02),
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <TextField
            size="small"
            placeholder="Isim veya email ile ara..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><IconSearch size={18} color={theme.palette.text.secondary} /></InputAdornment>,
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setSearchTerm(""); setCurrentPage(1); }}>
                    <IconX size={16} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{ flex: 1, minWidth: 220, "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "background.paper", fontSize: "0.875rem" } }}
          />

          <Stack direction="row" spacing={0.5}>
            {[
              { value: "all", label: "Tumu" },
              { value: "active", label: "Aktif" },
              { value: "inactive", label: "Pasif" },
            ].map((f) => (
              <Chip
                key={f.value}
                label={f.label}
                size="small"
                variant={selectedStatus === f.value ? "filled" : "outlined"}
                color={selectedStatus === f.value ? "primary" : "default"}
                onClick={() => { setSelectedStatus(f.value); setCurrentPage(1); }}
                sx={{
                  fontWeight: 600, fontSize: "0.75rem", borderRadius: 2, px: 0.5, cursor: "pointer",
                  ...(selectedStatus === f.value && { bgcolor: theme.palette.primary.main, color: "#fff" }),
                }}
              />
            ))}
          </Stack>

          <Tooltip title="Yenile">
            <IconButton size="small" onClick={() => { loadData(); loadStats(); }} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.15) } }}>
              <IconRefresh size={18} />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<IconUserPlus size={18} />}
            onClick={handleOpenCreate}
            disableElevation
            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 600, fontSize: "0.85rem", px: 2.5, py: 0.9, bgcolor: theme.palette.primary.main, "&:hover": { bgcolor: theme.palette.primary.dark } }}
          >
            Yeni Uye Ekle
          </Button>
        </Box>

        {/* ═══════════════ USER CARDS ═══════════════ */}
        <Grid container spacing={2.5}>
          {users.map((u) => (
            <Grid item xs={12} sm={6} lg={4} key={u._id}>
              <Card
                sx={{
                  borderRadius: 3, border: `1px solid ${theme.palette.divider}`, transition: "all 0.25s ease", overflow: "hidden", position: "relative",
                  "&:hover": { transform: "translateY(-3px)", boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`, borderColor: alpha(theme.palette.primary.main, 0.3) },
                  "&::after": { content: '""', position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: u.isActive ? theme.palette.success.main : theme.palette.error.main },
                }}
              >
                <CardContent sx={{ p: 2.5, pt: 3 }}>
                  {/* Top row: avatar + name + status */}
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 48, height: 48,
                        bgcolor: alpha(u.isActive ? theme.palette.success.main : theme.palette.error.main, 0.12),
                        color: u.isActive ? theme.palette.success.main : theme.palette.error.main,
                        fontSize: "1.1rem", fontWeight: 700,
                      }}
                    >
                      {u.name?.charAt(0)?.toUpperCase() || "?"}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {u.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {u.email}
                      </Typography>
                    </Box>
                    <Chip
                      label={getStatusLabel(u.isActive)}
                      size="small"
                      sx={{ height: 24, fontSize: "0.7rem", fontWeight: 600, bgcolor: alpha(u.isActive ? theme.palette.success.main : theme.palette.error.main, 0.1), color: u.isActive ? theme.palette.success.main : theme.palette.error.main, border: "none" }}
                    />
                  </Box>

                  {/* Info rows */}
                  {u.phone && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                      <IconPhone size={14} color={theme.palette.text.secondary} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.78rem" }}>{u.phone}</Typography>
                    </Stack>
                  )}

                  {/* Ideathon bilgisi */}
                  {u.ideathon && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                      <IconBuilding size={14} color={theme.palette.secondary.main} />
                      <Typography variant="body2" sx={{ fontSize: "0.78rem", color: theme.palette.secondary.main, fontWeight: 500 }}>
                        {u.ideathon.name}
                      </Typography>
                      {u.ideathon.status && (
                        <Chip
                          label={u.ideathon.status === "active" ? "Aktif" : u.ideathon.status === "draft" ? "Taslak" : u.ideathon.status}
                          size="small"
                          sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600, bgcolor: u.ideathon.status === "active" ? alpha("#51CF66", 0.12) : alpha("#FFD43B", 0.12), color: u.ideathon.status === "active" ? "#51CF66" : "#FFD43B" }}
                        />
                      )}
                    </Stack>
                  )}

                  {/* Takim bilgisi */}
                  {u.team && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                      <IconUsersGroup size={14} color={theme.palette.info.main} />
                      <Typography variant="body2" sx={{ fontSize: "0.78rem", color: theme.palette.info.main, fontWeight: 500 }}>
                        {u.team.teamName} ({u.team.memberCount || u.team.members?.length || 0} kisi)
                      </Typography>
                    </Stack>
                  )}

                  {/* Bottom row */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <IconCalendar size={13} />
                      {moment(u.createdAt).format("DD MMM YYYY")}
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Detay">
                        <IconButton size="small" onClick={() => { setSelectedUser(u); setTeamExpanded(false); setOpenDetailModal(true); }}
                          sx={{ width: 30, height: 30, bgcolor: alpha(theme.palette.primary.main, 0.08), color: theme.palette.primary.main, "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.18) } }}>
                          <IconEye size={15} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Duzenle">
                        <IconButton size="small" onClick={() => handleOpenEdit(u)}
                          sx={{ width: 30, height: 30, bgcolor: alpha(theme.palette.warning.main, 0.08), color: theme.palette.warning.main, "&:hover": { bgcolor: alpha(theme.palette.warning.main, 0.18) } }}>
                          <IconEdit size={15} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton size="small" onClick={() => { setSelectedUser(u); setOpenDeleteModal(true); }}
                          sx={{ width: 30, height: 30, bgcolor: alpha(theme.palette.error.main, 0.08), color: theme.palette.error.main, "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.18) } }}>
                          <IconTrash size={15} />
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
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 1 }}>
            <Pagination count={pagination.totalPages} page={currentPage} onChange={handlePageChange} color="primary" size={isMobile ? "small" : "medium"}
              sx={{ "& .MuiPaginationItem-root": { borderRadius: 2, fontWeight: 500, fontSize: "0.8rem" } }} />
          </Box>
        )}

        {/* Empty state */}
        {users.length === 0 && !ctxLoading && (
          <Box sx={{ textAlign: "center", py: 8, px: 3, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02), border: `1px dashed ${theme.palette.divider}` }}>
            <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: alpha(theme.palette.primary.main, 0.08), display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
              <IconUsers size={32} color={theme.palette.text.disabled} />
            </Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>Henuz uye bulunmuyor</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 360, mx: "auto" }}>Yeni uye ekleyerek baslayabilirsiniz.</Typography>
            <Button variant="contained" startIcon={<IconUserPlus size={18} />} onClick={handleOpenCreate} disableElevation sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 600, px: 3 }}>
              Ilk Uyeyi Ekle
            </Button>
          </Box>
        )}

        {/* ═══════════════ CREATE MODAL ═══════════════ */}
        <Dialog open={openCreateModal} onClose={handleCloseCreate} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}>
          {/* Header */}
          <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: "#fff", px: 3, py: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconUserPlus size={22} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Yeni Uye Olustur</Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>Kullanici bilgilerini girin, opsiyonel olarak takim ekleyin</Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseCreate} sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { color: "#fff" } }}>
              <IconX size={20} />
            </IconButton>
          </Box>

          {/* Stepper */}
          <Box sx={{ px: 3, pt: 3, pb: 1 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {createSteps.map((label, index) => (
                <Step key={label} completed={activeStep > index}>
                  <StepLabel sx={{ "& .MuiStepLabel-label": { fontSize: "0.8rem", fontWeight: activeStep === index ? 600 : 400 } }}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <DialogContent sx={{ px: 3, py: 2 }}>
            {/* Step 0: Kisisel Bilgiler */}
            {activeStep === 0 && (
              <Fade in>
                <Grid container spacing={2.5} sx={{ mt: 0 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Ad Soyad" required value={createFormData.name}
                      onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                      error={!!createFormErrors.name} helperText={createFormErrors.name}
                      InputProps={{ startAdornment: <InputAdornment position="start"><IconUser size={18} color={theme.palette.text.secondary} /></InputAdornment> }}
                      sx={inputSx} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Email" type="email" required value={createFormData.email}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                      error={!!createFormErrors.email} helperText={createFormErrors.email}
                      InputProps={{ startAdornment: <InputAdornment position="start"><IconMail size={18} color={theme.palette.text.secondary} /></InputAdornment> }}
                      sx={inputSx} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Sifre" type="password" required value={createFormData.password}
                      onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                      error={!!createFormErrors.password} helperText={createFormErrors.password || "En az 6 karakter"}
                      InputProps={{ startAdornment: <InputAdornment position="start"><IconLock size={18} color={theme.palette.text.secondary} /></InputAdornment> }}
                      sx={inputSx} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Telefon" value={createFormData.phone}
                      onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                      InputProps={{ startAdornment: <InputAdornment position="start"><IconPhone size={18} color={theme.palette.text.secondary} /></InputAdornment> }}
                      sx={inputSx} />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth error={!!createFormErrors.ideathonId}>
                      <InputLabel>Ideathon *</InputLabel>
                      <Select value={createFormData.ideathonId} label="Ideathon *"
                        onChange={(e) => setCreateFormData({ ...createFormData, ideathonId: e.target.value })}
                        sx={{ borderRadius: 2.5 }}
                        startAdornment={<InputAdornment position="start"><IconBuilding size={18} color={theme.palette.text.secondary} /></InputAdornment>}>
                        {ideathons.map((idt) => (
                          <MenuItem key={idt._id} value={idt._id}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography sx={{ fontWeight: 500, fontSize: "0.875rem" }}>{idt.name}</Typography>
                              <Chip label={idt.status === "active" ? "Aktif" : idt.status === "draft" ? "Taslak" : idt.status} size="small"
                                sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600, bgcolor: idt.status === "active" ? alpha("#51CF66", 0.15) : alpha("#FFD43B", 0.15), color: idt.status === "active" ? "#51CF66" : "#FFD43B" }} />
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {createFormErrors.ideathonId && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{createFormErrors.ideathonId}</Typography>}
                    </FormControl>
                  </Grid>
                </Grid>
              </Fade>
            )}

            {/* Step 1: Takim Bilgileri */}
            {activeStep === 1 && (
              <Fade in>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, mt: 1 }}>
                    <IconUsersGroup size={20} color={theme.palette.primary.main} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Takim bilgileri opsiyoneldir. Bos birakirsaniz uye takimsiz olusturulur.
                    </Typography>
                  </Box>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Takim Adi" value={createFormData.teamName}
                        onChange={(e) => setCreateFormData({ ...createFormData, teamName: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start"><IconUsersGroup size={18} color={theme.palette.text.secondary} /></InputAdornment> }}
                        sx={inputSx} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Sehir" value={createFormData.city}
                        onChange={(e) => setCreateFormData({ ...createFormData, city: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start"><IconMapPin size={18} color={theme.palette.text.secondary} /></InputAdornment> }}
                        sx={inputSx} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Takim Aciklamasi" multiline rows={3} value={createFormData.teamDescription}
                        onChange={(e) => setCreateFormData({ ...createFormData, teamDescription: e.target.value })}
                        InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}><IconNotes size={18} color={theme.palette.text.secondary} /></InputAdornment> }}
                        sx={inputSx} />
                    </Grid>
                  </Grid>
                </Box>
              </Fade>
            )}

            {/* Step 2: Takim Uyeleri */}
            {activeStep === 2 && (
              <Fade in>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, mt: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconUsersGroup size={20} color={theme.palette.primary.main} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Takim uyeleri opsiyoneldir. Olusturulan kullanici takimin sahibidir (createdBy).
                      </Typography>
                    </Box>
                    <Button size="small" variant="outlined" startIcon={<IconPlus size={16} />} onClick={handleAddTeamMember}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, fontSize: "0.8rem" }}>
                      Uye Ekle
                    </Button>
                  </Box>

                  {createFormData.teamMembers.length === 0 && (
                    <Box sx={{ textAlign: "center", py: 5, borderRadius: 3, border: `1px dashed ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                      <IconUsersGroup size={36} color={theme.palette.text.disabled} style={{ marginBottom: 8 }} />
                      <Typography variant="body2" color="text.secondary">Henuz takim uyesi eklenmedi</Typography>
                      <Typography variant="caption" color="text.secondary">Yukaridaki butona tiklayarak takim uyesi ekleyebilirsiniz</Typography>
                    </Box>
                  )}

                  <Stack spacing={2}>
                    {createFormData.teamMembers.map((member, index) => (
                      <Box key={index} sx={{ p: 2, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.6), position: "relative" }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>Uye {index + 1}</Typography>
                          <IconButton size="small" onClick={() => handleRemoveTeamMember(index)} sx={{ color: theme.palette.error.main, width: 28, height: 28 }}>
                            <IconTrash size={16} />
                          </IconButton>
                        </Box>
                        <Grid container spacing={1.5}>
                          <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Ad Soyad *" value={member.name}
                              onChange={(e) => handleTeamMemberChange(index, "name", e.target.value)}
                              error={!!createFormErrors[`member_${index}_name`]} helperText={createFormErrors[`member_${index}_name`]}
                              sx={inputSx} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Email" value={member.email}
                              onChange={(e) => handleTeamMemberChange(index, "email", e.target.value)} sx={inputSx} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="TC Kimlik No" value={member.tcIdentity}
                              onChange={(e) => handleTeamMemberChange(index, "tcIdentity", e.target.value)}
                              error={!!createFormErrors[`member_${index}_tcIdentity`]} helperText={createFormErrors[`member_${index}_tcIdentity`] || "11 haneli (opsiyonel)"}
                              InputProps={{ startAdornment: <InputAdornment position="start"><IconId size={16} color={theme.palette.text.secondary} /></InputAdornment> }}
                              sx={inputSx} />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="Rol" placeholder="orn. Backend Gelistirici" value={member.role}
                              onChange={(e) => handleTeamMemberChange(index, "role", e.target.value)} sx={inputSx} />
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Fade>
            )}
          </DialogContent>

          {/* Footer */}
          <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
            <Button onClick={handleCloseCreate} variant="text" sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 500, color: "text.secondary" }}>Iptal</Button>
            <Box sx={{ flex: 1 }} />
            {activeStep > 0 && (
              <Button onClick={handleBackStep} variant="outlined" sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 600 }}>Geri</Button>
            )}
            {activeStep < 2 ? (
              <Button onClick={handleNextStep} variant="contained" disableElevation
                sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 600, px: 3, bgcolor: theme.palette.primary.main, "&:hover": { bgcolor: theme.palette.primary.dark } }}>
                Ileri
              </Button>
            ) : (
              <Button onClick={handleCreateSubmit} variant="contained" disableElevation disabled={createLoading}
                startIcon={createLoading ? <CircularProgress size={16} color="inherit" /> : <IconCheck size={18} />}
                sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 600, px: 3, bgcolor: theme.palette.success.main, "&:hover": { bgcolor: theme.palette.success.dark } }}>
                {createLoading ? "Olusturuluyor..." : "Olustur"}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* ═══════════════ EDIT MODAL ═══════════════ */}
        <Dialog open={openEditModal} onClose={handleCloseEdit} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}>
          {/* Header */}
          <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`, color: "#fff", px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <IconEdit size={22} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Uye Duzenle</Typography>
            </Box>
            <IconButton onClick={handleCloseEdit} sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { color: "#fff" } }}>
              <IconX size={20} />
            </IconButton>
          </Box>

          <DialogContent sx={{ px: 3, py: 3 }}>
            <Grid container spacing={2.5}>
              {/* Kisisel Bilgiler */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main, display: "flex", alignItems: "center", gap: 0.5 }}>
                  <IconUser size={16} /> Kisisel Bilgiler
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Ad Soyad" value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  error={!!editFormErrors.name} helperText={editFormErrors.name}
                  InputProps={{ startAdornment: <InputAdornment position="start"><IconUser size={18} color={theme.palette.text.secondary} /></InputAdornment> }}
                  sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" type="email" value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  error={!!editFormErrors.email} helperText={editFormErrors.email}
                  InputProps={{ startAdornment: <InputAdornment position="start"><IconMail size={18} color={theme.palette.text.secondary} /></InputAdornment> }}
                  sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Telefon" value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><IconPhone size={18} color={theme.palette.text.secondary} /></InputAdornment> }}
                  sx={inputSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch checked={editFormData.isActive} onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })} color="success" />}
                  label={editFormData.isActive ? "Aktif" : "Pasif"}
                  sx={{ "& .MuiFormControlLabel-label": { fontWeight: 500 } }}
                />
              </Grid>

              {/* Ideathon Degistirme */}
              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.secondary.main, mt: 1, mb: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                  <IconArrowsExchange size={16} /> Ideathon Degistir
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                  Uyeyi farkli bir ideathon&apos;a tasiyabilirsiniz.
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Ideathon</InputLabel>
                  <Select value={editFormData.ideathonId} label="Ideathon"
                    onChange={(e) => setEditFormData({ ...editFormData, ideathonId: e.target.value })}
                    sx={{ borderRadius: 2.5 }}
                    startAdornment={<InputAdornment position="start"><IconBuilding size={18} color={theme.palette.text.secondary} /></InputAdornment>}>
                    {ideathons.map((idt) => (
                      <MenuItem key={idt._id} value={idt._id}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography sx={{ fontWeight: 500, fontSize: "0.875rem" }}>{idt.name}</Typography>
                          <Chip label={idt.status === "active" ? "Aktif" : idt.status === "draft" ? "Taslak" : idt.status} size="small"
                            sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600, bgcolor: idt.status === "active" ? alpha("#51CF66", 0.15) : alpha("#FFD43B", 0.15), color: idt.status === "active" ? "#51CF66" : "#FFD43B" }} />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Takim Uye Yonetimi (Team modeli — _id varsa editable) */}
              {selectedUser?.team && selectedUser.team._id && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 0.5 }} />
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                      <IconUsersGroup size={16} color={theme.palette.info.main} />
                      <TextField
                        size="small"
                        value={editTeamName}
                        onChange={(e) => setEditTeamName(e.target.value)}
                        onBlur={handleSaveTeamName}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveTeamName(); }}
                        disabled={memberSaving}
                        placeholder="Takim Adi"
                        sx={{ flex: 1, "& .MuiInputBase-input": { fontSize: "0.85rem", fontWeight: 600, color: theme.palette.info.main, py: 0.6, px: 1 } }}
                      />
                      <Button size="small" variant="outlined" startIcon={<IconPlus size={14} />} onClick={handleEditAddMember}
                        disabled={memberSaving}
                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, fontSize: "0.75rem", py: 0.3, whiteSpace: "nowrap" }}>
                        Uye Ekle
                      </Button>
                    </Box>
                    {selectedUser.team.city && (
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                        <IconMapPin size={13} color={theme.palette.text.secondary} />
                        <Typography variant="caption" color="text.secondary">{selectedUser.team.city}</Typography>
                      </Stack>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    {editTeamMembers.length === 0 && (
                      <Box sx={{ textAlign: "center", py: 3, borderRadius: 2.5, border: `1px dashed ${theme.palette.divider}`, bgcolor: alpha(theme.palette.info.main, 0.02) }}>
                        <IconUsersGroup size={28} color={theme.palette.text.disabled} style={{ marginBottom: 4 }} />
                        <Typography variant="body2" color="text.secondary">Takimda henuz uye yok</Typography>
                      </Box>
                    )}
                    <Stack spacing={1.5}>
                      {editTeamMembers.map((member, idx) => (
                        <Box key={idx} sx={{ p: 1.5, borderRadius: 2.5, border: `1px solid ${member.isNew ? alpha(theme.palette.success.main, 0.3) : theme.palette.divider}`, bgcolor: member.isNew ? alpha(theme.palette.success.main, 0.03) : alpha(theme.palette.background.paper, 0.6) }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: member.isNew ? theme.palette.success.main : theme.palette.info.main }}>
                              {member.isNew ? "Yeni Uye" : `Uye ${idx + 1}`}
                            </Typography>
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Kaydet">
                                <IconButton size="small" onClick={() => handleSaveMember(idx)} disabled={memberSaving}
                                  sx={{ width: 26, height: 26, bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, "&:hover": { bgcolor: alpha(theme.palette.success.main, 0.2) } }}>
                                  {memberSaving ? <CircularProgress size={12} color="inherit" /> : <IconCheck size={14} />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cikar">
                                <IconButton size="small" onClick={() => handleRemoveEditMember(idx)} disabled={memberSaving}
                                  sx={{ width: 26, height: 26, bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main, "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.2) } }}>
                                  <IconTrash size={14} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Box>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <TextField fullWidth size="small" label="Ad Soyad *" value={member.name}
                                onChange={(e) => handleEditMemberChange(idx, "name", e.target.value)}
                                error={!!editMemberErrors[`m_${idx}_name`]} helperText={editMemberErrors[`m_${idx}_name`]}
                                sx={inputSx} />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField fullWidth size="small" label="Email" value={member.email}
                                onChange={(e) => handleEditMemberChange(idx, "email", e.target.value)}
                                sx={inputSx} />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField fullWidth size="small" label="TC Kimlik No" value={member.tcIdentity}
                                onChange={(e) => handleEditMemberChange(idx, "tcIdentity", e.target.value)}
                                error={!!editMemberErrors[`m_${idx}_tcIdentity`]} helperText={editMemberErrors[`m_${idx}_tcIdentity`]}
                                InputProps={{ startAdornment: <InputAdornment position="start"><IconId size={14} color={theme.palette.text.secondary} /></InputAdornment> }}
                                sx={inputSx} />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField fullWidth size="small" label="Rol" placeholder="orn. Backend Gelistirici" value={member.role}
                                onChange={(e) => handleEditMemberChange(idx, "role", e.target.value)}
                                sx={inputSx} />
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                    </Stack>
                  </Grid>
                </>
              )}

              {/* Basvuru bazli takim bilgisi (salt okunur — _id yoksa Application'dan gelmistir) */}
              {selectedUser?.team && !selectedUser.team._id && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 0.5 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.info.main, mt: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
                      <IconUsersGroup size={16} /> Takim: {selectedUser.team.teamName} (basvurudan)
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: alpha(theme.palette.info.main, 0.04), border: `1px solid ${alpha(theme.palette.info.main, 0.12)}` }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                        Bu takim basvuru uzerinden olusturulmus. Uye duzenlemek icin basvuru yonetimini kullanin.
                      </Typography>
                      {selectedUser.team.members && selectedUser.team.members.length > 0 && (
                        <Stack spacing={0.5}>
                          {selectedUser.team.members.map((m, i) => (
                            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="body2" sx={{ fontSize: "0.78rem" }}>{m.name}</Typography>
                              {m.role && <Chip label={m.role} size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600 }} />}
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button onClick={handleCloseEdit} variant="text" sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 500, color: "text.secondary" }}>Iptal</Button>
            <Button onClick={handleEditSubmit} variant="contained" disableElevation disabled={ctxLoading}
              startIcon={ctxLoading ? <CircularProgress size={16} color="inherit" /> : <IconCheck size={18} />}
              sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 600, px: 3, bgcolor: theme.palette.warning.main, "&:hover": { bgcolor: theme.palette.warning.dark } }}>
              Guncelle
            </Button>
          </DialogActions>
        </Dialog>

        {/* ═══════════════ DETAIL MODAL ═══════════════ */}
        <Dialog open={openDetailModal} onClose={handleCloseModal} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}>
          <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: "#fff", px: 3, py: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Uye Detaylari</Typography>
            <IconButton onClick={handleCloseModal} sx={{ color: "rgba(255,255,255,0.8)" }}><IconX size={20} /></IconButton>
          </Box>

          <DialogContent sx={{ px: 3, py: 3 }}>
            {selectedUser && (
              <Box>
                {/* Profile */}
                <Box sx={{ textAlign: "center", mb: 3 }}>
                  <Avatar sx={{ width: 72, height: 72, mx: "auto", mb: 1.5, bgcolor: alpha(selectedUser.isActive ? theme.palette.success.main : theme.palette.error.main, 0.12), color: selectedUser.isActive ? theme.palette.success.main : theme.palette.error.main, fontSize: "1.8rem", fontWeight: 700 }}>
                    {selectedUser.name?.charAt(0)?.toUpperCase() || "?"}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedUser.name}</Typography>
                  <Chip label={getStatusLabel(selectedUser.isActive)} size="small"
                    sx={{ mt: 0.5, fontWeight: 600, bgcolor: alpha(selectedUser.isActive ? theme.palette.success.main : theme.palette.error.main, 0.1), color: selectedUser.isActive ? theme.palette.success.main : theme.palette.error.main }} />
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Info Grid */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Email</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedUser.email}</Typography>
                  </Grid>
                  {selectedUser.phone && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Telefon</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedUser.phone}</Typography>
                    </Grid>
                  )}
                  {/* Ideathon bilgisi — API response: ideathon: { _id, name, slug, status } */}
                  {selectedUser.ideathon && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Ideathon</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedUser.ideathon.name}</Typography>
                        {selectedUser.ideathon.status && (
                          <Chip label={selectedUser.ideathon.status === "active" ? "Aktif" : selectedUser.ideathon.status} size="small"
                            sx={{ height: 18, fontSize: "0.6rem", fontWeight: 600, bgcolor: selectedUser.ideathon.status === "active" ? alpha("#51CF66", 0.12) : alpha("#FFD43B", 0.12), color: selectedUser.ideathon.status === "active" ? "#51CF66" : "#FFD43B" }} />
                        )}
                      </Box>
                    </Grid>
                  )}
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Olusturulma</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{moment(selectedUser.createdAt).format("DD MMMM YYYY")}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Son Guncelleme</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{moment(selectedUser.updatedAt).format("DD MMMM YYYY")}</Typography>
                  </Grid>
                  {selectedUser.createdBy && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>Olusturan</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedUser.createdBy.name} ({selectedUser.createdBy.role})</Typography>
                    </Grid>
                  )}
                </Grid>

                {/* Team Section */}
                {selectedUser.team && (
                  <Box sx={{ mt: 3 }}>
                    <Box onClick={() => setTeamExpanded(!teamExpanded)}
                      sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, borderRadius: 2.5, bgcolor: alpha(theme.palette.info.main, 0.06), border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`, cursor: "pointer", transition: "all 0.2s", "&:hover": { bgcolor: alpha(theme.palette.info.main, 0.1) } }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <IconUsersGroup size={18} color={theme.palette.info.main} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.info.main }}>{selectedUser.team.teamName}</Typography>
                        <Chip label={`${selectedUser.team.memberCount || selectedUser.team.members?.length || 0} kisi`} size="small"
                          sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600, bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }} />
                      </Box>
                      {teamExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                    </Box>
                    <Collapse in={teamExpanded}>
                      <Box sx={{ mt: 1.5 }}>
                        {selectedUser.team.teamDescription && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: "0.8rem" }}>{selectedUser.team.teamDescription}</Typography>
                        )}
                        {selectedUser.team.city && (
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1.5 }}>
                            <IconMapPin size={14} color={theme.palette.text.secondary} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>{selectedUser.team.city}</Typography>
                          </Stack>
                        )}
                        {selectedUser.team.members && selectedUser.team.members.length > 0 && (
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 1 }}>Ad Soyad</TableCell>
                                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 1 }}>TC Kimlik No</TableCell>
                                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem", py: 1 }}>Rol</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {selectedUser.team.members.map((m, i) => (
                                  <TableRow key={i} sx={{ "&:last-child td": { border: 0 } }}>
                                    <TableCell sx={{ fontSize: "0.8rem", py: 0.8 }}>{m.name}</TableCell>
                                    <TableCell sx={{ fontSize: "0.8rem", py: 0.8 }}>{m.tcIdentity || "-"}</TableCell>
                                    <TableCell sx={{ fontSize: "0.8rem", py: 0.8 }}>
                                      <Chip label={m.role || "Uye"} size="small" sx={{ height: 22, fontSize: "0.65rem", fontWeight: 600 }} />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>
                    </Collapse>
                  </Box>
                )}

                {/* Takimsiz durumu */}
                {!selectedUser.team && (
                  <Box sx={{ mt: 3, p: 2, borderRadius: 2.5, bgcolor: alpha(theme.palette.grey[500], 0.04), border: `1px dashed ${theme.palette.divider}`, textAlign: "center" }}>
                    <IconUsersGroup size={24} color={theme.palette.text.disabled} style={{ marginBottom: 4 }} />
                    <Typography variant="body2" color="text.secondary">Bu uyenin takimi bulunmuyor</Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Button onClick={handleCloseModal} variant="text" sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 500, color: "text.secondary" }}>Kapat</Button>
          </DialogActions>
        </Dialog>

        {/* ═══════════════ DELETE CONFIRM ═══════════════ */}
        <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)} PaperProps={{ sx: { borderRadius: 4 } }}>
          <Box sx={{ px: 3, pt: 3, pb: 1, textAlign: "center" }}>
            <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: alpha(theme.palette.error.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
              <IconTrash size={28} color={theme.palette.error.main} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Uyeyi Sil</Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>{selectedUser?.name}</strong> adli uyeyi silmek istediginizden emin misiniz? Bu islem geri alinamaz.
            </Typography>
          </Box>
          <DialogActions sx={{ px: 3, py: 2, justifyContent: "center", gap: 1 }}>
            <Button onClick={() => setOpenDeleteModal(false)} variant="outlined"
              sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 600, px: 3, minWidth: 100 }}>Iptal</Button>
            <Button onClick={handleDelete} variant="contained" color="error" disableElevation
              sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 600, px: 3, minWidth: 100 }}>Sil</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default ChatUsers;
