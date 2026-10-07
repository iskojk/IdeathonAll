"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Stack,
  Typography,
  Button,
  Avatar,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  Autocomplete,
} from "@mui/material";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconBriefcase,
  IconBrandLinkedin,
  IconEdit,
  IconCheck,
  IconX,
  IconCamera,
  IconTrophy,
  IconStar,
  IconUsers,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { getMentorProfile, updateMentorProfile, uploadMentorPhoto } from "@/utils/api/mentor";
import { updateProfile, changePassword } from "@/utils/api/auth";
import { useSelector, useDispatch } from "react-redux";
import { login } from "@/store/authSlice";

// Uzmanlık Alanları Listesi
const EXPERTISE_OPTIONS = [
  "Satış",
  "Pazarlama",
  "SEO (Arama Motoru Optimizasyonu)",
  "Sosyal Medya Pazarlaması",
  "İçerik Pazarlaması",
  "Dijital Pazarlama",
  "E-Ticaret",
  "B2B Pazarlama",
  "B2C Pazarlama",
  "CRM (Müşteri İlişkileri Yönetimi)",
  "Fiyatlandırma Stratejileri",
  "Marka Yönetimi",
  "Ürün Yönetimi",
  "Pazar Araştırması",
  "Reklam ve Tanıtım",
  "Halkla İlişkiler",
  "Etkinlik Pazarlaması",
  "İş Geliştirme",
  "Müzakere Teknikleri",
  "Müşteri Deneyimi (CX)",
  "Muhasebe",
  "Finansal Planlama",
  "Bütçeleme ve Maliyet Kontrolü",
  "Yatırım Yönetimi",
  "Risk Yönetimi",
  "Vergi Planlaması",
  "Finansal Raporlama",
  "Finansal Analiz",
  "Hibeler ve Fon Yönetimi",
  "Yatırımcı İlişkileri",
  "Finansal Teknolojiler (FinTech)",
  "Dış Ticaret",
  "Uluslararası İş İlişkileri",
  "İhracat ve İthalat Yönetimi",
  "Gümrük ve Ticaret Mevzuatı",
  "Lojistik ve Tedarik Zinciri Yönetimi",
  "Döviz Kuru ve Dış Ticaret Riskleri",
  "Küresel Pazarlama Stratejileri",
  "Ekip Yönetimi",
  "Liderlik ve Motivasyon",
  "Performans Yönetimi",
  "İşe Alım ve Yetenek Yönetimi",
  "Kurumsal Kültür ve İş Ahlakı",
  "Eğitim ve Gelişim",
  "İş Hukuku ve İnsan Kaynakları Yönetimi",
  "Çatışma Çözümleme ve İletişim Becerileri",
  "Zaman Yönetimi ve Verimlilik",
  "Proje Yönetimi",
  "Değişim Yönetimi",
  "Kriz Yönetimi",
  "Yazılım Geliştirme",
  "Mobil Uygulamalar",
  "Web Geliştirme",
  "Kullanıcı Deneyimi (UX) ve Kullanıcı Arayüzü (UI)",
  "Veri Tabanı Yönetimi",
  "Bulut Bilişim",
  "Siber Güvenlik",
  "Veri Analitiği ve Büyük Veri",
  "Yapay Zeka (AI) ve Makine Öğrenimi",
  "Blokzincir ve Kripto Para Teknolojileri",
  "Oyun Geliştirme",
  "VR/AR (Sanal ve Artırılmış Gerçeklik)",
  "Espor ve Oyun Endüstrisi",
  "Sağlık Teknolojileri",
  "Biyoteknoloji",
  "Tıbbi Cihazlar ve Sağlık Hizmetleri",
  "Eğitim Teknolojileri (EdTech)",
  "Çevrimiçi Eğitim ve Uzaktan Öğrenme",
  "Öğrenci Başarısı ve Öğretim Yöntemleri",
  "Kurumsal Eğitim ve Yetişkin Eğitimi",
  "Turizm ve Otel Yönetimi",
  "Seyahat Teknolojileri",
  "Konaklama ve Misafirperverlik",
  "Etkinlik ve Eğlence Yönetimi",
  "Kültürel Turizm ve Turizm Pazarlaması",
  "Spor Yönetimi",
  "Spor Pazarlaması ve Sponsorluk",
  "Spor Teknolojileri",
  "Spor Tesisleri ve Etkinlik Yönetimi",
  "Kişisel Antrenörlük ve Spor Psikolojisi",
  "Girişimcilik ve Start-Up Mentorluğu",
  "İnovasyon ve Yaratıcılık",
  "İş Planı Hazırlama ve Stratejik Planlama",
  "Pazar Giriş Stratejileri ve İş Modeli Geliştirme",
  "Fikri Mülkiyet ve Patent Danışmanlığı",
  "Rekabet Analizi ve Sektörel Araştırma",
  "Müşteri İlişkileri ve Ağ Oluşturma",
  "Kurumsal Sosyal Sorumluluk",
  "Çevre ve Yeşil Teknolojiler",
  "Sosyal Girişimcilik ve Toplumsal Etki",
  "Küçük İşletmeler ve Aile Şirketleri",
  "Franchising ve Bayilik Yönetimi",
  "Üretim Yönetimi ve İşletme Mühendisliği",
  "Kalite Yönetimi ve Sürekli İyileştirme",
  "Tedarik Zinciri ve Stok Yönetimi",
  "Ürün Geliştirme ve İnovasyon",
  "Endüstriyel Tasarım ve Prototipleme",
  "Enerji Yönetimi ve Yenilenebilir Kaynaklar",
  "Gayrimenkul Yatırımı ve Emlak Yönetimi",
  "Sanat, Kültür ve Yaratıcı Endüstriler",
  "İK Teknolojileri",
  "Diğer",
];

const MentorProfileView = () => {
  const dispatch = useDispatch();
  const { user, mentorProfile: storedMentorProfile } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    about: "",
    linkedin: "",
    expertiseTags: [],
    additionalInfo: {
      languages: [],
    },
  });

  // Language input state
  const [langInput, setLangInput] = useState("");

  // User Profile Edit
  const [editUserProfile, setEditUserProfile] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
  });
  const [savingUser, setSavingUser] = useState(false);

  // Password Change
  const [editPassword, setEditPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await getMentorProfile();
      if (response.success) {
        setProfile(response.data);
        setFormData({
          title: response.data.title || "",
          about: response.data.about || "",
          linkedin: response.data.linkedin || "",
          expertiseTags: response.data.expertiseTags || [],
          additionalInfo: {
            languages: response.data.additionalInfo?.languages || [],
          },
        });
        
        // User form initialize
        if (response.data.userId) {
          setUserForm({
            name: response.data.userId.name || "",
            email: response.data.userId.email || "",
          });
        }
      } else {
        toast.error("Profil yüklenirken hata oluştu");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Profil yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleExpertiseChange = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      expertiseTags: newValue,
    }));
  };

  const handleAddLanguage = () => {
    if (langInput.trim() && !formData.additionalInfo.languages.includes(langInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        additionalInfo: {
          ...prev.additionalInfo,
          languages: [...prev.additionalInfo.languages, langInput.trim()],
        },
      }));
      setLangInput("");
    }
  };

  const handleRemoveLanguage = (langToRemove) => {
    setFormData((prev) => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        languages: prev.additionalInfo.languages.filter((lang) => lang !== langToRemove),
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await updateMentorProfile(formData);
      if (response.success) {
        setProfile(response.data);
        setEditMode(false);
        toast.success("Profil başarıyla güncellendi");
        
        // Redux'taki mentor profilini de güncelle
        const updatedProfile = { ...storedMentorProfile, ...response.data };
        localStorage.setItem("mentorProfile", JSON.stringify(updatedProfile));
      } else {
        toast.error("Profil güncellenirken hata oluştu");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Profil güncellenirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: profile?.title || "",
      about: profile?.about || "",
      linkedin: profile?.linkedin || "",
      expertiseTags: profile?.expertiseTags || [],
      additionalInfo: {
        languages: profile?.additionalInfo?.languages || [],
      },
    });
    setEditMode(false);
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5MB'dan küçük olmalıdır");
      return;
    }

    // Dosya tipi kontrolü
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Sadece JPG, JPEG ve PNG formatları desteklenmektedir");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await uploadMentorPhoto(formData);
      if (response.success) {
        setProfile((prev) => ({
          ...prev,
          photo: response.data.photo,
          photoUrl: response.data.photoUrl,
        }));
        toast.success("Profil fotoğrafı güncellendi");
        
        // Redux'taki profili güncelle
        const updatedProfile = { 
          ...storedMentorProfile, 
          photo: response.data.photo,
          photoUrl: response.data.photoUrl 
        };
        localStorage.setItem("mentorProfile", JSON.stringify(updatedProfile));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Fotoğraf yüklenirken hata oluştu");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveUserProfile = async () => {
    if (!userForm.name.trim()) {
      toast.error("Ad soyad boş olamaz");
      return;
    }

    if (!userForm.email.trim()) {
      toast.error("Email boş olamaz");
      return;
    }

    setSavingUser(true);
    try {
      const response = await updateProfile(userForm);
      if (response.success) {
        toast.success("Kullanıcı bilgileri güncellendi");
        setEditUserProfile(false);
        
        // Redux'taki user'ı güncelle
        const token = localStorage.getItem("token");
        if (token) {
          dispatch(login({ user: response.data, token }));
        }
        
        loadProfile(); // Profili yeniden yükle
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Profil güncellenemedi");
    } finally {
      setSavingUser(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword) {
      toast.error("Mevcut şifre boş olamaz");
      return;
    }

    if (!passwordForm.newPassword) {
      toast.error("Yeni şifre boş olamaz");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Yeni şifre en az 6 karakter olmalıdır");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      if (response.success) {
        toast.success("Şifre başarıyla değiştirildi");
        setEditPassword(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Şifre değiştirilemedi");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Card */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 2,
          background: "linear-gradient(135deg, #005DAD 0%, #004080 100%)",
          color: "white",
          boxShadow: "0 4px 12px rgba(0, 93, 173, 0.15)",
        }}
      >
        <CardContent sx={{ py: 3 }}>
          <Stack direction="row" spacing={3} alignItems="center">
            {/* Avatar ve Fotoğraf Yükleme */}
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={profile?.photoUrl}
                sx={{
                  width: 120,
                  height: 120,
                  border: "4px solid rgba(255,255,255,0.3)",
                  fontSize: "3rem",
                  fontWeight: 700,
                }}
              >
                {user?.name?.charAt(0) || "M"}
              </Avatar>
              <Tooltip title="Fotoğraf Değiştir">
                <IconButton
                  component="label"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    bgcolor: "primary.main",
                    color: "white",
                    "&:hover": {
                      color: "white",
                      borderColor: "#004080",
                      bgcolor: "#E6F2FF",
                      color: "#005DAD",
                    },
                  }}
                  disabled={uploading}
                >
                  <input
                    hidden
                    accept="image/jpeg,image/jpg,image/png"
                    type="file"
                    onChange={handlePhotoUpload}
                  />
                  {uploading ? <CircularProgress size={20} color="inherit" /> : <IconCamera size={20} />}
                </IconButton>
              </Tooltip>
            </Box>

            {/* Profil Bilgileri */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {user?.name}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                {profile?.title || "Mentor"}
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Chip
                  label={user?.email}
                  sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                />
                {user?.phone && (
                  <Chip
                    icon={<IconPhone size={16} />}
                    label={user?.phone}
                    sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                  />
                )}
              </Stack>
            </Box>

            {/* Profil Tamamlanma */}
            <Box sx={{ minWidth: 200 }}>
              <Paper sx={{ p: 2, bgcolor: "rgba(255,255,255,0.95)", borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Profil Tamamlanma
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={profile?.profileCompleteness || 0}
                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                    {profile?.profileCompleteness || 0}%
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* İstatistikler */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: "100%" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  bgcolor: "primary.main",
                  borderRadius: 2,
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconUsers size={28} color="white" />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
                  {profile?.stats?.totalMeetings || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Toplam Toplantı
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: "100%" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  bgcolor: "success.main",
                  borderRadius: 2,
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconTrophy size={28} color="white" />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
                  {profile?.stats?.completedMeetings || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tamamlanan
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: "100%" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  bgcolor: "warning.main",
                  borderRadius: 2,
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconStar size={28} color="white" />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
                  {profile?.stats?.averageRating?.toFixed(1) || "0.0"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ortalama Puan
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: "100%" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  bgcolor: "info.main",
                  borderRadius: 2,
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconUsers size={28} color="white" />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
                  {profile?.stats?.totalRatings || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Değerlendirme
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Kullanıcı Bilgileri (Ad, Email) */}
      <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Hesap Bilgileri
            </Typography>
            {!editUserProfile ? (
              <Button
                variant="contained"
                startIcon={<IconEdit size={18} />}
                onClick={() => setEditUserProfile(true)}
                sx={{
                  bgcolor: "#005DAD",
                  "&:hover": { bgcolor: "#004080" },
                }}
              >
                Düzenle
              </Button>
            ) : (
              <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
                <Button
                  variant="outlined"
                  startIcon={<IconX size={18} />}
                  onClick={() => {
                    setEditUserProfile(false);
                    setUserForm({
                      name: profile?.userId?.name || "",
                      email: profile?.userId?.email || "",
                    });
                  }}
                  disabled={savingUser}
                  fullWidth
                  sx={{ minWidth: { xs: "auto", sm: 100 } }}
                >
                  İptal
                </Button>
                <Button
                  variant="contained"
                  startIcon={<IconCheck size={18} />}
                  onClick={handleSaveUserProfile}
                  disabled={savingUser}
                  fullWidth
                  sx={{
                    bgcolor: "#005DAD",
                    "&:hover": { bgcolor: "#004080" },
                    minWidth: { xs: "auto", sm: 100 },
                  }}
                >
                  {savingUser ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </Stack>
            )}
          </Stack>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ad Soyad"
                name="name"
                value={editUserProfile ? userForm.name : profile?.userId?.name || ""}
                onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))}
                disabled={!editUserProfile}
                InputProps={{
                  startAdornment: <IconUser size={20} style={{ marginRight: 8 }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={editUserProfile ? userForm.email : profile?.userId?.email || ""}
                onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                disabled={!editUserProfile}
                InputProps={{
                  startAdornment: <IconMail size={20} style={{ marginRight: 8 }} />,
                }}
              />
            </Grid>
          </Grid>

          {editUserProfile && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Email değiştirilirse, yeni email ile giriş yapmanız gerekecektir.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Şifre Değiştirme */}
      <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Şifre Yönetimi
            </Typography>
            {!editPassword ? (
              <Button
                variant="contained"
                startIcon={<IconEdit size={18} />}
                onClick={() => setEditPassword(true)}
                sx={{
                  bgcolor: "#005DAD",
                  "&:hover": { bgcolor: "#004080" },
                }}
              >
                Şifre Değiştir
              </Button>
            ) : (
              <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
                <Button
                  variant="outlined"
                  startIcon={<IconX size={18} />}
                  onClick={() => {
                    setEditPassword(false);
                    setPasswordForm({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  disabled={changingPassword}
                  fullWidth
                  sx={{ minWidth: { xs: "auto", sm: 100 } }}
                >
                  İptal
                </Button>
                <Button
                  variant="contained"
                  startIcon={<IconCheck size={18} />}
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  fullWidth
                  sx={{
                    bgcolor: "#005DAD",
                    "&:hover": { bgcolor: "#004080" },
                    minWidth: { xs: "auto", sm: 100 },
                  }}
                >
                  {changingPassword ? "Değiştiriliyor..." : "Değiştir"}
                </Button>
              </Stack>
            )}
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {!editPassword ? (
            <Alert severity="info">
              Güvenliğiniz için düzenli olarak şifrenizi değiştirmenizi öneririz.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mevcut Şifre"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Yeni Şifre"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  helperText="En az 6 karakter olmalıdır"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Yeni Şifre (Tekrar)"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  error={
                    passwordForm.confirmPassword &&
                    passwordForm.newPassword !== passwordForm.confirmPassword
                  }
                  helperText={
                    passwordForm.confirmPassword &&
                    passwordForm.newPassword !== passwordForm.confirmPassword
                      ? "Şifreler eşleşmiyor"
                      : ""
                  }
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Profil Bilgileri Card */}
      <Card sx={{ borderRadius: 2, border: "1px solid #E0E0E0" }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Profil Bilgileri
            </Typography>
            {!editMode ? (
              <Button
                variant="contained"
                startIcon={<IconEdit size={18} />}
                onClick={() => setEditMode(true)}
              >
                Düzenle
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<IconX size={18} />}
                  onClick={handleCancel}
                  disabled={saving}
                >
                  İptal
                </Button>
                <Button
                  variant="contained"
                  startIcon={<IconCheck size={18} />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </Stack>
            )}
          </Stack>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            {/* Ünvan */}
            <Grid item xs={12}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Ünvan
              </Typography>
              {editMode ? (
                <TextField
                  fullWidth
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Örn: Senior Software Architect"
                />
              ) : (
                <Typography variant="body1">{profile?.title || "Belirtilmemiş"}</Typography>
              )}
            </Grid>

            {/* Hakkında */}
            <Grid item xs={12}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Hakkında
              </Typography>
              {editMode ? (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="about"
                  value={formData.about}
                  onChange={handleInputChange}
                  placeholder="Kendinizden, deneyimlerinizden bahsedin..."
                />
              ) : (
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {profile?.about || "Belirtilmemiş"}
                </Typography>
              )}
            </Grid>

            {/* LinkedIn */}
            <Grid item xs={12}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                LinkedIn Profili
              </Typography>
              {editMode ? (
                <TextField
                  fullWidth
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/..."
                />
              ) : (
                <Typography variant="body1">
                  {profile?.linkedin ? (
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                      {profile.linkedin}
                    </a>
                  ) : (
                    "Belirtilmemiş"
                  )}
                </Typography>
              )}
            </Grid>

            {/* Uzmanlık Alanları */}
            <Grid item xs={12}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Uzmanlık Alanları
              </Typography>
              {editMode ? (
                <Autocomplete
                  multiple
                  freeSolo
                  options={EXPERTISE_OPTIONS}
                  value={formData.expertiseTags}
                  onChange={handleExpertiseChange}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option}
                          {...tagProps}
                          sx={{
                            bgcolor: "#005DAD",
                            color: "white",
                            "& .MuiChip-deleteIcon": {
                              color: "rgba(255, 255, 255, 0.7)",
                              "&:hover": {
                                color: "white",
                              },
                            },
                          }}
                        />
                      );
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Uzmanlık alanlarını seçin veya yazın"
                      helperText="Listeden seçebilir veya özel alan ekleyebilirsiniz"
                    />
                  )}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover fieldset": {
                        borderColor: "#005DAD",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#005DAD",
                      },
                    },
                  }}
                />
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {profile?.expertiseTags?.length > 0 ? (
                    profile.expertiseTags.map((tag, idx) => (
                      <Chip 
                        key={idx} 
                        label={tag} 
                        sx={{
                          bgcolor: "#005DAD",
                          color: "white",
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Belirtilmemiş
                    </Typography>
                  )}
                </Stack>
              )}
            </Grid>

            {/* Diller */}
            <Grid item xs={12}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Konuşulan Diller
              </Typography>
              {editMode ? (
                <Box>
                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={langInput}
                      onChange={(e) => setLangInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddLanguage()}
                      placeholder="Dil ekle ve Enter'a bas"
                    />
                    <Button variant="outlined" onClick={handleAddLanguage}>
                      Ekle
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {formData.additionalInfo.languages.map((lang, idx) => (
                      <Chip
                        key={idx}
                        label={lang}
                        onDelete={() => handleRemoveLanguage(lang)}
                        color="secondary"
                      />
                    ))}
                  </Stack>
                </Box>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {profile?.additionalInfo?.languages?.length > 0 ? (
                    profile.additionalInfo.languages.map((lang, idx) => (
                      <Chip key={idx} label={lang} color="secondary" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Belirtilmemiş
                    </Typography>
                  )}
                </Stack>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MentorProfileView;

