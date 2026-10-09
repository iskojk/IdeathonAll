"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  TextField,
  Slider,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  AvatarGroup,
  Tooltip,
} from "@mui/material";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconChecks,
  IconAlertCircle,
  IconStar,
  IconUsers,
  IconFileText,
  IconDownload,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import axios from "@/utils/axios";

const CRITERIA = [
  {
    key: "problemDefinition",
    label: "Problem Tanımı ve İhtiyaç Analizi",
    maxScore: 15,
    subCriteria: [
      "Problemin net tanımlanması",
      "Bağlamın (site yaşamı, yönetim, güvenlik, enerji vb.) doğru kurulması",
      "Problemin gerçekliği ve ihtiyacın varlığı"
    ]
  },
  {
    key: "emlakKonutAlignment",
    label: "Emlak Konut Odak Alanlarıyla Uyum",
    maxScore: 10,
    subCriteria: [
      "Site yönetiminin dijitalleşmesi, topluluk yaşamı, güvenlik, enerji verimliliği, veri platformları vb. odaklara uygunluk",
      "Emlak Konut projelerinde pilotlanabilirlik potansiyeli"
    ]
  },
  {
    key: "innovation",
    label: "Yenilikçilik ve Farklılaşma",
    maxScore: 20,
    subCriteria: [
      "Mevcut çözümlere göre ayırt edici özellikler",
      "Yeni teknoloji, yeni iş modeli, yeni kullanıcı deneyimi getirme derecesi"
    ]
  },
  {
    key: "userExperience",
    label: "Kullanıcı Odaklılık ve Deneyim",
    maxScore: 10,
    subCriteria: [
      "Hedef kullanıcıya hitap etmesi",
      "Kullanıcı akışının mantıklı ve erişilebilir olması"
    ]
  },
  {
    key: "technicalFeasibility",
    label: "Teknik Uygulanabilirlik",
    maxScore: 15,
    subCriteria: [
      "Önerilen çözümün teknik olarak gerçekleştirilebilir olması",
      "Entegrasyon ve veri kullanımı açısından uygulanabilirlik"
    ]
  },
  {
    key: "teamPotential",
    label: "Ekip Potansiyeli",
    maxScore: 15,
    subCriteria: [
      "Takım üyeleri farklı disiplinlerden geliyor mu? (teknik, tasarım, iş geliştirme, operasyon vb.)",
      "Projeyi gerçekleştirmek için gerekli yetkinlik setleri takım içinde mevcut mu?"
    ]
  },
  {
    key: "sustainability",
    label: "Sürdürülebilirlik",
    maxScore: 5,
    subCriteria: [
      "Sürdürülebilirlik modeli ve iş planı",
      "Kamu / özel sektör, yönetim şirketleri vb. aktörler için değer önerisi"
    ]
  },
  {
    key: "presentationQuality",
    label: "Sunum Kalitesi ve Takım Dinamiği",
    maxScore: 10,
    subCriteria: [
      "Problemi ve çözümü net anlatma becerisi",
      "Zaman yönetimi ve sunum organizasyonu"
    ]
  },
];

const TeamEvaluationForm = ({ teamName }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [teamInfo, setTeamInfo] = useState(null);
  const [existingEvaluation, setExistingEvaluation] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [criteria, setCriteria] = useState(
    CRITERIA.reduce((acc, criterion) => {
      acc[criterion.key] = { score: 0, comment: "" };
      return acc;
    }, {})
  );
  const [generalComment, setGeneralComment] = useState("");
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  
  // Görünüm modu: 'wizard' veya 'full'
  const [viewMode, setViewMode] = useState('wizard');
  const [currentStep, setCurrentStep] = useState(0);
  
  const handleNext = () => {
    if (currentStep < CRITERIA.length) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const goToStep = (index) => {
    setCurrentStep(index);
  };

  useEffect(() => {
    loadTeamAndEvaluation();
  }, [teamName]);

  const loadTeamAndEvaluation = async () => {
    setLoading(true);
    try {
      // Takım bilgilerini ve var olan değerlendirmeyi paralel yükle
      const [teamsResponse, evaluationResponse] = await Promise.all([
        axios.get("/juri/teams"),
        axios.get(`/juri/teams/${encodeURIComponent(teamName)}/my-evaluation`).catch(() => null),
      ]);

      // Takım bilgisi
      if (teamsResponse.data.success) {
        const team = teamsResponse.data.data.teams.find((t) => t.teamName === teamName);
        setTeamInfo(team);
      }

      // Var olan değerlendirme
      if (evaluationResponse?.data?.success) {
        const evaluation = evaluationResponse.data.data.evaluation;
        setExistingEvaluation(evaluation);
        setIsEditMode(true);
        
        // Form'u doldur
        setCriteria(evaluation.criteria);
        setGeneralComment(evaluation.generalComment || "");
      }
    } catch (error) {
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleCriteriaScoreChange = (key, value) => {
    setCriteria((prev) => ({
      ...prev,
      [key]: { ...prev[key], score: parseFloat(value) || 0 },
    }));
  };

  const handleCriteriaCommentChange = (key, value) => {
    setCriteria((prev) => ({
      ...prev,
      [key]: { ...prev[key], comment: value },
    }));
  };

  const calculateTotalScore = () => {
    return Object.values(criteria).reduce((sum, c) => sum + (parseFloat(c.score) || 0), 0);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        criteria,
        generalComment,
        status: "submitted",
      };

      const method = isEditMode ? "put" : "post";
      const response = await axios[method](
        `/juri/teams/${encodeURIComponent(teamName)}/evaluate`,
        payload
      );

      if (response.data.success) {
        toast.success(
          isEditMode
            ? "Değerlendirme başarıyla güncellendi"
            : "Değerlendirme başarıyla kaydedildi"
        );
        router.push("/jury/teams");
      } else {
        toast.error(response.data.message || "Bir hata oluştu");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Değerlendirme kaydedilirken hata oluştu");
    } finally {
      setSubmitting(false);
      setOpenConfirmDialog(false);
    }
  };

  const totalScore = calculateTotalScore();
  const isFormValid = totalScore >= 0 && totalScore <= 100;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!teamInfo) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          Takım bilgileri bulunamadı.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Geri Dön Butonu */}
      <Button
        startIcon={<IconArrowLeft size={18} />}
        onClick={() => router.push("/jury/teams")}
        sx={{ mb: 2 }}
      >
        Takımlara Geri Dön
      </Button>

      {/* Takım Bilgileri Card */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ xs: "flex-start", md: "center" }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: { xs: 64, sm: 80 },
                height: { xs: 64, sm: 80 },
                fontSize: { xs: "1.5rem", sm: "2rem" },
                fontWeight: 700,
              }}
            >
              {teamInfo.teamName?.substring(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, width: "100%" }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                {teamInfo.teamName}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                <Chip
                  icon={<IconUsers size={16} />}
                  label={`${teamInfo.members?.length || 0} Üye`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
            
                {isEditMode && (
                  <Chip
                    icon={<IconChecks size={16} />}
                    label="Değerlendirme Mevcut"
                    size="small"
                    color="warning"
                    variant="filled"
                  />
                )}
              </Stack>

              {/* Takım Üyeleri */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Takım Üyeleri:
                </Typography>
                <AvatarGroup max={5}>
                  {teamInfo.members?.map((member, idx) => (
                    <Tooltip key={idx} title={`${member.fullName}${member.isProjectOwner ? " (Proje Sahibi)" : ""}`} arrow>
                      <Avatar
                        sx={{
                          bgcolor: member.isProjectOwner ? "primary.main" : "secondary.main",
                          width: 36,
                          height: 36,
                        }}
                      >
                        {member.fullName?.charAt(0) || "?"}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Puan Göstergesi */}
      <Card sx={{ mb: 3, borderRadius: 3, bgcolor: "primary.lighter" }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconStar size={24} color="orange" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Toplam Puan
              </Typography>
            </Stack>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: totalScore > 100 ? "error.main" : "primary.main",
              }}
            >
              {totalScore.toFixed(1)} / 100
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min((totalScore / 100) * 100, 100)}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: "grey.300",
              "& .MuiLinearProgress-bar": {
                bgcolor: totalScore > 100 ? "error.main" : "success.main",
              },
            }}
          />
          {totalScore > 100 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Toplam puan 100&#39;ü aşamaz!
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Görünüm Modu Seçici */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack 
            direction={{ xs: "column", sm: "row" }} 
            spacing={2} 
            alignItems={{ xs: "stretch", sm: "center" }} 
            justifyContent="space-between"
          >
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
              Değerlendirme Modunu Seçin
            </Typography>
            <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
              <Button
                variant={viewMode === 'wizard' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('wizard')}
                size="small"
                fullWidth
                sx={{ minWidth: { xs: "auto", sm: 120 } }}
              >
                Adım Adım
              </Button>
              <Button
                variant={viewMode === 'full' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('full')}
                size="small"
                fullWidth
                sx={{ minWidth: { xs: "auto", sm: 120 } }}
              >
                Tümünü Göster
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Wizard Mode - Step by Step */}
      {viewMode === 'wizard' && (
        <Box sx={{ mb: 3 }}>
          {/* Progress Indicator */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {currentStep === CRITERIA.length 
                      ? 'Genel Değerlendirme' 
                      : `Kriter ${currentStep + 1} / ${CRITERIA.length}`}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {Math.round(((currentStep + 1) / (CRITERIA.length + 1)) * 100)}% Tamamlandı
                  </Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={((currentStep + 1) / (CRITERIA.length + 1)) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                
                {/* Step Dots */}
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                  {CRITERIA.map((_, index) => (
                    <Box
                      key={index}
                      onClick={() => goToStep(index)}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: currentStep === index ? 'primary.main' : criteria[CRITERIA[index].key]?.score > 0 ? 'success.main' : 'grey.300',
                        color: currentStep === index || criteria[CRITERIA[index].key]?.score > 0 ? 'white' : 'text.secondary',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      {index + 1}
                    </Box>
                  ))}
                  <Box
                    onClick={() => goToStep(CRITERIA.length)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: currentStep === CRITERIA.length ? 'primary.main' : generalComment ? 'success.main' : 'grey.300',
                      color: currentStep === CRITERIA.length || generalComment ? 'white' : 'text.secondary',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    G
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Current Step Content */}
          {currentStep < CRITERIA.length ? (
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ bgcolor: 'primary.main', p: 3, color: 'white' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1 }}>
                      Kriter {currentStep + 1} / {CRITERIA.length}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {CRITERIA[currentStep].label}
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {criteria[CRITERIA[currentStep].key]?.score || 0}/{CRITERIA[currentStep].maxScore}
                  </Typography>
                </Stack>
              </Box>
              
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={4}>
                  {/* Alt Kriterler */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, fontSize: '1.1rem' }}>
                      Değerlendirme Kriterleri
                    </Typography>
                    <Stack spacing={2}>
                      {CRITERIA[currentStep].subCriteria.map((subCriterion, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            p: 2,
                            bgcolor: 'grey.50',
                            borderRadius: 1,
                            borderLeft: '4px solid',
                            borderColor: 'primary.main'
                          }}
                        >
                          <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                            {subCriterion}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  <Divider />

                  {/* Puanlama */}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, fontSize: '1.1rem' }}>
                      Puan Verin (0 - {CRITERIA[currentStep].maxScore})
                    </Typography>
                    
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={12} sm={9}>
                        <Slider
                          value={criteria[CRITERIA[currentStep].key]?.score || 0}
                          onChange={(e, value) => handleCriteriaScoreChange(CRITERIA[currentStep].key, value)}
                          min={0}
                          max={CRITERIA[currentStep].maxScore}
                          step={0.5}
                          marks={[
                            { value: 0, label: '0' },
                            { value: CRITERIA[currentStep].maxScore / 2, label: `${CRITERIA[currentStep].maxScore / 2}` },
                            { value: CRITERIA[currentStep].maxScore, label: `${CRITERIA[currentStep].maxScore}` },
                          ]}
                          valueLabelDisplay="auto"
                          sx={{
                            height: 10,
                            '& .MuiSlider-thumb': {
                              width: 28,
                              height: 28,
                            },
                            '& .MuiSlider-track': {
                              height: 10,
                            },
                            '& .MuiSlider-rail': {
                              height: 10,
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          type="number"
                          fullWidth
                          value={criteria[CRITERIA[currentStep].key]?.score || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (value >= 0 && value <= CRITERIA[currentStep].maxScore) {
                              handleCriteriaScoreChange(CRITERIA[currentStep].key, value);
                            }
                          }}
                          inputProps={{
                            min: 0,
                            max: CRITERIA[currentStep].maxScore,
                            step: 0.5,
                          }}
                          sx={{
                            '& input': {
                              fontSize: '1.25rem',
                              fontWeight: 600,
                              textAlign: 'center',
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>



                  {/* Navigation Buttons */}
                  <Stack direction="row" spacing={2} justifyContent="space-between" pt={2}>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={handlePrevious}
                      disabled={currentStep === 0}
                      sx={{ minWidth: 120 }}
                    >
                      Önceki
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleNext}
                      sx={{ minWidth: 120 }}
                    >
                      {currentStep === CRITERIA.length - 1 ? 'Genel Değerlendirme' : 'Sonraki'}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ) : (
            // Genel Değerlendirme Step
            <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ bgcolor: 'primary.main', p: 3, color: 'white' }}>
                <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1 }}>
                  Son Adım
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                  Genel Değerlendirme
                </Typography>
              </Box>
              
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={3}>
                  <Typography variant="body1" sx={{ lineHeight: 1.7, color: 'text.secondary' }}>
                    Takımın genel performansı, güçlü yönleri ve geliştirilmesi gereken alanlar hakkında 
                    detaylı yorumunuzu yazabilirsiniz.
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    placeholder="Genel değerlendirmenizi buraya yazın..."
                    value={generalComment}
                    onChange={(e) => setGeneralComment(e.target.value)}
                    inputProps={{ maxLength: 2000 }}
                    helperText={`${generalComment.length}/2000 karakter`}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '1rem',
                        lineHeight: 1.8,
                      }
                    }}
                  />

                  {/* Navigation Buttons */}
                  <Stack direction="row" spacing={2} justifyContent="space-between" pt={2}>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={handlePrevious}
                      sx={{ minWidth: 120 }}
                    >
                      Önceki
                    </Button>
                    <Box />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Full Mode - All Questions */}
      {viewMode === 'full' && (
        <Box sx={{ mb: 3 }}>
          <Stack spacing={3}>
            {CRITERIA.map((criterion, index) => (
              <Card key={criterion.key} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ bgcolor: 'primary.main', p: 2.5, color: 'white' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="overline" sx={{ opacity: 0.9 }}>
                        Kriter {index + 1} / {CRITERIA.length}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {criterion.label}
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {criteria[criterion.key]?.score || 0}/{criterion.maxScore}
                    </Typography>
                  </Stack>
                </Box>
                
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={3}>
                    {/* Alt Kriterler */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                        Değerlendirme Kriterleri
                      </Typography>
                      <Stack spacing={1.5}>
                        {criterion.subCriteria.map((subCriterion, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              p: 1.5,
                              bgcolor: 'grey.50',
                              borderRadius: 1,
                              borderLeft: '3px solid',
                              borderColor: 'primary.main'
                            }}
                          >
                            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                              {subCriterion}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>

                    <Divider />

                    {/* Puanlama */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                        Puan (0 - {criterion.maxScore})
                      </Typography>
                      
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={9}>
                          <Slider
                            value={criteria[criterion.key]?.score || 0}
                            onChange={(e, value) => handleCriteriaScoreChange(criterion.key, value)}
                            min={0}
                            max={criterion.maxScore}
                            step={0.5}
                            marks={[
                              { value: 0, label: '0' },
                              { value: criterion.maxScore / 2, label: `${criterion.maxScore / 2}` },
                              { value: criterion.maxScore, label: `${criterion.maxScore}` },
                            ]}
                            valueLabelDisplay="auto"
                            sx={{
                              height: 8,
                              '& .MuiSlider-thumb': {
                                width: 24,
                                height: 24,
                              },
                              '& .MuiSlider-track': {
                                height: 8,
                              },
                              '& .MuiSlider-rail': {
                                height: 8,
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            type="number"
                            fullWidth
                            size="small"
                            value={criteria[criterion.key]?.score || 0}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (value >= 0 && value <= criterion.maxScore) {
                                handleCriteriaScoreChange(criterion.key, value);
                              }
                            }}
                            inputProps={{
                              min: 0,
                              max: criterion.maxScore,
                              step: 0.5,
                            }}
                            sx={{
                              '& input': {
                                textAlign: 'center',
                                fontWeight: 600,
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Yorum */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                        Yorum (İsteğe Bağlı)
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder={`${criterion.label} hakkında yorumunuz...`}
                        value={criteria[criterion.key]?.comment || ''}
                        onChange={(e) => handleCriteriaCommentChange(criterion.key, e.target.value)}
                        inputProps={{ maxLength: 1000 }}
                        helperText={`${criteria[criterion.key]?.comment?.length || 0}/1000 karakter`}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            lineHeight: 1.6,
                          }
                        }}
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {/* Genel Yorum - Full Mode için */}
      {viewMode === 'full' && (
        <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ bgcolor: 'primary.main', p: 2.5, color: 'white' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Genel Değerlendirme
            </Typography>
          </Box>
          
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', lineHeight: 1.6 }}>
              Takımın genel performansı, güçlü yönleri ve geliştirilmesi gereken alanlar hakkında 
              detaylı yorumunuzu yazabilirsiniz.
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={6}
              placeholder="Genel değerlendirmenizi buraya yazın..."
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
              inputProps={{ maxLength: 2000 }}
              helperText={`${generalComment.length}/2000 karakter`}
              sx={{
                '& .MuiOutlinedInput-root': {
                  lineHeight: 1.7,
                }
              }}
            />
          </CardContent>
        </Card>
      )}


      {/* Aksiyon Butonları */}
      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            {/* Uyarı Mesajları */}
            {!isFormValid && (
              <Alert severity="error" sx={{ borderRadius: 1 }}>
                Toplam puan 100&#39;ü aşamaz. Lütfen puanları kontrol edin.
              </Alert>
            )}
            
            {totalScore === 0 && (
              <Alert severity="warning" sx={{ borderRadius: 1 }}>
                Henüz hiç puan vermediniz. Lütfen tüm kriterleri değerlendirin.
              </Alert>
            )}

            {/* Butonlar */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={() => router.push("/jury/teams")}
                disabled={submitting}
                sx={{
                  height: 50,
                  fontWeight: 600,
                }}
              >
                İptal
              </Button>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <IconDeviceFloppy size={20} />}
                onClick={() => setOpenConfirmDialog(true)}
                disabled={!isFormValid || submitting}
                color={isEditMode ? "warning" : "primary"}
                sx={{
                  height: 50,
                  fontWeight: 700,
                }}
              >
                {submitting
                  ? "Kaydediliyor..."
                  : isEditMode
                  ? "Değerlendirmeyi Güncelle"
                  : "Değerlendirmeyi Kaydet"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Onay Dialogu */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconAlertCircle size={24} color="orange" />
            <Typography variant="h6">Değerlendirmeyi Onayla</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography>
              {isEditMode
                ? "Değerlendirmeyi güncellemek istediğinizden emin misiniz?"
                : "Değerlendirmeyi kaydetmek istediğinizden emin misiniz?"}
            </Typography>
            <Paper sx={{ p: 2, bgcolor: "primary.lighter" }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Takım:
                  </Typography>
                  <Typography variant="body2">{teamName}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Toplam Puan:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                    {totalScore.toFixed(1)} / 100
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
            <Alert severity="info">
              {isEditMode
                ? "Güncelleme sonrası değerlendirmeniz yenilenecektir."
                : "Kaydettikten sonra değerlendirmeyi güncelleyebilirsiniz."}
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenConfirmDialog(false)} disabled={submitting}>
            İptal
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <IconChecks size={18} />}
            color={isEditMode ? "warning" : "primary"}
          >
            {submitting ? "Kaydediliyor..." : "Onayla ve Kaydet"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamEvaluationForm;

