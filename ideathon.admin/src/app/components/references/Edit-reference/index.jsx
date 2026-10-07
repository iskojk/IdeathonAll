"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import { ReferenceContext } from "@/app/context/ReferenceContext";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  TextField,
  Stack,
  Button,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002/api";

export default function EditReferenceContent() {
  const { id } = useParams();
  const router = useRouter();
  const { getReferenceById, updateReference } = useContext(ReferenceContext);

  const mountedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [form, setForm] = useState({
    name: "",
    link: "",
    logo: null, // new file (optional)
  });

  const [preview, setPreview] = useState("");
  const [existingLogo, setExistingLogo] = useState("");

  // Fetch once
  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await getReferenceById(id);
      if (!alive) return;

      if (res?.success && res?.data) {
        const r = res.data;

        setForm({
          name: r.name || "",
          link: r.link || "",
          logo: null,
        });

        const base = API_BASE_URL.replace("/api", "");
        const img = r.logo?.startsWith("/") ? `${base}${r.logo}` : r.logo || "";
        setExistingLogo(img);
        setPreview(img);
        setLoaded(true);
        mountedRef.current = true;
      } else {
        toast.error(res?.message || "Referans bulunamadı");
        router.push("/references/list");
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Generic change handler
  const handleChange = (e) => {
    const target = e.target || e.currentTarget;
    const name =
      target.name ||
      target.getAttribute?.("name") ||
      target.getAttribute?.("data-name");

    if (!name) return;

    if (name === "logo") {
      const file = target.files?.[0] || null;
      setForm((s) => ({ ...s, logo: file }));
      setPreview(file ? URL.createObjectURL(file) : existingLogo);
      return;
    }

    const value = target.value ?? "";
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const body = new FormData();
    body.append("name", form.name);
    if (form.link) body.append("link", form.link);
    if (form.logo) body.append("logo", form.logo); // optional

    setLoading(true);
    const res = await updateReference(id, body);
    setLoading(false);

    if (res?.success) {
      toast.success("Referans güncellendi");
      router.push("/references/list");
    } else {
      toast.error(res?.message || "Referans güncellenemedi");
    }
  };

  if (!loaded) return null;

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 3, p: { xs: 0, sm: 3 } }}
    >
      <Typography variant="h5">Referans Düzenle</Typography>

      <Stack spacing={2}>
        <TextField
          label="Ad *"
          name="name"
          inputProps={{ "data-name": "name" }}
          value={form.name}
          onChange={handleChange}
          required
          fullWidth
        />

        <TextField
          label="Link"
          name="link"
          inputProps={{ "data-name": "link" }}
          value={form.link}
          onChange={handleChange}
          fullWidth
          placeholder="https://..."
        />

        <Stack direction="row" spacing={2} alignItems="center">
          <Button variant="outlined" component="label">
            Logo Değiştir
            <input
              type="file"
              name="logo"
              accept="image/*"
              hidden
              onChange={handleChange}
            />
          </Button>
          <Typography variant="body2" color="text.secondary">
            {form.logo ? form.logo.name : "Yeni dosya seçilmedi"}
          </Typography>
        </Stack>

        {preview && (
          <Box
            component="img"
            src={preview}
            alt="Önizleme"
            sx={{
              width: 360,
              maxWidth: "100%",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
            }}
          />
        )}

        <Stack direction="row" spacing={2}>
          <Button
            color="error"
            variant="outlined"
            onClick={() => router.push("/references/list")}
            fullWidth
          >
            İptal
          </Button>
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
            {loading ? "Güncelleniyor..." : "Güncelle"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
