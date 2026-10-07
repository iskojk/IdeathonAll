"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Chip,
  Box,
} from "@mui/material";
import {
  IconCalendarEvent,
  IconCheck,
  IconX,
  IconUser,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { planMeeting, getMyAssignedUsers } from "@/utils/api/mentor";

const PlanMeetingDialog = ({
  open,
  onClose,
  slot,
  meetingTypes = [],
  onSuccess,
}) => {
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    meetingProvider: "",
  });

  useEffect(() => {
    if (open) {
      loadAssignedUsers();
      setSelectedUser(null);
      setFormData({
        title: "",
        description: "",
        meetingProvider: slot?.meetingType || "",
      });
    }
  }, [open, slot]);

  const loadAssignedUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await getMyAssignedUsers();
      if (response.success) {
        setAssignedUsers(response.data || []);
      }
    } catch (error) {
      toast.error("Katılımcı listesi yüklenemedi");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      toast.error("Lütfen bir katılımcı seçin");
      return;
    }

    if (!slot?._id) {
      toast.error("Slot bilgisi eksik");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        slotId: slot._id,
        participantUserId: selectedUser._id,
        participantApplicationId: selectedUser.applicationId || undefined,
        teamId: selectedUser.teamId || undefined,
        title: formData.title?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        meetingProvider: formData.meetingProvider || undefined,
      };

      const response = await planMeeting(payload);
      if (response.success) {
        toast.success("Toplantı başarıyla planlandı");
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Toplantı planlanırken hata oluştu"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!slot) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          color: "#005DAD",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <IconCalendarEvent size={24} />
        Toplantı Planla
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Slot bilgisi */}
          <Paper sx={{ p: 2, bgcolor: "#E6F2FF", borderRadius: 2 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Tarih
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {format(parseISO(slot.startAt), "d MMMM yyyy, EEEE", {
                    locale: tr,
                  })}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Saat
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {format(parseISO(slot.startAt), "HH:mm")} -{" "}
                  {format(parseISO(slot.endAt), "HH:mm")}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Katılımcı seçimi */}
          {loadingUsers ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={30} />
            </Box>
          ) : assignedUsers.length === 0 ? (
            <Alert severity="warning">
              Bu ideathon'da onaylanmış başvuru sahibi bulunmamaktadır.
            </Alert>
          ) : (
            <Autocomplete
              options={assignedUsers}
              getOptionLabel={(option) =>
                `${option.name} (${option.email})${option.teamName ? ` - ${option.teamName}` : ""}`
              }
              filterOptions={(options, { inputValue }) => {
                const q = inputValue.toLowerCase();
                return options.filter(
                  (o) =>
                    o.name?.toLowerCase().includes(q) ||
                    o.email?.toLowerCase().includes(q) ||
                    o.teamName?.toLowerCase().includes(q)
                );
              }}
              value={selectedUser}
              onChange={(_, newValue) => setSelectedUser(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Katılımcı Seç"
                  placeholder="Ad, e-posta veya takım adı ile arayın..."
                  required
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <IconUser size={18} style={{ marginRight: 8, color: "#005DAD" }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option._id}>
                  <Stack spacing={0.3}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email}
                    </Typography>
                    {option.teamName && (
                      <Chip
                        label={option.teamName}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.7rem",
                          bgcolor: "#E6F2FF",
                          color: "#005DAD",
                          fontWeight: 600,
                          mt: 0.3,
                          width: "fit-content",
                        }}
                      />
                    )}
                  </Stack>
                </li>
              )}
              noOptionsText="Katılımcı bulunamadı"
              isOptionEqualToValue={(option, value) =>
                option._id === value?._id
              }
            />
          )}

          {/* Toplantı şekli */}
          {meetingTypes.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>Toplantı Şekli</InputLabel>
              <Select
                value={formData.meetingProvider}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    meetingProvider: e.target.value,
                  }))
                }
                label="Toplantı Şekli"
              >
                {meetingTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Başlık */}
          <TextField
            fullWidth
            label="Toplantı Başlığı (Opsiyonel)"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Örn: Proje Danışmanlığı"
          />

          {/* Açıklama */}
          <TextField
            fullWidth
            label="Açıklama (Opsiyonel)"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Toplantı hakkında kısa açıklama..."
            multiline
            rows={2}
          />

          {selectedUser && (
            <Alert severity="info" icon={<IconCalendarEvent size={20} />}>
              <strong>{selectedUser.name}</strong>
              {selectedUser.teamName && (
                <span> ({selectedUser.teamName})</span>
              )}{" "}
              ile {format(parseISO(slot.startAt), "d MMMM HH:mm", { locale: tr })}{" "}
              tarihinde toplantı planlanacak. Katılımcıya e-posta bildirimi
              gönderilecektir.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          startIcon={<IconX size={16} />}
          disabled={submitting}
        >
          İptal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={
            submitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <IconCheck size={16} />
            )
          }
          disabled={!selectedUser || submitting || assignedUsers.length === 0}
          sx={{
            bgcolor: "#005DAD",
            "&:hover": { bgcolor: "#004080" },
          }}
        >
          {submitting ? "Planlanıyor..." : "Toplantı Planla"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlanMeetingDialog;
