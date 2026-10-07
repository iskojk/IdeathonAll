"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Grid,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { Edit, Save, Cancel } from "@mui/icons-material";
import { toast } from "react-toastify";
import { useProfile } from "@/app/context/ProfileContext";

const ProfileContent = () => {
  const { profile, loading, error, updateUserProfile, changePassword } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    let profileUpdated = false;
    let passwordUpdated = false;

    // Profil bilgilerini güncelle
    if (formData.name !== profile?.name || formData.email !== profile?.email) {
      const profileResponse = await updateUserProfile(formData);

      if (!profileResponse.success) {
        toast.error(profileResponse.message || "Profil güncellenemedi!");
        return;
      }
      profileUpdated = true;
    }

    // Şifre alanları doluysa şifre değiştir
    if (passwordData.currentPassword && passwordData.newPassword) {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error("Yeni şifreler eşleşmiyor!");
        return;
      }
      if (passwordData.newPassword.length < 6) {
        toast.error("Yeni şifre en az 6 karakter olmalıdır!");
        return;
      }
      const pwResponse = await changePassword(passwordData);

      if (!pwResponse.success) {
        toast.error(pwResponse.message || "Şifre güncellenemedi!");
        return;
      }
      passwordUpdated = true;
    }

    // Başarılı mesajları göster
    if (profileUpdated && passwordUpdated) {
      toast.success("Profil ve şifre başarıyla güncellendi!");
    } else if (profileUpdated) {
      toast.success("Profil başarıyla güncellendi!");
    } else if (passwordUpdated) {
      toast.success("Şifre başarıyla güncellendi!");
    } else {
      toast.info("Herhangi bir değişiklik yapılmadı.");
    }

    setIsEditing(false);
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Profil bilgileri yükleniyor...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column">
        <Typography variant="h6" color="error" gutterBottom>
          Profil bilgileri yüklenirken hata oluştu
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error}
        </Typography>
        <Button
          variant="outlined"
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Tekrar Dene
        </Button>
      </Box>
    );
  }

  return (
    <Box mx="auto" p={{ xs: 2, md: 5 }} width="100%">
      {/* Kullanıcı Görseli ve Adı */}
      <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
        <Avatar
          sx={{
            height: 100,
            width: 100,
            bgcolor: "primary.main",
            fontSize: 32,
            fontWeight: "bold",
          }}
        >
          {(profile?.displayName || profile?.name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
        </Avatar>
        <Typography variant="h6" mt={2}>
          {profile?.name || "İsim yükleniyor..."}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {profile?.role === "superadmin" ? "Super Administrator" : profile?.role === "juri" ? "Jüri" : "Rol Yok"}
        </Typography>
      </Box>

      {/* Form */}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Ad Soyad"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="E-posta"
            name="email"
            fullWidth
            value={formData.email}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </Grid>

        {/* Superadmin'e özel bilgiler */}
        {profile?.role === "superadmin" && (
          <>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Aktiflik Durumu"
                fullWidth
                value={profile?.isActive ? "Aktif" : "Pasif"}
                disabled
                sx={{ bgcolor: 'grey.50' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Hesap Oluşturulma Tarihi"
                fullWidth
                value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('tr-TR') + " " + new Date(profile.createdAt).toLocaleTimeString('tr-TR') : ""}
                disabled
                sx={{ bgcolor: 'grey.50' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Son Güncelleme Tarihi"
                fullWidth
                value={profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString('tr-TR') + " " + new Date(profile.updatedAt).toLocaleTimeString('tr-TR') : ""}
                disabled
                sx={{ bgcolor: 'grey.50' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Görünen İsim"
                fullWidth
                value={profile?.displayName || profile?.name || ""}
                disabled
                sx={{ bgcolor: 'grey.50' }}
              />
            </Grid>
          </>
        )}

        {isEditing && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" sx={{ mb: 2, mt: 2 }}>
                Şifre Değiştirme
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Mevcut Şifre"
                name="currentPassword"
                type="password"
                fullWidth
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Yeni Şifre"
                name="newPassword"
                type="password"
                fullWidth
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                helperText="En az 6 karakter"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Yeni Şifre (Tekrar)"
                name="confirmPassword"
                type="password"
                fullWidth
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                error={passwordData.confirmPassword.length > 0 && passwordData.newPassword !== passwordData.confirmPassword}
                helperText={passwordData.confirmPassword.length > 0 && passwordData.newPassword !== passwordData.confirmPassword ? "Şifreler eşleşmiyor" : ""}
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* Butonlar */}
      <Box mt={4} display="flex" justifyContent="center" gap={2}>
        {isEditing ? (
          <>
            <Button
              variant="contained"
              color="success"
              startIcon={<Save />}
              onClick={handleSave}
              sx={{ px: 4 }}
            >
              Kaydet
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={() => {
                setIsEditing(false);
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
              }}
              sx={{ px: 4 }}
            >
              İptal
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Edit />}
            onClick={() => setIsEditing(true)}
            sx={{ px: 4 }}
          >
            Düzenle
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ProfileContent;
