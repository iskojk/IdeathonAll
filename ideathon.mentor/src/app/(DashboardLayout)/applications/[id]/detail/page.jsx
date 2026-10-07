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
  Divider,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  IconArrowLeft,
  IconDownload,
  IconThumbUp,
  IconThumbDown,
  IconHelp,
  IconFileText,
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconCalendar,
  IconBriefcase,
  IconSchool,
  IconStar,
  IconHeart,
  IconLink,
  IconVideo,
  IconChevronDown,
  IconUsers,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { useRouter, useParams } from "next/navigation";
import moment from "moment";
import "moment/locale/tr";
import axios from "@/utils/axios";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import PageContainer from "@/app/components/container/PageContainer";
import PreEvaluationForm from "@/app/components/applications/PreEvaluationForm";

moment.locale("tr");

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002/api";

const ApplicationDetail = () => {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id;

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    personal: false,
    interests: false,
    competencies: false,
    team: false,
    links: false,
  });

  useEffect(() => {
    if (applicationId) {
      loadApplicationDetail();
    }
  }, [applicationId]);

  const loadApplicationDetail = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/applications/juri/${applicationId}/detail`);

      if (response.data.success) {
        setApplication(response.data.data);
      } else {
        toast.error("Başvuru detayı yüklenirken hata oluştu");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Başvuru bulunamadı");
      router.push("/applications/list");
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluationSuccess = () => {
    // Değerlendirme başarılı olduğunda sayfayı yenile
    loadApplicationDetail();
  };

  const handleDownloadPresentation = () => {
    if (application?.presentationInfo?.presentationFile) {
      const fileUrl = `${API_BASE_URL}/uploads/presentations/${application.presentationInfo.presentationFile.filename}`;
      window.open(fileUrl, "_blank");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "warning";
      case "under_review": return "info";
      case "approved": return "success";
      case "rejected": return "error";
      case "withdrawn": return "default";
      default: return "default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending": return "Bekliyor";
      case "under_review": return "İncelemede";
      case "approved": return "Onaylandı";
      case "rejected": return "Reddedildi";
      case "withdrawn": return "İptal Edildi";
      default: return status;
    }
  };

  const BCrumb = [
    { to: "/", title: "Anasayfa" },
    { to: "/applications/list", title: "Ön Değerlendirme" },
    { title: "Başvuru Detayı" },
  ];

  if (loading) {
    return (
      <PageContainer title="Yükleniyor..." description="Başvuru detayı yükleniyor">
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress size={60} />
        </Box>
      </PageContainer>
    );
  }

  if (!application) {
    return (
      <PageContainer title="Bulunamadı" description="Başvuru bulunamadı">
        <Alert severity="error">Başvuru bulunamadı.</Alert>
      </PageContainer>
    );
  }

  const personalInfo = application.personalInfo || {};
  const profileInfo = application.profileInfo || {};
  const interestsInfo = application.interestsInfo || {};
  const competenciesInfo = application.competenciesInfo || {};
  const presentationInfo = application.presentationInfo || {};
  const additionalInfo = application.additionalInfo || {};
  const socialInfo = application.socialInfo || {};
  const teamInfo = application.teamInfo || {};

  const fullName = `${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim();
  const initial = String(personalInfo.firstName || "?").charAt(0).toUpperCase();

  const handleAccordionChange = (section) => (event, isExpanded) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: isExpanded,
    }));
  };

  return (
    <PageContainer title={`Başvuru - ${fullName}`} description="Başvuru Detayı ve Ön Değerlendirme">
      <Breadcrumb title="Başvuru Detayı" items={BCrumb} />

      {/* Geri Dön Butonu */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<IconArrowLeft size={18} />}
          onClick={() => router.push("/applications/list")}
        >
          Listeye Dön
        </Button>
      </Box>

      {/* Üst Header - Aday Bilgileri */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "center" }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 80,
                height: 80,
                fontSize: "2rem",
                fontWeight: 700,
              }}
            >
              {initial}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1, flexWrap: "wrap" }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {fullName}
                </Typography>
                <Chip
                  label={application.displayParticipantType || "-"}
                  color="secondary"
                  variant="outlined"
                  size="medium"
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} divider={<Divider orientation="vertical" flexItem />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconMail size={18} />
                  <Typography variant="body2">{personalInfo.email}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconPhone size={18} />
                  <Typography variant="body2">{personalInfo.phone}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconMapPin size={18} />
                  <Typography variant="body2">{personalInfo.city}</Typography>
                </Stack>
              </Stack>
            </Box>
            <Stack spacing={1} alignItems={{ xs: "flex-start", sm: "flex-end" }}>
              <Chip
                label={getStatusLabel(application.status)}
                color={getStatusColor(application.status)}
                sx={{ fontWeight: 600, fontSize: "0.875rem" }}
              />
              <Typography variant="caption" color="text.secondary">
                Başvuru No: <strong>{application.applicationNumber}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {moment(application.createdAt).format("DD MMMM YYYY, HH:mm")}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Sunum ve Değerlendirme - Yan Yana */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Sunum Dosyası ve Proje */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Box sx={{ bgcolor: "primary.main", borderRadius: 2, p: 1, color: "white" }}>
                  <IconFileText size={24} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Sunum ve Proje
                </Typography>
              </Stack>

              {/* Sunum Dosyası */}
              {presentationInfo.presentationFile ? (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Sunum Dosyası
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: "primary.light",
                      borderRadius: 2,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "primary.main", color: "white" },
                      transition: "all 0.3s",
                    }}
                    onClick={handleDownloadPresentation}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <IconFileText size={32} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {presentationInfo.presentationFile.originalName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(presentationInfo.presentationFile.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                      <IconButton size="small">
                        <IconDownload size={20} />
                      </IconButton>
                    </Stack>
                  </Paper>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    Son güncelleme: {moment(presentationInfo.lastUpdatedAt).format("DD MMM YYYY, HH:mm")}
                  </Typography>
                </Box>
              ) : (
                <Alert severity="info" sx={{ mb: 3 }}>
                  Sunum dosyası yüklenmemiş
                </Alert>
              )}

              {/* Proje Açıklaması */}
              {presentationInfo.projectDescription && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Proje Açıklaması
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: "grey.50",
                      borderRadius: 2,
                      maxHeight: 300,
                      overflowY: "auto",
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {presentationInfo.projectDescription}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Ön Değerlendirme Formu */}
        <Grid item xs={12} lg={6}>
          <PreEvaluationForm
            applicationId={applicationId}
            currentEvaluation={application.myPreEvaluation}
            onSuccess={handleEvaluationSuccess}
          />
        </Grid>
      </Grid>

      {/* Detaylı Bilgiler - Full Genişlik */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Stack spacing={2}>
            {/* Kişisel Bilgiler */}
            <Accordion 
              expanded={expandedSections.personal} 
              onChange={handleAccordionChange('personal')}
              sx={{ borderRadius: 2, '&:before': { display: 'none' } }}
            >
              <AccordionSummary 
                expandIcon={<IconChevronDown />}
                sx={{ 
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ bgcolor: "primary.main", borderRadius: 2, p: 1, color: "white" }}>
                    <IconUser size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Kişisel Bilgiler
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoItem label="TC Kimlik No" value={personalInfo.tcIdentity} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem
                      label="Doğum Tarihi"
                      value={personalInfo.birthDate ? moment(personalInfo.birthDate).format("DD MMMM YYYY") : "-"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem label="Şehir" value={personalInfo.city} icon={<IconMapPin size={16} />} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoItem label="Email" value={personalInfo.email} icon={<IconMail size={16} />} />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* İlgi Alanları */}
            <Accordion 
              expanded={expandedSections.interests} 
              onChange={handleAccordionChange('interests')}
              sx={{ borderRadius: 2, '&:before': { display: 'none' } }}
            >
              <AccordionSummary 
                expandIcon={<IconChevronDown />}
                sx={{ 
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ bgcolor: "info.main", borderRadius: 2, p: 1, color: "white" }}>
                    <IconStar size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    İlgi Alanları ve Deneyim
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3 }}>
                <Stack spacing={2}>
                  {interestsInfo.observationField && interestsInfo.observationField.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Gözlem Alanları
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {interestsInfo.observationField.map((field, index) => (
                          <Chip key={index} label={field} size="small" color="info" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  <InfoItem
                    label="Önceki Deneyim"
                    value={interestsInfo.hasPreviousExperience ? "Var" : "Yok"}
                    chip
                    chipColor={interestsInfo.hasPreviousExperience ? "success" : "default"}
                  />
                  {interestsInfo.previousExperienceDescription && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Deneyim Açıklaması
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: "italic", p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                        "{interestsInfo.previousExperienceDescription}"
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Yetkinlikler */}
            <Accordion 
              expanded={expandedSections.competencies} 
              onChange={handleAccordionChange('competencies')}
              sx={{ borderRadius: 2, '&:before': { display: 'none' } }}
            >
              <AccordionSummary 
                expandIcon={<IconChevronDown />}
                sx={{ 
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'grey.100' }
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ bgcolor: "warning.main", borderRadius: 2, p: 1, color: "white" }}>
                    <IconHeart size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Yetkinlikler ve Motivasyon
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3 }}>
                <Stack spacing={2}>
                  {competenciesInfo.competencies && competenciesInfo.competencies.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Yetkinlik Alanları
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {competenciesInfo.competencies.map((comp, index) => (
                          <Chip key={index} label={comp} size="small" color="warning" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  {competenciesInfo.selfDescription && (
                    <InfoItem label="Kendini Tanımlama" value={competenciesInfo.selfDescription} />
                  )}
                  {competenciesInfo.motivation && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Motivasyon
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: "italic", p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                        "{competenciesInfo.motivation}"
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Takım Bilgileri */}
            {teamInfo.isInTeam && (
              <Accordion 
                expanded={expandedSections.team} 
                onChange={handleAccordionChange('team')}
                sx={{ borderRadius: 2, '&:before': { display: 'none' } }}
              >
                <AccordionSummary 
                  expandIcon={<IconChevronDown />}
                  sx={{ 
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ bgcolor: "primary.main", borderRadius: 2, p: 1, color: "white" }}>
                      <IconUsers size={20} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Takım Bilgileri
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <InfoItem label="Takım Adı" value={teamInfo.teamName} />
                    <InfoItem label="Takım Üye Sayısı" value={teamInfo.teamSize} />
                    {teamInfo.teamMembers && teamInfo.teamMembers.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                          Takım Üyeleri
                        </Typography>
                        <Stack spacing={1.5}>
                          {teamInfo.teamMembers.map((member, index) => (
                            <Paper key={index} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Grid container spacing={1}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" color="text.secondary">Ad Soyad</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{member.name}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" color="text.secondary">Rol</Typography>
                                  <Typography variant="body2">{member.role}</Typography>
                                </Grid>
                              </Grid>
                            </Paper>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Ek Bilgiler ve Linkler */}
            {(socialInfo.linkedinProfile || socialInfo.personalWebsite || additionalInfo.projectLink || additionalInfo.videoLink) && (
              <Accordion 
                expanded={expandedSections.links} 
                onChange={handleAccordionChange('links')}
                sx={{ borderRadius: 2, '&:before': { display: 'none' } }}
              >
                <AccordionSummary 
                  expandIcon={<IconChevronDown />}
                  sx={{ 
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ bgcolor: "success.main", borderRadius: 2, p: 1, color: "white" }}>
                      <IconLink size={20} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Ek Bilgiler ve Linkler
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    {socialInfo.linkedinProfile && (
                      <LinkItem label="LinkedIn Profili" url={socialInfo.linkedinProfile} />
                    )}
                    {socialInfo.personalWebsite && (
                      <LinkItem label="Kişisel Web Sitesi" url={socialInfo.personalWebsite} />
                    )}
                    {additionalInfo.projectLink && (
                      <LinkItem label="Proje Linki" url={additionalInfo.projectLink} icon={<IconLink size={16} />} />
                    )}
                    {additionalInfo.videoLink && (
                      <LinkItem label="Video Linki" url={additionalInfo.videoLink} icon={<IconVideo size={16} />} />
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}
          </Stack>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

// Yardımcı Bileşenler
const InfoItem = ({ label, value, icon, chip, chipColor = "default" }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", mb: 0.5, display: "block" }}>
      {label}
    </Typography>
    {chip ? (
      <Chip label={value || "-"} size="small" color={chipColor} variant="outlined" sx={{ fontWeight: 500 }} />
    ) : (
      <Stack direction="row" spacing={1} alignItems="center">
        {icon && <Box sx={{ color: "text.secondary" }}>{icon}</Box>}
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {value || "-"}
        </Typography>
      </Stack>
    )}
  </Box>
);

const LinkItem = ({ label, url, icon }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", mb: 0.5, display: "block" }}>
      {label}
    </Typography>
    <Paper
      sx={{
        p: 1.5,
        bgcolor: "grey.50",
        borderRadius: 2,
        cursor: "pointer",
        "&:hover": { bgcolor: "primary.light" },
        transition: "all 0.3s",
      }}
      onClick={() => window.open(url, "_blank")}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {icon || <IconLink size={16} />}
        <Typography
          variant="body2"
          sx={{
            color: "primary.main",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {url}
        </Typography>
      </Stack>
    </Paper>
  </Box>
);

export default ApplicationDetail;



