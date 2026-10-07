"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Skeleton,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  LinearProgress,
  Divider,
  Alert,
  Collapse,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  IconTrophy,
  IconMedal,
  IconUsers,
  IconChartBar,
  IconStar,
  IconRefresh,
  IconCrown,
  IconAward,
  IconTrendingUp,
  IconTrendingDown,
  IconCircleCheck,
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
  IconPercentage,
  IconClipboardCheck,
  IconClock,
  IconMessage,
  IconTrash,
} from "@tabler/icons-react";
import { JuriProvider, useJuri } from "@/app/context/JuriContext";
import { toast } from "react-toastify";
import PageContainer from "@/app/components/container/PageContainer";
import moment from "moment";
import "moment/locale/tr";
moment.locale("tr");

/* ─── Kriter label'lari ─── */

// Fallback kriter label'lari (evaluationCriteria tanimlanmamis ideathonlar icin)
const criteriaLabelsFallback = {
  problemDefinition: { label: "Problem Tanimi ve Ihtiyac Analizi", max: 15 },
  emlakKonutAlignment: { label: "Emlak Konut Odak Alanlariyla Uyum", max: 10 },
  innovation: { label: "Yenilikcilik ve Farklilasma", max: 20 },
  userExperience: { label: "Kullanici Odaklilik ve Deneyim", max: 10 },
  technicalFeasibility: { label: "Teknik Uygulanabilirlik", max: 15 },
  teamPotential: { label: "Ekip Potansiyeli", max: 15 },
  sustainability: { label: "Surdurulebilirlik", max: 5 },
  presentationQuality: { label: "Sunum Kalitesi ve Takim Dinamigi", max: 10 },
};

/* ─── Stats Karti (minimal Box) ─── */

const StatsCard = ({ title, value, subtitle, icon, color = "primary", theme }) => {
  const themeColor = theme.palette[color]?.main || theme.palette.primary.main;
  return (
    <Box
      sx={{
        flex: "1 1 140px",
        minWidth: 120,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderRadius: 2.5,
        bgcolor: `${themeColor}0F`,
        border: `1px solid ${themeColor}1F`,
        transition: "all 0.2s",
        "&:hover": {
          bgcolor: `${themeColor}1A`,
          borderColor: `${themeColor}40`,
        },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: `${themeColor}1F`,
          color: themeColor,
        }}
      >
        {React.cloneElement(icon, { size: 18 })}
      </Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: themeColor, lineHeight: 1.2 }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.7rem" }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ display: "block", color: "text.disabled", fontSize: "0.65rem" }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

/* ─── Kriter Ortalamalar Bolumu ─── */

const CriteriaAverages = ({ criteriaAverages }) => {
  const theme = useTheme();

  if (!criteriaAverages || Object.keys(criteriaAverages).length === 0) return null;

  return (
    <Card sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: "none", borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Avatar sx={{ bgcolor: "info.light", color: "info.main", width: 36, height: 36 }}>
            <IconChartBar size={20} />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="600">Kriter Bazli Ortalamalar</Typography>
            <Typography variant="caption" color="text.secondary">Her kriter icin ortalama puan</Typography>
          </Box>
        </Stack>

        <Stack spacing={2}>
          {Object.entries(criteriaAverages).map(([key, data]) => {
            const fallback = criteriaLabelsFallback[key] || { label: key, max: 10 };
            const meta = { label: data.name || fallback.label, max: data.maxPossible || fallback.max };
            const maxPossible = data.maxPossible || meta.max;
            const percentage = maxPossible > 0 ? (data.average / maxPossible) * 100 : 0;

            return (
              <Box key={key}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.82rem" }}>
                    {meta.label}
                  </Typography>
                  <Typography variant="body2" fontWeight="600" color="text.secondary">
                    {parseFloat(data.average || 0).toFixed(1)} / {maxPossible}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(percentage, 100)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: theme.palette.grey[100],
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 3,
                      bgcolor: percentage >= 75 ? "success.main" : percentage >= 50 ? "info.main" : percentage >= 25 ? "warning.main" : "error.main",
                    },
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
};

/* ─── Juri Istatistikleri Tablosu ─── */

const JuriStatsTable = ({ juriStats, onDeleteJuryEvaluations }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!juriStats || juriStats.length === 0) return null;

  return (
    <Card sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: "none", borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Avatar sx={{ bgcolor: "primary.light", color: "primary.main", width: 36, height: 36 }}>
            <IconUsers size={20} />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="600">Juri Bazli Istatistikler</Typography>
            <Typography variant="caption" color="text.secondary">{juriStats.length} juri uyesinin degerlendirme detaylari</Typography>
          </Box>
        </Stack>

        <TableContainer>
          <Table size={isMobile ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.78rem" }}>Juri</TableCell>
                {!isMobile && <TableCell sx={{ fontWeight: 600, fontSize: "0.78rem" }}>E-posta</TableCell>}
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.78rem" }}>Degerlendirme</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.78rem" }}>Ort.</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.78rem" }}>Max</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.78rem" }}>Min</TableCell>
                {!isMobile && <TableCell sx={{ fontWeight: 600, fontSize: "0.78rem" }}>Son Degerlendirme</TableCell>}
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.78rem" }}>Islem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {juriStats.map((juri, idx) => (
                <TableRow key={juri.juriId || idx} sx={{ "&:hover": { bgcolor: "action.hover" } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">{juri.juriName}</Typography>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{juri.juriEmail}</Typography>
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <Chip label={juri.evaluationCount} size="small" sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }} />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="600" color="primary.main">
                      {parseFloat(juri.averageScore || 0).toFixed(1)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="success.main" fontWeight="500">{juri.maxScore}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="error.main" fontWeight="500">{juri.minScore}</Typography>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {juri.lastEvaluatedAt ? moment(juri.lastEvaluatedAt).format("DD MMM YYYY, HH:mm") : "\u2014"}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <Tooltip title={`${juri.juriName} - Tum degerlendirmeleri sil`}>
                      <IconButton size="small" color="error" onClick={() => onDeleteJuryEvaluations(juri)}>
                        <IconTrash size={16} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

/* ─── Ranking Karti ─── */

const RankingCard = ({ team, onDeleteEvaluation }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [expanded, setExpanded] = useState(false);

  const getMedalColor = (rank) => {
    if (rank === 1) return theme.palette.warning.main;
    if (rank === 2) return theme.palette.grey[400];
    if (rank === 3) return "#CD7F32";
    return theme.palette.grey[500];
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) return parts[0][0] + parts[parts.length - 1][0];
    return name[0];
  };

  const evaluations = team.evaluations || [];
  const hasEvaluations = evaluations.length > 0;

  return (
    <Card
      sx={{
        mb: 2,
        border: team.rank <= 3 ? `2px solid ${getMedalColor(team.rank)}20` : `1px solid ${theme.palette.divider}`,
        boxShadow: "none",
        borderRadius: 3,
        transition: "all 0.2s ease",
        bgcolor: team.rank === 1 ? "rgba(255, 193, 7, 0.03)" : "background.paper",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Sira Numarasi */}
          <Box
            sx={{
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
              bgcolor: team.rank <= 3 ? `${getMedalColor(team.rank)}15` : "grey.50",
              flexShrink: 0,
            }}
          >
            {team.rank <= 3 ? (
              <IconMedal size={24} color={getMedalColor(team.rank)} />
            ) : (
              <Typography variant="subtitle1" fontWeight="700" color="text.secondary">
                {team.rank}
              </Typography>
            )}
          </Box>

          {/* Takim Bilgileri */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.25 }}>
              <Typography variant={isMobile ? "body1" : "subtitle1"} fontWeight="700" noWrap>
                {team.teamName}
              </Typography>
              {team.rank === 1 && <IconCrown size={18} color={theme.palette.warning.main} />}
            </Stack>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Typography variant="caption" color="text.secondary">
                {team.evaluationCount} degerlendirme
              </Typography>
              <Typography variant="caption" color="success.main">
                Max: {team.maxScore}
              </Typography>
              <Typography variant="caption" color="error.main">
                Min: {team.minScore}
              </Typography>
              {team.scoreRange !== undefined && (
                <Typography variant="caption" color="info.main">
                  Fark: {team.scoreRange}
                </Typography>
              )}
            </Stack>
          </Box>

          {/* Ortalama Puan */}
          <Box sx={{ textAlign: "center", minWidth: 70 }}>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              fontWeight="700"
              color={team.rank <= 3 ? getMedalColor(team.rank) : "primary.main"}
            >
              {parseFloat(team.averageScore || 0).toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.disabled">/ {team.maxTotalScore || 100}</Typography>
          </Box>

          {/* Expand */}
          {hasEvaluations && (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ color: "text.secondary" }}
            >
              {expanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
            </IconButton>
          )}
        </Stack>

        {/* Ilerleme Cubugu */}
        <Box sx={{ mt: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(parseFloat(team.scorePercentage || team.averageScore || 0), 100)}
            sx={{
              height: 5,
              borderRadius: 3,
              bgcolor: "grey.100",
              "& .MuiLinearProgress-bar": {
                bgcolor: team.rank <= 3 ? getMedalColor(team.rank) : "primary.main",
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Detayli Degerlendirmeler (Expandable) */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
            Juri Degerlendirmeleri ({evaluations.length})
          </Typography>

          <Stack spacing={1.5}>
            {evaluations.map((ev, idx) => (
              <EvaluationDetail key={ev.evaluationId || ev.juriId || idx} evaluation={ev} getInitials={getInitials} onDeleteEvaluation={onDeleteEvaluation} />
            ))}
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
};

/* ─── Degerlendirme Sil Onay Dialog ─── */

const DeleteEvaluationDialog = ({ open, onClose, evaluation, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm(evaluation);
    setDeleting(false);
    onClose();
  };

  if (!evaluation) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconTrash size={24} color="red" />
          <Typography variant="h6">Degerlendirmeyi Sil</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mt: 1 }}>
          <Typography variant="body2" component="div">
            <strong>{evaluation.juriName}</strong> jurisi tarafindan verilen{" "}
            <strong>{evaluation.totalScore}</strong> puanlik degerlendirmeyi silmek istediginize emin misiniz?
            <br /><br />
            Bu islem geri alinamaz. Siralama otomatik olarak yeniden hesaplanacaktir.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} color="inherit">Iptal</Button>
        <Button onClick={handleConfirm} variant="contained" color="error" disabled={deleting} startIcon={<IconTrash size={18} />}>
          {deleting ? "Siliniyor..." : "Sil"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ─── Juri Toplu Silme Onay Dialog ─── */

const DeleteJuryEvaluationsDialog = ({ open, onClose, juri, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm(juri);
    setDeleting(false);
    onClose();
  };

  if (!juri) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconTrash size={24} color="red" />
          <Typography variant="h6">Jurinin Tum Degerlendirmelerini Sil</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mt: 1 }}>
          <Typography variant="body2" component="div">
            <strong>{juri.juriName}</strong> ({juri.juriEmail}) jurisi tarafindan yapilan{" "}
            <strong>{juri.evaluationCount}</strong> degerlendirmenin tamamini silmek istediginize emin misiniz?
            <br /><br />
            Bu islem geri alinamaz. Tum takimlarin siralamalari yeniden hesaplanacaktir.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={onClose} color="inherit">Iptal</Button>
        <Button onClick={handleConfirm} variant="contained" color="error" disabled={deleting} startIcon={<IconTrash size={18} />}>
          {deleting ? "Siliniyor..." : `${juri.evaluationCount} Degerlendirmeyi Sil`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ─── Tekil Degerlendirme Detayi ─── */

const EvaluationDetail = ({ evaluation, getInitials, onDeleteEvaluation }) => {
  const theme = useTheme();
  const [showCriteria, setShowCriteria] = useState(false);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.action.hover,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: "0.7rem",
              fontWeight: 600,
              bgcolor: "primary.light",
              color: "primary.main",
            }}
          >
            {getInitials(evaluation.juriName)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight="600" noWrap>{evaluation.juriName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{evaluation.juriEmail}</Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          {evaluation.status && (
            <Chip
              label={evaluation.status === "submitted" ? "Gonderildi" : "Taslak"}
              size="small"
              color={evaluation.status === "submitted" ? "success" : "default"}
              variant="outlined"
              sx={{ height: 22, fontSize: "0.65rem" }}
            />
          )}
          <Typography variant="h6" fontWeight="700" color="primary.main">
            {evaluation.totalScore}
          </Typography>
          <Typography variant="caption" color="text.disabled">puan</Typography>
          {evaluation.evaluationId && (
            <Tooltip title="Degerlendirmeyi Sil">
              <IconButton size="small" color="error" onClick={() => onDeleteEvaluation(evaluation)} sx={{ ml: 0.25 }}>
                <IconTrash size={14} />
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="small" onClick={() => setShowCriteria(!showCriteria)} sx={{ ml: 0.5 }}>
            {showCriteria ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          </IconButton>
        </Stack>
      </Stack>

      {/* Tarih ve yorum */}
      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
        {evaluation.evaluatedAt && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconClock size={12} style={{ opacity: 0.5 }} />
            <Typography variant="caption" color="text.disabled">
              {moment(evaluation.evaluatedAt).format("DD MMM YYYY, HH:mm")}
            </Typography>
          </Stack>
        )}
        {evaluation.generalComment && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconMessage size={12} style={{ opacity: 0.5 }} />
            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
              {evaluation.generalComment}
            </Typography>
          </Stack>
        )}
      </Stack>

      {/* Kriter Detaylari */}
      <Collapse in={showCriteria} timeout="auto" unmountOnExit>
        <Divider sx={{ my: 1.5 }} />
        <Grid container spacing={1}>
          {evaluation.criteria && Object.entries(evaluation.criteria).map(([key, data]) => {
            const fallback = criteriaLabelsFallback[key];
            const meta = fallback || { label: key, max: 10 };
            const score = typeof data === "object" ? data.score : data;
            const comment = typeof data === "object" ? data.comment : "";
            const percentage = meta.max > 0 ? (score / meta.max) * 100 : 0;

            return (
              <Grid item xs={12} sm={6} key={key}>
                <Box sx={{ p: 1 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                    <Typography variant="caption" sx={{ fontSize: "0.7rem", fontWeight: 500 }}>{meta.label}</Typography>
                    <Typography variant="caption" fontWeight="600" color="text.secondary">
                      {score} / {meta.max}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(percentage, 100)}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: "grey.100",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 2,
                        bgcolor: percentage >= 75 ? "success.main" : percentage >= 50 ? "info.main" : percentage >= 25 ? "warning.main" : "error.main",
                      },
                    }}
                  />
                  {comment && (
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25, display: "block", fontSize: "0.65rem", fontStyle: "italic" }}>
                      {comment}
                    </Typography>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
        {evaluation.generalComment && (
          <Paper elevation={0} sx={{ p: 1.5, mt: 1, borderRadius: 1.5, bgcolor: "background.paper", border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: "block", mb: 0.25 }}>
              Genel Yorum
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ fontSize: "0.8rem" }}>
              {evaluation.generalComment}
            </Typography>
          </Paper>
        )}
      </Collapse>
    </Paper>
  );
};

/* ═══════════════════════════════════════════════════════════ */
/*                       ANA SAYFA                             */
/* ═══════════════════════════════════════════════════════════ */

const FinalResultsPage = () => {
  const { stats, rankings, summary, loading, error, fetchAll, deleteEvaluation, deleteEvaluationsByJury } = useJuri();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [deleteDialog, setDeleteDialog] = useState({ open: false, evaluation: null });
  const [deleteJuryDialog, setDeleteJuryDialog] = useState({ open: false, juri: null });

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    fetchAll();
    toast.info("Veriler yenileniyor...");
  };

  const handleDeleteEvaluation = async (evaluation) => {
    if (!evaluation?.evaluationId) return;
    const result = await deleteEvaluation(evaluation.evaluationId);
    if (result.success) {
      toast.success(result.message || "Degerlendirme silindi, siralama guncelleniyor...");
      await fetchAll();
    } else {
      toast.error(result.message || "Degerlendirme silinemedi");
    }
  };

  const handleDeleteJuryEvaluations = async (juri) => {
    if (!juri?.juriId) return;
    const result = await deleteEvaluationsByJury(juri.juriId);
    if (result.success) {
      toast.success(result.message || "Jurinin tum degerlendirmeleri silindi");
      await fetchAll();
    } else {
      toast.error(result.message || "Degerlendirmeler silinemedi");
    }
  };

  return (
    <PageContainer title="Final Sonuclari" description="Juri degerlendirmeleri ve takim siralamalari">
      <Fade in={true} timeout={500}>
        <Box>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ bgcolor: "warning.light", color: "warning.main", width: 40, height: 40 }}>
                  <IconTrophy size={22} />
                </Avatar>
                <Box>
                  <Typography variant={isMobile ? "h5" : "h4"} fontWeight="700">
                    Final Sonuclari
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Juri degerlendirmelerine gore takim siralamasi
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <Tooltip title="Yenile">
              <IconButton
                onClick={handleRefresh}
                disabled={loading}
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "primary.light", color: "primary.main" },
                }}
              >
                <IconRefresh size={22} />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Genel Istatistikler */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 3,
              flexWrap: "wrap",
            }}
          >
            <StatsCard
              title="Toplam Degerlendirme"
              value={stats.overall.totalEvaluations}
              subtitle={`${stats.overall.evaluatedTeamsCount} takim`}
              icon={<IconCircleCheck />}
              color="success"
              theme={theme}
            />
            <StatsCard
              title="Onayli Takim"
              value={stats.overall.totalApprovedTeams}
              subtitle={`${stats.overall.pendingTeamsCount} beklemede`}
              icon={<IconClipboardCheck />}
              color="info"
              theme={theme}
            />
            <StatsCard
              title="Aktif Juri"
              value={stats.overall.activeJurisCount}
              subtitle="Degerlendirme yapan"
              icon={<IconUsers />}
              color="primary"
              theme={theme}
            />
            <StatsCard
              title="Ortalama Puan"
              value={parseFloat(stats.overall.averageScore || 0).toFixed(1)}
              subtitle="100 uzerinden"
              icon={<IconStar />}
              color="warning"
              theme={theme}
            />
            <StatsCard
              title="En Yuksek"
              value={stats.overall.maxScore || 0}
              subtitle={`En Dusuk: ${stats.overall.minScore || 0}`}
              icon={<IconTrophy />}
              color="secondary"
              theme={theme}
            />
            <StatsCard
              title="Tamamlanma"
              value={`%${parseFloat(stats.overall.completionRate || 0).toFixed(0)}`}
              subtitle="Degerlendirme orani"
              icon={<IconPercentage />}
              color="success"
              theme={theme}
            />
          </Box>

          {/* Kriter Ortalamalari + Juri Istatistikleri */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} lg={5}>
              <CriteriaAverages criteriaAverages={stats.criteriaAverages} />
            </Grid>
            <Grid item xs={12} lg={7}>
              <JuriStatsTable juriStats={stats.juriStats} onDeleteJuryEvaluations={(juri) => setDeleteJuryDialog({ open: true, juri })} />
            </Grid>
          </Grid>

          {/* Ozet Bilgileri (summary) */}
          {summary.totalTeams > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.action.hover,
              }}
            >
              <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap justifyContent="center">
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">Toplam Takim</Typography>
                  <Typography variant="h6" fontWeight="700">{summary.totalTeams}</Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">Toplam Degerlendirme</Typography>
                  <Typography variant="h6" fontWeight="700">{summary.totalEvaluations}</Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">Genel Ortalama</Typography>
                  <Typography variant="h6" fontWeight="700" color="primary.main">
                    {parseFloat(summary.overallAverageScore || 0).toFixed(1)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">En Yuksek Ort.</Typography>
                  <Typography variant="h6" fontWeight="700" color="success.main">
                    {parseFloat(summary.highestAverage || 0).toFixed(1)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">En Dusuk Ort.</Typography>
                  <Typography variant="h6" fontWeight="700" color="error.main">
                    {parseFloat(summary.lowestAverage || 0).toFixed(1)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          {/* Takim Siralamasi */}
          <Card sx={{ border: `1px solid ${theme.palette.divider}`, boxShadow: "none", borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                <Avatar sx={{ bgcolor: "warning.light", color: "warning.main", width: 36, height: 36 }}>
                  <IconTrophy size={20} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="600">Takim Siralamasi</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ortalama puana gore sirali - Detaylar icin satira tiklayin
                  </Typography>
                </Box>
                <Chip label={`${rankings.length} Takim`} size="small" sx={{ fontWeight: 600, height: 26 }} />
              </Stack>

              <Divider sx={{ mb: 2 }} />

              {loading && rankings.length === 0 ? (
                <Stack spacing={1.5}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
                  ))}
                </Stack>
              ) : error && rankings.length === 0 ? (
                <Alert severity="error" icon={<IconAlertCircle size={18} />} sx={{ borderRadius: 2 }}>
                  {error}
                </Alert>
              ) : rankings.length === 0 ? (
                <Alert severity="info" icon={<IconAlertCircle size={18} />} sx={{ borderRadius: 2 }}>
                  Henuz degerlendirme yapilmamis
                </Alert>
              ) : (
                <Box>
                  {rankings.map((team, idx) => (
                    <RankingCard key={team.teamId || team.teamName || idx} team={team} onDeleteEvaluation={(ev) => setDeleteDialog({ open: true, evaluation: ev })} />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Degerlendirilen Takimlar Listesi */}
          {stats.evaluatedTeamNames && stats.evaluatedTeamNames.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mt: 3,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
                Degerlendirilen Takimlar ({stats.evaluatedTeamNames.length})
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {stats.evaluatedTeamNames.map((name, idx) => (
                  <Chip
                    key={idx}
                    label={name}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.72rem", height: 24, mb: 0.5 }}
                  />
                ))}
              </Stack>
            </Paper>
          )}

          <DeleteEvaluationDialog
            open={deleteDialog.open}
            onClose={() => setDeleteDialog({ open: false, evaluation: null })}
            evaluation={deleteDialog.evaluation}
            onConfirm={handleDeleteEvaluation}
          />
          <DeleteJuryEvaluationsDialog
            open={deleteJuryDialog.open}
            onClose={() => setDeleteJuryDialog({ open: false, juri: null })}
            juri={deleteJuryDialog.juri}
            onConfirm={handleDeleteJuryEvaluations}
          />
        </Box>
      </Fade>
    </PageContainer>
  );
};

// Provider ile sarmalanmis ana component
export default function FinalResultsPageWithProvider() {
  return (
    <JuriProvider>
      <FinalResultsPage />
    </JuriProvider>
  );
}
