"use client";

import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  Chip,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { IconArrowRight, IconArrowLeft, IconBuilding } from "@tabler/icons-react";

// Uzmanlik alanlari listesi
const EXPERTISE_OPTIONS = [
  "Satis", "Pazarlama", "SEO (Arama Motoru Optimizasyonu)", "Sosyal Medya Pazarlamasi",
  "Icerik Pazarlamasi", "Dijital Pazarlama", "E-Ticaret", "B2B Pazarlama", "B2C Pazarlama",
  "CRM (Musteri Iliskileri Yonetimi)", "Fiyatlandirma Stratejileri", "Marka Yonetimi",
  "Urun Yonetimi", "Pazar Arastirmasi", "Reklam ve Tanitim", "Halkla Iliskiler",
  "Etkinlik Pazarlamasi", "Is Gelistirme", "Muzakere Teknikleri", "Musteri Deneyimi (CX)",
  "Muhasebe", "Finansal Planlama", "Butceleme ve Maliyet Kontrolu", "Yatirim Yonetimi",
  "Risk Yonetimi", "Vergi Planlamasi", "Finansal Raporlama", "Finansal Analiz",
  "Hibeler ve Fon Yonetimi", "Yatirimci Iliskileri", "Finansal Teknolojiler (FinTech)",
  "Dis Ticaret", "Uluslararasi Is Iliskileri", "Ihracat ve Ithalat Yonetimi",
  "Gumruk ve Ticaret Mevzuati", "Lojistik ve Tedarik Zinciri Yonetimi",
  "Doviz Kuru ve Dis Ticaret Riskleri", "Kuresel Pazarlama Stratejileri",
  "Ekip Yonetimi", "Liderlik ve Motivasyon", "Performans Yonetimi",
  "Ise Alim ve Yetenek Yonetimi", "Kurumsal Kultur ve Is Ahlaki", "Egitim ve Gelisim",
  "Is Hukuku ve Insan Kaynaklari Yonetimi", "Catisma Cozumleme ve Iletisim Becerileri",
  "Zaman Yonetimi ve Verimlilik", "Proje Yonetimi", "Degisim Yonetimi", "Kriz Yonetimi",
  "Yazilim Gelistirme", "Mobil Uygulamalar", "Web Gelistirme",
  "Kullanici Deneyimi (UX) ve Kullanici Arayuzu (UI)", "Veri Tabani Yonetimi",
  "Bulut Bilisim", "Siber Guvenlik", "Veri Analitigi ve Buyuk Veri",
  "Yapay Zeka (AI) ve Makine Ogrenimi", "Blokzincir ve Kripto Para Teknolojileri",
  "Oyun Gelistirme", "VR/AR (Sanal ve Artirilmis Gerceklik)", "Espor ve Oyun Endustrisi",
  "Saglik Teknolojileri", "Biyoteknoloji", "Tibbi Cihazlar ve Saglik Hizmetleri",
  "Egitim Teknolojileri (EdTech)", "Cevrimici Egitim ve Uzaktan Ogrenme",
  "Ogrenci Basarisi ve Ogretim Yontemleri", "Kurumsal Egitim ve Yetiskin Egitimi",
  "Turizm ve Otel Yonetimi", "Seyahat Teknolojileri", "Konaklama ve Misafirperverlik",
  "Etkinlik ve Eglence Yonetimi", "Kulturel Turizm ve Turizm Pazarlamasi",
  "Spor Yonetimi", "Spor Pazarlamasi ve Sponsorluk", "Spor Teknolojileri",
  "Spor Tesisleri ve Etkinlik Yonetimi", "Kisisel Antrenorluk ve Spor Psikolojisi",
  "Girisimcilik ve Start-Up Mentorlugu", "Inovasyon ve Yaraticilik",
  "Is Plani Hazirlama ve Stratejik Planlama", "Pazar Giris Stratejileri ve Is Modeli Gelistirme",
  "Fikri Mulkiyet ve Patent Danismanligi", "Rekabet Analizi ve Sektorel Arastirma",
  "Musteri Iliskileri ve Ag Olusturma", "Kurumsal Sosyal Sorumluluk",
  "Cevre ve Yesil Teknolojiler", "Sosyal Girisimcilik ve Toplumsal Etki",
  "Kucuk Isletmeler ve Aile Sirketleri", "Franchising ve Bayilik Yonetimi",
  "Uretim Yonetimi ve Isletme Muhendisligi", "Kalite Yonetimi ve Surekli Iyilestirme",
  "Tedarik Zinciri ve Stok Yonetimi", "Urun Gelistirme ve Inovasyon",
  "Endustriyel Tasarim ve Prototipleme", "Enerji Yonetimi ve Yenilenebilir Kaynaklar",
  "Gayrimenkul Yatirimi ve Emlak Yonetimi", "Sanat, Kultur ve Yaratici Endustriler",
  "IK Teknolojileri", "Diger",
];

const MentorProfileForm = ({ formData, setFormData, onSubmit, onBack, loading, ideathons = [] }) => {
  const theme = useTheme();
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Ideathon validation (zorunlu)
    if (!formData.ideathonId) {
      newErrors.ideathonId = "Ideathon secimi zorunludur";
    }

    // Title validation
    if (!formData.title || formData.title.trim().length < 2) {
      newErrors.title = "Unvan en az 2 karakter olmalidir";
    }

    // About validation
    if (!formData.about || formData.about.trim().length < 10) {
      newErrors.about = "Hakkinda bilgisi en az 10 karakter olmalidir";
    }

    // LinkedIn validation (optional but if provided, should be valid)
    if (formData.linkedin && !formData.linkedin.includes('linkedin.com')) {
      newErrors.linkedin = "Gecerli bir LinkedIn profil linki girin";
    }

    // Tags validation
    if (formData.expertiseTags.length === 0) {
      newErrors.expertiseTags = "En az 1 uzmanlik alani eklemelisiniz";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Mentorun profil bilgilerini doldurun. Ideathon secimi zorunludur — mentor olusturulunca ideathondaki tum kullanicilar otomatik atanir.
        </Alert>

        {/* Ideathon Secimi (Zorunlu) */}
        <FormControl fullWidth required error={!!errors.ideathonId}>
          <InputLabel>Ideathon *</InputLabel>
          <Select
            value={formData.ideathonId}
            label="Ideathon *"
            onChange={(e) => handleChange("ideathonId", e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            {ideathons.map((idt) => (
              <MenuItem key={idt._id} value={idt._id}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconBuilding size={16} color={theme.palette.text.secondary} />
                  <Typography sx={{ fontWeight: 500, fontSize: "0.875rem" }}>{idt.name}</Typography>
                  <Chip
                    label={idt.status === "active" ? "Aktif" : idt.status === "draft" ? "Taslak" : idt.status}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      bgcolor: idt.status === "active" ? alpha("#51CF66", 0.15) : alpha("#FFD43B", 0.15),
                      color: idt.status === "active" ? "#51CF66" : "#FFD43B",
                    }}
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
          {errors.ideathonId && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
              {errors.ideathonId}
            </Typography>
          )}
        </FormControl>

        <TextField
          fullWidth
          label="Unvan"
          required
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          error={!!errors.title}
          helperText={errors.title}
          placeholder="Orn: Kidemli Yazilim Gelistirici"
          inputProps={{ maxLength: 200 }}
        />

        <TextField
          fullWidth
          label="Hakkinda"
          multiline
          rows={4}
          required
          value={formData.about}
          onChange={(e) => handleChange("about", e.target.value)}
          error={!!errors.about}
          helperText={errors.about}
          placeholder="Mentorun deneyimi, uzmanlik alanlari ve yetenekleri hakkinda bilgi..."
          inputProps={{ maxLength: 1000 }}
        />

        <TextField
          fullWidth
          label="LinkedIn Profil Linki"
          value={formData.linkedin}
          onChange={(e) => handleChange("linkedin", e.target.value)}
          error={!!errors.linkedin}
          helperText={errors.linkedin || "Istege bagli"}
          placeholder="https://linkedin.com/in/kullaniciadi"
          inputProps={{ maxLength: 200 }}
        />

        {/* Uzmanlik Alanlari - Autocomplete */}
        <Box>
          <Autocomplete
            multiple
            freeSolo
            options={EXPERTISE_OPTIONS}
            value={formData.expertiseTags}
            onChange={(event, newValue) => {
              handleChange("expertiseTags", newValue);
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    variant="outlined"
                    label={option}
                    {...tagProps}
                    color="primary"
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Uzmanlik Alanlari"
                placeholder="Secin veya yazin"
                error={!!errors.expertiseTags}
                helperText={errors.expertiseTags || "Listeden secebilir veya kendiniz ekleyebilirsiniz"}
                required={formData.expertiseTags.length === 0}
              />
            )}
          />
        </Box>

        <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={20} />}
            onClick={onBack}
            disabled={loading}
            size="large"
            sx={{ textTransform: "none" }}
          >
            Geri
          </Button>

          <Button
            type="submit"
            variant="contained"
            endIcon={<IconArrowRight size={20} />}
            disabled={loading}
            size="large"
            sx={{ textTransform: "none", boxShadow: "none", "&:hover": { boxShadow: "none" } }}
          >
            {loading ? "Kaydediliyor..." : "Devam Et"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default MentorProfileForm;
