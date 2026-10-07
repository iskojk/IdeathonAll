"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { ReferenceContext } from "@/app/context/ReferenceContext";
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
} from "@mui/material";
import {
  IconSearch,
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconPlus,
  IconArrowUp,
  IconArrowDown,
  IconPower,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import Link from "next/link";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002/api";

const ReferenceList = () => {
  const {
    fetchReferences,
    deleteReference,
    toggleReferenceStatus,
    reorderReferences,
  } = useContext(ReferenceContext);

  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await fetchReferences({ sort: "order:asc" });
    if (res?.success) setRows(res.data || []);
  };

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const n = (r.name || "").toLowerCase();
      const l = (r.link || "").toLowerCase();
      return n.includes(q) || l.includes(q);
    });
  }, [rows, searchTerm]);

  const handleMenuOpen = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuRow(row);
  };
  const handleMenuClose = () => setAnchorEl(null);

  const handleDelete = async () => {
    if (!menuRow?._id) return;
    const res = await deleteReference(menuRow._id);
    if (res.success) {
      toast.success("Referans silindi");
      loadData();
    } else {
      toast.error(res.message || "Referans silinemedi");
    }
    setOpenDeleteDialog(false);
    setMenuRow(null);
  };

  const toggleStatus = async () => {
    if (!menuRow?._id) return;
    const res = await toggleReferenceStatus(menuRow._id, !menuRow.is_active);
    if (res.success) {
      toast.success("Durum güncellendi");
      loadData();
    } else {
      toast.error(res.message || "Durum güncellenemedi");
    }
    handleMenuClose();
  };

  // Sıra değiştir (yukarı/aşağı)
  const moveRow = async (index, dir) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= rows.length) return;
    const copy = [...rows];
    [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
    setRows(copy);
    await reorderReferences(copy.map((r) => r._id));
    await loadData();
  };

  return (
    <Box>
      {/* Arama ve Ekle */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <TextField
          size="small"
          variant="outlined"
          placeholder="Ad veya link ile arayın"
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
          href="/references/create"
          startIcon={<IconPlus />}
        >
          Yeni Referans Ekle
        </Button>
      </Stack>

      {/* Tablo */}
      <Box sx={{ overflowX: "auto", width: "100%" }}>
        <Table sx={{ whiteSpace: "nowrap", minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell>Logo</TableCell>
              <TableCell>Ad</TableCell>
              <TableCell>Link</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>Sıra</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((row, idx) => {
              const base = API_BASE_URL.replace("/api", "");
              const img =
                row.logo?.startsWith("/")
                  ? `${base}${row.logo}`
                  : row.logo || "";

              return (
                <TableRow key={row._id} hover>
                  <TableCell>
                    <Avatar
                      variant="rounded"
                      src={img}
                      sx={{ width: 64, height: 40, bgcolor: "grey.100" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography>{row.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary" sx={{ maxWidth: 320 }} noWrap>
                      {row.link || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.is_active ? "Aktif" : "Pasif"}
                      color={row.is_active ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Tooltip title="Yukarı">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => moveRow(idx, -1)}
                            disabled={idx === 0}
                          >
                            <IconArrowUp size={18} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Aşağı">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => moveRow(idx, +1)}
                            disabled={idx === filteredRows.length - 1}
                          >
                            <IconArrowDown size={18} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {row.order}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="İşlemler">
                      <IconButton onClick={(e) => handleMenuOpen(e, row)}>
                        <IconDotsVertical size={20} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
            {!filteredRows.length && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary">Kayıt bulunamadı</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Silme Onay Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Referans Sil</DialogTitle>
        <DialogContent>
          <Typography>
            "{menuRow?.name}" referansını silmek istediğinize emin misiniz?
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
        <MenuItem component={Link} href={`/references/edit/${menuRow?._id}`}>
          <ListItemIcon>
            <IconEdit size={18} />
          </ListItemIcon>{" "}
          Düzenle
        </MenuItem>
        <MenuItem onClick={toggleStatus}>
          <ListItemIcon>
            <IconPower size={18} />
          </ListItemIcon>{" "}
          {menuRow?.is_active ? "Pasifleştir" : "Aktifleştir"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setOpenDeleteDialog(true);
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <IconTrash size={18} />
          </ListItemIcon>{" "}
          Sil
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ReferenceList;
