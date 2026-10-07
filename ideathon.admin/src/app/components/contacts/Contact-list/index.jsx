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
  Pagination,
} from "@mui/material";
import {
  IconSearch,
  IconEye,
  IconEdit,
  IconMail,
  IconPhone,
  IconFilter,
  IconMessage,
  IconClock,
  IconInfoCircle,
} from "@tabler/icons-react";
import { ContactContext } from "@/app/context/ContactContext";
import { toast } from "react-toastify";
import moment from "moment";
import "moment/locale/tr";
moment.locale("tr");

/* ------------------------- Helpers ------------------------- */

const getStatusColor = (status) => {
  switch (status) {
    case "new": return "error";
    case "read": return "warning";
    case "replied": return "success";
    case "closed": return "default";
    default: return "default";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "new": return "Yeni";
    case "read": return "Okundu";
    case "replied": return "Yanıtlandı";
    case "closed": return "Kapandı";
    default: return status;
  }
};

/* ------------------------- Main List ------------------------- */
const ContactList = () => {
  const { fetchContacts, updateContactStatus, fetchStats } = useContext(ContactContext);

  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedContact, setSelectedContact] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    // Token kontrolü
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Önce giriş yapmanız gerekiyor");
      return;
    }

    loadData();
  }, [searchTerm, selectedStatus, currentPage]);

  useEffect(() => {
    // Token kontrolü
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Önce giriş yapmanız gerekiyor");
      return;
    }

    loadStats();
  }, []);

  const loadData = async () => {
    const result = await fetchContacts(currentPage, 10, selectedStatus !== "all" ? selectedStatus : "");
    if (result?.success) {
      setContacts(result.data || []);
      setPagination(result.pagination || {});
    }
  };

  const loadStats = async () => {
    const result = await fetchStats();
    if (result?.success) {
      setStats(result.data || {});
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedContact || !newStatus) return;

    // Token kontrolü
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Önce giriş yapmanız gerekiyor");
      return;
    }

    const result = await updateContactStatus(selectedContact._id, newStatus);
    if (result.success) {
      toast.success(result.message);
      loadData();
      loadStats();
      setStatusDialogOpen(false);
      setSelectedContact(null);
      setNewStatus("");
    } else {
      toast.error(result.message);
    }
  };

  const handleStatusChange = (contact) => {
    setSelectedContact(contact);
    setNewStatus(contact.status);
    setStatusDialogOpen(true);
  };

  const filteredContacts = contacts.filter((contact) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.firstName?.toLowerCase().includes(searchLower) ||
      contact.lastName?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.message?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Box>
      {/* İstatistikler */}
      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={2}
        sx={{ mb: 3 }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            İletişim Mesajları
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {stats.totalContacts || 0} toplam mesaj
          </Typography>
        </Stack>

        {/* Status İstatistikleri */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            size="small"
            label={`Yeni: ${stats.statusBreakdown?.new || 0}`}
            color="error"
            variant="outlined"
          />
          <Chip
            size="small"
            label={`Okundu: ${stats.statusBreakdown?.read || 0}`}
            color="warning"
            variant="outlined"
          />
          <Chip
            size="small"
            label={`Yanıtlandı: ${stats.statusBreakdown?.replied || 0}`}
            color="success"
            variant="outlined"
          />
          <Chip
            size="small"
            label={`Kapandı: ${stats.statusBreakdown?.closed || 0}`}
            color="default"
            variant="outlined"
          />
        </Stack>
      </Stack>

      {/* Filtreler */}
      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={2}
        justifyContent="space-between"
        alignItems={isMobile ? "stretch" : "center"}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: isMobile ? "100%" : "auto" }}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="İsim, e-posta veya mesaj ara"
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
            <InputLabel>Durum</InputLabel>
            <Select
              value={selectedStatus}
              label="Durum"
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="all">Tümü</MenuItem>
              <MenuItem value="new">Yeni</MenuItem>
              <MenuItem value="read">Okundu</MenuItem>
              <MenuItem value="replied">Yanıtlandı</MenuItem>
              <MenuItem value="closed">Kapandı</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {(selectedStatus !== "all" || searchTerm) && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setSelectedStatus("all");
              setSearchTerm("");
            }}
          >
            Filtreleri Temizle
          </Button>
        )}
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
                <TableCell>Gönderen</TableCell>
                <TableCell>Mesaj</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Tarih</TableCell>
                <TableCell align="right">İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContacts.map((contact) => {
                const initial = String(contact.firstName || "?").charAt(0).toUpperCase();
                const fullName = `${contact.firstName || ""} ${contact.lastName || ""}`.trim();
                const messagePreview = contact.message?.substring(0, 100) + (contact.message?.length > 100 ? "..." : "");

                return (
                  <TableRow key={contact._id} hover>
                    {/* Gönderen Bilgileri */}
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar>{initial}</Avatar>
                        <Box>
                          <Typography fontWeight={600}>
                            {fullName || "İsimsiz"}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <IconMail size={14} />
                            <Typography variant="body2" color="textSecondary">
                              {contact.email}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <IconPhone size={14} />
                            <Typography variant="body2" color="textSecondary">
                              {contact.phone}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* Mesaj Önizlemesi */}
                    <TableCell>
                      <Typography
                        sx={{
                          maxWidth: 300,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {messagePreview}
                      </Typography>
                    </TableCell>

                    {/* Durum */}
                    <TableCell>
                      <Chip
                        size="small"
                        label={getStatusLabel(contact.status)}
                        color={getStatusColor(contact.status)}
                        variant="filled"
                      />
                    </TableCell>

                    {/* Tarih */}
                    <TableCell>
                      <Typography>
                        {moment(contact.createdAt).format("DD.MM.YYYY")}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {moment(contact.createdAt).format("HH:mm")}
                      </Typography>
                    </TableCell>

                    {/* İşlemler */}
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Detay Görüntüle">
                          <IconButton
                            onClick={() => {
                              setSelectedContact(contact);
                              setDetailOpen(true);
                            }}
                            sx={{ borderRadius: 2 }}
                          >
                            <IconEye size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Durum Değiştir">
                          <IconButton
                            onClick={() => handleStatusChange(contact)}
                            sx={{ borderRadius: 2 }}
                          >
                            <IconEdit size={18} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredContacts.length === 0 && (
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
                          ? "Arama kriterlerine uygun mesaj bulunamadı."
                          : "Henüz iletişim mesajı bulunmuyor."}
                      </Typography>
                      {(searchTerm || selectedStatus !== "all") && (
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setSearchTerm("");
                            setSelectedStatus("all");
                            setCurrentPage(1);
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

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
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
              <Avatar sx={{ bgcolor: "primary.main", width: 50, height: 50 }}>
                {String(selectedContact?.firstName || "?").charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedContact?.firstName} {selectedContact?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedContact?.email}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Chip
                size="small"
                label={getStatusLabel(selectedContact?.status)}
                color={getStatusColor(selectedContact?.status)}
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
            {selectedContact ? (
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
                              Ad Soyad
                            </Typography>
                            <Typography variant="body1">
                              {selectedContact.firstName} {selectedContact.lastName}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              E-posta
                            </Typography>
                            <Typography variant="body1">
                              {selectedContact.email}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Telefon
                            </Typography>
                            <Typography variant="body1">
                              {selectedContact.phone}
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
                              IP Adresi
                            </Typography>
                            <Typography variant="body1">
                              {selectedContact.ipAddress}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Tarayıcı
                            </Typography>
                            <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                              {selectedContact.userAgent}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Gönderim Tarihi
                            </Typography>
                            <Typography variant="body1">
                              {moment(selectedContact.createdAt).format("DD.MM.YYYY HH:mm")}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Son Güncelleme
                            </Typography>
                            <Typography variant="body1">
                              {moment(selectedContact.updatedAt).format("DD.MM.YYYY HH:mm")}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Mesaj */}
                  <Grid item xs={12}>
                    <Card elevation={1}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                          💬 Mesaj
                        </Typography>
                        <Box
                          sx={{
                            backgroundColor: theme.palette.grey[50],
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            whiteSpace: 'pre-wrap',
                            maxHeight: 300,
                            overflowY: 'auto'
                          }}
                        >
                          <Typography variant="body1">
                            {selectedContact.message}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Stack>
            ) : (
              <Typography color="text.secondary">Mesaj detayı yüklenemedi.</Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Durum Güncelleme Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>İletişim Mesajı Durumunu Güncelle</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {selectedContact?.firstName} {selectedContact?.lastName} adlı kişiden gelen mesajın durumunu güncelleyin.
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Yeni Durum</InputLabel>
              <Select
                value={newStatus}
                label="Yeni Durum"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <MenuItem value="new">Yeni</MenuItem>
                <MenuItem value="read">Okundu</MenuItem>
                <MenuItem value="replied">Yanıtlandı</MenuItem>
                <MenuItem value="closed">Kapandı</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>İptal</Button>
          <Button onClick={handleStatusUpdate} color="primary" variant="contained">
            Durumu Güncelle
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactList;
