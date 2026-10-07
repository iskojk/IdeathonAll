"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Divider,
  Chip,
} from "@mui/material";
import {
  IconThumbUp,
  IconThumbDown,
  IconHelp,
  IconCheck,
  IconEdit,
  IconX,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import axios from "@/utils/axios";
import moment from "moment";
import "moment/locale/tr";

moment.locale("tr");

const PreEvaluationForm = ({ applicationId, currentEvaluation, onSuccess }) => {
  const [decision, setDecision] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (currentEvaluation) {
      setDecision(currentEvaluation.decision);
      setComment(currentEvaluation.comment || "");
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [currentEvaluation]);

  const handleDecisionChange = (event, newDecision) => {
    if (newDecision !== null) {
      setDecision(newDecision);
    }
  };

  const handleSubmit = async () => {
    if (!decision) {
      toast.error("Lütfen bir karar seçin");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        decision,
        comment: comment.trim() || undefined,
      };

      const response = await axios.post(`/applications/${applicationId}/pre-evaluate`, payload);

      if (response.data.success) {
        toast.success(response.data.message || "Değerlendirme kaydedildi");
        setIsEditing(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.data.message || "Değerlendirme kaydedilemedi");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (currentEvaluation) {
      setDecision(currentEvaluation.decision);
      setComment(currentEvaluation.comment || "");
      setIsEditing(false);
    } else {
      setDecision("");
      setComment("");
    }
  };

  const getDecisionLabel = (dec) => {
    switch (dec) {
      case "approve": return "Onaylıyorum";
      case "reject": return "Reddediyorum";
      case "undecided": return "Kararsızım";
      default: return "";
    }
  };

  const getDecisionColor = (dec) => {
    switch (dec) {
      case "approve": return "success";
      case "reject": return "error";
      case "undecided": return "warning";
      default: return "default";
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 3,
        border: "2px solid",
        borderColor: currentEvaluation ? "success.main" : "divider",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Başlık */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {currentEvaluation ? "✅ Değerlendirmeniz" : "📝 Ön Değerlendirme"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentEvaluation 
                ? "Bu başvuruyu daha önce değerlendirdiniz" 
                : "Bu başvuruya ön değerlendirme yapın"}
            </Typography>
          </Box>

          <Divider />

          {/* Mevcut Değerlendirme Gösterimi */}
          {currentEvaluation && !isEditing ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", mb: 1, display: "block" }}>
                  Kararınız
                </Typography>
                <Chip
                  label={getDecisionLabel(currentEvaluation.decision)}
                  color={getDecisionColor(currentEvaluation.decision)}
                  sx={{ fontWeight: 600, fontSize: "0.875rem" }}
                />
              </Box>

              {currentEvaluation.comment && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", mb: 1, display: "block" }}>
                    Yorumunuz
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                    <Typography variant="body2">{currentEvaluation.comment}</Typography>
                  </Box>
                </Box>
              )}

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                  Değerlendirme Tarihi: {moment(currentEvaluation.evaluatedAt).format("DD MMMM YYYY, HH:mm")}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                fullWidth
                startIcon={<IconEdit size={18} />}
                onClick={handleEdit}
              >
                Değerlendirmeyi Güncelle
              </Button>
            </Stack>
          ) : (
            /* Değerlendirme Formu */
            <Stack spacing={3}>
              {/* Karar Seçimi */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                  Kararınız <span style={{ color: "red" }}>*</span>
                </Typography>
                <Stack spacing={1.5}>
                  <Button
                    fullWidth
                    variant={decision === "approve" ? "contained" : "outlined"}
                    color="success"
                    size="large"
                    onClick={() => setDecision("approve")}
                    startIcon={<IconThumbUp size={20} />}
                    sx={{
                      py: 1.5,
                      textTransform: "none",
                      fontWeight: 600,
                      justifyContent: "flex-start",
                      px: 3,
                    }}
                  >
                    Onaylıyorum
                  </Button>

                  <Button
                    fullWidth
                    variant={decision === "undecided" ? "contained" : "outlined"}
                    color="warning"
                    size="large"
                    onClick={() => setDecision("undecided")}
                    startIcon={<IconHelp size={20} />}
                    sx={{
                      py: 1.5,
                      textTransform: "none",
                      fontWeight: 600,
                      justifyContent: "flex-start",
                      px: 3,
                    }}
                  >
                    Kararsızım
                  </Button>

                  <Button
                    fullWidth
                    variant={decision === "reject" ? "contained" : "outlined"}
                    color="error"
                    size="large"
                    onClick={() => setDecision("reject")}
                    startIcon={<IconThumbDown size={20} />}
                    sx={{
                      py: 1.5,
                      textTransform: "none",
                      fontWeight: 600,
                      justifyContent: "flex-start",
                      px: 3,
                    }}
                  >
                    Reddediyorum
                  </Button>
                </Stack>
              </Box>

              {/* Yorum Alanı */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                  Yorumunuz (İsteğe Bağlı)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Değerlendirme yorumunuzu buraya yazabilirsiniz..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  variant="outlined"
                  inputProps={{ maxLength: 1000 }}
                  helperText={`${comment.length}/1000 karakter`}
                />
              </Box>

          

              {/* Butonlar */}
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<IconCheck size={20} />}
                  onClick={handleSubmit}
                  disabled={loading || !decision}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                  }}
                >
                  {loading ? "Kaydediliyor..." : currentEvaluation ? "Güncelle" : "Kaydet"}
                </Button>

                {currentEvaluation && isEditing && (
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<IconX size={20} />}
                    onClick={handleCancel}
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      minWidth: 120,
                    }}
                  >
                    İptal
                  </Button>
                )}
              </Stack>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PreEvaluationForm;



