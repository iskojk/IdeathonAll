"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
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
  Fade,
  Switch,
  FormControlLabel,
  Tooltip,
  Divider,
  Pagination,
  useTheme,
  Tab,
  Tabs,
  Alert,
  alpha,
  CircularProgress,
  InputAdornment,
  Collapse,
  LinearProgress,
} from "@mui/material";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconUsers,
  IconCalendar,
  IconBuildingSkyscraper,
  IconSettings,
  IconUserPlus,
  IconUserMinus,
  IconCheck,
  IconX,
  IconForms,
  IconUserCheck,
  IconUser,
  IconUsersGroup,
  IconPresentation,
  IconPencil,
  IconListCheck,
  IconChevronUp,
  IconChevronDown,
  IconStarFilled,
  IconCopy,
} from "@tabler/icons-react";
import { useIdeathon } from "@/app/context/IdeathonContext";
import { toast } from "react-toastify";
import moment from "moment";
import "moment/locale/tr";
moment.locale("tr");

/* ─── Status helpers ─── */

const statusConfig = {
  draft: { label: "Taslak", color: "#FFD43B", bg: "#FFD43B30" },
  active: { label: "Aktif", color: "#51CF66", bg: "#51CF6630" },
  completed: { label: "Tamamlandi", color: "#4DABF7", bg: "#4DABF730" },
  archived: { label: "Arsiv", color: "#ADB5BD", bg: "#ADB5BD30" },
};

const getStatus = (s) => statusConfig[s] || statusConfig.draft;

/* ─── Toggle field config ─── */

const toggleFields = [
  { key: "registrationOpen", label: "Kayit", icon: IconUserCheck },
  { key: "applicationOpen", label: "Basvuru", icon: IconForms },
  { key: "individualApplicationOpen", label: "Bireysel Basvuru", icon: IconUser },
  { key: "teamCreationOpen", label: "Takim Olusturma", icon: IconUsersGroup },
  { key: "presentationUploadOpen", label: "Sunum Yukleme", icon: IconPresentation },
  { key: "applicationEditOpen", label: "Basvuru Duzenleme", icon: IconPencil },
];

/* ─── Initial form state ─── */

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  status: "draft",
  type: "standard",
  startDate: "",
  endDate: "",
  registrationOpen: true,
  applicationOpen: true,
  individualApplicationOpen: true,
  teamCreationOpen: true,
  presentationUploadOpen: true,
  applicationEditOpen: true,
  phases: {
    applicationStart: "",
    applicationEnd: "",
    evaluationStart: "",
    evaluationEnd: "",
    mentorshipStart: "",
    mentorshipEnd: "",
    finalStart: "",
    finalEnd: "",
  },
  settings: {
    maxTeamSize: 5,
    maxApplications: 0,
    allowPublicRegistration: true,
    requireTeam: false,
  },
  evaluationCriteria: [],
};


/* ═══════════════════════════════════════════════════════════ */
/*                    MAIN COMPONENT                          */
/* ═══════════════════════════════════════════════════════════ */

const IdeathonManagement = () => {
  const theme = useTheme();
  const {
    fetchIdeathons,
    getIdeathonById,
    createIdeathon,
    updateIdeathon,
    deleteIdeathon,
    assignUser,
    unassignUser,
    fetchIdeathonUsers,
    loading,
  } = useIdeathon();

  // List state
  const [ideathons, setIdeathons] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal state
  const [openFormModal, setOpenFormModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({ ...emptyForm });
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);

  // Detail state
  const [selectedIdeathon, setSelectedIdeathon] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [detailTab, setDetailTab] = useState(0);

  // Assign user state
  const [assignForm, setAssignForm] = useState({ userId: "", role: "juri" });
  const [showAssignForm, setShowAssignForm] = useState(false);

  // Criteria modal state
  const [openCriteriaModal, setOpenCriteriaModal] = useState(false);
  const [criteriaIdeathon, setCriteriaIdeathon] = useState(null);
  const [criteriaList, setCriteriaList] = useState([]);
  const [criteriaSaving, setCriteriaSaving] = useState(false);
  const [expandedCriterion, setExpandedCriterion] = useState(null);

  /* ─── Data fetching ─── */

  const loadIdeathons = useCallback(async () => {
    const filters = {};
    if (statusFilter !== "all") filters.status = statusFilter;

    const result = await fetchIdeathons(currentPage, 20, filters);
    if (result.success) {
      setIdeathons(result.data || []);
      setPagination(result.pagination || { total: 0, page: 1, totalPages: 1 });
    }
  }, [currentPage, statusFilter, fetchIdeathons]);

  useEffect(() => {
    loadIdeathons();
  }, [loadIdeathons]);

  /* ─── Create / Edit ─── */

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setFormErrors({});
    setOpenFormModal(true);
  };

  const handleOpenEdit = async (ideathon) => {
    setEditingId(ideathon._id);
    setFormData({
      name: ideathon.name || "",
      slug: ideathon.slug || "",
      description: ideathon.description || "",
      status: ideathon.status || "draft",
      type: ideathon.type || "standard",
      startDate: ideathon.startDate ? ideathon.startDate.split("T")[0] : "",
      endDate: ideathon.endDate ? ideathon.endDate.split("T")[0] : "",
      registrationOpen: ideathon.registrationOpen ?? true,
      applicationOpen: ideathon.applicationOpen ?? true,
      individualApplicationOpen: ideathon.individualApplicationOpen ?? true,
      teamCreationOpen: ideathon.teamCreationOpen ?? true,
      presentationUploadOpen: ideathon.presentationUploadOpen ?? true,
      applicationEditOpen: ideathon.applicationEditOpen ?? true,
      phases: {
        applicationStart: ideathon.phases?.applicationStart?.split("T")[0] || "",
        applicationEnd: ideathon.phases?.applicationEnd?.split("T")[0] || "",
        evaluationStart: ideathon.phases?.evaluationStart?.split("T")[0] || "",
        evaluationEnd: ideathon.phases?.evaluationEnd?.split("T")[0] || "",
        mentorshipStart: ideathon.phases?.mentorshipStart?.split("T")[0] || "",
        mentorshipEnd: ideathon.phases?.mentorshipEnd?.split("T")[0] || "",
        finalStart: ideathon.phases?.finalStart?.split("T")[0] || "",
        finalEnd: ideathon.phases?.finalEnd?.split("T")[0] || "",
      },
      settings: {
        maxTeamSize: ideathon.settings?.maxTeamSize ?? 5,
        maxApplications: ideathon.settings?.maxApplications ?? 0,
        allowPublicRegistration: ideathon.settings?.allowPublicRegistration ?? true,
        requireTeam: ideathon.settings?.requireTeam ?? false,
      },
      evaluationCriteria: ideathon.evaluationCriteria || [],
    });
    setFormErrors({});
    setOpenFormModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Ad zorunludur";
    if (!formData.slug.trim()) errors.slug = "Slug zorunludur";
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = "Slug sadece kucuk harf, rakam ve tire icerebilir";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) return;

    // Temiz data hazirla
    const cleanData = { ...formData };
    if (!cleanData.startDate) delete cleanData.startDate;
    if (!cleanData.endDate) delete cleanData.endDate;

    // evaluationCriteria: bos key/name olanlari filtrele, order ata
    if (cleanData.evaluationCriteria && cleanData.evaluationCriteria.length > 0) {
      cleanData.evaluationCriteria = cleanData.evaluationCriteria
        .filter(c => c.key && c.name && c.maxScore)
        .map((c, idx) => ({
          ...c,
          order: idx,
          evaluationPoints: (c.evaluationPoints || []).filter(p => p.trim()),
        }));
    }

    // Phases'den bos stringleri temizle
    const phases = { ...cleanData.phases };
    Object.keys(phases).forEach((key) => {
      if (!phases[key]) delete phases[key];
    });
    if (Object.keys(phases).length > 0) {
      cleanData.phases = phases;
    } else {
      delete cleanData.phases;
    }

    let result;
    if (editingId) {
      result = await updateIdeathon(editingId, cleanData);
    } else {
      result = await createIdeathon(cleanData);
    }

    if (result.success) {
      toast.success(editingId ? "Ideathon guncellendi" : "Ideathon olusturuldu");
      setOpenFormModal(false);
      loadIdeathons();
    } else {
      toast.error(result.message);
    }
  };

  /* ─── Delete ─── */

  const handleDeleteConfirm = async () => {
    if (!selectedIdeathon) return;
    const result = await deleteIdeathon(selectedIdeathon._id);
    if (result.success) {
      toast.success("Ideathon silindi");
      setOpenDeleteModal(false);
      setSelectedIdeathon(null);
      loadIdeathons();
    } else {
      toast.error(result.message);
    }
  };

  /* ─── Detail & Users ─── */

  const handleOpenDetail = async (ideathon) => {
    setSelectedIdeathon(ideathon);
    setDetailTab(0);
    setOpenDetailModal(true);
    setShowAssignForm(false);
    setAssignForm({ userId: "", role: "juri" });

    const usersResult = await fetchIdeathonUsers(ideathon._id);
    if (usersResult.success) {
      setAssignedUsers(usersResult.data || []);
    }
  };

  const handleUnassign = async (user) => {
    if (!selectedIdeathon) return;
    const result = await unassignUser(selectedIdeathon._id, user.userId?._id || user.userId, user.role);
    if (result.success) {
      toast.success("Atama kaldirildi");
      const usersResult = await fetchIdeathonUsers(selectedIdeathon._id);
      if (usersResult.success) setAssignedUsers(usersResult.data || []);
    } else {
      toast.error(result.message);
    }
  };

  const handleAssignSubmit = async () => {
    if (!assignForm.userId.trim()) {
      toast.error("Kullanici ID gerekli");
      return;
    }
    if (!selectedIdeathon) return;

    const result = await assignUser(selectedIdeathon._id, assignForm.userId, assignForm.role);
    if (result.success) {
      toast.success("Kullanici atandi");
      setAssignForm({ userId: "", role: "juri" });
      setShowAssignForm(false);
      const usersResult = await fetchIdeathonUsers(selectedIdeathon._id);
      if (usersResult.success) setAssignedUsers(usersResult.data || []);
    } else {
      toast.error(result.message);
    }
  };

  /* ─── Quick Toggle ─── */

  const handleQuickToggle = async (ideathon, field) => {
    const newValue = !ideathon[field];
    const result = await updateIdeathon(ideathon._id, { [field]: newValue });
    if (result.success) {
      const found = toggleFields.find((t) => t.key === field);
      toast.success(`${found?.label || field} ${newValue ? "acildi" : "kapatildi"}`);
      loadIdeathons();
    } else {
      toast.error(result.message);
    }
  };

  /* ─── Criteria Modal ─── */

  const handleOpenCriteria = (ideathon) => {
    setCriteriaIdeathon(ideathon);
    setCriteriaList(
      (ideathon.evaluationCriteria || []).map((c, i) => ({
        ...c,
        order: c.order ?? i,
        evaluationPoints: c.evaluationPoints?.length > 0 ? [...c.evaluationPoints] : [""],
      }))
    );
    setExpandedCriterion(null);
    setOpenCriteriaModal(true);
  };

  const handleCloseCriteria = () => {
    setOpenCriteriaModal(false);
    setCriteriaIdeathon(null);
    setCriteriaList([]);
  };

  const handleAddCriterion = () => {
    const newOrder = criteriaList.length;
    const newKey = `criterion_${newOrder + 1}`;
    setCriteriaList((prev) => [
      ...prev,
      { key: newKey, name: "", maxScore: 10, order: newOrder, evaluationPoints: [""] },
    ]);
    setExpandedCriterion(newOrder);
  };

  const handleDuplicateCriterion = (idx) => {
    const src = criteriaList[idx];
    setCriteriaList((prev) => {
      const copy = {
        ...src,
        key: `${src.key}_copy`,
        name: `${src.name} (Kopya)`,
        order: prev.length,
        evaluationPoints: [...(src.evaluationPoints || [])],
      };
      return [...prev, copy];
    });
  };

  const handleRemoveCriterion = (idx) => {
    setCriteriaList((prev) => prev.filter((_, i) => i !== idx).map((c, i) => ({ ...c, order: i })));
    if (expandedCriterion === idx) setExpandedCriterion(null);
    else if (expandedCriterion > idx) setExpandedCriterion(expandedCriterion - 1);
  };

  const handleMoveCriterion = (idx, direction) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= criteriaList.length) return;
    setCriteriaList((prev) => {
      const updated = [...prev];
      [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
      return updated.map((c, i) => ({ ...c, order: i }));
    });
    if (expandedCriterion === idx) setExpandedCriterion(newIdx);
    else if (expandedCriterion === newIdx) setExpandedCriterion(idx);
  };

  const handleCriterionChange = (idx, field, value) => {
    setCriteriaList((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handlePointChange = (cIdx, pIdx, value) => {
    setCriteriaList((prev) => {
      const updated = [...prev];
      const points = [...(updated[cIdx].evaluationPoints || [])];
      points[pIdx] = value;
      updated[cIdx] = { ...updated[cIdx], evaluationPoints: points };
      return updated;
    });
  };

  const handleAddPoint = (cIdx) => {
    setCriteriaList((prev) => {
      const updated = [...prev];
      updated[cIdx] = {
        ...updated[cIdx],
        evaluationPoints: [...(updated[cIdx].evaluationPoints || []), ""],
      };
      return updated;
    });
  };

  const handleRemovePoint = (cIdx, pIdx) => {
    setCriteriaList((prev) => {
      const updated = [...prev];
      const points = [...(updated[cIdx].evaluationPoints || [])];
      points.splice(pIdx, 1);
      updated[cIdx] = { ...updated[cIdx], evaluationPoints: points };
      return updated;
    });
  };

  const handleSaveCriteria = async () => {
    const cleaned = criteriaList
      .filter((c) => c.key?.trim() && c.name?.trim() && c.maxScore > 0)
      .map((c, idx) => ({
        key: c.key.trim(),
        name: c.name.trim(),
        maxScore: parseInt(c.maxScore) || 10,
        order: idx,
        evaluationPoints: (c.evaluationPoints || []).filter((p) => p.trim()),
      }));

    const keys = cleaned.map((c) => c.key);
    if (new Set(keys).size !== keys.length) {
      toast.error("Kriter anahtarlari benzersiz olmalidir");
      return;
    }

    setCriteriaSaving(true);
    const result = await updateIdeathon(criteriaIdeathon._id, { evaluationCriteria: cleaned });
    setCriteriaSaving(false);

    if (result.success) {
      toast.success("Degerlendirme kriterleri kaydedildi");
      handleCloseCriteria();
      loadIdeathons();
    } else {
      toast.error(result.message || "Kriterler kaydedilemedi");
    }
  };

  const criteriaTotalScore = criteriaList.reduce((s, c) => s + (parseInt(c.maxScore) || 0), 0);

  /* ─── Slug auto-generate ─── */

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  /* ═══════════════════════════════════════════════════════════ */
  /*                         RENDER                              */
  /* ═══════════════════════════════════════════════════════════ */

  return (
    <Fade in={true} timeout={500}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>

        {/* ─── Filtre & Aksiyon Bar ─── */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Durum Filtresi</InputLabel>
                <Select
                  value={statusFilter}
                  label="Durum Filtresi"
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  sx={{ borderRadius: 2, backgroundColor: theme.palette.background.paper }}
                >
                  <MenuItem value="all">Tumu</MenuItem>
                  <MenuItem value="draft">Taslak</MenuItem>
                  <MenuItem value="active">Aktif</MenuItem>
                  <MenuItem value="completed">Tamamlandi</MenuItem>
                  <MenuItem value="archived">Arsiv</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary">
                Toplam: {pagination.total || 0} ideathon
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<IconPlus size={18} />}
                onClick={handleOpenCreate}
                sx={{
                  borderRadius: 2,
                  py: 1.1,
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.9rem",
                  bgcolor: theme.palette.primary.main,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: theme.palette.primary.dark,
                    boxShadow: "none",
                  },
                }}
              >
                Yeni Ideathon
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* ─── Ideathon Kartlari ─── */}
        <Grid container spacing={3}>
          {ideathons.map((ideathon) => {
            const st = getStatus(ideathon.status);
            return (
              <Grid item xs={12} sm={6} lg={4} key={ideathon._id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    transition: "all 0.2s ease",
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                      borderColor: theme.palette.primary.light,
                    },
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: st.color,
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: st.bg,
                          mr: 1.5,
                          flexShrink: 0,
                        }}
                      >
                        <IconBuildingSkyscraper size={22} color={st.color} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.25, lineHeight: 1.3 }} noWrap>
                          {ideathon.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ideathon.slug}
                        </Typography>
                      </Box>
                      <Chip
                        label={st.label}
                        size="small"
                        sx={{
                          bgcolor: st.bg,
                          color: st.color,
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          height: 24,
                          ml: 1,
                        }}
                      />
                    </Box>

                    {/* Stats */}
                    {ideathon.stats && (
                      <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                        <Chip
                          icon={<IconUsers size={13} />}
                          label={`${ideathon.stats?.juriCount || 0} Juri`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem", height: 24 }}
                        />
                        <Chip
                          icon={<IconUsers size={13} />}
                          label={`${ideathon.stats?.mentorCount || 0} Mentor`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem", height: 24 }}
                        />
                      </Box>
                    )}

                    {/* Ozellik Toggle Chip'leri */}
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1.5 }}>
                      {toggleFields.map(({ key, label, icon: Icon }) => {
                        const isOpen = ideathon[key] !== false;
                        return (
                          <Tooltip
                            key={key}
                            title={`${label}: ${isOpen ? "Acik" : "Kapali"} — Degistirmek icin tikla`}
                          >
                            <Chip
                              icon={<Icon size={12} />}
                              label={label}
                              size="small"
                              color={isOpen ? "success" : "default"}
                              variant={isOpen ? "filled" : "outlined"}
                              onClick={() => handleQuickToggle(ideathon, key)}
                              sx={{
                                fontSize: "0.65rem",
                                height: 22,
                                cursor: "pointer",
                                "& .MuiChip-icon": { fontSize: 12 },
                              }}
                            />
                          </Tooltip>
                        );
                      })}
                    </Box>

                    {/* Tarih */}
                    {ideathon.startDate && (
                      <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                        <IconCalendar size={14} style={{ marginRight: 4, opacity: 0.5 }} />
                        <Typography variant="caption" color="text.secondary">
                          {moment(ideathon.startDate).format("DD MMM YYYY")}
                          {ideathon.endDate && ` — ${moment(ideathon.endDate).format("DD MMM YYYY")}`}
                        </Typography>
                      </Box>
                    )}

                    {/* Degerlendirme Kriterleri — Card uzerinde */}
                    {(() => {
                      const criteria = ideathon.evaluationCriteria || [];
                      const total = criteria.reduce((s, c) => s + (c.maxScore || 0), 0);
                      return (
                        <Box
                          onClick={() => handleOpenCriteria(ideathon)}
                          sx={{
                            mb: 1.5,
                            p: 1.5,
                            borderRadius: 2,
                            border: `1px solid ${criteria.length > 0 ? alpha(theme.palette.secondary.main, 0.25) : alpha(theme.palette.grey[400], 0.3)}`,
                            bgcolor: criteria.length > 0 ? alpha(theme.palette.secondary.main, 0.04) : alpha(theme.palette.grey[100], 0.5),
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              borderColor: theme.palette.secondary.main,
                              bgcolor: alpha(theme.palette.secondary.main, 0.08),
                              transform: "translateY(-1px)",
                            },
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                              <IconListCheck size={15} color={criteria.length > 0 ? theme.palette.secondary.main : theme.palette.text.disabled} />
                              <Typography variant="caption" sx={{ fontWeight: 600, color: criteria.length > 0 ? theme.palette.secondary.main : "text.secondary" }}>
                                {criteria.length > 0 ? `${criteria.length} Kriter` : "Kriter Tanimlanmamis"}
                              </Typography>
                            </Box>
                            {criteria.length > 0 && (
                              <Chip
                                icon={<IconStarFilled size={10} />}
                                label={`${total} Puan`}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  bgcolor: alpha(theme.palette.secondary.main, 0.12),
                                  color: theme.palette.secondary.main,
                                  "& .MuiChip-icon": { color: theme.palette.secondary.main },
                                }}
                              />
                            )}
                          </Box>
                          {criteria.length > 0 && (
                            <Box sx={{ mt: 0.75, display: "flex", gap: 0.4, flexWrap: "wrap" }}>
                              {criteria.slice(0, 4).map((c, i) => (
                                <Chip
                                  key={i}
                                  label={`${c.name?.substring(0, 18)}${c.name?.length > 18 ? "..." : ""} (${c.maxScore})`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 18, fontSize: "0.6rem", borderRadius: 1 }}
                                />
                              ))}
                              {criteria.length > 4 && (
                                <Chip
                                  label={`+${criteria.length - 4}`}
                                  size="small"
                                  sx={{ height: 18, fontSize: "0.6rem", borderRadius: 1, bgcolor: alpha(theme.palette.text.primary, 0.06) }}
                                />
                              )}
                            </Box>
                          )}
                          {criteria.length === 0 && (
                            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25, display: "block", fontSize: "0.65rem" }}>
                              Tiklayarak degerlendirme kriterleri ekleyin
                            </Typography>
                          )}
                        </Box>
                      );
                    })()}

                    {/* Aksiyonlar */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Detay">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDetail(ideathon)}
                            sx={{
                              color: "text.secondary",
                              "&:hover": { bgcolor: "primary.light", color: "primary.main" },
                            }}
                          >
                            <IconEye size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Duzenle">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(ideathon)}
                            sx={{
                              color: "text.secondary",
                              "&:hover": { bgcolor: "warning.light", color: "warning.main" },
                            }}
                          >
                            <IconEdit size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedIdeathon(ideathon);
                              setOpenDeleteModal(true);
                            }}
                            sx={{
                              color: "text.secondary",
                              "&:hover": { bgcolor: "error.light", color: "error.main" },
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
            );
          })}
        </Grid>

        {/* Bos durum */}
        {ideathons.length === 0 && !loading && (
          <Paper
            elevation={0}
            sx={{
              textAlign: "center",
              py: 8,
              px: 3,
              borderRadius: 3,
              border: `1px dashed ${theme.palette.divider}`,
              bgcolor: theme.palette.action.hover,
            }}
          >
            <IconBuildingSkyscraper size={56} color={theme.palette.text.disabled} style={{ marginBottom: 16 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
              Henuz ideathon bulunmuyor
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
              Ilk ideathon'unuzu olusturarak baslayabilirsiniz.
            </Typography>
            <Button
              variant="contained"
              startIcon={<IconPlus size={18} />}
              onClick={handleOpenCreate}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": { boxShadow: "none" },
              }}
            >
              Ideathon Olustur
            </Button>
          </Paper>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Pagination
              count={pagination.totalPages}
              page={currentPage}
              onChange={(_, p) => setCurrentPage(p)}
              color="primary"
              size="large"
            />
          </Box>
        )}

        {/* ═══ CREATE / EDIT MODAL ═══ */}
        <Dialog
          open={openFormModal}
          onClose={() => setOpenFormModal(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
            {editingId ? "Ideathon Duzenle" : "Yeni Ideathon Olustur"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Temel Bilgiler */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ad *"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: editingId ? prev.slug : generateSlug(name),
                    }));
                  }}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Slug *"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  error={!!formErrors.slug}
                  helperText={formErrors.slug || "Kucuk harf, rakam ve tire"}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Aciklama"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={2}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Durum</InputLabel>
                  <Select
                    value={formData.status}
                    label="Durum"
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="draft">Taslak</MenuItem>
                    <MenuItem value="active">Aktif</MenuItem>
                    <MenuItem value="completed">Tamamlandi</MenuItem>
                    <MenuItem value="archived">Arsiv</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Tip</InputLabel>
                  <Select
                    value={formData.type || "standard"}
                    label="Tip"
                    onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="standard">Standart (Tam Akis)</MenuItem>
                    <MenuItem value="evaluation_only">Sadece Degerlendirme (DemoDay)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Baslangic Tarihi"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Bitis Tarihi"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>

              {/* Ozellik Kontrolleri */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: "flex", alignItems: "center", gap: 0.75 }}>
                  <IconSettings size={16} />
                  Ozellik Kontrolleri
                </Typography>
              </Grid>
              {toggleFields.map(({ key, label, icon: Icon }) => (
                <Grid item xs={6} sm={4} key={key}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData[key]}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                        color="success"
                        size="small"
                      />
                    }
                    label={
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Icon size={15} />
                        <Typography variant="body2" sx={{ fontSize: "0.82rem" }}>{label}</Typography>
                      </Stack>
                    }
                  />
                </Grid>
              ))}

              {/* Asamalar */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: "flex", alignItems: "center", gap: 0.75 }}>
                  <IconCalendar size={16} />
                  Asamalar
                </Typography>
              </Grid>
              {[
                { label: "Basvuru Baslangic", key: "applicationStart" },
                { label: "Basvuru Bitis", key: "applicationEnd" },
                { label: "Degerlendirme Baslangic", key: "evaluationStart" },
                { label: "Degerlendirme Bitis", key: "evaluationEnd" },
                { label: "Mentorluk Baslangic", key: "mentorshipStart" },
                { label: "Mentorluk Bitis", key: "mentorshipEnd" },
                { label: "Final Baslangic", key: "finalStart" },
                { label: "Final Bitis", key: "finalEnd" },
              ].map(({ label, key }) => (
                <Grid item xs={6} sm={3} key={key}>
                  <TextField
                    fullWidth
                    label={label}
                    type="date"
                    value={formData.phases[key]}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phases: { ...prev.phases, [key]: e.target.value },
                      }))
                    }
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>
              ))}

              {/* Ayarlar */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Ayarlar
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Max Takim Boyutu"
                  type="number"
                  value={formData.settings.maxTeamSize}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, maxTeamSize: parseInt(e.target.value) || 0 },
                    }))
                  }
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Max Basvuru (0=sinirsiz)"
                  type="number"
                  value={formData.settings.maxApplications}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, maxApplications: parseInt(e.target.value) || 0 },
                    }))
                  }
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.settings.allowPublicRegistration}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, allowPublicRegistration: e.target.checked },
                        }))
                      }
                      size="small"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontSize: "0.82rem" }}>Public Kayit</Typography>}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.settings.requireTeam}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, requireTeam: e.target.checked },
                        }))
                      }
                      size="small"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontSize: "0.82rem" }}>Takim Zorunlu</Typography>}
                />
              </Grid>

              {/* Degerlendirme Kriterleri — bilgi notu */}
              {editingId && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Alert
                    severity="info"
                    icon={<IconListCheck size={18} />}
                    sx={{ borderRadius: 2 }}
                    action={
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setOpenFormModal(false);
                          const idt = ideathons.find((i) => i._id === editingId);
                          if (idt) handleOpenCriteria(idt);
                        }}
                        sx={{ textTransform: "none", borderRadius: 2, fontSize: "0.78rem", whiteSpace: "nowrap" }}
                      >
                        Kriterleri Yonet
                      </Button>
                    }
                  >
                    Degerlendirme kriterlerini ideathon kartindaki ozel panelden yonetebilirsiniz.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button
              onClick={() => setOpenFormModal(false)}
              variant="outlined"
              sx={{ borderRadius: 2, px: 3, textTransform: "none" }}
            >
              Iptal
            </Button>
            <Button
              onClick={handleFormSubmit}
              variant="contained"
              disabled={loading}
              sx={{
                borderRadius: 2,
                px: 3,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": { boxShadow: "none" },
              }}
            >
              {editingId ? "Guncelle" : "Olustur"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ═══ DELETE MODAL ═══ */}
        <Dialog
          open={openDeleteModal}
          onClose={() => setOpenDeleteModal(false)}
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ pb: 1, fontWeight: 600, color: "error.main" }}>
            Ideathon Sil
          </DialogTitle>
          <DialogContent>
            <Typography>
              <strong>{selectedIdeathon?.name}</strong> ideathon'unu silmek istediginizden emin misiniz?
            </Typography>
            <Alert severity="warning" sx={{ mt: 2 }}>
              Aktif kullanici atamasi varsa silme islemi engellenecektir.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setOpenDeleteModal(false)} variant="outlined" sx={{ borderRadius: 2, textTransform: "none" }}>
              Iptal
            </Button>
            <Button onClick={handleDeleteConfirm} variant="contained" color="error" sx={{ borderRadius: 2, textTransform: "none", boxShadow: "none" }}>
              Sil
            </Button>
          </DialogActions>
        </Dialog>

        {/* ═══ DETAIL MODAL ═══ */}
        <Dialog
          open={openDetailModal}
          onClose={() => setOpenDetailModal(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ pb: 0, fontWeight: 600 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconBuildingSkyscraper size={22} />
              {selectedIdeathon?.name}
              {selectedIdeathon && (
                <Chip
                  label={getStatus(selectedIdeathon.status).label}
                  size="small"
                  sx={{
                    bgcolor: getStatus(selectedIdeathon.status).bg,
                    color: getStatus(selectedIdeathon.status).color,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    height: 24,
                    ml: 1,
                  }}
                />
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}>
              <Tab label="Detaylar" sx={{ textTransform: "none" }} />
              <Tab label={`Atanmis Kullanicilar (${assignedUsers.length})`} sx={{ textTransform: "none" }} />
            </Tabs>

            {/* Tab 0: Detaylar */}
            {detailTab === 0 && selectedIdeathon && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Slug</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedIdeathon.slug}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Durum</Typography>
                  <Box>
                    <Chip
                      label={getStatus(selectedIdeathon.status).label}
                      size="small"
                      sx={{
                        bgcolor: getStatus(selectedIdeathon.status).bg,
                        color: getStatus(selectedIdeathon.status).color,
                        fontWeight: 600,
                        mt: 0.5,
                      }}
                    />
                  </Box>
                </Grid>
                {selectedIdeathon.description && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Aciklama</Typography>
                    <Typography variant="body2">{selectedIdeathon.description}</Typography>
                  </Grid>
                )}
                {selectedIdeathon.startDate && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Baslangic</Typography>
                    <Typography variant="body2">{moment(selectedIdeathon.startDate).format("DD MMM YYYY")}</Typography>
                  </Grid>
                )}
                {selectedIdeathon.endDate && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Bitis</Typography>
                    <Typography variant="body2">{moment(selectedIdeathon.endDate).format("DD MMM YYYY")}</Typography>
                  </Grid>
                )}

                {/* Ozellik Durumlari */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: "flex", alignItems: "center", gap: 0.75 }}>
                    <IconSettings size={16} />
                    Ozellik Kontrolleri
                  </Typography>
                </Grid>
                {toggleFields.map(({ key, label, icon: Icon }) => {
                  const isOpen = selectedIdeathon[key] !== false;
                  return (
                    <Grid item xs={6} sm={4} key={key}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: `1px solid ${isOpen ? "#51CF6640" : theme.palette.divider}`,
                          bgcolor: isOpen ? "#51CF6608" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Icon size={16} color={isOpen ? "#51CF66" : "#ADB5BD"} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                            {label}
                          </Typography>
                        </Box>
                        <Chip
                          label={isOpen ? "Acik" : "Kapali"}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            bgcolor: isOpen ? "#51CF6620" : "#ADB5BD20",
                            color: isOpen ? "#51CF66" : "#ADB5BD",
                          }}
                        />
                      </Paper>
                    </Grid>
                  );
                })}

                {/* Asamalar */}
                {selectedIdeathon.phases && Object.keys(selectedIdeathon.phases).some((k) => selectedIdeathon.phases[k]) && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Asamalar</Typography>
                    </Grid>
                    {[
                      { label: "Basvuru", start: "applicationStart", end: "applicationEnd" },
                      { label: "Degerlendirme", start: "evaluationStart", end: "evaluationEnd" },
                      { label: "Mentorluk", start: "mentorshipStart", end: "mentorshipEnd" },
                      { label: "Final", start: "finalStart", end: "finalEnd" },
                    ].map(({ label, start, end }) => (
                      (selectedIdeathon.phases[start] || selectedIdeathon.phases[end]) && (
                        <Grid item xs={6} sm={3} key={start}>
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="body2">
                            {selectedIdeathon.phases[start] ? moment(selectedIdeathon.phases[start]).format("DD.MM") : "\u2014"}
                            {" \u2014 "}
                            {selectedIdeathon.phases[end] ? moment(selectedIdeathon.phases[end]).format("DD.MM") : "\u2014"}
                          </Typography>
                        </Grid>
                      )
                    ))}
                  </>
                )}

                {/* Ayarlar */}
                {selectedIdeathon.settings && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Ayarlar</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Max Takim</Typography>
                      <Typography variant="body2">{selectedIdeathon.settings.maxTeamSize}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Max Basvuru</Typography>
                      <Typography variant="body2">{selectedIdeathon.settings.maxApplications || "Sinirsiz"}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Public Kayit</Typography>
                      <Typography variant="body2">{selectedIdeathon.settings.allowPublicRegistration ? "Evet" : "Hayir"}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Takim Zorunlu</Typography>
                      <Typography variant="body2">{selectedIdeathon.settings.requireTeam ? "Evet" : "Hayir"}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            )}

            {/* Tab 1: Atanmis Kullanicilar */}
            {detailTab === 1 && (
              <Box>
                {assignedUsers.length > 0 ? (
                  <Box>
                    {assignedUsers.map((assignment, idx) => (
                      <Paper
                        key={assignment._id || idx}
                        elevation={0}
                        sx={{
                          p: 2,
                          mb: 1,
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {assignment.userId?.name || "\u2014"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {assignment.userId?.email || "\u2014"}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Chip
                            label={assignment.role === "juri" ? "Juri" : assignment.role === "mentor" ? "Mentor" : assignment.role}
                            size="small"
                            color={assignment.role === "juri" ? "primary" : "secondary"}
                            sx={{ height: 24, fontSize: "0.7rem" }}
                          />
                          <Chip
                            label={assignment.isActive ? "Aktif" : "Pasif"}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: "0.7rem",
                              bgcolor: assignment.isActive ? "#51CF6620" : "#FF6B6B20",
                              color: assignment.isActive ? "#51CF66" : "#FF6B6B",
                            }}
                          />
                          <Tooltip title="Atamayi Kaldir">
                            <IconButton
                              size="small"
                              onClick={() => handleUnassign(assignment)}
                              sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
                            >
                              <IconUserMinus size={15} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Bu ideathon'a henuz kullanici atanmamis.
                  </Alert>
                )}

                {/* Atama Formu */}
                <Divider sx={{ my: 2 }} />
                {!showAssignForm ? (
                  <Button
                    variant="outlined"
                    startIcon={<IconUserPlus size={16} />}
                    onClick={() => setShowAssignForm(true)}
                    sx={{ borderRadius: 2, textTransform: "none" }}
                  >
                    Kullanici Ata
                  </Button>
                ) : (
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                      Yeni Kullanici Atama
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={5}>
                        <TextField
                          fullWidth
                          label="Kullanici ID"
                          value={assignForm.userId}
                          onChange={(e) => setAssignForm((prev) => ({ ...prev, userId: e.target.value }))}
                          size="small"
                          placeholder="Kullanici ObjectId"
                          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Rol</InputLabel>
                          <Select
                            value={assignForm.role}
                            label="Rol"
                            onChange={(e) => setAssignForm((prev) => ({ ...prev, role: e.target.value }))}
                            sx={{ borderRadius: 2 }}
                          >
                            <MenuItem value="juri">Juri</MenuItem>
                            <MenuItem value="mentor">Mentor</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={handleAssignSubmit}
                          disabled={loading}
                          sx={{ borderRadius: 2, textTransform: "none", boxShadow: "none" }}
                        >
                          Ata
                        </Button>
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={() => setShowAssignForm(false)}
                          sx={{ borderRadius: 2, textTransform: "none" }}
                        >
                          Iptal
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button
              onClick={() => {
                if (selectedIdeathon) handleOpenEdit(selectedIdeathon);
                setOpenDetailModal(false);
              }}
              variant="outlined"
              startIcon={<IconEdit size={16} />}
              sx={{ borderRadius: 2, px: 3, textTransform: "none" }}
            >
              Duzenle
            </Button>
            <Button
              onClick={() => setOpenDetailModal(false)}
              variant="contained"
              sx={{ borderRadius: 2, px: 3, textTransform: "none", boxShadow: "none", "&:hover": { boxShadow: "none" } }}
            >
              Kapat
            </Button>
          </DialogActions>
        </Dialog>

        {/* ═══ CRITERIA MANAGEMENT MODAL ═══ */}
        <Dialog
          open={openCriteriaModal}
          onClose={handleCloseCriteria}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              overflow: "hidden",
              maxHeight: "90vh",
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
              color: "#fff",
              px: 3,
              py: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconListCheck size={24} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  Degerlendirme Kriterleri
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  {criteriaIdeathon?.name}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseCriteria} sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { color: "#fff" } }}>
              <IconX size={20} />
            </IconButton>
          </Box>

          {/* Score Summary Bar */}
          <Box
            sx={{
              px: 3,
              py: 1.5,
              bgcolor: alpha(theme.palette.secondary.main, 0.04),
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                    Toplam Puan
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                    {criteriaTotalScore} Puan
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((criteriaTotalScore / Math.max(criteriaTotalScore, 100)) * 100, 100)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 3,
                      bgcolor: theme.palette.secondary.main,
                    },
                  }}
                />
              </Box>
              <Chip
                label={`${criteriaList.length} Kriter`}
                size="small"
                sx={{
                  height: 28,
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  color: theme.palette.secondary.main,
                }}
              />
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<IconPlus size={16} />}
              onClick={handleAddCriterion}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.82rem",
                px: 2,
                bgcolor: theme.palette.secondary.main,
                "&:hover": { bgcolor: theme.palette.secondary.dark },
                boxShadow: "none",
              }}
            >
              Kriter Ekle
            </Button>
          </Box>

          {/* Criteria List */}
          <DialogContent sx={{ px: 3, py: 2 }}>
            {criteriaList.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  borderRadius: 3,
                  border: `2px dashed ${alpha(theme.palette.secondary.main, 0.2)}`,
                  bgcolor: alpha(theme.palette.secondary.main, 0.02),
                }}
              >
                <IconListCheck size={48} color={theme.palette.text.disabled} style={{ marginBottom: 12 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Henuz kriter yok
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mb: 3, maxWidth: 360, mx: "auto" }}>
                  Jurinin takimlari degerlendirmesi icin kriterler ekleyin. Her kriter soru adi, max puan ve degerlendirme maddelerinden olusur.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<IconPlus size={18} />}
                  onClick={handleAddCriterion}
                  sx={{
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    bgcolor: theme.palette.secondary.main,
                    "&:hover": { bgcolor: theme.palette.secondary.dark },
                    boxShadow: "none",
                  }}
                >
                  Ilk Kriteri Ekle
                </Button>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {criteriaList.map((criterion, cIdx) => {
                  const isExpanded = expandedCriterion === cIdx;
                  const scorePercent = criteriaTotalScore > 0 ? ((parseInt(criterion.maxScore) || 0) / criteriaTotalScore) * 100 : 0;
                  return (
                    <Paper
                      key={cIdx}
                      elevation={0}
                      sx={{
                        borderRadius: 2.5,
                        border: `1px solid ${isExpanded ? alpha(theme.palette.secondary.main, 0.4) : theme.palette.divider}`,
                        bgcolor: isExpanded ? alpha(theme.palette.secondary.main, 0.02) : "transparent",
                        overflow: "hidden",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* Criterion Header — always visible */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          px: 2,
                          py: 1.5,
                          cursor: "pointer",
                          "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.04) },
                        }}
                        onClick={() => setExpandedCriterion(isExpanded ? null : cIdx)}
                      >
                        {/* Reorder + Number */}
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mr: 0.5 }}>
                          <IconButton
                            size="small"
                            disabled={cIdx === 0}
                            onClick={(e) => { e.stopPropagation(); handleMoveCriterion(cIdx, -1); }}
                            sx={{ width: 20, height: 20, color: "text.disabled", "&:hover": { color: "text.primary" } }}
                          >
                            <IconChevronUp size={14} />
                          </IconButton>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.secondary.main, fontSize: "0.72rem", lineHeight: 1 }}>
                            {cIdx + 1}
                          </Typography>
                          <IconButton
                            size="small"
                            disabled={cIdx === criteriaList.length - 1}
                            onClick={(e) => { e.stopPropagation(); handleMoveCriterion(cIdx, 1); }}
                            sx={{ width: 20, height: 20, color: "text.disabled", "&:hover": { color: "text.primary" } }}
                          >
                            <IconChevronDown size={14} />
                          </IconButton>
                        </Box>

                        {/* Name + Key */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
                            {criterion.name || "Isimsiz Kriter"}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.68rem" }}>
                            {criterion.key || "—"} · {(criterion.evaluationPoints || []).filter((p) => p.trim()).length} madde
                          </Typography>
                        </Box>

                        {/* Score Chip */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <Box sx={{ width: 50 }}>
                            <LinearProgress
                              variant="determinate"
                              value={scorePercent}
                              sx={{
                                height: 4,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                "& .MuiLinearProgress-bar": { borderRadius: 2, bgcolor: theme.palette.secondary.main },
                              }}
                            />
                          </Box>
                          <Chip
                            label={`${criterion.maxScore || 0}`}
                            size="small"
                            sx={{
                              height: 24,
                              minWidth: 40,
                              fontWeight: 700,
                              fontSize: "0.78rem",
                              bgcolor: alpha(theme.palette.secondary.main, 0.1),
                              color: theme.palette.secondary.main,
                            }}
                          />
                        </Box>

                        {/* Expand icon */}
                        {isExpanded ? <IconChevronUp size={18} color={theme.palette.text.secondary} /> : <IconChevronDown size={18} color={theme.palette.text.secondary} />}
                      </Box>

                      {/* Expanded Content */}
                      <Collapse in={isExpanded}>
                        <Box sx={{ px: 2, pb: 2 }}>
                          <Divider sx={{ mb: 2 }} />

                          {/* Criterion Fields */}
                          <Grid container spacing={1.5} sx={{ mb: 2 }}>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Anahtar (key)"
                                value={criterion.key}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
                                  handleCriterionChange(cIdx, "key", val);
                                }}
                                size="small"
                                placeholder="problemDefinition"
                                helperText="Benzersiz, ingilizce"
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={5}>
                              <TextField
                                fullWidth
                                label="Kriter Adi"
                                value={criterion.name}
                                onChange={(e) => handleCriterionChange(cIdx, "name", e.target.value)}
                                size="small"
                                placeholder="Problem Tanimi ve Ihtiyac Analizi"
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <TextField
                                fullWidth
                                label="Max Puan"
                                type="number"
                                value={criterion.maxScore}
                                onChange={(e) => handleCriterionChange(cIdx, "maxScore", parseInt(e.target.value) || 0)}
                                size="small"
                                inputProps={{ min: 1 }}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <IconStarFilled size={14} color={theme.palette.secondary.main} />
                                    </InputAdornment>
                                  ),
                                }}
                                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                              />
                            </Grid>
                          </Grid>

                          {/* Evaluation Points */}
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.background.default, 0.6),
                              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: 0.5 }}>
                                Degerlendirme Maddeleri
                              </Typography>
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                                {(criterion.evaluationPoints || []).filter((p) => p.trim()).length} madde
                              </Typography>
                            </Box>
                            <Stack spacing={0.75}>
                              {(criterion.evaluationPoints || []).map((point, pIdx) => (
                                <Box key={pIdx} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                  <Box
                                    sx={{
                                      width: 22,
                                      height: 22,
                                      borderRadius: "50%",
                                      bgcolor: alpha(theme.palette.secondary.main, 0.08),
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Typography variant="caption" sx={{ fontSize: "0.62rem", fontWeight: 700, color: theme.palette.secondary.main }}>
                                      {pIdx + 1}
                                    </Typography>
                                  </Box>
                                  <TextField
                                    fullWidth
                                    value={point}
                                    onChange={(e) => handlePointChange(cIdx, pIdx, e.target.value)}
                                    size="small"
                                    placeholder={`Degerlendirme maddesi ${pIdx + 1}`}
                                    sx={{
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                        bgcolor: "background.paper",
                                        fontSize: "0.85rem",
                                      },
                                      "& .MuiOutlinedInput-input": { py: 0.8 },
                                    }}
                                  />
                                  <Tooltip title="Maddeyi kaldir">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRemovePoint(cIdx, pIdx)}
                                      disabled={(criterion.evaluationPoints || []).length <= 1}
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        color: "text.disabled",
                                        "&:hover": { color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.08) },
                                      }}
                                    >
                                      <IconX size={14} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ))}
                            </Stack>
                            <Button
                              size="small"
                              startIcon={<IconPlus size={14} />}
                              onClick={() => handleAddPoint(cIdx)}
                              sx={{
                                mt: 1,
                                textTransform: "none",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                color: theme.palette.secondary.main,
                                borderRadius: 2,
                                "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.08) },
                              }}
                            >
                              Madde Ekle
                            </Button>
                          </Box>

                          {/* Criterion Actions */}
                          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.75, mt: 1.5 }}>
                            <Tooltip title="Kopyala">
                              <IconButton
                                size="small"
                                onClick={() => handleDuplicateCriterion(cIdx)}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  color: "text.secondary",
                                  "&:hover": { color: theme.palette.info.main, bgcolor: alpha(theme.palette.info.main, 0.08) },
                                }}
                              >
                                <IconCopy size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Kriteri sil">
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveCriterion(cIdx)}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  color: "text.secondary",
                                  "&:hover": { color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.08) },
                                }}
                              >
                                <IconTrash size={16} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Collapse>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </DialogContent>

          {/* Footer */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: alpha(theme.palette.background.default, 0.5),
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {criteriaList.filter((c) => c.key?.trim() && c.name?.trim()).length} gecerli kriter · {criteriaTotalScore} toplam puan
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                onClick={handleCloseCriteria}
                variant="text"
                sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 500, color: "text.secondary" }}
              >
                Iptal
              </Button>
              <Button
                onClick={handleSaveCriteria}
                variant="contained"
                disabled={criteriaSaving}
                startIcon={criteriaSaving ? <CircularProgress size={16} color="inherit" /> : <IconCheck size={18} />}
                sx={{
                  borderRadius: 2.5,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  bgcolor: theme.palette.secondary.main,
                  "&:hover": { bgcolor: theme.palette.secondary.dark },
                  boxShadow: "none",
                }}
              >
                {criteriaSaving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </Stack>
          </Box>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default IdeathonManagement;
