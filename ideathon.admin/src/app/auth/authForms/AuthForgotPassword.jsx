"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { toast } from "react-toastify";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import { sendForgotPassword } from "@/utils/api/auth";

export default function AuthForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await sendForgotPassword(email.trim().toLowerCase());
      toast.success(res.message || "Bu e-posta adresiyle kayıtlı aktif bir hesap varsa şifre sıfırlama kodu gönderildi.");
      router.push(`/auth/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Bir hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3} sx={{ mt: 4 }}>
        <CustomFormLabel htmlFor="email">E-posta Adresi</CustomFormLabel>
        <CustomTextField
          id="email"
          variant="outlined"
          fullWidth
          type="email"
          placeholder="ornek@firma.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button
          type="submit"
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
        >
          {loading ? "Gönderiliyor..." : "Doğrulama Kodu Gönder"}
        </Button>

        <Button
          color="primary"
          size="large"
          fullWidth
          onClick={() => router.push("/auth/login")}
          disabled={loading}
        >
          Vazgeç
        </Button>
      </Stack>
    </form>
  );
}
