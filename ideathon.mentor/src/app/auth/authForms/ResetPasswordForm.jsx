"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { toast } from "react-toastify";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { resetPassword } from "@/utils/api/auth";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Email yoksa forgot-password sayfasına yönlendir
  useEffect(() => {
    if (!email) {
      toast.error("Email adresi bulunamadı. Lütfen tekrar deneyin.");
      router.push("/auth/forgot-password");
    }
  }, [email, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validasyonlar
    if (!code.trim()) {
      setError("Doğrulama kodu zorunludur");
      return;
    }

    if (code.trim().length !== 6) {
      setError("Doğrulama kodu 6 haneli olmalıdır");
      return;
    }

    if (!newPassword) {
      setError("Yeni şifre zorunludur");
      return;
    }

    if (newPassword.length < 6) {
      setError("Yeni şifre en az 6 karakter olmalıdır");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Şifreler eşleşmiyor. Lütfen kontrol ediniz.");
      return;
    }

    setLoading(true);

    try {
      
      const res = await resetPassword({
        email: email.toLowerCase(),
        code: code.trim(),
        newPassword: newPassword
      });
      

      if (res.success) {
        toast.success(res.message || "Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.");
        
        // 2 saniye bekle ve login sayfasına yönlendir
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        setError(res.message || "Bir hata oluştu");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Bir hata oluştu.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

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

        {/* Email (Disabled) */}
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
            value={email}
            disabled
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: "#F8F9FA",
                '& fieldset': {
                  borderColor: '#E0E0E0',
                },
              },
              '& .MuiOutlinedInput-input': {
                padding: '14px 16px',
                color: "#666",
              }
            }}
          />
        </Box>

        {/* Doğrulama Kodu */}
        <Box>
          <CustomFormLabel 
            htmlFor="code"
            sx={{ 
              mb: 1.5, 
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#2c3e50"
            }}
          >
            Doğrulama Kodu
          </CustomFormLabel>
          <CustomTextField
            id="code"
            variant="outlined"
            fullWidth
            placeholder="_ _ _ _ _ _"
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setCode(value);
              setError("");
            }}
            inputProps={{ 
              inputMode: "numeric", 
              maxLength: 6,
              style: { 
                letterSpacing: "1em", 
                fontSize: "1.5rem", 
                textAlign: "center",
                fontWeight: 600,
                color: "#005DAD"
              }
            }}
            required
            disabled={loading}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
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
                padding: '16px',
              }
            }}
          />
        </Box>

        {/* Yeni Şifre */}
        <Box>
          <CustomFormLabel 
            htmlFor="new-password"
            sx={{ 
              mb: 1.5, 
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#2c3e50"
            }}
          >
            Yeni Şifre
          </CustomFormLabel>
          <CustomTextField
            id="new-password"
            variant="outlined"
            fullWidth
            type={showPassword ? "text" : "password"}
            placeholder="En az 6 karakter"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError("");
            }}
            required
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={() => setShowPassword(!showPassword)} 
                    edge="end"
                    disabled={loading}
                    sx={{ mr: 0.5 }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
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

        {/* Şifreyi Onayla */}
        <Box>
          <CustomFormLabel 
            htmlFor="confirm-password"
            sx={{ 
              mb: 1.5, 
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#2c3e50"
            }}
          >
            Şifreyi Onayla
          </CustomFormLabel>
          <CustomTextField
            id="confirm-password"
            variant="outlined"
            fullWidth
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Şifreyi tekrar girin"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError("");
            }}
            required
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    edge="end"
                    disabled={loading}
                    sx={{ mr: 0.5 }}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
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

        {/* Bilgilendirme */}
        <Alert 
          severity="info" 
          sx={{ 
            mt: 1,
            borderRadius: 2,
            fontSize: "0.875rem",
            bgcolor: "rgba(33, 150, 243, 0.08)",
            boxShadow: "0 2px 8px rgba(33, 150, 243, 0.15)"
          }}
        >
          <strong>Önemli:</strong> Doğrulama kodu 15 dakika geçerlidir. Kod süreniz dolduysa yeni kod talep edin.
        </Alert>

        {/* Kaydet Butonu */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          sx={{
            mt: 3,
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
              <span>Şifre Güncelleniyor...</span>
            </Stack>
          ) : (
            "Yeni Şifreyi Kaydet"
          )}
        </Button>

        {/* Geri Dön Butonu */}
        <Button
          variant="text"
          size="large"
          fullWidth
          onClick={() => router.push("/auth/forgot-password")}
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
          Yeni Kod Talep Et
        </Button>
      </Stack>
    </form>
  );
}
