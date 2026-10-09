"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { toast } from "react-toastify";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import { forgotPassword } from "@/utils/api/auth";

export default function AuthForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Email validation
    if (!email.trim()) {
      setError("Email adresi zorunludur");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Geçerli bir email adresi giriniz");
      return;
    }

    setLoading(true);
    setError("");

    try {
      
      const res = await forgotPassword(email.trim().toLowerCase());
      
      
      if (res.success) {
        toast.success(res.message || "Bu e-posta adresiyle kayıtlı aktif bir hesap varsa şifre sıfırlama kodu gönderildi.");
        // Reset password sayfasına yönlendir
        router.push(`/auth/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      } else {
        setError(res.message || "Bir hata oluştu");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Bir hata oluştu!";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3.5} sx={{ mt: 5 }}>
        {/* Hata Mesajı */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: 2,
              fontSize: "0.9rem",
              boxShadow: "0 2px 8px rgba(211, 47, 47, 0.15)"
            }}
          >
            {error}
          </Alert>
        )}

        {/* Email Input */}
        <Box>
          <CustomFormLabel 
            htmlFor="email"
            sx={{ 
              mb: 1.5, 
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#2c3e50"
            }}
          >
            E-posta Adresi
          </CustomFormLabel>
          <CustomTextField
            id="email"
            variant="outlined"
            fullWidth
            type="email"
            placeholder="ornek@firma.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            required
            disabled={loading}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: "1rem",
                transition: "all 0.3s ease",
                '& fieldset': {
                  borderColor: '#E0E0E0',
                  borderWidth: 1.5,
                },
                '&:hover fieldset': {
                  borderColor: '#005DAD',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#005DAD',
                  borderWidth: 2,
                },
              },
              '& .MuiOutlinedInput-input': {
                padding: '14px 16px',
              }
            }}
          />
        </Box>

        {/* Gönder Butonu */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          sx={{
            mt: 2,
            py: 1.75,
            fontSize: "1rem",
            fontWeight: 600,
            borderRadius: 2,
            bgcolor: "#005DAD",
            textTransform: "none",
            boxShadow: "0 4px 12px rgba(0, 93, 173, 0.25)",
            transition: "all 0.3s ease",
            "&:hover": {
              bgcolor: "#004080",
              boxShadow: "0 6px 16px rgba(0, 93, 173, 0.35)",
              transform: "translateY(-1px)",
            },
            "&:active": {
              transform: "translateY(0)",
            },
            "&:disabled": {
              bgcolor: "#BDBDBD",
              boxShadow: "none",
            }
          }}
        >
          {loading ? (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={22} sx={{ color: "white" }} />
              <span>Gönderiliyor...</span>
            </Stack>
          ) : (
            "Doğrulama Kodu Gönder"
          )}
        </Button>

        {/* Vazgeç Butonu */}
        <Button
          variant="text"
          size="large"
          fullWidth
          onClick={() => router.push("/auth/login")}
          disabled={loading}
          sx={{
            py: 1.5,
            fontSize: "0.95rem",
            fontWeight: 500,
            color: "#005DAD",
            textTransform: "none",
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: "rgba(0, 93, 173, 0.08)",
            }
          }}
        >
          Giriş Sayfasına Dön
        </Button>
      </Stack>
    </form>
  );
}
