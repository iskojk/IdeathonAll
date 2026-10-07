"use client";

import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
  Avatar,
  Alert,
  Paper,
  useTheme,
} from "@mui/material";
import { IconArrowLeft, IconCheck, IconPhoto, IconUpload } from "@tabler/icons-react";

const MentorPhotoUpload = ({ photoFile, setPhotoFile, onSubmit, onSkip, onBack, loading }) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (file) {
      // File type validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Sadece JPEG, PNG ve WebP formatındaki resim dosyaları kabul edilir');
        setPhotoFile(null);
        setPhotoPreview(null);
        return;
      }

      // File size validation (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Dosya boyutu çok büyük (maksimum 5MB)');
        setPhotoFile(null);
        setPhotoPreview(null);
        return;
      }

      setPhotoFile(file);
      setError("");

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!photoFile) {
      setError("Lütfen bir fotoğraf seçin");
      return;
    }

    await onSubmit(photoFile);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Mentorun profil fotoğrafını yükleyin. Bu adım isteğe bağlıdır, daha sonra da ekleyebilirsiniz.
        </Alert>

        {/* Photo Upload Area */}
        <Paper
          elevation={0}
          sx={{
            border: `2px dashed ${error ? theme.palette.error.main : theme.palette.divider}`,
            borderRadius: 3,
            p: 4,
            textAlign: 'center',
            bgcolor: theme.palette.background.default,
            cursor: 'pointer',
            transition: 'all 0.3s',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              bgcolor: theme.palette.action.hover,
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Stack spacing={2} alignItems="center">
            {photoPreview ? (
              <Avatar
                src={photoPreview}
                sx={{
                  width: 150,
                  height: 150,
                  border: `4px solid ${theme.palette.primary.main}`,
                  boxShadow: 3,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  bgcolor: theme.palette.grey[200],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconPhoto size={60} color={theme.palette.grey[500]} />
              </Box>
            )}

            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {photoFile ? photoFile.name : "Fotoğraf Seç"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tıklayarak dosya seçin veya sürükle-bırak yapın
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                JPEG, PNG veya WebP • Maksimum 5MB
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<IconUpload size={18} />}
              size="large"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Dosya Seç
            </Button>
          </Stack>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={handleFileChange}
          />
        </Paper>

        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={20} />}
            onClick={onBack}
            disabled={loading}
            size="large"
          >
            Geri
          </Button>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={onSkip}
              disabled={loading}
              size="large"
            >
              Atla
            </Button>

            <Button
              type="submit"
              variant="contained"
              startIcon={<IconCheck size={20} />}
              disabled={loading || !photoFile}
              size="large"
            >
              {loading ? "Yükleniyor..." : "Tamamla"}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};

export default MentorPhotoUpload;




















