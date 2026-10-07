"use client";

import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import { IconEye, IconEyeOff, IconArrowRight } from "@tabler/icons-react";

const MentorUserForm = ({ formData, setFormData, onSubmit, onBack, loading }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = "Ad Soyad en az 2 karakter olmalıdır";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = "Geçerli bir e-posta adresi girin";
    }

    // Password validation
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "Şifre en az 6 karakter olmalıdır";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Mentor rolünde yeni bir kullanıcı hesabı oluşturun. Bu hesap ile mentor giriş yapabilecek.
        </Alert>

        <TextField
          fullWidth
          label="Ad Soyad"
          required
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          placeholder="Örn: Ahmet Yılmaz"
          inputProps={{ maxLength: 100 }}
        />

        <TextField
          fullWidth
          label="E-posta"
          type="email"
          required
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          error={!!errors.email}
          helperText={errors.email}
          placeholder="Örn: ahmet@example.com"
          inputProps={{ maxLength: 100 }}
        />

        <TextField
          fullWidth
          label="Şifre"
          type={showPassword ? "text" : "password"}
          required
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          error={!!errors.password}
          helperText={errors.password || "Mentor giriş için kullanılacak şifre"}
          placeholder="En az 6 karakter"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            endIcon={<IconArrowRight size={20} />}
            disabled={loading}
            size="large"
          >
            {loading ? "Oluşturuluyor..." : "Devam Et"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default MentorUserForm;




















