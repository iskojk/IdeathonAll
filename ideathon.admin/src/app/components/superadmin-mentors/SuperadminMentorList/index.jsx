"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Button,
  Fade,
  alpha,
  useTheme,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  IconRefresh,
  IconTrophy,
  IconActivity,
  IconStar,
  IconCheck,
  IconChevronDown,
  IconCalendarTime,
  IconCircleCheck,
  IconCircleX,
} from "@tabler/icons-react";
import { useSuperadminMentor } from "@/app/context/SuperadminMentorContext";
import { toast } from "react-toastify";
import MentorStatsCards from "../MentorStatsCards";
import MentorTable from "../MentorTable";
import MentorDetailModal from "../MentorDetailModal";
import moment from "moment";
import "moment/locale/tr";

moment.locale("tr");

const BRAND_COLOR = "#005DAD";

const SuperadminMentorList = () => {
  const theme = useTheme();
  const { fetchDashboardStats, fetchMentorsWithStats, loading } = useSuperadminMentor();

  const [dashboardStats, setDashboardStats] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    searchText: "",
    isActive: "all",
  });

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  useEffect(() => {
    loadMentors();
  }, [currentPage, filters]);

  const loadDashboardStats = async () => {
    const result = await fetchDashboardStats();
    if (result.success) {
      setDashboardStats(result.data);
    } else {
      toast.error(result.message || "Dashboard istatistikleri yuklenemedi");
    }
  };

  const loadMentors = async () => {
    const result = await fetchMentorsWithStats(currentPage, 10, filters);
    if (result.success) {
      setMentors(result.data);
      setPagination(result.pagination);
    } else {
      toast.error(result.message || "Mentor listesi yuklenemedi");
    }
  };

  const handlePageChange = (page, limit = 10) => {
    setCurrentPage(page);
  };

  const handleSearch = (searchTerm) => {
    setFilters((prev) => ({ ...prev, searchText: searchTerm }));
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleViewDetails = (mentor) => {
    setSelectedMentor(mentor);
    setDetailModalOpen(true);
  };

  const handleRefresh = () => {
    loadDashboardStats();
    loadMentors();
    toast.success("Veriler yenilendi");
  };

  return (
    <Fade in={true} timeout={500}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
      <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Mentor Yönetimi
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Performans, görüşme ve kalite metriklerini tek ekranda izleyin.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<IconRefresh size={20} />}
            onClick={handleRefresh}
            disabled={loading}
                  sx={{
                    borderColor: alpha(BRAND_COLOR, 0.4),
                    color: BRAND_COLOR,
                    "&:hover": { borderColor: BRAND_COLOR, backgroundColor: alpha(BRAND_COLOR, 0.05) },
                  }}
          >
                  Verileri Yenile
          </Button>
        </Stack>
            </Stack>
          </CardContent>
        </Card>

        <MentorStatsCards stats={dashboardStats} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: alpha("#f59e0b", 0.1), color: "#f59e0b", width: 40, height: 40 }}>
                    <IconTrophy size={20} />
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      En Başarılı Mentorlar
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tamamlanan görüşme ve puan ortalamasına göre
                  </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {dashboardStats?.topPerformers && dashboardStats.topPerformers.length > 0 ? (
                <Stack spacing={1.5}>
                    {dashboardStats.topPerformers.slice(0, 3).map((mentor, index) => (
                      <Box
                        key={mentor.mentorUserId}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          backgroundColor: alpha(theme.palette.background.paper, 0.6),
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              backgroundColor: alpha(BRAND_COLOR, 0.1),
                              color: BRAND_COLOR,
                              fontWeight: 700,
                            }}
                          >
                            {index + 1}
                          </Avatar>
                          <Box flex={1} minWidth={0}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                              {mentor.name}
                            </Typography>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                              <Chip
                                icon={<IconCheck size={12} />}
                                label={`${mentor.completedMeetings}/${mentor.totalMeetings} tamamlandı`}
                                size="small"
                                sx={{
                                  height: 24,
                                  backgroundColor: alpha("#10b981", 0.1),
                                  color: "#10b981",
                                  "& .MuiChip-icon": { color: "#10b981" },
                                }}
                              />
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <IconStar size={14} fill="#f59e0b" color="#f59e0b" />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "#f59e0b" }}>
                                  {mentor.averageRating?.toFixed(1)}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Box>
                        </Stack>
                      </Box>
                    ))}

                    {dashboardStats.topPerformers.length > 3 && (
                      <Accordion elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                        <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Tüm performans listesi
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Stack spacing={1.5}>
                            {dashboardStats.topPerformers.slice(3).map((mentor, index) => (
                              <Stack key={mentor.mentorUserId} direction="row" spacing={1.5} alignItems="center">
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    backgroundColor: alpha(theme.palette.text.secondary, 0.1),
                                    color: theme.palette.text.secondary,
                                    fontWeight: 700,
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {index + 4}
                                </Avatar>
                                <Box flex={1} minWidth={0}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                    {mentor.name}
                                  </Typography>
                                </Box>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <IconStar size={14} fill="#f59e0b" color="#f59e0b" />
                                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                    {mentor.averageRating?.toFixed(1)}
                                  </Typography>
                                </Stack>
                              </Stack>
                            ))}
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                    Henüz veri yok
                    </Typography>
                  )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: alpha(BRAND_COLOR, 0.1), color: BRAND_COLOR, width: 40, height: 40 }}>
                    <IconActivity size={20} />
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Son Aktiviteler
                  </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Görüşme ve durum değişiklikleri
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {dashboardStats?.recentActivity && dashboardStats.recentActivity.length > 0 ? (
                <Stack spacing={1.5}>
                    {dashboardStats.recentActivity.slice(0, 4).map((activity, index) => {
                      const statusColor =
                                activity.status === "completed"
                                  ? "#10b981"
                                  : activity.status === "scheduled"
                                  ? "#3b82f6"
                          : activity.status === "cancelled"
                          ? "#ef4444"
                          : BRAND_COLOR;
                      const StatusIcon =
                        activity.status === "completed"
                          ? IconCircleCheck
                          : activity.status === "scheduled"
                          ? IconCalendarTime
                          : IconCircleX;

                      return (
                        <Box
                          key={index}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            backgroundColor: alpha(theme.palette.background.paper, 0.6),
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <Avatar sx={{ bgcolor: alpha(statusColor, 0.12), color: statusColor, width: 36, height: 36 }}>
                              <StatusIcon size={18} />
                            </Avatar>
                          <Box flex={1} minWidth={0}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                              {activity.mentorName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                Katılımcı: {activity.participantName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {moment(activity.timestamp).fromNow()}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                      );
                    })}

                    {dashboardStats.recentActivity.length > 4 && (
                      <Accordion elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                        <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Tüm aktiviteleri görüntüle
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Stack spacing={1.5}>
                            {dashboardStats.recentActivity.slice(4).map((activity, index) => (
                              <Stack key={index} direction="row" spacing={1.5} alignItems="center">
                                <Avatar
                                  sx={{
                                    bgcolor: alpha(theme.palette.text.secondary, 0.1),
                                    color: theme.palette.text.secondary,
                                    width: 32,
                                    height: 32,
                                  }}
                                >
                                  <IconActivity size={16} />
                                </Avatar>
                                <Box flex={1} minWidth={0}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                    {activity.mentorName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {moment(activity.timestamp).fromNow()}
                                  </Typography>
                                </Box>
                              </Stack>
                            ))}
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                    Henüz aktivite yok
                    </Typography>
                  )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <MentorTable
          mentors={mentors}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onViewDetails={handleViewDetails}
          loading={loading}
        />

        <MentorDetailModal open={detailModalOpen} onClose={() => setDetailModalOpen(false)} mentor={selectedMentor} />
      </Box>
    </Fade>
  );
};

export default SuperadminMentorList;
