"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  InputAdornment,
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
  AvatarGroup,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  IconSearch,
  IconTrophy,
  IconUsers,
  IconChecks,
  IconClock,
  IconStar,
  IconFileText,
  IconChevronRight,
  IconInfoCircle,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import axios from "@/utils/axios";

const JuryTeamsList = () => {
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, evaluated, pending
  const [maxTotalScore, setMaxTotalScore] = useState(100);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const [response, criteriaResponse] = await Promise.all([
        axios.get("/juri/teams"),
        axios.get("/juri/criteria").catch(() => null),
      ]);

      if (response.data.success) {
        setTeams(response.data.data.teams || []);
        setStats(response.data.data.stats || {});
      } else {
        toast.error("Takımlar yüklenirken hata oluştu");
      }

      if (criteriaResponse?.data?.success) {
        setMaxTotalScore(criteriaResponse.data.data.maxTotalScore || 100);
      }
    } catch (error) {
      console.error("Takımlar yüklenirken hata:", error);
      toast.error(error.response?.data?.message || "Takımlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Filtreleme
  const filteredTeams = teams.filter((team) => {
    // Arama filtresi
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesName = team.teamName?.toLowerCase().includes(search);
      const matchesMember = team.members?.some(
        (m) =>
          m.fullName?.toLowerCase().includes(search) ||
          m.email?.toLowerCase().includes(search)
      );
      if (!matchesName && !matchesMember) return false;
    }

    // Durum filtresi
    if (filterStatus === "evaluated" && !team.isEvaluated) return false;
    if (filterStatus === "pending" && team.isEvaluated) return false;

    return true;
  });

  const handleEvaluateTeam = (teamName) => {
    router.push(`/jury/teams/${encodeURIComponent(teamName)}/evaluate`);
  };

  const getTeamInitials = (teamName) => {
    if (!teamName) return "?";
    const words = teamName.split(" ");
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return teamName.substring(0, 2).toUpperCase();
  };

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
          background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
          color: "white",
          boxShadow: "0 8px 32px rgba(30, 60, 114, 0.3)"
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
                Final Değerlendirme
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Takımları değerlendirin ve puan verin
              </Typography>
            </Box>
          </Stack>

          {/* İstatistikler */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={4}>
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
                    <IconUsers size={28} color="white" />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
                      {stats.totalTeams || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Toplam Takım
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
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
                      bgcolor: "success.main",
                      borderRadius: 2,
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <IconChecks size={28} color="white" />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
                      {stats.evaluatedTeams || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Değerlendirilen
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
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
                    <IconClock size={28} color="white" />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
                      {stats.pendingTeams || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Bekleyen
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Filtre ve Arama */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            {/* Arama */}
            <TextField
              fullWidth
              size="small"
              placeholder="Takım adı veya üye ara..."
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

            {/* Durum Filtreleri */}
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Button
                variant={filterStatus === "all" ? "contained" : "outlined"}
                size="small"
                onClick={() => setFilterStatus("all")}
                sx={{ minWidth: 100 }}
              >
                Tümü ({teams.length})
              </Button>
              <Button
                variant={filterStatus === "evaluated" ? "contained" : "outlined"}
                color={filterStatus === "evaluated" ? "success" : "inherit"}
                size="small"
                startIcon={<IconChecks size={16} />}
                onClick={() => setFilterStatus("evaluated")}
                sx={{ minWidth: 160 }}
              >
                Değerlendirilen ({stats.evaluatedTeams || 0})
              </Button>
              <Button
                variant={filterStatus === "pending" ? "contained" : "outlined"}
                color={filterStatus === "pending" ? "warning" : "inherit"}
                size="small"
                startIcon={<IconClock size={16} />}
                onClick={() => setFilterStatus("pending")}
                sx={{ minWidth: 140 }}
              >
                Bekleyen ({stats.pendingTeams || 0})
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

    

      {/* Takım Listesi */}
      {filteredTeams.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {searchTerm ? "Arama kriterlerine uygun takım bulunamadı." : "Henüz takım bulunmuyor."}
          </Typography>
        </Alert>
      )}

      {filteredTeams.length > 0 && (
        <Grid container spacing={3}>
          {filteredTeams.map((team) => (
            <Grid item xs={12} md={6} lg={4} key={team.teamName}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  border: "2px solid",
                  borderColor: team.isEvaluated ? "success.main" : "divider",
                  position: "relative",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: 8,
                    borderColor: team.isEvaluated ? "success.main" : "primary.main",
                  },
                }}
                onClick={() => handleEvaluateTeam(team.teamName)}
              >
                {/* Değerlendirme Badge */}
                {team.isEvaluated && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      zIndex: 1,
                    }}
                  >
                    <Chip
                      icon={<IconChecks size={16} />}
                      label="Değerlendirildi"
                      color="success"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                )}

                <CardContent>
                  <Stack spacing={2}>
                    {/* Takım Avatar ve İsim */}
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: team.isEvaluated ? "success.main" : "primary.main",
                          width: 64,
                          height: 64,
                          fontSize: "1.5rem",
                          fontWeight: 700,
                        }}
                      >
                        {getTeamInitials(team.teamName)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            mb: 0.5,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {team.teamName}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <IconUsers size={16} />
                          <Typography variant="body2" color="text.secondary">
                            {team.members?.length || 0} Üye
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>

                    <Divider />

                    {/* Takım Üyeleri */}
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                        Takım Üyeleri
                      </Typography>
                      <AvatarGroup max={4} spacing="small">
                        {team.members?.map((member, idx) => (
                          <Tooltip key={idx} title={member.fullName} arrow>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: "0.8rem",
                                bgcolor: member.isProjectOwner ? "primary.main" : "secondary.main",
                              }}
                            >
                              {member.fullName?.charAt(0) || "?"}
                            </Avatar>
                          </Tooltip>
                        ))}
                      </AvatarGroup>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                        {team.members?.find(m => m.isProjectOwner)?.fullName || "Proje Sahibi Belirsiz"}
                        {" (Proje Sahibi)"}
                      </Typography>
                    </Box>


                    {/* Puanlama Bilgisi */}
                    {team.isEvaluated && team.myScore !== null && (
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: "success.lighter",
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "success.main",
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <IconStar size={20} color="orange" />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Verdiğiniz Puan
                            </Typography>
                          </Stack>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: "success.dark" }}>
                            {team.myScore}/{maxTotalScore}
                          </Typography>
                        </Stack>
                      </Paper>
                    )}

                    {/* Aksiyon Butonu */}
                    <Button
                      variant="contained"
                      fullWidth
                      endIcon={<IconChevronRight size={18} />}
                      color={team.isEvaluated ? "success" : "primary"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEvaluateTeam(team.teamName);
                      }}
                      sx={{ mt: 1 }}
                    >
                      {team.isEvaluated ? "Değerlendirmeyi Görüntüle" : "Değerlendir"}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default JuryTeamsList;

