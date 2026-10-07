"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Switch,
  FormControlLabel,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Button,
} from "@mui/material";
import {
  IconBell,
  IconCalendarEvent,
  IconX,
  IconNotes,
  IconCalendar,
  IconMessage,
  IconAlarmSnooze,
  IconCheck,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { getEmailPreferences, updateEmailPreferences } from "@/utils/api/mentor";

const NotificationSettingsView = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    meetingCreated: true,
    meetingCancelled: true,
    meetingNoteAdded: true,
    availabilityUpdated: true,
    newMessage: true,
    meetingReminder: true,
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Bildirim türleri ve açıklamaları
  const notificationTypes = [
    {
      key: "meetingCreated",
      title: "Toplantı Oluşturuldu",
      description: "Yeni bir toplantı oluşturulduğunda bildirim alın",
      icon: IconCalendarEvent,
    },
    {
      key: "meetingCancelled",
      title: "Toplantı İptal Edildi",
      description: "Bir toplantı iptal edildiğinde bildirim alın",
      icon: IconX,
    },
    {
      key: "meetingNoteAdded",
      title: "Toplantı Notu Eklendi",
      description: "Toplantıya yeni bir not eklendiğinde bildirim alın",
      icon: IconNotes,
    },
    {
      key: "availabilityUpdated",
      title: "Müsaitlik Güncellendi",
      description: "Müsaitlik durumunuz güncellendiğinde katılımcılara bildirim gönder",
      icon: IconCalendar,
    },
    {
      key: "newMessage",
      title: "Yeni Mesaj",
      description: "Yeni bir mesaj aldığınızda bildirim alın",
      icon: IconMessage,
    },
    {
      key: "meetingReminder",
      title: "Toplantı Hatırlatması",
      description: "Toplantıdan önce hatırlatma bildirimleri alın (1 gün önce ve 1 saat önce)",
      icon: IconAlarmSnooze,
    },
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await getEmailPreferences();
      if (response.success && response.data) {
        setPreferences(response.data);
      }
    } catch (error) {
      toast.error("Bildirim tercihleri yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await updateEmailPreferences(preferences);
      if (response.success) {
        toast.success("Bildirim tercihleri güncellendi!");
        setHasChanges(false);
      }
    } catch (error) {
      toast.error("Bildirim tercihleri güncellenemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadPreferences();
    setHasChanges(false);
  };

  const handleEnableAll = () => {
    const allEnabled = {};
    notificationTypes.forEach((type) => {
      allEnabled[type.key] = true;
    });
    setPreferences(allEnabled);
    setHasChanges(true);
  };

  const handleDisableAll = () => {
    const allDisabled = {};
    notificationTypes.forEach((type) => {
      allDisabled[type.key] = false;
    });
    setPreferences(allDisabled);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper
        sx={{
          background: "linear-gradient(135deg, #005DAD 0%, #0082CC 100%)",
          color: "white",
          p: { xs: 3, sm: 4 },
          mb: 3,
          borderRadius: 2,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              borderRadius: 2,
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconBell size={32} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Bildirim Ayarları
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Email bildirim tercihlerinizi yönetin
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Bilgi Mesajı */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Bu ayarlar, hangi durumlarda email bildirimi almak istediğinizi belirlemenize olanak sağlar. 
          Tüm bildirimler <strong>Emlak Konut</strong> tarafından gönderilir.
        </Typography>
      </Alert>

      {/* Toplu İşlemler */}
      <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Hızlı İşlemler
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleEnableAll}
                sx={{
                  borderColor: "#005DAD",
                  color: "#005DAD",
                  "&:hover": {
                    borderColor: "#004080",
                    bgcolor: "#E6F2FF",
                  },
                }}
              >
                Tümünü Aç
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleDisableAll}
                sx={{
                  borderColor: "#757575",
                  color: "#757575",
                  "&:hover": {
                    borderColor: "#424242",
                    bgcolor: "#F5F5F5",
                  },
                }}
              >
                Tümünü Kapat
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Bildirim Türleri */}
      <Grid container spacing={2}>
        {notificationTypes.map((type, index) => {
          const Icon = type.icon;
          const isEnabled = preferences[type.key];

          return (
            <Grid item xs={12} key={type.key}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${isEnabled ? "#005DAD" : "#E0E0E0"}`,
                  bgcolor: isEnabled ? "#F0F7FF" : "white",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 2,
                  },
                }}
              >
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={{ xs: 2, sm: 3 }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                  >
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                      {/* Icon */}
                      <Box
                        sx={{
                          bgcolor: isEnabled ? "#005DAD" : "#E0E0E0",
                          color: "white",
                          borderRadius: 2,
                          p: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: 48,
                          minHeight: 48,
                        }}
                      >
                        <Icon size={24} />
                      </Box>

                      {/* İçerik */}
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: isEnabled ? "#005DAD" : "text.primary",
                            mb: 0.5,
                          }}
                        >
                          {type.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {type.description}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Switch */}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isEnabled}
                          onChange={() => handleToggle(type.key)}
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: "#005DAD",
                            },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                              backgroundColor: "#005DAD",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontWeight: 600, color: isEnabled ? "#005DAD" : "text.secondary" }}>
                          {isEnabled ? "Aktif" : "Pasif"}
                        </Typography>
                      }
                      labelPlacement="start"
                      sx={{ m: 0 }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Kaydet Butonu */}
      {hasChanges && (
        <Paper
          sx={{
            position: "fixed",
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            p: 2,
            borderRadius: 2,
            boxShadow: 6,
            bgcolor: "white",
            zIndex: 1000,
          }}
        >
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={saving}
              sx={{
                borderColor: "#757575",
                color: "#757575",
                "&:hover": {
                  borderColor: "#424242",
                  bgcolor: "#F5F5F5",
                },
              }}
            >
              İptal
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : <IconCheck size={18} />}
              onClick={handleSave}
              disabled={saving}
              sx={{
                bgcolor: "#005DAD",
                "&:hover": {
                  bgcolor: "#004080",
                },
                minWidth: 120,
              }}
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default NotificationSettingsView;

