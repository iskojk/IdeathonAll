"use client";

import React, { useContext, useState } from "react";
import { ReferenceContext } from "@/app/context/ReferenceContext";
import { useRouter } from "next/navigation";
import {
  Box,
  TextField,
  Stack,
  Button,
  Typography,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { toast } from "react-toastify";

const CreateReferenceContent = () => {
  const { createReference } = useContext(ReferenceContext);
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    link: "",
    is_active: true,
    order: "", // opsiyonel
    logo: null,
  });

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;

    if (name === "logo") {
      const file = files?.[0] || null;
      setForm((s) => ({ ...s, logo: file }));
      setPreview(file ? URL.createObjectURL(file) : "");
      return;
    }

    if (type === "checkbox") {
      setForm((s) => ({ ...s, [name]: checked }));
      return;
    }

    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = new FormData();

    // zorunlu alanlar
    body.append("name", form.name);
    if (form.logo) body.append("logo", form.logo);

    // opsiyoneller
    if (form.link) body.append("link", form.link);
    body.append("is_active", String(!!form.is_active));
    if (form.order !== "" && form.order !== null) {
      body.append("order", String(form.order));
    }

    setLoading(true);
    const res = await createReference(body);
    setLoading(false);

    if (res?.success) {
      toast.success("Referans oluşturuldu");
      router.push("/references/list");
    } else {
      toast.error(res?.message || "Referans oluşturulamadı");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 3, p: { xs: 0, sm: 3 } }}
    >
      <Typography variant="h5">Yeni Referans Oluştur</Typography>

      <Stack spacing={2}>
        <TextField
          label="Ad *"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          fullWidth
        />

        <TextField
          label="Link"
          name="link"
          value={form.link}
          onChange={handleChange}
          fullWidth
          placeholder="https://..."
        />

        <TextField
          label="Sıra"
          name="order"
          type="number"
          value={form.order}
          onChange={handleChange}
          fullWidth
          inputProps={{ min: 1 }}
          placeholder="Boş bırakılırsa otomatik"
        />

        <FormControlLabel
          control={
            <Switch
              checked={form.is_active}
              onChange={handleChange}
              name="is_active"
              color="primary"
            />
          }
          label="Aktif"
        />

        <Stack direction="row" spacing={2} alignItems="center">
          <Button variant="outlined" component="label">
            Logo Yükle
            <input
              type="file"
              name="logo"
              accept="image/*"
              hidden
              onChange={handleChange}
            />
          </Button>
          <Typography variant="body2" color="text.secondary">
            {form.logo ? form.logo.name : "Dosya seçilmedi"}
          </Typography>
        </Stack>

        {preview && (
          <Box
            component="img"
            src={preview}
            alt="Önizleme"
            sx={{ width: 360, maxWidth: "100%", borderRadius: 1, border: "1px solid", borderColor: "divider" }}
          />
        )}

        <Stack direction="row" spacing={2}>
          <Button color="error" variant="outlined" href="/references/list" fullWidth>
            İptal
          </Button>
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
            {loading ? "Oluşturuluyor..." : "Referans Oluştur"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default CreateReferenceContent;
