"use client";

import React, { useState, useContext, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  Box,
  TextField,
  Stack,
  Button,
  Typography,
  MenuItem,
} from "@mui/material";
import { toast } from "react-toastify";
import { JobContext } from "@/app/context/JobContext";
import { CompanyContext } from "@/app/context/CompanyContext";
import OccupationSingleSelect from "@/app/components/common/OccupationSingleSelect";

export default function CreateJobContent() {
  const router = useRouter();
  const { createJob } = useContext(JobContext);

  const { user } = useSelector((state) => state.auth) || {};
  const isCompany = user?.role === "company";
  const defaultCompanyName = user?.name || "";

  const { companies = [], fetchCompanies } = useContext(CompanyContext) || {};
  const didFetchRef = useRef(false);

  useEffect(() => {
    if (isCompany) return;
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    if (fetchCompanies) fetchCompanies().catch(() => {});
  }, [isCompany, fetchCompanies]);

  const [selectedOccupation, setSelectedOccupation] = useState(null); // { code, name } | null

  const [formData, setFormData] = useState({
    company_id: "",
    category: "",
    title: "",
    title_code: "",
    description: "",
    location: "",
    type: "",
    deadline: "",
    custom_company_name: defaultCompanyName,
  });

  const handleOccupationChange = (val) => {
    setSelectedOccupation(val);
    setFormData((p) => ({
      ...p,
      title: val?.name || "",
      title_code: val?.code || "",
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "company_id") {
      const selectedCompany = companies.find((c) => c._id === value);
      setFormData((prev) => ({
        ...prev,
        company_id: value,
        custom_company_name:
          selectedCompany?.user_id?.name || selectedCompany?.name || "",
      }));
      return;
    }

    if (isCompany && name === "custom_company_name") return;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    if (!isCompany && formData.company_id) body.append("company_id", formData.company_id);
    body.append("category", formData.category);
    body.append("title", formData.title);
    if (formData.title_code) body.append("title_code", formData.title_code);
    if (formData.description) body.append("description", formData.description);
    if (formData.location) body.append("location", formData.location);
    if (formData.type) body.append("type", formData.type);
    if (formData.deadline) body.append("deadline", formData.deadline);
    if (!isCompany && formData.custom_company_name) {
      body.append("custom_company_name", formData.custom_company_name);
    }

    const result = await createJob(body);

    if (result?.success) {
      toast.success("İlan başarıyla oluşturuldu.");
      router.push("/job/list");
    } else {
      toast.error(result?.message || "Bir hata oluştu.");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 3, p: { xs: 0, sm: 3 } }}
    >
      <Typography variant="h5">Yeni İş İlanı Oluştur</Typography>

      {isCompany ? (
        <TextField
          label="Firma"
          name="custom_company_name"
          value={formData.custom_company_name}
          onChange={handleInputChange}
          fullWidth
          InputProps={{ readOnly: true }}
          helperText="Şirket hesabı ile ilan oluşturuluyor."
        />
      ) : (
        <Stack spacing={2}>
          <TextField
            select
            label="Firma (varsa seçin)"
            name="company_id"
            value={formData.company_id}
            onChange={handleInputChange}
            fullWidth
          >
            <MenuItem value="">Bağlantısız (manuel bilgi girilecek)</MenuItem>
            {companies.map((comp) => (
              <MenuItem key={comp._id} value={comp._id}>
                {comp?.user_id?.name || comp?.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Firma Adı (Manuel)"
            name="custom_company_name"
            value={formData.custom_company_name}
            onChange={handleInputChange}
            fullWidth
          />
        </Stack>
      )}

      <Stack spacing={2}>
        <TextField
          label="Kategori *"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          required
          fullWidth
        />

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

        <Stack direction="row" spacing={2}>
          <Button color="error" variant="outlined" href="/job/list" fullWidth>
            İptal
          </Button>
          <Button type="submit" variant="contained" color="primary" fullWidth>
            İlan Oluştur
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
