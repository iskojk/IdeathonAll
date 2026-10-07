"use client";

import React, { useState, useEffect, useMemo, useContext } from "react";
import {
  Box,
  TextField,
  Stack,
  Button,
  Typography,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { JobContext } from "@/app/context/JobContext";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import OccupationSingleSelect from "@/app/components/common/OccupationSingleSelect";

export default function EditJobContent() {
  const { id } = useParams();
  const router = useRouter();
  const { getJobById, updateJob } = useContext(JobContext);

  const { user } = useSelector((state) => state.auth) || {};
  const isCompany = user?.role === "company";
  const defaultCompanyName = useMemo(
    () => (user?.name ? String(user.name) : ""),
    [user?.name]
  );

  const [formData, setFormData] = useState({
    category: "",
    title: "",
    title_code: "",
    description: "",
    location: "",
    type: "",
    deadline: "",
    custom_company_logo: null, // string (filename) | File | null
    custom_company_name: "",
    is_active: false,
    is_approved: false,
  });

  const [selectedOccupation, setSelectedOccupation] = useState(null); // {code, name} | null
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadJob = async () => {
      const res = await getJobById(id);
      if (!res?.success || !res?.data) {
        toast.error(res?.message || "İlan bulunamadı.");
        router.push("/job/list");
        return;
      }
      const job = res.data;

      setFormData({
        category: job.category || "",
        title: job.title || "",
        title_code: job.title_code || "",
        description: job.description || "",
        location: job.location || "",
        type: job.type || "",
        deadline: job.deadline ? job.deadline.split("T")[0] : "",
        custom_company_name: isCompany
          ? defaultCompanyName
          : job.custom_company_name || "",
        custom_company_logo: job.custom_company_logo || null,
        is_active: job.is_active ?? false,
        is_approved: job.is_approved ?? false,
      });

      // Meslek seçiciyi mevcut değerle doldur
      const occ = {
        name: job.title || "",
        code: job.title_code || "",
      };
      if (occ.name) setSelectedOccupation(occ);
    };

    loadJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isCompany, defaultCompanyName]);

  const handleOccupationChange = (val) => {
    setSelectedOccupation(val);
    setFormData((p) => ({
      ...p,
      title: val?.name || "",
      title_code: val?.code || "",
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    // company kullanıcıları firma adı/logo/approved değiştiremez
    if (isCompany && (name === "custom_company_name" || name === "custom_company_logo" || name === "is_approved")) {
      return;
    }

    if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files?.[0] || null }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error("Lütfen pozisyon başlığını seçin.");
      return;
    }
    if (!formData.category) {
      toast.error("Lütfen kategori girin.");
      return;
    }

    const body = new FormData();
    // boş/null olanları yollama
    Object.entries(formData).forEach(([key, value]) => {
      if (value === null || value === "") return;

      // company kısıtları
      if (isCompany && (key === "custom_company_logo" || key === "custom_company_name" || key === "is_approved")) {
        return;
      }

      // File ve string filename durumlarını olduğu gibi gönder
      body.append(key, value);
    });

    setLoading(true);
    const result = await updateJob(id, body);
    setLoading(false);

    if (result?.success) {
      toast.success("İlan başarıyla güncellendi.");
      router.push("/job/list");
    } else {
      toast.error(result?.message || "Bir hata oluştu.");
    }
  };

  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL_APP || "").replace(
    /\/+$/,
    ""
  );

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 3, p: { xs: 0, sm: 3 } }}
    >
      <Typography variant="h5">İş İlanı Güncelle</Typography>

      <TextField
        label="Firma"
        name="custom_company_name"
        value={formData.custom_company_name || (isCompany ? defaultCompanyName : "")}
        onChange={handleInputChange}
        fullWidth
        InputProps={{ readOnly: true }}
        helperText="Şirket hesabıyla işlem yapılıyor."
      />

      <Stack spacing={2}>
        <TextField
          label="Kategori *"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          required
          fullWidth
        />

        {/* Pozisyon Başlığı: İŞKUR mesleklerinden tek seçim */}
        <OccupationSingleSelect
          label="Pozisyon Başlığı *"
          value={selectedOccupation}
          onChange={handleOccupationChange}
          required
        />

        <TextField
          label="Açıklama"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          fullWidth
          multiline
          rows={4}
        />

        <TextField
          label="Konum"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          fullWidth
        />

        <TextField
          select
          label="Çalışma Şekli"
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          fullWidth
        >
          <MenuItem value="">Seçiniz</MenuItem>
          <MenuItem value="Tam Zamanlı">Tam Zamanlı</MenuItem>
          <MenuItem value="Yarı Zamanlı">Yarı Zamanlı</MenuItem>
          <MenuItem value="Uzaktan">Uzaktan</MenuItem>
          <MenuItem value="Vardiyalı">Vardiyalı</MenuItem>
          <MenuItem value="Staj">Staj</MenuItem>
        </TextField>

        <TextField
          label="Son Başvuru Tarihi"
          name="deadline"
          type="date"
          value={formData.deadline}
          onChange={handleInputChange}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />

        {/* Logo yalnızca admin/staff düzenler */}
        {!isCompany && (
          <>
            <Button variant="outlined" component="label">
              Firma Logosu Yükle
              <input
                type="file"
                name="custom_company_logo"
                accept="image/*"
                hidden
                onChange={handleInputChange}
              />
            </Button>

            {formData.custom_company_logo &&
              (typeof formData.custom_company_logo === "string" ? (
                <Box mt={1}>
                  <Typography fontSize={14}>Mevcut Logo:</Typography>
                  <img
                    src={`${API_BASE}/uploads/${formData.custom_company_logo}`}
                    alt="Firma Logosu"
                    style={{
                      maxWidth: 100,
                      marginTop: 8,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                    }}
                  />
                </Box>
              ) : (
                <Typography fontSize={14}>
                  Yüklendi: {formData.custom_company_logo.name}
                </Typography>
              ))}
          </>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={!!formData.is_active}
              onChange={handleInputChange}
              name="is_active"
            />
          }
          label="İlan Aktif mi?"
        />

        {!isCompany && (
          <FormControlLabel
            control={
              <Switch
                checked={!!formData.is_approved}
                onChange={handleInputChange}
                name="is_approved"
              />
            }
            label="Onaylı mı?"
          />
        )}

        <Stack direction="row" spacing={2}>
          <Button color="error" variant="outlined" href="/job/list" fullWidth>
            İptal
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? "Güncelleniyor..." : "Güncelle"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
