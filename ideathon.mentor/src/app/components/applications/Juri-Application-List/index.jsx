"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Stack,
  Typography,
  Button,
  Avatar,
  Chip,
  Grid,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
} from "@mui/material";
import {
  IconSearch,
  IconEye,
  IconClipboardCheck,
  IconFilter,
  IconX,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import moment from "moment";
import "moment/locale/tr";
import axios from "@/utils/axios";

moment.locale("tr");

const JuriApplicationList = () => {
  const router = useRouter();
  const [allApplications, setAllApplications] = useState([]); // Tüm başvurular
  const [loading, setLoading] = useState(true);
  
  // LocalStorage'dan filtreleri yükle
  const getStoredValue = (key, defaultValue) => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`juriFilters_${key}`);
      return stored !== null ? stored : defaultValue;
    }
    return defaultValue;
  };

  const [searchTerm, setSearchTerm] = useState(() => getStoredValue('searchTerm', ''));
  const [selectedStatus, setSelectedStatus] = useState(() => getStoredValue('selectedStatus', 'all'));
  const [selectedParticipantType, setSelectedParticipantType] = useState(() => getStoredValue('selectedParticipantType', 'all'));
  const [selectedApplicationType, setSelectedApplicationType] = useState(() => getStoredValue('selectedApplicationType', 'all'));
  const [presentationFilter, setPresentationFilter] = useState(() => getStoredValue('presentationFilter', 'all'));
  const [evaluationFilter, setEvaluationFilter] = useState(() => getStoredValue('evaluationFilter', 'all'));
  const [decisionFilter, setDecisionFilter] = useState(() => getStoredValue('decisionFilter', 'all')); // all, approved, rejected, undecided
  const [currentPage, setCurrentPage] = useState(() => {
    const stored = getStoredValue('currentPage', '1');
    return parseInt(stored, 10);
  });
  const [sortBy, setSortBy] = useState(() => getStoredValue('sortBy', '-createdAt'));
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const stored = getStoredValue('itemsPerPage', '12');
    return parseInt(stored, 10);
  });

  // Filtreleri localStorage'a kaydet
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('juriFilters_searchTerm', searchTerm);
      localStorage.setItem('juriFilters_selectedStatus', selectedStatus);
      localStorage.setItem('juriFilters_selectedParticipantType', selectedParticipantType);
      localStorage.setItem('juriFilters_selectedApplicationType', selectedApplicationType);
      localStorage.setItem('juriFilters_presentationFilter', presentationFilter);
      localStorage.setItem('juriFilters_evaluationFilter', evaluationFilter);
      localStorage.setItem('juriFilters_decisionFilter', decisionFilter);
      localStorage.setItem('juriFilters_currentPage', currentPage.toString());
      localStorage.setItem('juriFilters_sortBy', sortBy);
      localStorage.setItem('juriFilters_itemsPerPage', itemsPerPage.toString());
    }
  }, [searchTerm, selectedStatus, selectedParticipantType, selectedApplicationType, 
      presentationFilter, evaluationFilter, decisionFilter, currentPage, sortBy, itemsPerPage]);

  useEffect(() => {
    loadApplications();
  }, [searchTerm, selectedStatus, selectedParticipantType, sortBy]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const params = {
        page: 1,
        limit: 1000, // Tüm başvuruları al
        sort: sortBy,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (selectedParticipantType !== "all") params.participantType = selectedParticipantType;

      const response = await axios.get("/applications/juri/list", { params });

      if (response.data.success) {
        setAllApplications(response.data.data || []);
      } else {
        toast.error("Başvurular yüklenirken hata oluştu");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Başvurular yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Frontend'de filtreleme ve sıralama
  const filteredApplications = allApplications
    .filter((app) => {
      // Değerlendirme filtresi
      if (evaluationFilter === "evaluated" && !app.myPreEvaluation) return false;
      if (evaluationFilter === "not_evaluated" && app.myPreEvaluation) return false;
      
      // Karar filtresi (Onayladıklarım, Reddetiklerim, Kararsızlarım)
      if (decisionFilter !== "all") {
        if (decisionFilter === "approved" && app.myPreEvaluation?.decision !== "approve") return false;
        if (decisionFilter === "rejected" && app.myPreEvaluation?.decision !== "reject") return false;
        if (decisionFilter === "undecided" && app.myPreEvaluation?.decision !== "undecided") return false;
      }
      
      // Başvuru Tipi filtresi (Takımlı/Bireysel)
      if (selectedApplicationType === "team" && app.applicationType !== "team") return false;
      if (selectedApplicationType === "individual" && app.applicationType !== "individual") return false;
      
      // Sunum durumu filtresi
      const hasPresentation = app.presentationInfo?.presentationFile ? true : false;
      if (presentationFilter === "with_presentation" && !hasPresentation) return false;
      if (presentationFilter === "without_presentation" && hasPresentation) return false;
      
      return true;
    })
    .sort((a, b) => {
      // Tümünü gösterirken: önce değerlendirmediklerim sonra değerlendirdiklerim
      if (evaluationFilter === "all") {
        if (!a.myPreEvaluation && b.myPreEvaluation) return -1; // a değerlendirilmemiş, b değerlendirilmiş → a önce
        if (a.myPreEvaluation && !b.myPreEvaluation) return 1;  // a değerlendirilmiş, b değerlendirilmemiş → b önce
      }
      return 0;
    });

  // Sayıları hesapla
  const totalCount = allApplications.length;
  const evaluatedCount = allApplications.filter(app => app.myPreEvaluation !== null).length;
  const notEvaluatedCount = allApplications.filter(app => app.myPreEvaluation === null).length;
  
  // Karar sayıları
  const approvedCount = allApplications.filter(app => app.myPreEvaluation?.decision === "approve").length;
  const rejectedCount = allApplications.filter(app => app.myPreEvaluation?.decision === "reject").length;
  const undecidedCount = allApplications.filter(app => app.myPreEvaluation?.decision === "undecided").length;
  
  // Sunum sayıları
  const withPresentationCount = allApplications.filter(app => app.presentationInfo?.presentationFile).length;
  const withoutPresentationCount = allApplications.filter(app => !app.presentationInfo?.presentationFile).length;
  
  // Başvuru tipi sayıları
  const teamApplicationsCount = allApplications.filter(app => app.applicationType === "team").length;
  const individualApplicationsCount = allApplications.filter(app => app.applicationType === "individual").length;

  // Sayfalama için
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

  const handleViewDetail = (applicationId) => {
    router.push(`/applications/${applicationId}/detail`);
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

  const getMyPreEvaluationBadge = (app) => {
    if (!app.hasMyPreEvaluation) return null;

    const decision = app.myPreEvaluation?.decision;
    let color = "default";
    let label = "Değerlendirdin";

    if (decision === "approve") {
      color = "success";
      label = "✓ Onayladın";
    } else if (decision === "reject") {
      color = "error";
      label = "✗ Reddettin";
    } else if (decision === "undecided") {
      color = "warning";
      label = "Kararsız";
    }

    return <Chip label={label} color={color} size="small" sx={{ fontWeight: 600 }} />;
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedParticipantType("all");
    setSelectedApplicationType("all");
    setPresentationFilter("all");
    setEvaluationFilter("all");
    setDecisionFilter("all");
    setSortBy("-createdAt");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || selectedStatus !== "all" || selectedParticipantType !== "all" || selectedApplicationType !== "all" || presentationFilter !== "all" || evaluationFilter !== "all" || decisionFilter !== "all" || sortBy !== "-createdAt";

  const handleApplyFilters = () => {
    setOpenFilterDialog(false);
    setCurrentPage(1);
  };

  return (
    <Box>
      {/* Üst Kontrol Bölümü - Revize */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 2 }}>
        <CardContent sx={{ py: 2, px: 3 }}>
          <Stack spacing={2}>
            {/* Başlık ve Ana Butonlar */}
            <Stack 
              direction={{ xs: "column", sm: "row" }} 
              justifyContent="space-between" 
              alignItems={{ xs: "stretch", sm: "center" }}
              spacing={2}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Ön Değerlendirme
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {evaluationFilter === "all" && `Toplam ${filteredApplications.length} başvuru`}
                  {evaluationFilter === "evaluated" && `${filteredApplications.length} başvuru değerlendirildi`}
                  {evaluationFilter === "not_evaluated" && `${filteredApplications.length} başvuru değerlendirilmedi`}
                </Typography>
              </Box>

              {/* Sağ Taraf Butonlar */}
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1 }}>
                {hasActiveFilters && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<IconX size={16} />}
                    onClick={handleClearFilters}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    Temizle
                  </Button>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<IconFilter size={18} />}
                  onClick={() => setOpenFilterDialog(true)}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  Filtreler
                </Button>
              </Stack>
            </Stack>

            {/* Arama ve Değerlendirme Butonları */}
            <Stack 
              direction={{ xs: "column", md: "row" }} 
              spacing={2} 
              alignItems="stretch"
            >
              {/* Arama */}
              <TextField
                fullWidth
                size="small"
                placeholder="İsim, email veya başvuru no ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={18} />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1 }}
              />

              {/* Değerlendirme Butonları */}
              <Stack direction="row" spacing={1.5} sx={{ minWidth: { md: "auto" }, flexWrap: "wrap", gap: 1.5 }}>
                <Button
                  variant={evaluationFilter === "all" ? "contained" : "outlined"}
                  size="small"
                  onClick={() => {
                    setEvaluationFilter("all");
                    setCurrentPage(1);
                  }}
                  sx={{ 
                    minWidth: { xs: "auto", sm: "100px" },
                    whiteSpace: "nowrap",
                    px: 2
                  }}
                >
                  Tümü ({totalCount})
                </Button>

                <Button
                  variant={evaluationFilter === "evaluated" ? "contained" : "outlined"}
                  color={evaluationFilter === "evaluated" ? "success" : "inherit"}
                  size="small"
                  startIcon={<IconCircleCheck size={16} />}
                  onClick={() => {
                    setEvaluationFilter("evaluated");
                    setCurrentPage(1);
                  }}
                  sx={{ 
                    minWidth: { xs: "auto", sm: "180px" },
                    whiteSpace: "nowrap",
                    px: 2
                  }}
                >
                  Değerlendirdiklerim ({evaluatedCount})
                </Button>

                <Button
                  variant={evaluationFilter === "not_evaluated" ? "contained" : "outlined"}
                  color={evaluationFilter === "not_evaluated" ? "warning" : "inherit"}
                  size="small"
                  startIcon={<IconCircleX size={16} />}
                  onClick={() => {
                    setEvaluationFilter("not_evaluated");
                    setCurrentPage(1);
                  }}
                  sx={{ 
                    minWidth: { xs: "auto", sm: "200px" },
                    whiteSpace: "nowrap",
                    px: 2
                  }}
                >
                  Değerlendirmediklerim ({notEvaluatedCount})
                </Button>
              </Stack>
            </Stack>

            {/* Sunum ve Başvuru Tipi İstatistikleri */}
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: "primary.lighter", 
                borderRadius: 2,
                border: "1px solid",
                borderColor: "primary.main"
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Takımlı Başvurular
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>
                      {teamApplicationsCount}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Bireysel Başvurular
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "info.main" }}>
                      {individualApplicationsCount}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Sunumlu Başvurular
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "success.main" }}>
                      {withPresentationCount}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Sunumsuz Başvurular
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "error.main" }}>
                      {withoutPresentationCount}
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Filtreler Modal */}
      <Dialog 
        open={openFilterDialog} 
        onClose={() => setOpenFilterDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconFilter size={24} />
            <Typography variant="h6">Filtreler</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            {/* Başvuru Tipi Filtresi (Takımlı/Bireysel) */}
            <FormControl fullWidth>
              <InputLabel>Başvuru Tipi</InputLabel>
              <Select
                value={selectedApplicationType}
                label="Başvuru Tipi"
                onChange={(e) => setSelectedApplicationType(e.target.value)}
              >
                <MenuItem value="all">Tümü ({totalCount})</MenuItem>
                <MenuItem value="team">Takımlı ({teamApplicationsCount})</MenuItem>
                <MenuItem value="individual">Bireysel ({individualApplicationsCount})</MenuItem>
              </Select>
            </FormControl>

            {/* Sunum Durumu Filtresi */}
            <FormControl fullWidth>
              <InputLabel>Sunum Durumu</InputLabel>
              <Select
                value={presentationFilter}
                label="Sunum Durumu"
                onChange={(e) => setPresentationFilter(e.target.value)}
              >
                <MenuItem value="all">Tümü ({totalCount})</MenuItem>
                <MenuItem value="with_presentation">Sunum Yüklenmiş ({withPresentationCount})</MenuItem>
                <MenuItem value="without_presentation">Sunum Yüklenmemiş ({withoutPresentationCount})</MenuItem>
              </Select>
            </FormControl>

            {/* Ön Değerlendirme Kararı Filtresi */}
            <FormControl fullWidth>
              <InputLabel>Ön Değerlendirme Kararım</InputLabel>
              <Select
                value={decisionFilter}
                label="Ön Değerlendirme Kararım"
                onChange={(e) => setDecisionFilter(e.target.value)}
              >
                <MenuItem value="all">Tümü ({totalCount})</MenuItem>
                <MenuItem value="approved">✓ Onayladıklarım ({approvedCount})</MenuItem>
                <MenuItem value="rejected">✗ Reddetiklerim ({rejectedCount})</MenuItem>
                <MenuItem value="undecided">? Kararsızlarım ({undecidedCount})</MenuItem>
              </Select>
            </FormControl>

            {/* Durum Filtresi */}
            <FormControl fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select
                value={selectedStatus}
                label="Durum"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="pending">Bekliyor</MenuItem>
                <MenuItem value="under_review">İncelemede</MenuItem>
                <MenuItem value="approved">Onaylandı</MenuItem>
                <MenuItem value="rejected">Reddedildi</MenuItem>
              </Select>
            </FormControl>

            {/* Katılımcı Tipi */}
            <FormControl fullWidth>
              <InputLabel>Katılımcı Tipi</InputLabel>
              <Select
                value={selectedParticipantType}
                label="Katılımcı Tipi"
                onChange={(e) => setSelectedParticipantType(e.target.value)}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="student">Öğrenci</MenuItem>
                <MenuItem value="entrepreneur">Girişimci</MenuItem>
                <MenuItem value="employee">Çalışan</MenuItem>
                <MenuItem value="recent_graduate">Yeni Mezun</MenuItem>
                <MenuItem value="other">Diğer</MenuItem>
              </Select>
            </FormControl>

            {/* Sıralama */}
            <FormControl fullWidth>
              <InputLabel>Sıralama</InputLabel>
              <Select
                value={sortBy}
                label="Sıralama"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="-createdAt">En Yeni</MenuItem>
                <MenuItem value="createdAt">En Eski</MenuItem>
                <MenuItem value="personalInfo.firstName">İsim A-Z</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenFilterDialog(false)}>
            İptal
          </Button>
          <Button 
            variant="contained" 
            onClick={handleApplyFilters}
            startIcon={<IconFilter size={18} />}
          >
            Uygula
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Başvuru Kartları */}
      {!loading && paginatedApplications.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            Hiç başvuru bulunamadı.
          </Typography>
          {hasActiveFilters && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Filtreleri temizleyerek tüm başvuruları görüntüleyebilirsiniz.
            </Typography>
          )}
        </Alert>
      )}

      {!loading && paginatedApplications.length > 0 && (
        <>
          <Grid container spacing={3}>
            {paginatedApplications.map((app) => {
              const personalInfo = app.personalInfo || {};
              const fullName = `${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim();
              const initial = String(personalInfo.firstName || "?").charAt(0).toUpperCase();

              return (
                <Grid item xs={12} sm={6} lg={4} key={app._id}>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: "divider",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 6,
                        borderColor: "primary.main",
                      },
                    }}
                    onClick={() => handleViewDetail(app._id)}
                  >
                    <CardContent>
                      <Stack spacing={2}>
                        {/* Üst Kısım: Avatar + İsim */}
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            sx={{
                              bgcolor: "primary.main",
                              width: 56,
                              height: 56,
                              fontSize: "1.5rem",
                              fontWeight: 700,
                            }}
                          >
                            {initial}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                mb: 0.5,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {fullName || "-"}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {personalInfo.email || "-"}
                            </Typography>
                          </Box>
                        </Stack>

                        {/* Bilgiler */}
                        <Stack spacing={1.5}>
                          {/* Başvuru No ve Katılımcı Tipi */}
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", mb: 0.5 }}>
                              Başvuru No · {app.displayParticipantType || getParticipantTypeLabel(app.profileInfo?.participantType)}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "monospace" }}>
                              {app.applicationNumber}
                            </Typography>
                          </Box>

                          {/* Başvuru Türü ve Sunum Durumu */}
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", mb: 0.5 }}>
                              Başvuru Bilgileri
                            </Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              <Chip
                                label={app.displayApplicationType || (app.applicationType === "team" ? "Takım" : "Bireysel")}
                                size="small"
                                color={app.applicationType === "team" ? "primary" : "info"}
                                variant="filled"
                              />
                              <Chip
                                label={app.presentationInfo?.presentationFile ? "✓ Sunum Yüklendi" : "✗ Sunum Yok"}
                                size="small"
                                color={app.presentationInfo?.presentationFile ? "success" : "default"}
                                variant="outlined"
                              />
                            </Stack>
                          </Box>
                        </Stack>

                        {/* Alt Kısım: Değerlendirme Badge */}
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" sx={{ pt: 1 }}>
                          {getMyPreEvaluationBadge(app)}
                        </Stack>

                        {/* Detay Butonu */}
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<IconEye size={18} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(app._id);
                          }}
                        >
                          Detay & Değerlendir
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Pagination ve Sayfa Başına Kayıt */}
          <Box sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mt: 4 
          }}>
            {/* Sayfa Başına Kayıt Seçimi */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Sayfa başına:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(e.target.value);
                    setCurrentPage(1);
                  }}
                  sx={{ 
                    "& .MuiSelect-select": { 
                      py: 1 
                    } 
                  }}
                >
                  <MenuItem value={12}>12</MenuItem>
                  <MenuItem value={24}>24</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                  <MenuItem value={250}>250</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, page) => setCurrentPage(page)}
                color="primary"
                size="large"
                sx={{
                  "& .MuiPaginationItem-root": {
                    borderRadius: 2,
                    fontWeight: 600,
                  },
                }}
              />
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default JuriApplicationList;

