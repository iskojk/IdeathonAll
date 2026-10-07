"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Paper,
  Tabs,
  Tab,
  InputAdornment,
} from "@mui/material";
import { TechnicalContext } from "@/app/context/TechnicalContext";
import { toast } from "react-toastify";
import {
  IconUpload,
  IconX,
  IconRefresh,
  IconPlus,
  IconPhone,
  IconAt,
  IconWorldWww,
  IconMapPin,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandYoutube,
  IconBrandLinkedin,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api";
const API_BASE = API_BASE_URL.replace(/\/api\/?$/, "");

// yardımcı
const getImageUrl = (val) => {
  if (!val) return "";
  if (val.startsWith("blob:")) return val;
  return val.startsWith("/") ? `${API_BASE}${val}` : val;
};

const LoaderOverlay = ({ show }) =>
  show ? (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        bgcolor: "rgba(255,255,255,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
        borderRadius: 2,
      }}
    >
      <CircularProgress />
    </Box>
  ) : null;

const FilePreview = ({ label, src, onClear }) => {
  if (!src) return null;
  return (
    <Card
      variant="outlined"
      sx={{
        width: 280,
        overflow: "hidden",
        borderRadius: 3,
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: 140,
          bgcolor: "background.default",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={`${label} Önizleme`}
          src={getImageUrl(src)}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
        <Tooltip title="Temizle">
          <IconButton
            size="small"
            onClick={onClear}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "background.paper",
              "&:hover": { bgcolor: "background.paper" },
            }}
          >
            <IconX size={18} />
          </IconButton>
        </Tooltip>
      </Box>
      <CardContent sx={{ py: 1.25, display: "flex", gap: 1, alignItems: "center" }}>
        <Chip size="small" label={label} />
        <Typography variant="caption" color="text.secondary" noWrap>
          image/*
        </Typography>
      </CardContent>
    </Card>
  );
};

const ListInput = ({
  label,
  icon,
  value,
  setValue,
  items,
  setItems,
  validator,
  placeholder,
}) => {
  const addItem = () => {
    const v = value.trim();
    if (!v) return;
    if (validator && !validator(v)) {
      toast.error(`${label} formatı geçersiz`);
      return;
    }
    if (items.includes(v)) {
      toast.info("Zaten ekli");
      return;
    }
    setItems([...items, v]);
    setValue("");
  };
  const removeItem = (idx) => {
    const next = [...items];
    next.splice(idx, 1);
    setItems(next);
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">{icon}</InputAdornment>
            ),
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <Button
          variant="outlined"
          startIcon={<IconPlus size={18} />}
          onClick={addItem}
        >
          Ekle
        </Button>
      </Stack>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {items.map((itm, idx) => (
          <Chip
            key={`${label}-${idx}-${itm}`}
            label={itm}
            onDelete={() => removeItem(idx)}
            variant="outlined"
          />
        ))}
      </Stack>
    </Stack>
  );
};

const TechnicalList = () => {
  const { technical, loading, error, fetchTechnical, updateTechnical } =
    useContext(TechnicalContext);

  // Sekme (görsel / iletişim / sosyal)
  const [tab, setTab] = useState(0);

  // Form state
  const [address, setAddress] = useState("");

  const [phoneInput, setPhoneInput] = useState("");
  const [phones, setPhones] = useState([]);

  const [mailInput, setMailInput] = useState("");
  const [mails, setMails] = useState([]);

  // Dosyalar + önizleme
  const [logoDarkFile, setLogoDarkFile] = useState(null);
  const [logoWhiteFile, setLogoWhiteFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);

  const [logoDarkPreview, setLogoDarkPreview] = useState("");
  const [logoWhitePreview, setLogoWhitePreview] = useState("");
  const [faviconPreview, setFaviconPreview] = useState("");

  // Sosyal
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");
  const [linkedin, setLinkedin] = useState("");

  // İlk yükleme
  useEffect(() => {
    fetchTechnical();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Teknik state değişince formu doldur
  useEffect(() => {
    if (!technical) return;
    setAddress(technical.address || "");
    setPhones(Array.isArray(technical.phones) ? technical.phones : []);
    setMails(Array.isArray(technical.mails) ? technical.mails : []);

    setFacebook(technical.facebook || "");
    setInstagram(technical.instagram || "");
    setTwitter(technical.twitter || "");
    setYoutube(technical.youtube || "");
    setLinkedin(technical.linkedin || "");

    // mevcut görseller
    setLogoDarkPreview(technical.logo_dark || "");
    setLogoWhitePreview(technical.logo_white || "");
    setFaviconPreview(technical.favicon || "");

    // dosya inputlarını sıfırla
    setLogoDarkFile(null);
    setLogoWhiteFile(null);
    setFaviconFile(null);
  }, [technical]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // dosya seçimi
  const onFileChange = (setterFile, setterPreview) => (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setterFile(f);
    setterPreview(url);
  };

  const clearPreview = (which) => {
    switch (which) {
      case "dark":
        setLogoDarkFile(null);
        setLogoDarkPreview(technical?.logo_dark || "");
        break;
      case "white":
        setLogoWhiteFile(null);
        setLogoWhitePreview(technical?.logo_white || "");
        break;
      case "favicon":
        setFaviconFile(null);
        setFaviconPreview(technical?.favicon || "");
        break;
    }
  };

  // basit validasyonlar
  const isEmail = (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
  const isPhone = (v) =>
    /^[0-9+()\-.\s]{6,}$/.test(String(v).trim()); // gevşek doğrulama

  // Kaydet
  const handleSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData();
    // text alanları
    fd.append("address", address || "");
    fd.append("facebook", facebook || "");
    fd.append("instagram", instagram || "");
    fd.append("twitter", twitter || "");
    fd.append("youtube", youtube || "");
    fd.append("linkedin", linkedin || "");

    // array alanlar -> phones[] / mails[]
    phones.forEach((p) => fd.append("phones[]", p));
    mails.forEach((m) => fd.append("mails[]", m));

    // dosyalar
    if (logoDarkFile) fd.append("logo_dark", logoDarkFile);
    if (logoWhiteFile) fd.append("logo_white", logoWhiteFile);
    if (faviconFile) fd.append("favicon", faviconFile);

    const res = await updateTechnical(fd);
    if (res.success) {
      toast.success("Ayarlar güncellendi");
      await fetchTechnical();
    } else {
      toast.error(res.message || "Güncelleme başarısız");
    }
  };

  // Sunucudan yenile
  const handleReload = async () => {
    await fetchTechnical();
    toast.info("Veriler yenilendi");
  };

  // Header görseli
  const headerImage = useMemo(() => {
    return getImageUrl(logoDarkPreview || logoWhitePreview || faviconPreview);
  }, [logoDarkPreview, logoWhitePreview, faviconPreview]);

  return (
    <Box sx={{ position: "relative" }}>
      <LoaderOverlay show={false} />

      {/* Başlık alanı */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 3,
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Stack flex={1} spacing={0.5}>
            <Typography variant="h5">Web Sitesi Teknik Alanlar</Typography>
            <Typography variant="body2" color="text.secondary">
              Logolar, favicon, iletişim ve sosyal medya ayarları
            </Typography>
          </Stack>
          {headerImage ? (
            <Box
              sx={{
                width: 120,
                height: 72,
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 1,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={headerImage}
                alt="Kapak"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                width: 120,
                height: 72,
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "text.secondary",
                fontSize: 12,
              }}
            >
              Görsel yok
            </Box>
          )}
        </Paper>
      </motion.div>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{
          mb: 2,
          "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 44 },
        }}
      >
        <Tab label="Görseller" />
        <Tab label="İletişim" />
        <Tab label="Sosyal Medya" />
      </Tabs>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          position: "relative",
          p: { xs: 1, md: 2 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
          bgcolor: "background.paper",
        }}
      >
        <LoaderOverlay show={loading} />

        {/* Sekme İçerikleri */}
        {tab === 0 && (
          <Stack spacing={2} sx={{ opacity: loading ? 0.5 : 1 }}>
            <Typography variant="h6">Görseller</Typography>
            <Divider />

            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Logo (Dark)
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button component="label" variant="outlined" startIcon={<IconUpload size={18} />}>
                    Yükle
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={onFileChange(setLogoDarkFile, setLogoDarkPreview)}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    PNG/SVG — Maks. 2–5MB
                  </Typography>
                </Stack>
                <FilePreview
                  label="logo_dark"
                  src={logoDarkPreview}
                  onClear={() => clearPreview("dark")}
                />
              </Stack>

              <Stack spacing={1.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Logo (White)
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button component="label" variant="outlined" startIcon={<IconUpload size={18} />}>
                    Yükle
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={onFileChange(setLogoWhiteFile, setLogoWhitePreview)}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    PNG/SVG — Maks. 2–5MB
                  </Typography>
                </Stack>
                <FilePreview
                  label="logo_white"
                  src={logoWhitePreview}
                  onClear={() => clearPreview("white")}
                />
              </Stack>

              <Stack spacing={1.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Favicon
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button component="label" variant="outlined" startIcon={<IconUpload size={18} />}>
                    Yükle
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={onFileChange(setFaviconFile, setFaviconPreview)}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    ICO/PNG — Kare önerilir
                  </Typography>
                </Stack>
                <FilePreview
                  label="favicon"
                  src={faviconPreview}
                  onClear={() => clearPreview("favicon")}
                />
              </Stack>
            </Stack>
          </Stack>
        )}

        {tab === 1 && (
          <Stack spacing={2} sx={{ opacity: loading ? 0.5 : 1 }}>
            <Typography variant="h6">İletişim</Typography>
            <Divider />

            <ListInput
              label="Telefonlar"
              icon={<IconPhone size={18} />}
              value={phoneInput}
              setValue={setPhoneInput}
              items={phones}
              setItems={setPhones}
              validator={isPhone}
              placeholder="+90 262 000 00 00"
            />

            <ListInput
              label="E-posta Adresleri"
              icon={<IconAt size={18} />}
              value={mailInput}
              setValue={setMailInput}
              items={mails}
              setItems={setMails}
              validator={isEmail}
              placeholder="info@belediye.gov.tr"
            />

            <Typography variant="subtitle2" color="text.secondary">
              Adres
            </Typography>
            <TextField
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adres"
              fullWidth
              minRows={3}
              multiline
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconMapPin size={18} />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        )}

        {tab === 2 && (
          <Stack spacing={2} sx={{ opacity: loading ? 0.5 : 1 }}>
            <Typography variant="h6">Sosyal Medya</Typography>
            <Divider />

            <TextField
              label="Facebook"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconBrandFacebook size={18} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconBrandInstagram size={18} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Twitter / X"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconBrandTwitter size={18} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="YouTube"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconBrandYoutube size={18} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="LinkedIn"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconBrandLinkedin size={18} />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        )}

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            type="button"
            variant="outlined"
            startIcon={<IconRefresh size={18} />}
            disabled={loading}
            onClick={handleReload}
          >
            Sunucudan Yenile
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default TechnicalList;
