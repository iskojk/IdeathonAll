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
  Drawer,
  Grid,
  Card,
  CardContent,
  Checkbox,
  Pagination,
} from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import {
  IconSearch,
  IconTrash,
  IconEye,
  IconMail,
  IconPhone,
  IconEdit,
  IconUser,
  IconUserCheck,
  IconUserX,
  IconUserPlus,
  IconUserMinus,
  IconUserEdit,
  IconUserLock,
  IconUserUnlock,
  IconUserBlock,
  IconUserUnblock,
  IconUserDelete,
  IconDownload,
  IconX,
  IconShield,
  IconUsers,
  IconCrown,
  IconInfoCircle,
  IconFilter,
} from "@tabler/icons-react";
import { ApplicationContext } from "@/app/context/ApplicationContext";
import { toast } from "react-toastify";
import Link from "next/link";
import moment from "moment";
import "moment/locale/tr";
moment.locale("tr");

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api";
const FILE_BASE = API_BASE_URL.replace("/api", "");

/* ------------------------- Helpers ------------------------- */
const buildFileUrl = (file) => {
  if (!file || typeof file !== "string") return null;
  if (file.startsWith("http://") || file.startsWith("https://")) return file;
  return `${FILE_BASE}/uploads/resumes/${file}`;
};

const getStatusColor = (status) => {
  switch (status) {
    case "pending": return "warning";
    case "under_review": return "info";
    case "approved": return "success";
    case "rejected": return "error";
    case "withdrawn": return "default";
    default: return "default";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "pending": return "Bekliyor";
    case "under_review": return "İncelemede";
    case "approved": return "Onaylandı";
    case "rejected": return "Reddedildi";
    case "withdrawn": return "İptal Edildi";
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

const getInterestFieldLabel = (field) => {
  switch (field) {
    case "mobile_living": return "Mobil Yaşam";
    case "predictive_maintenance": return "Öngörücü Bakım";
    case "security_access": return "Güvenlik Erişim";
    case "data_platform": return "Veri Platformu";
    case "other": return "Diğer";
    default: return field;
  }
};

/* ------------------------- Main List ------------------------- */
const ApplicationList = () => {
  const {
    fetchApplications,
    deleteApplication,
    updateApplicationStatus,
    fetchStats,
    fetchDashboardStats
  } = useContext(ApplicationContext);

  const [applications, setApplications] = useState([]);
  const [allApplications, setAllApplications] = useState([]); // Tüm başvurular için
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedParticipantType, setSelectedParticipantType] = useState("all");
  const [selectedApplicationType, setSelectedApplicationType] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [sortBy, setSortBy] = useState("-createdAt");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Sayfa başına kayıt sayısı

  // Stats state
  const [stats, setStats] = useState({});
  const [dashboardStats, setDashboardStats] = useState({});

  // Modal states
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openFiltersDialog, setOpenFiltersDialog] = useState(false);

  const [selectedApp, setSelectedApp] = useState(null);
  const [statusReason, setStatusReason] = useState("");
  const [selectedApplications, setSelectedApplications] = useState([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [pagination, setPagination] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    loadData();
  }, [searchTerm, selectedStatus, selectedParticipantType, selectedApplicationType, sortBy, currentPage, itemsPerPage]);

  useEffect(() => {
    loadStats();
    loadAllApplications(); // Tüm başvuruları yükle
  }, []);

  const loadData = async () => {
    const filters = {
      search: searchTerm || undefined,
      status: selectedStatus !== "all" ? selectedStatus : undefined,
      participantType: selectedParticipantType !== "all" ? selectedParticipantType : undefined,
      applicationType: selectedApplicationType !== "all" ? selectedApplicationType : undefined,
      sort: sortBy || undefined,
    };

    const appsRes = await fetchApplications(currentPage, itemsPerPage, filters);
    if (appsRes?.success) {
      setApplications(appsRes.data || []);
      setPagination(appsRes.pagination);
    }
  };

  const loadAllApplications = async () => {
    // Tüm başvuruları çek (sayfalama olmadan veya çok büyük limit ile)
    const allAppsRes = await fetchApplications(1, 10000, {});
    if (allAppsRes?.success) {
      setAllApplications(allAppsRes.data || []);
    }
  };

  const loadStats = async () => {
    const statsRes = await fetchDashboardStats();
    if (statsRes?.success) {
      setDashboardStats(statsRes.data || {});
    }

    const overviewStats = await fetchStats('overview');
    if (overviewStats?.success) {
      setStats(overviewStats.data || {});
    }
  };

  const handleDelete = async () => {
    if (!selectedApp) return;
    const result = await deleteApplication(selectedApp._id);
    if (result.success) {
      toast.success(result.message);
      loadData();
      loadAllApplications(); // Tüm başvuruları da güncelle
    } else {
      toast.error(result.message);
    }
    setOpenDeleteDialog(false);
  };

  const handleStatusUpdate = async () => {
    if (!selectedApp) return;
    const result = await updateApplicationStatus(selectedApp._id, selectedStatus, statusReason || undefined);
    if (result.success) {
      toast.success(result.message);
      loadData();
      loadStats();
      loadAllApplications(); // Tüm başvuruları da güncelle
    } else {
      toast.error(result.message);
    }
    setOpenStatusDialog(false);
    setStatusReason("");
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedApplications.length === 0) return;

    const promises = selectedApplications.map(id =>
      updateApplicationStatus(id, newStatus)
    );

    try {
      await Promise.all(promises);
      toast.success(`${selectedApplications.length} başvuru ${getStatusLabel(newStatus)} durumuna güncellendi`);
      loadData();
      loadStats();
      loadAllApplications(); // Tüm başvuruları da güncelle
      setSelectedApplications([]);
    } catch (error) {
      toast.error("Toplu güncelleme sırasında hata oluştu");
    }
  };

  const filteredApps = useMemo(() => {
    // Tarih seçiliyse allApplications'dan filtrele, değilse applications'ı kullan
    const sourceApps = selectedDate ? allApplications : applications;
    
    return (sourceApps || []).filter((app) => {
      // Başvuru türü filtresi (takımlı/bireysel)
      if (selectedApplicationType !== "all") {
        const isTeamApp = app.teamInfo && app.teamInfo.isInTeam;
        if (selectedApplicationType === "team" && !isTeamApp) return false;
        if (selectedApplicationType === "individual" && isTeamApp) return false;
      }

      // Tarih filtresi - createdAt'e göre (sadece tarih seçiliyse)
      if (selectedDate) {
        const appDate = moment(app.createdAt).startOf('day');
        const filterDate = moment(selectedDate).startOf('day');
        if (!appDate.isSame(filterDate)) return false;
      }

      // Tarih seçiliyse diğer filtreleri de uygula
      if (selectedDate) {
        // Durum filtresi
        if (selectedStatus !== "all" && app.status !== selectedStatus) return false;
        
        // Katılımcı tipi filtresi
        if (selectedParticipantType !== "all" && app.profileInfo?.participantType !== selectedParticipantType) return false;
        
        // Arama filtresi
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const fullName = `${app.personalInfo?.firstName || ''} ${app.personalInfo?.lastName || ''}`.toLowerCase();
          const email = (app.personalInfo?.email || '').toLowerCase();
          const appNumber = (app.applicationNumber || '').toLowerCase();
          
          if (!fullName.includes(searchLower) && 
              !email.includes(searchLower) && 
              !appNumber.includes(searchLower)) {
            return false;
          }
        }
      }

      // API'den gelen diğer filtreler zaten uygulanıyor (tarih seçili değilse)
      return true;
    });
  }, [allApplications, applications, selectedApplicationType, selectedDate, selectedStatus, selectedParticipantType, searchTerm]);

  // Tarih filtresine göre TÜM başvurulardan sayı hesapla
  const dateFilteredCount = useMemo(() => {
    if (!selectedDate) return 0;
    return allApplications.filter((app) => {
      const appDate = moment(app.createdAt).startOf('day');
      const filterDate = moment(selectedDate).startOf('day');
      return appDate.isSame(filterDate);
    }).length;
  }, [allApplications, selectedDate]);

  // Takımlı ve Bireysel sayılarını hesapla - TÜM başvurulardan
  const applicationTypeStats = useMemo(() => {
    const teamCount = allApplications.filter(app => app.teamInfo && app.teamInfo.isInTeam).length;
    const individualCount = allApplications.filter(app => !app.teamInfo || !app.teamInfo.isInTeam).length;
    return { teamCount, individualCount };
  }, [allApplications]);

  const totalCount = applications.length;
  const filteredCount = filteredApps.length;

  return (
    <Box>
        {/* İstatistikler Kartları */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ justifyContent: 'flex-start', alignItems: 'stretch' }}>
            {/* Ana İstatistik Kartları - Küçültülmüş */}
            <Box sx={{ flex: '1 1 auto', minWidth: { xs: 100, sm: 110 }, maxWidth: { xs: 120, sm: 130 } }}>
              <Card
                elevation={2}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
                  },
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: 1.5, textAlign: 'center', '&:last-child': { pb: 1.5 } }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '1.2rem', sm: '1.4rem' },
                      mb: 0.5
                    }}
                  >
                    {stats.total || 0}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      opacity: 0.9,
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      fontWeight: 500
                    }}
                  >
                    Toplam
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 auto', minWidth: { xs: 100, sm: 110 }, maxWidth: { xs: 120, sm: 130 } }}>
              <Card
                elevation={2}
                sx={{
                  backgroundColor: theme.palette.warning.main,
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(245, 87, 108, 0.3)'
                  },
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: 1.5, textAlign: 'center', '&:last-child': { pb: 1.5 } }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '1.2rem', sm: '1.4rem' },
                      mb: 0.5
                    }}
                  >
                    {stats.byStatus?.pending?.count || 0}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      opacity: 0.9,
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      fontWeight: 500
                    }}
                  >
                    Bekliyor
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 auto', minWidth: { xs: 100, sm: 110 }, maxWidth: { xs: 120, sm: 130 } }}>
              <Card
                elevation={2}
                sx={{
                  backgroundColor: theme.palette.info.main,
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(79, 172, 254, 0.3)'
                  },
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: 1.5, textAlign: 'center', '&:last-child': { pb: 1.5 } }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '1.2rem', sm: '1.4rem' },
                      mb: 0.5
                    }}
                  >
                    {stats.byStatus?.under_review?.count || 0}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      opacity: 0.9,
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      fontWeight: 500
                    }}
                  >
                    İnceleniyor
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 auto', minWidth: { xs: 100, sm: 110 }, maxWidth: { xs: 120, sm: 130 } }}>
              <Card
                elevation={2}
                sx={{
                  backgroundColor: theme.palette.success.main,
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(67, 233, 123, 0.3)'
                  },
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: 1.5, textAlign: 'center', '&:last-child': { pb: 1.5 } }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '1.2rem', sm: '1.4rem' },
                      mb: 0.5
                    }}
                  >
                    {stats.byStatus?.approved?.count || 0}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      opacity: 0.9,
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      fontWeight: 500
                    }}
                  >
                    Onaylandı
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 auto', minWidth: { xs: 100, sm: 110 }, maxWidth: { xs: 120, sm: 130 } }}>
              <Card
                elevation={2}
                sx={{
                  backgroundColor: theme.palette.error.main,
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(250, 112, 154, 0.3)'
                  },
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: 1.5, textAlign: 'center', '&:last-child': { pb: 1.5 } }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '1.2rem', sm: '1.4rem' },
                      mb: 0.5
                    }}
                  >
                    {stats.byStatus?.rejected?.count || 0}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      opacity: 0.9,
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      fontWeight: 500
                    }}
                  >
                    Reddedildi
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Takımlı/Bireysel Kartları - Frontend'de hesaplanıyor */}
            <Box sx={{ flex: '1 1 auto', minWidth: { xs: 100, sm: 110 }, maxWidth: { xs: 120, sm: 130 } }}>
              <Card
                elevation={2}
                sx={{
                  backgroundColor: '#667eea',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
                  },
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: 1.5, textAlign: 'center', '&:last-child': { pb: 1.5 } }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '1.2rem', sm: '1.4rem' },
                      mb: 0.5
                    }}
                  >
                    {applicationTypeStats.teamCount}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      opacity: 0.9,
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      fontWeight: 500
                    }}
                  >
                    Takımlı
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 auto', minWidth: { xs: 100, sm: 110 }, maxWidth: { xs: 120, sm: 130 } }}>
              <Card
                elevation={2}
                sx={{
                  backgroundColor: '#f5576c',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(245, 87, 108, 0.3)'
                  },
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: 1.5, textAlign: 'center', '&:last-child': { pb: 1.5 } }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '1.2rem', sm: '1.4rem' },
                      mb: 0.5
                    }}
                  >
                    {applicationTypeStats.individualCount}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      opacity: 0.9,
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      fontWeight: 500
                    }}
                  >
                    Bireysel
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Tarih filtresi kartı */}
            {selectedDate && (
              <Box sx={{ flex: '1 1 auto', minWidth: { xs: 100, sm: 110 }, maxWidth: { xs: 120, sm: 130 } }}>
                <Card
                  elevation={2}
                  sx={{
                    backgroundColor: theme.palette.secondary.main,
                    color: 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 16px rgba(156, 39, 176, 0.3)'
                    },
                    borderRadius: 2,
                  }}
                >
                  <CardContent sx={{ p: 1.5, textAlign: 'center', '&:last-child': { pb: 1.5 } }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: { xs: '1.2rem', sm: '1.4rem' },
                        mb: 0.5
                      }}
                    >
                      {dateFilteredCount}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        opacity: 0.9,
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        fontWeight: 500
                      }}
                    >
                      {moment(selectedDate).format('DD.MM.YY')}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}

          </Stack>
        </Box>

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
            Başvurular
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


          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sırala</InputLabel>
            <Select
              value={sortBy}
              label="Sırala"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="-createdAt">En Yeni</MenuItem>
              <MenuItem value="createdAt">En Eski</MenuItem>
              <MenuItem value="personalInfo.firstName">İsim A-Z</MenuItem>
              <MenuItem value="-personalInfo.firstName">İsim Z-A</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            startIcon={<IconFilter size={18} />}
            onClick={() => setOpenFiltersDialog(true)}
            sx={{ minWidth: 120 }}
          >
            Filtreler
          </Button>

          {(selectedStatus !== "all" || selectedParticipantType !== "all" || selectedApplicationType !== "all" || selectedDate || searchTerm) && (
            <Button
              variant="text"
              size="small"
              color="error"
              onClick={() => {
                setSelectedStatus("all");
                setSelectedParticipantType("all");
                setSelectedApplicationType("all");
                setSelectedDate(null);
                setSearchTerm("");
                setCurrentPage(1);
              }}
            >
              Temizle
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Liste Kartı */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {/* Toplu İşlem Butonları */}
        {selectedApplications.length > 0 && (
          <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ color: 'primary.contrastText' }}>
                {selectedApplications.length} başvuru seçildi
              </Typography>
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={() => handleBulkStatusUpdate('approved')}
              >
                Onayla
              </Button>
              <Button
                size="small"
                variant="contained"
                color="warning"
                onClick={() => handleBulkStatusUpdate('under_review')}
              >
                İnceleniyor Yap
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={() => handleBulkStatusUpdate('rejected')}
              >
                Reddet
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setSelectedApplications([])}
                sx={{ ml: 'auto' }}
              >
                Seçimi Temizle
              </Button>
            </Stack>
          </Box>
        )}

        <Box sx={{ overflowX: "auto", width: "100%" }}>
          <Table
            sx={{
              whiteSpace: "nowrap",
              minWidth: 1000,
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
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedApplications.length > 0 && selectedApplications.length < filteredApps.length}
                    checked={filteredApps.length > 0 && selectedApplications.length === filteredApps.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedApplications(filteredApps.map(app => app._id));
                      } else {
                        setSelectedApplications([]);
                      }
                    }}
                  />
                </TableCell>
                <TableCell>Aday Bilgileri</TableCell>
                <TableCell>Katılımcı Tipi</TableCell>
                <TableCell>Başvuru Türü</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Başvuru Tarihi</TableCell>
                <TableCell align="right">İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApps.map((app) => {
                const personalInfo = app.personalInfo || {};
                const profileInfo = app.profileInfo || {};
                const interestsInfo = app.interestsInfo || {};

                const initial = String(personalInfo.firstName || "?").charAt(0).toUpperCase();
                const fullName = `${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim();



                return (
                  <TableRow key={app._id} hover>
                    {/* Checkbox */}
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedApplications.includes(app._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedApplications(prev => [...prev, app._id]);
                          } else {
                            setSelectedApplications(prev => prev.filter(id => id !== app._id));
                          }
                        }}
                      />
                    </TableCell>

                    {/* Aday Bilgileri */}
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar>{initial}</Avatar>
                        <Box>
                          <Typography fontWeight={600}>
                            {fullName || "-"}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <IconMail size={14} />
                            <Typography variant="body2" color="textSecondary">
                              {personalInfo.email || "-"}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <IconPhone size={14} />
                            <Typography variant="body2" color="textSecondary">
                              {personalInfo.phone || "-"}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* Katılımcı Tipi */}
                    <TableCell>
                      <Typography>
                        {getParticipantTypeLabel(profileInfo.participantType) || "-"}
                      </Typography>
                    </TableCell>

                    {/* Başvuru Türü */}
                    <TableCell>
                      <Chip
                        label={app.teamInfo?.isInTeam ? "Takımlı" : "Bireysel"}
                        color={app.teamInfo?.isInTeam ? "success" : "info"}
                        variant="filled"
                        size="small"
                      />
                    </TableCell>

                    {/* Durum */}
                    <TableCell>
                      <Chip
                        size="small"
                        label={getStatusLabel(app.status)}
                        color={getStatusColor(app.status)}
                        variant="filled"
                      />
                    </TableCell>

                    {/* Başvuru Tarihi */}
                    <TableCell>
                      <Typography>
                        {moment(app.createdAt).format("DD.MM.YYYY")}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {moment(app.createdAt).format("HH:mm")}
                      </Typography>
                    </TableCell>

                    {/* İşlemler */}
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Detay Görüntüle">
                          <IconButton
                            onClick={() => {
                              setSelectedApp(app);
                              setDetailOpen(true);
                            }}
                            sx={{ borderRadius: 2 }}
                          >
                            <IconEye size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Durum Değiştir">
                          <IconButton
                            onClick={() => {
                              setSelectedApp(app);
                              setSelectedStatus(app.status);
                              setStatusReason("");
                              setOpenStatusDialog(true);
                            }}
                            sx={{ borderRadius: 2 }}
                          >
                            <IconEdit size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton
                            onClick={() => {
                              setSelectedApp(app);
                              setOpenDeleteDialog(true);
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

              {filteredApps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box
                      py={6}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexDirection="column"
                      sx={{ color: "text.secondary" }}
                    >
                      <Typography sx={{ mb: 1 }}>Kayıt bulunamadı.</Typography>
                      {searchTerm || selectedStatus !== "all" || selectedParticipantType !== "all" || selectedApplicationType !== "all" ? (
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setSearchTerm("");
                            setSelectedStatus("all");
                            setSelectedParticipantType("all");
                            setSelectedApplicationType("all");
                            setSelectedDate(null);
                          }}
                        >
                          Filtreleri Temizle
                        </Button>
                      ) : null}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>


        {/* Pagination ve Kayıt Sayısı - Tarih filtresi yoksa göster */}
        {!selectedDate && pagination && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mt: 4, 
            mb: 2,
            px: 2
          }}>
            {/* Kayıt Sayısı Seçimi */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Sayfa başına:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(e.target.value);
                    setCurrentPage(1); // Sayfa 1'e dön
                  }}
                  sx={{ 
                    '& .MuiSelect-select': { 
                      py: 1 
                    } 
                  }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary">
                Toplam: {pagination.total || 0}
              </Typography>
            </Stack>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                count={pagination.totalPages}
                page={currentPage}
                onChange={(event, page) => setCurrentPage(page)}
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
            )}
          </Box>
        )}
      </Paper>

      {/* Silme Onay Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Başvuruyu Sil</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{selectedApp?.personalInfo?.firstName} {selectedApp?.personalInfo?.lastName}</strong> adlı adayın başvurusunu silmek istediğinizden emin misiniz?
            Bu işlem geri alınamaz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>İptal</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* Durum Değiştirme Dialog'u */}
      <Dialog
        open={openStatusDialog}
        onClose={() => setOpenStatusDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Başvuru Durumunu Değiştir</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {selectedApp?.applicationNumber} numaralı başvurunun durumunu değiştirin.
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Yeni Durum</InputLabel>
              <Select
                value={selectedStatus}
                label="Yeni Durum"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="pending">Bekliyor</MenuItem>
                <MenuItem value="under_review">İncelemede</MenuItem>
                <MenuItem value="approved">Onaylandı</MenuItem>
                <MenuItem value="rejected">Reddedildi</MenuItem>
                <MenuItem value="withdrawn">İptal Edildi</MenuItem>
              </Select>
            </FormControl>

            {(selectedStatus === "rejected" || selectedStatus === "withdrawn") && (
              <TextField
                label="Açıklama (İsteğe bağlı)"
                multiline
                rows={3}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Reddetme veya iptal nedeni..."
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>İptal</Button>
          <Button onClick={handleStatusUpdate} color="primary" variant="contained">
            Durumu Güncelle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filtreler Modal */}
      <Dialog
        open={openFiltersDialog}
        onClose={() => setOpenFiltersDialog(false)}
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
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <Stack spacing={3} sx={{ pt: 1 }}>
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
                  <MenuItem value="withdrawn">İptal Edildi</MenuItem>
                </Select>
              </FormControl>

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

              <FormControl fullWidth>
                <InputLabel>Başvuru Türü</InputLabel>
                <Select
                  value={selectedApplicationType}
                  label="Başvuru Türü"
                  onChange={(e) => setSelectedApplicationType(e.target.value)}
                >
                  <MenuItem value="all">Tümü</MenuItem>
                  <MenuItem value="team">Takımlı</MenuItem>
                  <MenuItem value="individual">Bireysel</MenuItem>
                </Select>
              </FormControl>

              <DatePicker
                label="Başvuru Tarihi"
                value={selectedDate}
                onChange={(newValue) => {
                  setSelectedDate(newValue);
                  if (newValue) {
                    setCurrentPage(1); // Tarih seçildiğinde sayfa 1'e dön
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined'
                  }
                }}
              />
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFiltersDialog(false)}>İptal</Button>
          <Button
            variant="contained"
            onClick={() => setOpenFiltersDialog(false)}
          >
            Uygula
          </Button>
        </DialogActions>
      </Dialog>


      {/* Detay Modal - Modern Tasarım */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            maxHeight: '95vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            pb: 3,
            pt: 3,
            px: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)`,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={3}
          >
            <Stack direction="row" alignItems="center" spacing={3}>
              <Avatar
                sx={{
                  bgcolor: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  width: 64,
                  height: 64,
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  boxShadow: theme.shadows[4]
                }}
              >
                {String(selectedApp?.personalInfo?.firstName || "?").charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {selectedApp?.personalInfo?.firstName} {selectedApp?.personalInfo?.lastName}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Başvuru No: <strong>{selectedApp?.applicationNumber}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    •
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {moment(selectedApp?.submittedAt).format('DD MMM YYYY, HH:mm')}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                label={getStatusLabel(selectedApp?.status)}
                color={getStatusColor(selectedApp?.status)}
                variant="filled"
                sx={{
                  fontWeight: 600,
                  px: 2,
                  fontSize: '0.875rem',
                  boxShadow: theme.shadows[2]
                }}
              />
              <IconButton
                onClick={() => setDetailOpen(false)}
                sx={{
                  bgcolor: theme.palette.grey[100],
                  '&:hover': { bgcolor: theme.palette.grey[200] }
                }}
              >
                <IconX size={20} />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ maxHeight: 'calc(95vh - 140px)', overflowY: 'auto', p: 4 }}>

          {selectedApp ? (
            <Stack spacing={4}>

              {/* Başvuru Özeti */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <Card
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                        📋 Başvuru Özeti
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Başvuru Numarası
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                              {selectedApp.applicationNumber}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Başvuru Tarihi
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {moment(selectedApp.submittedAt).format('DD.MM.YYYY')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {moment(selectedApp.submittedAt).format('HH:mm')}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Durum
                            </Typography>
                            <Chip
                              label={getStatusLabel(selectedApp.status)}
                              color={getStatusColor(selectedApp.status)}
                              variant="filled"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              IP Adresi
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                              {selectedApp.ipAddress}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Detaylı Bilgiler */}
              <Grid container spacing={3}>
                {/* Kişisel Bilgiler */}
                <Grid item xs={12} lg={6}>
                  <Card
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] }
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{
                          bgcolor: 'primary.main',
                          borderRadius: 2,
                          p: 1,
                          mr: 2,
                          color: 'white'
                        }}>
                          <IconUser size={20} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Kişisel Bilgiler
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                              E-posta
                            </Typography>
                            <Typography variant="body1" sx={{ wordBreak: 'break-all', fontWeight: 500 }}>
                              {selectedApp.personalInfo?.email || "-"}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                              Telefon
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {selectedApp.personalInfo?.phone || "-"}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                              TC Kimlik No
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                              {selectedApp.personalInfo?.tcIdentity || "-"}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                              Doğum Tarihi
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {selectedApp.personalInfo?.birthDate ?
                                moment(selectedApp.personalInfo.birthDate).format("DD MMMM YYYY") : "-"}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                              Şehir
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {selectedApp.personalInfo?.city || "-"}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Profil Bilgileri */}
                <Grid item xs={12} lg={6}>
                  <Card
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] }
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{
                          bgcolor: 'secondary.main',
                          borderRadius: 2,
                          p: 1,
                          mr: 2,
                          color: 'white'
                        }}>
                          <IconUser size={20} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Profil Bilgileri
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                              Katılımcı Tipi
                            </Typography>
                            <Chip
                              label={selectedApp.displayParticipantType || selectedApp.participantType}
                              color="secondary"
                              variant="outlined"
                              sx={{ fontWeight: 500 }}
                            />
                          </Box>
                        </Grid>
                        {selectedApp.profileInfo?.studentInfo && (
                          <>
                            <Grid item xs={12} sm={8}>
                              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                  Okul / Üniversite
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {selectedApp.profileInfo.studentInfo.school || "-"}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                  Sınıf
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {selectedApp.profileInfo.studentInfo.grade || "-"}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12}>
                              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                  Bölüm
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {selectedApp.profileInfo.studentInfo.department || "-"}
                                </Typography>
                              </Box>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* İlgi Alanları */}
                <Grid item xs={12} lg={6}>
                  <Card
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] }
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{
                          bgcolor: 'info.main',
                          borderRadius: 2,
                          p: 1,
                          mr: 2,
                          color: 'white'
                        }}>
                          <IconUserCheck size={20} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          İlgi Alanları
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                              Gözlem Alanları
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              {selectedApp.interestsInfo?.observationField?.map((field, index) => (
                                <Chip
                                  key={index}
                                  label={field}
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                  sx={{ fontWeight: 500 }}
                                />
                              )) || <Typography variant="body2">Belirtilmemiş</Typography>}
                            </Stack>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                              Önceki Deneyim
                            </Typography>
                            <Stack spacing={1}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {selectedApp.interestsInfo?.hasPreviousExperience ? 'Evet' : 'Hayır'}
                                </Typography>
                                <Chip
                                  label={selectedApp.interestsInfo?.hasPreviousExperience ? 'Deneyimli' : 'Yeni Başlayan'}
                                  size="small"
                                  color={selectedApp.interestsInfo?.hasPreviousExperience ? 'success' : 'warning'}
                                  variant="filled"
                                />
                              </Box>
                              {selectedApp.interestsInfo?.hasPreviousExperience && selectedApp.interestsInfo?.previousExperienceDescription && (
                                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                  &quot;{selectedApp.interestsInfo.previousExperienceDescription}&quot;
                                </Typography>
                              )}
                            </Stack>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Yetkinlikler */}
                <Grid item xs={12} lg={6}>
                  <Card
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] }
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{
                          bgcolor: 'warning.main',
                          borderRadius: 2,
                          p: 1,
                          mr: 2,
                          color: 'white'
                        }}>
                          <IconShield size={20} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Yetkinlikler
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                              Yetkinlik Alanları
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              {selectedApp.competenciesInfo?.competencies?.map((competency, index) => (
                                <Chip
                                  key={index}
                                  label={competency}
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  sx={{ fontWeight: 500, mb: 1 }}
                                />
                              )) || <Typography variant="body2">Belirtilmemiş</Typography>}
                            </Stack>
                          </Box>
                        </Grid>
                        {selectedApp.competenciesInfo?.otherCompetency && (
                          <Grid item xs={12}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                Diğer Yetkinlik
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {selectedApp.competenciesInfo.otherCompetency}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        {selectedApp.competenciesInfo?.motivation && (
                          <Grid item xs={12}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                Motivasyon
                              </Typography>
                              <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                                &quot;{selectedApp.competenciesInfo.motivation}&quot;
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        {selectedApp.competenciesInfo?.selfDescription && (
                          <Grid item xs={12}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                Kendini Tanımlama
                              </Typography>
                              <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                                &quot;{selectedApp.competenciesInfo.selfDescription}&quot;
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Sosyal Medya ve Ek Bilgiler */}
                <Grid item xs={12} lg={6}>
                  <Card
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] }
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{
                          bgcolor: 'success.main',
                          borderRadius: 2,
                          p: 1,
                          mr: 2,
                          color: 'white'
                        }}>
                          <IconMail size={20} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Sosyal Medya & Ek Bilgiler
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        {selectedApp.socialInfo?.linkedinProfile && (
                          <Grid item xs={12}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                LinkedIn Profili
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  wordBreak: 'break-all',
                                  fontWeight: 500,
                                  color: 'primary.main',
                                  textDecoration: 'underline',
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(selectedApp.socialInfo.linkedinProfile, '_blank')}
                              >
                                {selectedApp.socialInfo.linkedinProfile}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        {selectedApp.socialInfo?.personalWebsite && (
                          <Grid item xs={12}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                Kişisel Web Sitesi
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  wordBreak: 'break-all',
                                  fontWeight: 500,
                                  color: 'primary.main',
                                  textDecoration: 'underline',
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(selectedApp.socialInfo.personalWebsite, '_blank')}
                              >
                                {selectedApp.socialInfo.personalWebsite}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        {selectedApp.additionalInfo?.projectLink && (
                          <Grid item xs={12}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                Proje Linki
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  wordBreak: 'break-all',
                                  fontWeight: 500,
                                  color: 'primary.main',
                                  textDecoration: 'underline',
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(selectedApp.additionalInfo.projectLink, '_blank')}
                              >
                                {selectedApp.additionalInfo.projectLink}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        {selectedApp.additionalInfo?.videoLink && (
                          <Grid item xs={12}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                Video Linki
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  wordBreak: 'break-all',
                                  fontWeight: 500,
                                  color: 'primary.main',
                                  textDecoration: 'underline',
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(selectedApp.additionalInfo.videoLink, '_blank')}
                              >
                                {selectedApp.additionalInfo.videoLink}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Sağlık Bilgileri */}
                <Grid item xs={12} lg={6}>
                  <Card
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] }
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{
                          bgcolor: 'error.main',
                          borderRadius: 2,
                          p: 1,
                          mr: 2,
                          color: 'white'
                        }}>
                          <IconUser size={20} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Sağlık Bilgileri
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        {selectedApp.healthInfo?.emergencyContact && (
                          <>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                  Acil Durum Kişisi
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {selectedApp.healthInfo.emergencyContact.name}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                  İletişim No
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {selectedApp.healthInfo.emergencyContact.phone}
                                </Typography>
                              </Box>
                            </Grid>
                          </>
                        )}
                        {selectedApp.healthInfo?.healthDeclaration && (
                          <Grid item xs={12}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                Sağlık Beyanı
                              </Typography>
                              <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                                &quot;{selectedApp.healthInfo.healthDeclaration}&quot;
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Takım Bilgileri */}
                {selectedApp.teamInfo && (
                  <Grid item xs={12} lg={6}>
                    <Card
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] }
                      }}
                    >
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Box sx={{
                            bgcolor: 'primary.main',
                            borderRadius: 2,
                            p: 1,
                            mr: 2,
                            color: 'white'
                          }}>
                            <IconUsers size={20} />
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Takım Bilgileri
                          </Typography>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                Takım Durumu
                              </Typography>
                              <Chip
                                label={selectedApp.teamInfo.isInTeam ? 'Takımlı' : 'Bireysel'}
                                color={selectedApp.teamInfo.isInTeam ? 'success' : 'warning'}
                                variant="filled"
                                sx={{ fontWeight: 500 }}
                              />
                            </Box>
                          </Grid>
                          {selectedApp.teamInfo.isInTeam && (
                            <>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                    Takım Adı
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {selectedApp.teamInfo.teamName}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                    Takım Büyüklüğü
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {selectedApp.teamInfo.teamSize} kişi
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12}>
                                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                                    Takım Üyeleri
                                  </Typography>
                                  <Stack spacing={1}>
                                    {selectedApp.teamInfo.teamMembers?.map((member, index) => (
                                      <Box key={index} sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                                          <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                              {member.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                              TC: {member.tcIdentity}
                                            </Typography>
                                          </Box>
                                          <Chip
                                            label={member.role}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: '0.7rem', fontWeight: 500 }}
                                          />
                                        </Stack>
                                      </Box>
                                    ))}
                                  </Stack>
                                </Box>
                              </Grid>
                            </>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Onaylar ve Sözleşmeler */}
                <Grid item xs={12} lg={6}>
                  <Card
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] }
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{
                          bgcolor: 'success.main',
                          borderRadius: 2,
                          p: 1,
                          mr: 2,
                          color: 'white'
                        }}>
                          <IconShield size={20} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Onaylar ve Sözleşmeler
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                              Bilgi Doğruluğu
                            </Typography>
                            <Chip
                              label={selectedApp.consents?.informationAccuracy ? 'Onaylandı' : 'Onaylanmadı'}
                              color={selectedApp.consents?.informationAccuracy ? 'success' : 'error'}
                              variant="filled"
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                              Kurallar
                            </Typography>
                            <Chip
                              label={selectedApp.consents?.rulesCompliance ? 'Onaylandı' : 'Onaylanmadı'}
                              color={selectedApp.consents?.rulesCompliance ? 'success' : 'error'}
                              variant="filled"
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                              KVKK
                            </Typography>
                            <Chip
                              label={selectedApp.consents?.kvkkConsent ? 'Onaylandı' : 'Onaylanmadı'}
                              color={selectedApp.consents?.kvkkConsent ? 'success' : 'error'}
                              variant="filled"
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Final Değerlendirme */}
                {selectedApp.finalEvaluation && (
                  <Grid item xs={12}>
                    <Card
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4] }
                      }}
                    >
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Box sx={{
                            bgcolor: 'warning.main',
                            borderRadius: 2,
                            p: 1,
                            mr: 2,
                            color: 'white'
                          }}>
                            <IconCrown size={20} />
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Final Değerlendirme
                          </Typography>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                Toplam Değerlendirme
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {selectedApp.finalEvaluation.totalEvaluations || 0}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                Final Karar
                              </Typography>
                              <Chip
                                label={selectedApp.finalEvaluation.finalDecision || 'pending'}
                                color={
                                  selectedApp.finalEvaluation.finalDecision === 'approved' ? 'success' :
                                  selectedApp.finalEvaluation.finalDecision === 'rejected' ? 'error' :
                                  'warning'
                                }
                                variant="filled"
                                sx={{ fontWeight: 600, px: 2 }}
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Stack>

          ) : null}
        </Box>
        </DialogContent>
      </Dialog>

      {/* Eski modal kodları kaldırıldı */}
    </Box>
  );
};

export default ApplicationList;
