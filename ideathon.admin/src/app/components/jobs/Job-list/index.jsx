"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { JobContext } from "@/app/context/JobContext";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  useMediaQuery,
  useTheme,
  Divider,
  Paper,
} from "@mui/material";
import {
  IconSearch,
  IconEdit,
  IconEye,
  IconTrash,
  IconDotsVertical,
  IconPlus,
  IconInfoCircle,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import Link from "next/link";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api";
const FILE_BASE = API_BASE_URL.replace("/api", "");

// -------- Helpers
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

const buildFileUrl = (file) => {
  if (!file) return null;
  if (typeof file !== "string") return null;
  if (file.startsWith("http://") || file.startsWith("https://")) return file;
  return `${FILE_BASE}/uploads/${file}`;
};

const deriveCompany = (job) => {
  const comp = isObj(job.company_id) ? job.company_id : null;
  const name = comp?.user_id?.name || comp?.name || job.custom_company_name || null;
  const logoFile = comp?.logo || job.custom_company_logo || null;
  const logoUrl = buildFileUrl(logoFile);
  return { name, logoUrl };
};

const JobList = () => {
  const { fetchJobs, deleteJob } = useContext(JobContext);
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuJob, setMenuJob] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const result = await fetchJobs();
    if (result.success) setJobs(result.data || []);
  };

  const handleMenuOpen = (event, job) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuJob(job);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleDelete = async () => {
    if (!menuJob) return;
    const result = await deleteJob(menuJob._id);
    if (result.success) {
      toast.success(result.message);
      loadJobs();
    } else {
      toast.error(result.message);
    }
    setOpenDeleteDialog(false);
    setMenuJob(null);
  };

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) =>
        String(job.title || "").toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [jobs, searchTerm]
  );

  return (
    <Box>
      {/* Üst Aksiyonlar */}
      <Stack
        direction={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "stretch" : "center"}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            İş İlanları
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {jobs.length} ilan listeleniyor
          </Typography>
        </Stack>

        <Stack direction={isMobile ? "column" : "row"} spacing={1} alignItems="center">
          <TextField
            size="small"
            variant="outlined"
            placeholder="Pozisyon adı ile arayın"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconSearch size={18} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            component={Link}
            href="/job/create"
            startIcon={<IconPlus />}
            sx={{
              boxShadow: "none",
              borderRadius: 2,
            }}
          >
            Yeni İlan Ekle
          </Button>
        </Stack>
      </Stack>

      {/* Tablo Kapsayıcı */}
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
              minWidth: "860px",
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
                <TableCell>Pozisyon</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell>Firma</TableCell>
                <TableCell>Başvuru Sayısı</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredJobs.map((job) => {
                const { name, logoUrl } = deriveCompany(job);
                const companyInitial = String(name || "?").charAt(0).toUpperCase();

                const approvedChip = job.is_approved ? (
                  <Chip label="Onaylı" color="success" size="small" />
                ) : (
                  <Tooltip
                    arrow
                    title={
                      <Stack spacing={0.5}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          Admin onayı bekliyor
                        </Typography>
                        <Typography variant="caption">
                          Onaylanana kadar ilan herkese görünmez.
                        </Typography>
                      </Stack>
                    }
                  >
                    <Chip
                      label={
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <IconInfoCircle size={14} />
                          <span>Beklemede</span>
                        </Stack>
                      }
                      color="warning"
                      size="small"
                      variant="filled"
                      sx={{
                        "&:hover": {
                          boxShadow: 2,
                        },
                      }}
                    />
                  </Tooltip>
                );

                const activeChip = job.is_active ? (
                  <Chip label="Aktif" color="primary" size="small" />
                ) : (
                  <Chip label="Pasif" size="small" variant="outlined" />
                );

                return (
                  <TableRow key={job._id} hover>
                    {/* Pozisyon */}
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography sx={{ fontWeight: 600 }}>
                          {job.title || "-"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {job.location || ""}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Kategori */}
                    <TableCell>{job.category || "-"}</TableCell>

                    {/* Firma */}
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar src={logoUrl || undefined}>{companyInitial}</Avatar>
                        <Stack>
                          <Typography sx={{ fontWeight: 500 }}>{name || "-"}</Typography>
                          {isObj(job.company_id) && job.company_id.sector ? (
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {job.company_id.sector}
                            </Typography>
                          ) : null}
                        </Stack>
                      </Stack>
                    </TableCell>

                    {/* Başvuru sayısı */}
                    <TableCell>{job.application_count ?? 0}</TableCell>

                    {/* Durum */}
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {approvedChip}
                        {activeChip}
                      </Stack>
                    </TableCell>

                    {/* İşlemler */}
                    <TableCell align="right">
                      <IconButton
                        aria-label="İşlemler"
                        onClick={(e) => handleMenuOpen(e, job)}
                        sx={{ borderRadius: 2 }}
                      >
                        <IconDotsVertical size={20} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredJobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography sx={{ color: "text.secondary", mb: 1 }}>
                      Kriterlere uygun ilan bulunamadı.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => setSearchTerm("")}
                      startIcon={<IconSearch size={16} />}
                    >
                      Filtreleri Temizle
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Silme Onay Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>İlanı Sil</DialogTitle>
        <DialogContent>
          <Typography>
            "{menuJob?.title}" pozisyonlu ilanı silmek istediğinize emin misiniz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>İptal</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* İşlem Menüsü */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem component={Link} href={`/job/view/${menuJob?._id}`}>
          <ListItemIcon>
            <IconEye size={18} />
          </ListItemIcon>
          Görüntüle
        </MenuItem>
        <MenuItem component={Link} href={`/job/edit/${menuJob?._id}`}>
          <ListItemIcon>
            <IconEdit size={18} />
          </ListItemIcon>
          Düzenle
        </MenuItem>
        <MenuItem
          onClick={() => {
            setOpenDeleteDialog(true);
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <IconTrash size={18} />
          </ListItemIcon>
          Sil
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default JobList;
