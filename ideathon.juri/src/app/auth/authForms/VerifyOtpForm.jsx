"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";

import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";

import { verifyOtp } from "@/utils/api/auth";

export default function VerifyOtpForm() {
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 dakika (600 saniye)
  const searchParams = useSearchParams();
  const router = useRouter();

  // Telefon numarasını URL'den al
  const phone = searchParams.get("phone") || "";

  useEffect(() => {
    if (!phone) {
      toast.error("Telefon numarası eksik! Tekrar giriş yapın.");
      router.push("/auth/forgot-password");
    }
  }, [phone, router]);

  // Geri sayım için useEffect
  useEffect(() => {
    if (countdown <= 0) {
      toast.error("Doğrulama süresi doldu. Tekrar kod talep edin.");
      router.push("/auth/forgot-password");
      return;
    }
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer); // Temizlik
  }, [countdown, router]);

  // Geri sayımı dakika:saniye formatına çevir
  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await verifyOtp(phone, otpCode);
      toast.success(response.message);
      setLoading(false); // Sayfa geçişi sırasında da buton aktif olmasın
      router.push(`/auth/reset-password?phone=${phone}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP doğrulama başarısız!");
      setLoading(false); // Hata olursa butonu tekrar aktif et
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3} sx={{ mt: 4 }}>
        <CustomFormLabel htmlFor="otp-code">Doğrulama Kodu</CustomFormLabel>
        <CustomTextField
          id="otp-code"
          variant="outlined"
          fullWidth
          placeholder="6 haneli kodu girin"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          required
        />

        {/* Geri sayım */}
        <Typography variant="subtitle1" align="center" color="error" sx={{ mt: 2 }}>
          Kodun geçerlilik süresi: {formatCountdown()}
        </Typography>

        <Button
          type="submit"
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading || countdown <= 0} // Geri sayım bitince veya işlem sırasında pasif
        >
          {loading ? "Doğrulanıyor..." : "Doğrula"}
        </Button>

        <Button
          color="primary"
          size="large"
          fullWidth
          disabled={loading} // İşlem sırasında bu buton da pasif
          onClick={() => router.push("/auth/login")}
        >
          Vazgeç
        </Button>
      </Stack>
    </form>
  );
}
