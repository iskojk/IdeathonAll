"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  Avatar,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Tooltip
} from "@mui/material";
import {
  IconStar,
  IconChevronDown,
  IconChevronUp,
  IconCalendar,
  IconTrophy,
  IconSearch,
  IconEdit,
  IconEye,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import axios from "@/utils/axios";
import moment from "moment";
import "moment/locale/tr";

moment.locale("tr");

const CRITERIA_LABELS = {
  problemDefinition: "Problem Tanımı ve İhtiyaç Analizi",
  emlakKonutAlignment: "Emlak Konut Odak Alanlarıyla Uyum",
  innovation: "Yenilikçilik ve Farklılaşma",
  userExperience: "Kullanıcı Odaklılık ve Deneyim",
  technicalFeasibility: "Teknik Uygulanabilirlik",
  teamPotential: "Ekip Potansiyeli",
  sustainability: "Sürdürülebilirlik",
  presentationQuality: "Sunum Kalitesi ve Takım Dinamiği",
};

const CRITERIA_MAX_SCORES = {
  problemDefinition: 15,
  emlakKonutAlignment: 10,
  innovation: 20,
  userExperience: 10,
  technicalFeasibility: 15,
  teamPotential: 15,
  sustainability: 5,
  presentationQuality: 10,
};

const CRITERIA_DESCRIPTIONS = {
  problemDefinition: [
    "Problemin net tanımlanması",
    "Bağlamın (site yaşamı, yönetim, güvenlik, enerji vb.) doğru kurulması",
    "Problemin gerçekliği ve ihtiyacın varlığı"
  ],
  emlakKonutAlignment: [
    "Site yönetiminin dijitalleşmesi, topluluk yaşamı, güvenlik, enerji verimliliği, veri platformları vb. odaklara uygunluk",
    "Emlak Konut projelerinde pilotlanabilirlik potansiyeli"
  ],
  innovation: [
    "Mevcut çözümlere göre ayırt edici özellikler",
    "Yeni teknoloji, yeni iş modeli, yeni kullanıcı deneyimi getirme derecesi"
  ],
  userExperience: [
    "Hedef kullanıcıya hitap etmesi",
    "Kullanıcı akışının mantıklı ve erişilebilir olması"
  ],
  technicalFeasibility: [
    "Önerilen çözümün teknik olarak gerçekleştirilebilir olması",
    "Entegrasyon ve veri kullanımı açısından uygulanabilirlik"
  ],
  teamPotential: [
    "Takım üyeleri farklı disiplinlerden geliyor mu? (teknik, tasarım, iş geliştirme, operasyon vb.)",
    "Projeyi gerçekleştirmek için gerekli yetkinlik setleri takım içinde mevcut mu?"
  ],
  sustainability: [
    "Sürdürülebilirlik modeli ve iş planı",
    "Kamu / özel sektör, yönetim şirketleri vb. aktörler için değer önerisi"
  ],
  presentationQuality: [
    "Problemi ve çözümü net anlatma becerisi",
    "Zaman yönetimi ve sunum organizasyonu"
  ]
};

const EvaluationCard = ({ evaluation }) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "success.main";
    if (percentage >= 60) return "warning.main";
    return "error.main";
  };

  const getTotalScoreColor = (score) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "error";
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        transition: "all 0.3s ease",
        border: "2px solid",
        borderColor: "divider",
        "&:hover": {
          boxShadow: 4,
          borderColor: "primary.main",
        },
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 56,
                  height: 56,
                  fontSize: "1.2rem",
                  fontWeight: 700,
                }}
              >
                {evaluation.teamName?.substring(0, 2).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {evaluation.teamName}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconCalendar size={14} />
                  <Typography variant="caption" color="text.secondary">
                    {moment(evaluation.evaluatedAt).format("DD MMMM YYYY, HH:mm")}
                  </Typography>
                </Stack>
              </Box>
            </Stack>

            {/* Toplam Puan */}
            <Paper
              sx={{
                p: 2,
                bgcolor: `${getTotalScoreColor(evaluation.totalScore)}.lighter`,
                borderRadius: 2,
                minWidth: 100,
                textAlign: "center",
              }}
            >
              <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" mb={0.5}>
                <IconStar size={18} color="orange" />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Puan
                </Typography>
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 700, color: `${getTotalScoreColor(evaluation.totalScore)}.dark` }}>
                {evaluation.totalScore}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                / 100
              </Typography>
            </Paper>
          </Stack>

          <Divider />

          {/* Kriterler Özeti */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Kriter Puanları
              </Typography>
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                sx={{ 
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s"
                }}
              >
                <IconChevronDown size={20} />
              </IconButton>
            </Stack>

            <Grid container spacing={1}>
              {Object.entries(evaluation.criteria).slice(0, expanded ? undefined : 4).map(([key, value]) => {
                const percentage = CRITERIA_LABELS[key]?.match(/\(%([\d]+)\)/)?.[1];
                return (
                  <Grid item xs={6} sm={3} key={key}>
                    <Tooltip 
                      title={CRITERIA_LABELS[key]} 
                      arrow
                      placement="top"
                    >
                      <Paper
                        sx={{
                          p: 1.5,
                          bgcolor: "grey.50",
                          borderRadius: 1,
                          textAlign: "center",
                          cursor: "help",
                          transition: "all 0.2s",
                          "&:hover": {
                            bgcolor: "grey.100",
                            transform: "translateY(-2px)",
                          }
                        }}
                      >
                        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" mb={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            {CRITERIA_LABELS[key]?.split(" ")[0]}...
                          </Typography>
                          {percentage && (
                            <Chip 
                              label={`%${percentage}`} 
                              size="small" 
                              sx={{ 
                                height: 16, 
                                fontSize: "0.65rem",
                                bgcolor: "primary.main",
                                color: "white",
                                fontWeight: 700
                              }} 
                            />
                          )}
                        </Stack>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: getScoreColor(value.score, CRITERIA_MAX_SCORES[key]),
                          }}
                        >
                          {value.score}/{CRITERIA_MAX_SCORES[key]}
                        </Typography>
                      </Paper>
                    </Tooltip>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          {/* Detaylı Kriterler */}
          <Collapse in={expanded}>
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Kriter</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Puan</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Yorum</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(evaluation.criteria).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {CRITERIA_LABELS[key]}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {CRITERIA_DESCRIPTIONS[key]?.map((desc, idx) => (
                            <Typography key={idx} variant="caption" color="text.secondary" sx={{ display: "block", ml: 1 }}>
                              • {desc}
                            </Typography>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${value.score}/${CRITERIA_MAX_SCORES[key]}`}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor: getScoreColor(value.score, CRITERIA_MAX_SCORES[key]),
                            color: "white",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {value.comment || "-"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Genel Yorum */}
            {evaluation.generalComment && (
              <Paper sx={{ p: 2, bgcolor: "primary.lighter", mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Genel Değerlendirme
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {evaluation.generalComment}
                </Typography>
              </Paper>
            )}
          </Collapse>

          {/* Aksiyon Butonları */}
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<IconEye size={18} />}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Detayları Gizle" : "Detayları Göster"}
            </Button>
            <Button
              variant="contained"
              fullWidth
              startIcon={<IconEdit size={18} />}
              onClick={() => router.push(`/jury/teams/${encodeURIComponent(evaluation.teamName)}/evaluate`)}
            >
              Düzenle
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

const MyEvaluationsList = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/juri/my-evaluations", {
        params: {
          limit: 100,
          sort: "-evaluatedAt",
        },
      });

      if (response.data.success) {
        setEvaluations(response.data.data.evaluations || []);
        setStats(response.data.data.stats || {});
      } else {
        toast.error("Değerlendirmeler yüklenirken hata oluştu");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Değerlendirmeler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const filteredEvaluations = evaluations.filter((evaluation) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return evaluation.teamName?.toLowerCase().includes(search);
  });

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Card */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
          color: "white",
          boxShadow: "0 8px 32px rgba(15, 32, 39, 0.3)"
        }}
      >
        <CardContent sx={{ py: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.2)",
                borderRadius: 2,
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <IconTrophy size={40} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                Değerlendirmelerim
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Yaptığınız tüm değerlendirmeler
              </Typography>
            </Box>
          </Stack>

          {/* İstatistikler */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <Paper 
                sx={{ 
                  p: 2.5, 
                  bgcolor: "rgba(255,255,255,0.95)", 
                  backdropFilter: "blur(10px)",
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.3)"
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      bgcolor: "primary.main",
                      borderRadius: 2,
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <IconTrophy size={28} color="white" />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
                      {stats.totalEvaluations || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Toplam Değerlendirme
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Paper 
                sx={{ 
                  p: 2.5, 
                  bgcolor: "rgba(255,255,255,0.95)", 
                  backdropFilter: "blur(10px)",
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.3)"
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      bgcolor: "warning.main",
                      borderRadius: 2,
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <IconStar size={28} color="white" />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
                      {stats.averageScore || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ortalama Puan
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Arama */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Takım adı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={18} />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Değerlendirmeler Listesi */}
      {filteredEvaluations.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {searchTerm
              ? "Arama kriterlerine uygun değerlendirme bulunamadı."
              : "Henüz değerlendirme yapmadınız."}
          </Typography>
        </Alert>
      )}

      {filteredEvaluations.length > 0 && (
        <Grid container spacing={3}>
          {filteredEvaluations.map((evaluation) => (
            <Grid item xs={12} key={evaluation._id}>
              <EvaluationCard evaluation={evaluation} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default MyEvaluationsList;

