"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Tooltip,
  Alert,
  useTheme,
  useMediaQuery,
  Skeleton,
  CardHeader,
  ListItemButton,
} from "@mui/material";
import {
  IconSearch,
  IconUsers,
  IconUser,
  IconUserPlus,
  IconUserMinus,
  IconCrown,
  IconMail,
  IconPhone,
  IconRefresh,
  IconCheck,
  IconX,
  IconPlus,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { TeamProvider, useTeam } from "@/app/context/TeamContext";
import { toast } from "react-toastify";
import PageContainer from "@/app/components/container/PageContainer";

const StatsCard = ({ title, value, icon, color = "primary" }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Card
      sx={{
        height: "100%",
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette[color].main} 0%, ${theme.palette[color].dark} 100%)`,
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant={isMobile ? "h4" : "h3"} fontWeight="600">
              {value}
            </Typography>
            <Typography variant={isMobile ? "caption" : "subtitle2"} sx={{ opacity: 0.9, mt: 1 }}>
              {title}
            </Typography>
          </Box>
          <Avatar
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              width: isMobile ? 48 : 56,
              height: isMobile ? 48 : 56,
            }}
          >
            {React.cloneElement(icon, { size: isMobile ? 20 : 24 })}
          </Avatar>
        </Stack>
      </CardContent>
      <Box
        sx={{
          position: "absolute",
          bottom: -20,
          right: -20,
          opacity: 0.1,
          transform: "rotate(-15deg)",
        }}
      >
        {React.cloneElement(icon, { size: 120 })}
      </Box>
    </Card>
  );
};

// Lider Düzenle Dialog
const EditLeaderDialog = ({ open, onClose, member, onSave }) => {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setForm({
        firstName: member.firstName || "",
        lastName: member.lastName || "",
        email: member.email || "",
        phone: member.phone || "",
      });
    }
  }, [member]);

  const handleSave = async () => {
    if (!form.firstName.trim()) {
      toast.error("Ad zorunludur");
      return;
    }
    setSaving(true);
    const result = await onSave(member.applicationId, form);
    setSaving(false);
    if (result.success) {
      toast.success(result.message || "Lider bilgileri güncellendi");
      onClose();
    } else {
      toast.error(result.message || "Hata oluştu");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: "warning.main" }}>
            <IconCrown size={24} />
          </Avatar>
          <Typography variant="h6">Lider Düzenle</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Ad"
              fullWidth
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
            />
            <TextField
              label="Soyad"
              fullWidth
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
            />
          </Stack>
          <TextField
            label="E-posta"
            fullWidth
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
          <TextField
            label="Telefon"
            fullWidth
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Üye Düzenle Dialog (sadece ad, TC, rol)
const EditMemberDialog = ({ open, onClose, member, onSave }) => {
  const [form, setForm] = useState({ name: "", tcIdentity: "", role: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setForm({
        name: `${member.firstName || ""} ${member.lastName || ""}`.trim(),
        tcIdentity: member.tcIdentity || "",
        role: member.role || "",
      });
    }
  }, [member]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Ad Soyad zorunludur");
      return;
    }
    setSaving(true);
    const result = await onSave(member.ownerApplicationId, member.memberIndex, form);
    setSaving(false);
    if (result.success) {
      toast.success(result.message || "Üye bilgileri güncellendi");
      onClose();
    } else {
      toast.error(result.message || "Hata oluştu");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <IconEdit size={24} />
          </Avatar>
          <Typography variant="h6">Üye Düzenle</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Ad Soyad"
            fullWidth
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <TextField
            label="TC Kimlik No"
            fullWidth
            value={form.tcIdentity}
            onChange={(e) => setForm((p) => ({ ...p, tcIdentity: e.target.value }))}
            inputProps={{ maxLength: 11 }}
          />
          <TextField
            label="Rol"
            fullWidth
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            placeholder="Örn: Yazılımcı, Tasarımcı..."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Üye Ekle Dialog (sadece ad, TC, rol)
const AddMemberDialog = ({ open, onClose, team, onSave }) => {
  const [form, setForm] = useState({ name: "", tcIdentity: "", role: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ name: "", tcIdentity: "", role: "" });
  }, [open]);

  const ownerApp = team?.members?.find((m) => m.isProjectOwner);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Ad Soyad zorunludur");
      return;
    }
    if (!ownerApp?.applicationId) {
      toast.error("Takım sahibi başvurusu bulunamadı");
      return;
    }
    setSaving(true);
    const result = await onSave(ownerApp.applicationId, form);
    setSaving(false);
    if (result.success) {
      toast.success(result.message || "Üye eklendi");
      onClose();
    } else {
      toast.error(result.message || "Hata oluştu");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: "success.main" }}>
            <IconUserPlus size={24} />
          </Avatar>
          <Box>
            <Typography variant="h6">Yeni Üye Ekle</Typography>
            {team && (
              <Typography variant="caption" color="text.secondary">
                {team.teamName}
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Ad Soyad"
            fullWidth
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            autoFocus
          />
          <TextField
            label="TC Kimlik No"
            fullWidth
            value={form.tcIdentity}
            onChange={(e) => setForm((p) => ({ ...p, tcIdentity: e.target.value }))}
            inputProps={{ maxLength: 11 }}
          />
          <TextField
            label="Rol"
            fullWidth
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            placeholder="Örn: Yazılımcı, Tasarımcı..."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button onClick={handleSave} variant="contained" color="success" disabled={saving} startIcon={<IconPlus size={18} />}>
          {saving ? "Ekleniyor..." : "Ekle"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Üye Sil Onay Dialog
const RemoveMemberConfirmDialog = ({ open, onClose, member, teamName, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    const result = await onConfirm(member.ownerApplicationId, member.memberIndex);
    setDeleting(false);
    if (result.success) {
      toast.success(result.message || "Üye silindi");
      onClose();
    } else {
      toast.error(result.message || "Hata oluştu");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconTrash size={24} color="red" />
          <Typography variant="h6">Üye Sil</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mt: 1 }}>
          <Typography variant="body2" component="div">
            <strong>{member?.firstName} {member?.lastName}</strong> kişisini{" "}
            <strong>{teamName}</strong> takımından silmek istediğinize emin misiniz?
            <br /><br />
            Bu işlem geri alınamaz.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={deleting}
          startIcon={<IconTrash size={18} />}
        >
          {deleting ? "Siliniyor..." : "Sil"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Takım Adı Düzenle Dialog
const EditTeamNameDialog = ({ open, onClose, team, onSave }) => {
  const [teamName, setTeamName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (team) setTeamName(team.teamName || "");
  }, [team]);

  const handleSave = async () => {
    if (!teamName.trim()) {
      toast.error("Takım adı zorunludur");
      return;
    }
    setSaving(true);
    const result = await onSave(team, teamName.trim());
    setSaving(false);
    if (result.success) {
      toast.success(result.message || "Takım adı güncellendi");
      onClose();
    } else {
      toast.error(result.message || "Hata oluştu");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <IconUsers size={24} />
          </Avatar>
          <Typography variant="h6">Takım Adını Düzenle</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Takım Adı"
          fullWidth
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          sx={{ mt: 1 }}
          autoFocus
        />
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Ad-hoc Takım Oluştur Dialog
const CreateAdHocTeamDialog = ({ open, onClose, onSave }) => {
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState([{ name: "", tcIdentity: "", role: "" }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTeamName("");
      setMembers([{ name: "", tcIdentity: "", role: "" }]);
    }
  }, [open]);

  const addMemberRow = () => {
    setMembers((prev) => [...prev, { name: "", tcIdentity: "", role: "" }]);
  };

  const removeMemberRow = (idx) => {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateMemberRow = (idx, field, value) => {
    setMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const handleSave = async () => {
    if (!teamName.trim()) {
      toast.error("Takım adı zorunludur");
      return;
    }
    const validMembers = members.filter((m) => m.name.trim());
    if (validMembers.length === 0) {
      toast.error("En az bir üye eklenmelidir");
      return;
    }
    setSaving(true);
    const result = await onSave({ teamName: teamName.trim(), members: validMembers });
    setSaving(false);
    if (result.success) {
      toast.success(result.message || "Takım oluşturuldu");
      onClose();
    } else {
      toast.error(result.message || "Hata oluştu");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: "success.main" }}>
            <IconUsers size={24} />
          </Avatar>
          <Box>
            <Typography variant="h6">Yeni Takım Oluştur</Typography>
            <Typography variant="caption" color="text.secondary">
              Başvuru olmadan doğrudan takım ekleyin
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Takım Adı"
            fullWidth
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            autoFocus
          />
          <Divider />
          <Typography variant="subtitle2" fontWeight="600">
            Takım Üyeleri
          </Typography>
          {members.map((member, idx) => (
            <Paper key={idx} sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" fontWeight="600" color="text.secondary">
                    {idx === 0 ? "Takım Lideri" : `Üye ${idx + 1}`}
                  </Typography>
                  {idx > 0 && (
                    <IconButton size="small" color="error" onClick={() => removeMemberRow(idx)}>
                      <IconTrash size={16} />
                    </IconButton>
                  )}
                </Stack>
                <TextField
                  label="Ad Soyad"
                  fullWidth
                  size="small"
                  value={member.name}
                  onChange={(e) => updateMemberRow(idx, "name", e.target.value)}
                />
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="TC Kimlik No"
                    fullWidth
                    size="small"
                    value={member.tcIdentity}
                    onChange={(e) => updateMemberRow(idx, "tcIdentity", e.target.value)}
                    inputProps={{ maxLength: 11 }}
                  />
                  <TextField
                    label="Rol"
                    fullWidth
                    size="small"
                    value={member.role}
                    onChange={(e) => updateMemberRow(idx, "role", e.target.value)}
                    placeholder={idx === 0 ? "Takım Lideri" : "Üye"}
                  />
                </Stack>
              </Stack>
            </Paper>
          ))}
          <Button
            startIcon={<IconPlus size={18} />}
            onClick={addMemberRow}
            variant="outlined"
            size="small"
            sx={{ alignSelf: "flex-start" }}
          >
            Üye Ekle
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button onClick={handleSave} variant="contained" color="success" disabled={saving} startIcon={<IconPlus size={18} />}>
          {saving ? "Oluşturuluyor..." : "Takım Oluştur"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Ad-hoc Üye Düzenle Dialog (Team koleksiyonu üzerinden)
const EditAdHocMemberDialog = ({ open, onClose, member, onSave }) => {
  const [form, setForm] = useState({ name: "", tcIdentity: "", role: "", email: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setForm({
        name: `${member.firstName || ""} ${member.lastName || ""}`.trim(),
        tcIdentity: member.tcIdentity || "",
        role: member.role || "",
        email: member.email || "",
      });
    }
  }, [member]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Ad Soyad zorunludur");
      return;
    }
    setSaving(true);
    const result = await onSave(member.teamId, member.memberId, form);
    setSaving(false);
    if (result.success) {
      toast.success(result.message || "Üye güncellendi");
      onClose();
    } else {
      toast.error(result.message || "Hata oluştu");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <IconEdit size={24} />
          </Avatar>
          <Typography variant="h6">Üye Düzenle</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField label="Ad Soyad" fullWidth value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <TextField label="TC Kimlik No" fullWidth value={form.tcIdentity} onChange={(e) => setForm((p) => ({ ...p, tcIdentity: e.target.value }))} inputProps={{ maxLength: 11 }} />
          <TextField label="Rol" fullWidth value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} placeholder="Örn: Yazılımcı, Tasarımcı..." />
          <TextField label="E-posta" fullWidth value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Ad-hoc Üye Ekle Dialog (Team koleksiyonu üzerinden)
const AddAdHocMemberDialog = ({ open, onClose, team, onSave }) => {
  const [form, setForm] = useState({ name: "", tcIdentity: "", role: "", email: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ name: "", tcIdentity: "", role: "", email: "" });
  }, [open]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Ad Soyad zorunludur");
      return;
    }
    setSaving(true);
    const result = await onSave(team?.teamId, form);
    setSaving(false);
    if (result.success) {
      toast.success(result.message || "Üye eklendi");
      onClose();
    } else {
      toast.error(result.message || "Hata oluştu");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: "success.main" }}>
            <IconUserPlus size={24} />
          </Avatar>
          <Box>
            <Typography variant="h6">Yeni Üye Ekle</Typography>
            {team && <Typography variant="caption" color="text.secondary">{team.teamName}</Typography>}
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField label="Ad Soyad" fullWidth value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} autoFocus />
          <TextField label="TC Kimlik No" fullWidth value={form.tcIdentity} onChange={(e) => setForm((p) => ({ ...p, tcIdentity: e.target.value }))} inputProps={{ maxLength: 11 }} />
          <TextField label="Rol" fullWidth value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} placeholder="Örn: Yazılımcı, Tasarımcı..." />
          <TextField label="E-posta" fullWidth value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button onClick={handleSave} variant="contained" color="success" disabled={saving} startIcon={<IconPlus size={18} />}>
          {saving ? "Ekleniyor..." : "Ekle"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Ad-hoc Üye Sil Onay Dialog
const RemoveAdHocMemberConfirmDialog = ({ open, onClose, member, teamName, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    const result = await onConfirm(member.teamId, member.memberId);
    setDeleting(false);
    if (result.success) {
      toast.success(result.message || "Üye silindi");
      onClose();
    } else {
      toast.error(result.message || "Hata oluştu");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconTrash size={24} color="red" />
          <Typography variant="h6">Üye Sil</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mt: 1 }}>
          <Typography variant="body2" component="div">
            <strong>{member?.firstName} {member?.lastName}</strong> kişisini{" "}
            <strong>{teamName}</strong> takımından silmek istediğinize emin misiniz?
            <br /><br />
            Bu işlem geri alınamaz.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button onClick={handleConfirm} variant="contained" color="error" disabled={deleting} startIcon={<IconTrash size={18} />}>
          {deleting ? "Siliniyor..." : "Sil"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Harici Takım Sil Onay Dialog
const DeleteAdHocTeamDialog = ({ open, onClose, team, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    const result = await onConfirm(team?.teamId);
    setDeleting(false);
    if (result.success) {
      toast.success(result.message || "Takım silindi");
      onClose();
    } else {
      toast.error(result.message || "Hata oluştu");
    }
  };

  if (!team) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconTrash size={24} color="red" />
          <Typography variant="h6">Takımı Sil</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mt: 1 }}>
          <Typography variant="body2" component="div">
            <strong>{team.teamName}</strong> takımını ve tüm üyelerini silmek istediğinize emin misiniz?
            <br /><br />
            Bu işlem geri alınamaz.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button onClick={handleConfirm} variant="contained" color="error" disabled={deleting} startIcon={<IconTrash size={18} />}>
          {deleting ? "Siliniyor..." : "Takımı Sil"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Bireysel Başvuru Seçme Dialog'u (eski tasarım)
const AddIndividualDialog = ({ open, onClose, team, individuals, onAddMember }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndividual, setSelectedIndividual] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const filteredIndividuals = individuals.filter((ind) =>
    ind.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    if (selectedIndividual && team) {
      onAddMember(selectedIndividual.applicationId, team.teamName);
      setSelectedIndividual(null);
      setSearchTerm("");
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedIndividual(null);
    setSearchTerm("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <IconUserPlus size={24} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">Bireysel Başvuru Ekle</Typography>
            {team && (
              <Typography variant="caption" color="text.secondary">
                {team.teamName}
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleClose} size="small">
            <IconX size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Alert severity="info" icon={<IconUsers size={20} />}>
            <strong>{individuals.length}</strong> bireysel başvuru mevcut. Takıma eklemek için birini seçin.
          </Alert>
          <TextField
            fullWidth
            placeholder="Ad, soyad ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={20} />
                </InputAdornment>
              ),
            }}
            autoFocus
          />
          {filteredIndividuals.length === 0 ? (
            <Alert severity="warning">
              {searchTerm ? "Arama sonucu bulunamadı" : "Henüz bireysel başvuru bulunmuyor"}
            </Alert>
          ) : (
            <Paper variant="outlined" sx={{ maxHeight: "400px", overflowY: "auto" }}>
              <List sx={{ p: 0 }}>
                {filteredIndividuals.map((individual, idx) => (
                  <React.Fragment key={individual.applicationId}>
                    <ListItemButton
                      selected={selectedIndividual?.applicationId === individual.applicationId}
                      onClick={() => setSelectedIndividual(individual)}
                      sx={{
                        "&.Mui-selected": {
                          bgcolor: "primary.lighter",
                          "&:hover": { bgcolor: "primary.light" },
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "success.main" }}>
                          <IconUser size={20} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight="600">
                            {individual.fullName}
                          </Typography>
                        }
                        secondary={
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            {individual.email && (
                              <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <IconMail size={12} />
                                {individual.email}
                              </Typography>
                            )}
                            {individual.phone && (
                              <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <IconPhone size={12} />
                                {individual.phone}
                              </Typography>
                            )}
                          </Stack>
                        }
                        secondaryTypographyProps={{ component: "div" }}
                      />
                      {selectedIndividual?.applicationId === individual.applicationId && (
                        <ListItemSecondaryAction>
                          <IconCheck size={24} color={theme.palette.primary.main} />
                        </ListItemSecondaryAction>
                      )}
                    </ListItemButton>
                    {idx < filteredIndividuals.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={handleClose} color="inherit" size="large">İptal</Button>
        <Button onClick={handleAdd} variant="contained" disabled={!selectedIndividual} startIcon={<IconUserPlus size={18} />} size="large">
          Takıma Ekle
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Takım Kartı
const TeamCard = ({ team, onEditLeader, onEditMember, onRemoveMember, onAddMember, onAddIndividual, onEditTeamName, onEditAdHocMember, onRemoveAdHocMember, onAddAdHocMember, onDeleteAdHocTeam }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isAdHoc = !!team.isAdHoc;

  const projectOwners = team.members.filter((m) => m.isProjectOwner);
  const mainProjectOwner = isAdHoc ? null : projectOwners[0];
  const otherMembers = isAdHoc ? team.members : team.members.filter((m) => m !== mainProjectOwner);

  return (
    <Card
      sx={{
        height: "100%",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: theme.shadows[10],
          transform: "translateY(-4px)",
        },
        position: "relative",
        ...(isAdHoc && {
          border: `2px solid ${theme.palette.info.main}30`,
        }),
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: isAdHoc ? "info.main" : "primary.main", width: 48, height: 48 }}>
            <IconUsers size={24} />
          </Avatar>
        }
        action={
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Yeni Üye Ekle">
              <IconButton color="success" size="small" onClick={() => isAdHoc ? onAddAdHocMember(team) : onAddMember(team)}>
                <IconPlus size={20} />
              </IconButton>
            </Tooltip>
            {!isAdHoc && (
              <Tooltip title="Bireysel Başvuru Ekle">
                <IconButton color="primary" size="small" onClick={() => onAddIndividual(team)}>
                  <IconUserPlus size={20} />
                </IconButton>
              </Tooltip>
            )}
            {isAdHoc && (
              <Tooltip title="Takımı Sil">
                <IconButton color="error" size="small" onClick={() => onDeleteAdHocTeam(team)}>
                  <IconTrash size={20} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        }
        title={
          <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="600">
              {team.teamName}
            </Typography>
            <Tooltip title="Takım Adını Düzenle">
              <IconButton size="small" onClick={() => onEditTeamName(team)} sx={{ opacity: 0.5, "&:hover": { opacity: 1 } }}>
                <IconEdit size={16} />
              </IconButton>
            </Tooltip>
            {isAdHoc && (
              <Chip label="Harici Takım" size="small" color="info" sx={{ height: 20, fontSize: "0.65rem" }} />
            )}
          </Stack>
        }
        subheader={
          <Chip label={`${team.members.length} Üye`} size="small" color="primary" variant="outlined" sx={{ mt: 0.5 }} />
        }
      />

      <CardContent sx={{ pt: 0 }}>
        <Divider sx={{ mb: 2 }} />

        {/* Proje Sahibi — sadece Application bazlı takımlarda */}
        {!isAdHoc && mainProjectOwner && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <IconCrown size={18} color={theme.palette.warning.main} />
              <Typography variant="subtitle2" fontWeight="600" color="warning.main">
                Proje Sahibi
              </Typography>
            </Stack>
            <Paper
              sx={{
                p: 2,
                bgcolor: "warning.lighter",
                border: (theme) => `2px solid ${theme.palette.warning.main}`,
                borderRadius: 2,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: "warning.main", width: 40, height: 40 }}>
                  {mainProjectOwner.firstName?.[0]}
                  {mainProjectOwner.lastName?.[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="600">
                    {mainProjectOwner.firstName} {mainProjectOwner.lastName}
                  </Typography>
                  <Stack spacing={0.3} sx={{ mt: 0.5 }}>
                    {mainProjectOwner.email && (
                      <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                        <IconMail size={14} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{mainProjectOwner.email}</span>
                      </Typography>
                    )}
                    {mainProjectOwner.phone && (
                      <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <IconPhone size={14} style={{ flexShrink: 0 }} />
                        {mainProjectOwner.phone}
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <Tooltip title="Lider Düzenle">
                  <IconButton size="small" color="warning" onClick={() => onEditLeader(mainProjectOwner)}>
                    <IconEdit size={18} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          </Box>
        )}

        {/* Üyeler */}
        {otherMembers.length > 0 && (
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <IconUsers size={18} color={theme.palette.primary.main} />
              <Typography variant="subtitle2" fontWeight="600" color="primary.main">
                {isAdHoc ? "Üyeler" : "Takım Üyeleri"} ({otherMembers.length})
              </Typography>
            </Stack>
            <Stack spacing={1}>
              {otherMembers.map((member, idx) => (
                <Paper
                  key={idx}
                  sx={{
                    p: 1.5,
                    bgcolor: "grey.50",
                    borderRadius: 1,
                    transition: "all 0.2s",
                    "&:hover": { bgcolor: "grey.100", boxShadow: 1 },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" fontWeight="600">
                          {member.firstName} {member.lastName}
                        </Typography>
                        {member.isProjectOwner && (
                          <Chip icon={<IconCrown size={12} />} label="Proje Sahibi" size="small" color="warning" sx={{ height: "20px", fontSize: "0.65rem" }} />
                        )}
                        {member.isAddedIndividual && (
                          <Chip label="Bireysel" size="small" color="info" variant="outlined" sx={{ height: "20px", fontSize: "0.65rem" }} />
                        )}
                        {isAdHoc && idx === 0 && (
                          <Chip icon={<IconCrown size={12} />} label="Lider" size="small" color="warning" sx={{ height: "20px", fontSize: "0.65rem" }} />
                        )}
                      </Stack>
                      <Stack spacing={0.3} sx={{ mt: 0.5 }}>
                        {member.tcIdentity && (
                          <Typography variant="caption" color="text.secondary">
                            TC: {member.tcIdentity}
                          </Typography>
                        )}
                        {member.email && isAdHoc && (
                          <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <IconMail size={12} /> {member.email}
                          </Typography>
                        )}
                        {member.role && (
                          <Typography variant="caption" color="primary.main" fontWeight="500">
                            {member.role}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      {isAdHoc && member.memberId && (
                        <>
                          <Tooltip title="Düzenle">
                            <IconButton size="small" color="primary" onClick={() => onEditAdHocMember({ ...member, teamId: team.teamId })}>
                              <IconEdit size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sil">
                            <IconButton size="small" color="error" onClick={() => onRemoveAdHocMember({ ...member, teamId: team.teamId }, team.teamName)}>
                              <IconTrash size={16} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {!isAdHoc && !member.isAddedIndividual && member.memberIndex !== undefined && (
                        <>
                          <Tooltip title="Düzenle">
                            <IconButton size="small" color="primary" onClick={() => onEditMember(member)}>
                              <IconEdit size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sil">
                            <IconButton size="small" color="error" onClick={() => onRemoveMember(member, team.teamName)}>
                              <IconTrash size={16} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {otherMembers.length === 0 && !mainProjectOwner && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Henüz üye bulunmuyor. + butonuna tıklayarak üye ekleyebilirsiniz.
          </Alert>
        )}

        {!isAdHoc && otherMembers.length === 0 && mainProjectOwner && (
          <Alert severity="info" icon={<IconUserPlus size={18} />}>
            + butonuna tıklayarak takıma üye ekleyebilirsiniz
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// Ana Sayfa
const TeamsListPage = () => {
  const {
    teams, individuals, stats, loading, error,
    fetchTeamsAndIndividuals, addIndividualToTeam, removeFromTeam,
    updateTeamName, updateLeaderInfo, addApprovedMember, updateApprovedMember, removeApprovedMember,
    createAdHocTeam, addAdHocMember, updateAdHocMember, removeAdHocMember, updateAdHocTeam, deleteAdHocTeam,
  } = useTeam();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [teamsSearch, setTeamsSearch] = useState("");

  // Dialogs
  const [editLeaderDialog, setEditLeaderDialog] = useState({ open: false, member: null });
  const [editMemberDialog, setEditMemberDialog] = useState({ open: false, member: null });
  const [addMemberDialog, setAddMemberDialog] = useState({ open: false, team: null });
  const [removeMemberDialog, setRemoveMemberDialog] = useState({ open: false, member: null, teamName: "" });
  const [editTeamNameDialog, setEditTeamNameDialog] = useState({ open: false, team: null });
  const [addIndividualDialog, setAddIndividualDialog] = useState({ open: false, team: null });
  const [createAdHocDialog, setCreateAdHocDialog] = useState(false);
  const [editAdHocMemberDialog, setEditAdHocMemberDialog] = useState({ open: false, member: null });
  const [addAdHocMemberDialog, setAddAdHocMemberDialog] = useState({ open: false, team: null });
  const [removeAdHocMemberDialog, setRemoveAdHocMemberDialog] = useState({ open: false, member: null, teamName: "" });
  const [deleteAdHocTeamDialog, setDeleteAdHocTeamDialog] = useState({ open: false, team: null });
  const [removeIndividualDialog, setRemoveIndividualDialog] = useState({
    open: false,
    applicationId: null,
    memberName: "",
    teamName: "",
  });

  useEffect(() => {
    fetchTeamsAndIndividuals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTeams = teams.filter((team) => team.teamName.toLowerCase().includes(teamsSearch.toLowerCase()));

  const handleRefresh = () => {
    fetchTeamsAndIndividuals();
    toast.info("Liste yenileniyor...");
  };

  // Takım adı düzenle
  const handleUpdateTeamName = async (team, newName) => {
    if (team.isAdHoc) {
      return handleUpdateAdHocTeamName(team, newName);
    }
    const result = await updateTeamName(team.teamName, newName);
    if (result.success) await fetchTeamsAndIndividuals();
    return result;
  };

  // Lider düzenle
  const handleUpdateLeader = async (applicationId, data) => {
    const result = await updateLeaderInfo(applicationId, data);
    if (result.success) await fetchTeamsAndIndividuals();
    return result;
  };

  // Üye düzenle
  const handleUpdateMember = async (applicationId, memberIndex, data) => {
    const result = await updateApprovedMember(applicationId, memberIndex, data);
    if (result.success) await fetchTeamsAndIndividuals();
    return result;
  };

  // Üye ekle
  const handleAddMember = async (applicationId, data) => {
    const result = await addApprovedMember(applicationId, data);
    if (result.success) await fetchTeamsAndIndividuals();
    return result;
  };

  // Üye sil
  const handleRemoveMember = async (applicationId, memberIndex) => {
    const result = await removeApprovedMember(applicationId, memberIndex);
    if (result.success) await fetchTeamsAndIndividuals();
    return result;
  };

  // Ad-hoc takım oluştur
  const handleCreateAdHocTeam = async (teamData) => {
    const result = await createAdHocTeam(teamData);
    if (result.success) await fetchTeamsAndIndividuals();
    return result;
  };

  // Ad-hoc üye ekle
  const handleAddAdHocMember = async (teamId, data) => {
    const result = await addAdHocMember(teamId, data);
    if (result.success) await fetchTeamsAndIndividuals();
    return result;
  };

  // Ad-hoc üye düzenle
  const handleUpdateAdHocMember = async (teamId, memberId, data) => {
    const result = await updateAdHocMember(teamId, memberId, data);
    if (result.success) await fetchTeamsAndIndividuals();
    return result;
  };

  // Ad-hoc üye sil
  const handleRemoveAdHocMember = async (teamId, memberId) => {
    const result = await removeAdHocMember(teamId, memberId);
    if (result.success) await fetchTeamsAndIndividuals();
    return result;
  };

  // Ad-hoc takımı sil
  const handleDeleteAdHocTeam = async (teamId) => {
    const result = await deleteAdHocTeam(teamId);
    if (result.success) await fetchTeamsAndIndividuals();
    return result;
  };

  // Ad-hoc takım adı düzenle
  const handleUpdateAdHocTeamName = async (team, newName) => {
    const result = await updateAdHocTeam(team.teamId, { teamName: newName });
    if (result.success) await fetchTeamsAndIndividuals();
    return result;
  };

  // Bireysel başvuruyu takıma ekle
  const handleAddIndividual = async (individualId, teamName) => {
    const result = await addIndividualToTeam(individualId, teamName);
    if (result.success) {
      toast.success(result.message || "Başarıyla takıma eklendi");
    } else {
      toast.error(result.message || "Takıma eklenirken hata oluştu");
    }
  };

  // Takımdan bireysel çıkar
  const handleRemoveIndividual = async () => {
    const result = await removeFromTeam(removeIndividualDialog.applicationId);
    if (result.success) {
      toast.success(result.message || "Üye başarıyla takımdan çıkarıldı");
    } else {
      toast.error(result.message || "Üye çıkarılırken hata oluştu");
    }
    setRemoveIndividualDialog({ open: false, applicationId: null, memberName: "", teamName: "" });
  };

  return (
    <PageContainer title="Takım Yönetimi" description="Onaylı takımlar ve bireysel başvurular">
      <Box>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant={isMobile ? "h4" : "h3"} fontWeight="700">
              Takım Yönetimi
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Onaylı başvuruları takımlar halinde yönetin
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="contained"
              color="success"
              startIcon={<IconPlus size={20} />}
              onClick={() => setCreateAdHocDialog(true)}
              size={isMobile ? "small" : "medium"}
            >
              {isMobile ? "Takım" : "Yeni Takım Oluştur"}
            </Button>
            <Tooltip title="Yenile">
              <IconButton onClick={handleRefresh} color="primary" disabled={loading} size="large">
                <IconRefresh size={24} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* İstatistikler */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <StatsCard title="Toplam Onaylı" value={stats.totalApproved} icon={<IconCheck size={28} />} color="success" />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatsCard title="Toplam Takım" value={stats.totalTeams} icon={<IconUsers size={28} />} color="primary" />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatsCard title="Bireysel Başvuru" value={stats.totalIndividuals} icon={<IconUser size={28} />} color="warning" />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatsCard title="Toplam Üye" value={stats.totalTeamMembers} icon={<IconUsers size={28} />} color="secondary" />
          </Grid>
        </Grid>

        {/* Arama */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              placeholder="Takım ara..."
              value={teamsSearch}
              onChange={(e) => setTeamsSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={20} />
                  </InputAdornment>
                ),
              }}
            />
          </CardContent>
        </Card>

        {/* Takım Kartları */}
        {loading && teams.length === 0 ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} sm={6} lg={4} key={i}>
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : error && teams.length === 0 ? (
          <Alert severity="error">{error}</Alert>
        ) : filteredTeams.length === 0 ? (
          <Alert severity="info">{teamsSearch ? "Arama sonucu takım bulunamadı" : "Henüz takım bulunmuyor"}</Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredTeams.map((team, idx) => (
              <Grid item xs={12} sm={6} lg={4} key={idx}>
                <TeamCard
                  team={team}
                  onEditLeader={(member) => setEditLeaderDialog({ open: true, member })}
                  onEditMember={(member) => setEditMemberDialog({ open: true, member })}
                  onRemoveMember={(member, teamName) => setRemoveMemberDialog({ open: true, member, teamName })}
                  onAddMember={(team) => setAddMemberDialog({ open: true, team })}
                  onAddIndividual={(team) => setAddIndividualDialog({ open: true, team })}
                  onEditTeamName={(team) => setEditTeamNameDialog({ open: true, team })}
                  onEditAdHocMember={(member) => setEditAdHocMemberDialog({ open: true, member })}
                  onRemoveAdHocMember={(member, teamName) => setRemoveAdHocMemberDialog({ open: true, member, teamName })}
                  onAddAdHocMember={(team) => setAddAdHocMemberDialog({ open: true, team })}
                  onDeleteAdHocTeam={(team) => setDeleteAdHocTeamDialog({ open: true, team })}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Dialogs */}
      <EditTeamNameDialog
        open={editTeamNameDialog.open}
        onClose={() => setEditTeamNameDialog({ open: false, team: null })}
        team={editTeamNameDialog.team}
        onSave={handleUpdateTeamName}
      />
      <EditLeaderDialog
        open={editLeaderDialog.open}
        onClose={() => setEditLeaderDialog({ open: false, member: null })}
        member={editLeaderDialog.member}
        onSave={handleUpdateLeader}
      />
      <EditMemberDialog
        open={editMemberDialog.open}
        onClose={() => setEditMemberDialog({ open: false, member: null })}
        member={editMemberDialog.member}
        onSave={handleUpdateMember}
      />
      <AddMemberDialog
        open={addMemberDialog.open}
        onClose={() => setAddMemberDialog({ open: false, team: null })}
        team={addMemberDialog.team}
        onSave={handleAddMember}
      />
      <RemoveMemberConfirmDialog
        open={removeMemberDialog.open}
        onClose={() => setRemoveMemberDialog({ open: false, member: null, teamName: "" })}
        member={removeMemberDialog.member}
        teamName={removeMemberDialog.teamName}
        onConfirm={handleRemoveMember}
      />
      <AddIndividualDialog
        open={addIndividualDialog.open}
        onClose={() => setAddIndividualDialog({ open: false, team: null })}
        team={addIndividualDialog.team}
        individuals={individuals}
        onAddMember={handleAddIndividual}
      />
      <CreateAdHocTeamDialog
        open={createAdHocDialog}
        onClose={() => setCreateAdHocDialog(false)}
        onSave={handleCreateAdHocTeam}
      />
      <EditAdHocMemberDialog
        open={editAdHocMemberDialog.open}
        onClose={() => setEditAdHocMemberDialog({ open: false, member: null })}
        member={editAdHocMemberDialog.member}
        onSave={handleUpdateAdHocMember}
      />
      <AddAdHocMemberDialog
        open={addAdHocMemberDialog.open}
        onClose={() => setAddAdHocMemberDialog({ open: false, team: null })}
        team={addAdHocMemberDialog.team}
        onSave={handleAddAdHocMember}
      />
      <RemoveAdHocMemberConfirmDialog
        open={removeAdHocMemberDialog.open}
        onClose={() => setRemoveAdHocMemberDialog({ open: false, member: null, teamName: "" })}
        member={removeAdHocMemberDialog.member}
        teamName={removeAdHocMemberDialog.teamName}
        onConfirm={handleRemoveAdHocMember}
      />
      <DeleteAdHocTeamDialog
        open={deleteAdHocTeamDialog.open}
        onClose={() => setDeleteAdHocTeamDialog({ open: false, team: null })}
        team={deleteAdHocTeamDialog.team}
        onConfirm={handleDeleteAdHocTeam}
      />

      {/* Bireysel Çıkarma Onay */}
      <Dialog
        open={removeIndividualDialog.open}
        onClose={() => setRemoveIndividualDialog({ open: false, applicationId: null, memberName: "", teamName: "" })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconUserMinus size={24} />
            <Typography variant="h6">Takımdan Çıkar</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            <Typography variant="body2" component="div">
              <strong>{removeIndividualDialog.memberName}</strong> kişisini <strong>{removeIndividualDialog.teamName}</strong> takımından çıkarmak istediğinize emin misiniz?
              <br /><br />
              Bu kişi tekrar bireysel başvuru olarak listelenecektir.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setRemoveIndividualDialog({ open: false, applicationId: null, memberName: "", teamName: "" })} color="inherit" size="large">
            İptal
          </Button>
          <Button onClick={handleRemoveIndividual} variant="contained" color="error" startIcon={<IconUserMinus size={18} />} size="large">
            Çıkar
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default function TeamsPage() {
  return (
    <TeamProvider>
      <TeamsListPage />
    </TeamProvider>
  );
}
