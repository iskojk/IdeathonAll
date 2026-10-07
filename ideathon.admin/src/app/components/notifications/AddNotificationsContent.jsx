"use client"
import React, { useState } from "react";
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";
import { createNotification } from "@/services/notificationService";
import { toast } from "react-toastify";

const AddNotificationsContent = () => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "announcement",
    recipientType: "User",
    recipients: [],
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === "type" && value === "announcement") {
      setFormData({
        ...formData,
        type: value,
        recipientType: "General",
        recipients: [],
      });
    } else if (name === "recipientType" && formData.type !== "announcement") {
      setFormData({
        ...formData,
        [name]: value,
        recipients: [],
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await createNotification(formData);
      toast.success(response.message || "Bildirim başarıyla oluşturuldu!");
      setFormData({
        title: "",
        content: "",
        type: "announcement",
        recipientType: "User",
        recipients: [],
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Bildirim oluşturulamadı!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        {/* Bildirim Türlerinin Açıklamaları */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
            Bildirim Türleri:
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Genel Bildirim:</strong> Tüm öğrenci, mentor ve öğretmenlere
            gönderilen bildirimlerdir.
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Kişisel Bildirim:</strong> Belirli bir grup (öğrenci veya öğretmen/mentor) için
            gönderilen özel bildirimlerdir.
          </Typography>
        </Box>

        {/* Bildirim Oluşturma Formu */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <TextField
            label="Başlık"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            fullWidth
            variant="outlined"
          />

          <TextField
            label="İçerik"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            multiline
            rows={4}
            required
            fullWidth
            variant="outlined"
          />

          <TextField
            select
            label="Bildirim Türü"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            fullWidth
            variant="outlined"
          >
            <MenuItem value="announcement">Genel Bildirim</MenuItem>
            <MenuItem value="personal">Kişisel Bildirim</MenuItem>
          </TextField>

          {formData.type !== "announcement" && (
            <TextField
              select
              label="Alıcı Türü"
              name="recipientType"
              value={formData.recipientType}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
            >
              <MenuItem value="User">Öğretmen ve Mentör</MenuItem>
              <MenuItem value="Student">Öğrenci</MenuItem>
            </TextField>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? "Oluşturuluyor..." : "Oluştur"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AddNotificationsContent;
