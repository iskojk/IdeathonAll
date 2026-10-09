"use client";
import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { toast } from "react-toastify";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { resetPassword } from "@/utils/api/auth";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor. Lütfen kontrol ediniz.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ email, code: code.trim(), newPassword });
      toast.success(res.message || "Şifre başarıyla güncellendi.");
      window.location.href = "/auth/login";
    } catch (error) {
      toast.error(error.response?.data?.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3} sx={{ mt: 4 }}>
        <CustomFormLabel htmlFor="email">E-posta</CustomFormLabel>
        <CustomTextField
          id="email"
          variant="outlined"
          fullWidth
          value={email}
          disabled
        />

        <CustomFormLabel htmlFor="code">Doğrulama Kodu</CustomFormLabel>
        <CustomTextField
          id="code"
          variant="outlined"
          fullWidth
          placeholder="6 haneli kod"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
          inputProps={{ inputMode: "numeric", maxLength: 6 }}
          required
        />

        <CustomFormLabel htmlFor="new-password">Yeni Şifre</CustomFormLabel>
        <CustomTextField
          id="new-password"
          variant="outlined"
          fullWidth
          type={showPassword ? "text" : "password"}
          placeholder="Yeni şifrenizi girin"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <CustomFormLabel htmlFor="confirm-password">Şifreyi Onayla</CustomFormLabel>
        <CustomTextField
          id="confirm-password"
          variant="outlined"
          fullWidth
          type={showPassword ? "text" : "password"}
          placeholder="Şifreyi tekrar girin"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Şifre kuralları */}
        <Stack spacing={1} sx={{ mt: 1 }}>
          <p style={{ color: "#6b6b6b", fontSize: "14px" }}>
            <b>* Şifre Kuralları:</b>
          </p>
          <ul style={{ paddingLeft: "20px", marginTop: 0, color: "#6b6b6b", fontSize: "14px" }}>
            <li>En az 8 karakter uzunluğunda olmalıdır.</li>
            <li>En az bir büyük harf içermelidir.</li>
            <li>En az bir küçük harf içermelidir.</li>
            <li>En az bir rakam içermelidir.</li>
          </ul>
        </Stack>

        <Button
          type="submit"
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
        >
          {loading ? "Şifre Yenileniyor..." : "Yeni Şifreyi Kaydet"}
        </Button>
      </Stack>
    </form>
  );
}
