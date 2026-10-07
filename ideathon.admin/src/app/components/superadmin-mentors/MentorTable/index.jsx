"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  Avatar,
  Chip,
  Typography,
  Stack,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Grid,
  Pagination,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  LinearProgress,
  CardContent,
} from "@mui/material";
import {
  IconSearch,
  IconEye,
  IconStar,
  IconCalendar,
  IconCheck,
  IconFilter,
  IconChevronDown,
  IconBriefcase,
  IconMail,
  IconBrandLinkedin,
  IconCalendarTime,
  IconChartBar,
} from "@tabler/icons-react";
import moment from "moment";
import "moment/locale/tr";

moment.locale("tr");

const BRAND_COLOR = "#005DAD";

const MentorCard = ({ mentor, onViewDetails }) => {
  const theme = useTheme();
  const totalMeetings = mentor.stats?.totalMeetings || 0;
  const completedMeetings = mentor.stats?.completedMeetings || 0;
  const completionRate = totalMeetings > 0 ? Math.round((completedMeetings / totalMeetings) * 100) : 0;
  const avgRating = mentor.stats?.averageRating || 0;
  const totalRatings = mentor.stats?.totalRatings || 0;
  const photoUrl = mentor.photoUrl || "/images/profile/user-1.jpg";
  const mentorName = mentor.userId?.name || mentor.displayName || mentor.name || "Bilinmeyen";
  const mentorEmail = mentor.userId?.email || mentor.email || "-";
  const hasAbout = Boolean(mentor.about && mentor.about.trim().length > 0);
  const hasTags = Boolean(mentor.expertiseTags && mentor.expertiseTags.length > 0);
  const profileCompleteness = mentor.profileCompleteness ?? null;
  const linkedInUrl = mentor.linkedin;

  return (
    <Card
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        transition: "all 0.2s ease",
        "&:hover": { borderColor: alpha(BRAND_COLOR, 0.5) },
      }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
            <Avatar
              src={photoUrl}
              alt={mentorName}
              sx={{ width: 72, height: 72, border: `2px solid ${alpha(BRAND_COLOR, 0.4)}` }}
            />
            <Box flex={1} minWidth={0}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
                  {mentorName}
                </Typography>
                <Chip
                  label={mentor.isActive ? "Aktif" : "Pasif"}
                  size="small"
                  sx={{
                    height: 22,
                    backgroundColor: mentor.isActive ? alpha("#10b981", 0.12) : alpha("#ef4444", 0.12),
                    color: mentor.isActive ? "#10b981" : "#ef4444",
                    fontWeight: 600,
                  }}
                />
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <IconBriefcase size={16} color={theme.palette.text.secondary} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {mentor.title || "-"}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconMail size={16} color={theme.palette.text.secondary} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {mentorEmail}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          {(hasAbout || hasTags) && (
            <Accordion
              elevation={0}
              sx={{
                mt: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.6),
              }}
            >
              <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Mentor Detayları
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {hasAbout && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Hakkında
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {mentor.about}
                      </Typography>
                    </Box>
                  )}
                  {hasTags && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Uzmanlık Alanları
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5, mt: 0.5 }}>
                        {mentor.expertiseTags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            sx={{
                              height: 24,
                              backgroundColor: alpha(BRAND_COLOR, 0.1),
                              color: BRAND_COLOR,
                              fontSize: "0.75rem",
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.6),
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: alpha(BRAND_COLOR, 0.1), color: BRAND_COLOR, width: 36, height: 36 }}>
                    <IconCalendar size={18} />
                  </Avatar>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Görüşme Özeti
                  </Typography>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLOR }}>
                      {totalMeetings}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Toplam
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#10b981" }}>
                      {completedMeetings}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Tamamlanan
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#8b5cf6" }}>
                      %{completionRate}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Oran
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconStar size={18} fill="#f59e0b" color="#f59e0b" />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#f59e0b" }}>
                    {avgRating > 0 ? avgRating.toFixed(1) : "0.0"}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {totalRatings} değerlendirme
                </Typography>
              </Stack>
              <Stack spacing={0.5} alignItems="flex-end">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconCalendarTime size={16} color={theme.palette.text.secondary} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {mentor.extendedStats?.upcomingMeetings || 0}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Yaklaşan görüşme
                </Typography>
              </Stack>
              <Stack spacing={0.5} alignItems="flex-end">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconChartBar size={16} color={theme.palette.text.secondary} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {mentor.extendedStats?.lastMeetingDate
                      ? moment(mentor.extendedStats.lastMeetingDate).format("DD MMM")
                      : "-"}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Son görüşme
                </Typography>
              </Stack>
            </Stack>

            {profileCompleteness !== null && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Profil Tamamlama
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={profileCompleteness}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mt: 0.5,
                    backgroundColor: alpha(BRAND_COLOR, 0.08),
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                      backgroundColor: BRAND_COLOR,
                    },
                  }}
                />
              </Box>
            )}

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              {linkedInUrl && (
                <Tooltip title="LinkedIn Profili">
                  <IconButton
                    component="a"
                    href={linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: BRAND_COLOR,
                      backgroundColor: alpha(BRAND_COLOR, 0.08),
                      "&:hover": { backgroundColor: alpha(BRAND_COLOR, 0.16) },
                    }}
                  >
                    <IconBrandLinkedin size={20} />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Mentor detayları">
                <IconButton
                  onClick={() => onViewDetails(mentor)}
                  sx={{
                    color: BRAND_COLOR,
                    backgroundColor: alpha(BRAND_COLOR, 0.08),
                    "&:hover": { backgroundColor: alpha(BRAND_COLOR, 0.16) },
                  }}
                >
                  <IconEye size={20} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Card>
  );
};

const MentorTable = ({ mentors, pagination, onPageChange, onSearch, onFilterChange, onViewDetails, loading }) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleStatusFilterChange = (event) => {
    const value = event.target.value;
    setStatusFilter(value);
    onFilterChange({ isActive: value });
  };

  const handlePageChange = (event, newPage) => {
    onPageChange(newPage);
  };

  return (
    <Box>
      <Card sx={{ p: { xs: 2.5, md: 3 }, mb: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
            <TextField
              placeholder="Mentor ara (başlık, hakkında, uzmanlık)"
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={18} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                displayEmpty
                startAdornment={
                  <InputAdornment position="start">
                    <IconFilter size={18} />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">Tüm Mentorlar</MenuItem>
                <MenuItem value="true">Aktif</MenuItem>
                <MenuItem value="false">Pasif</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Divider />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {pagination?.totalMentors ? `Toplam ${pagination.totalMentors} mentor` : "Mentor listesi"}
            </Typography>
            {loading && <Typography variant="caption" color="text.secondary">Güncelleniyor...</Typography>}
          </Stack>
        </Stack>
      </Card>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Stack spacing={2} sx={{ mb: 3 }}>
        {loading ? (
          [1, 2, 3].map((item) => (
            <Card key={item} sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <Stack direction="row" spacing={2}>
                    <Skeleton variant="circular" width={72} height={72} />
                    <Box flex={1}>
                      <Skeleton width="60%" height={26} />
                      <Skeleton width="40%" height={18} />
                      <Skeleton width="80%" height={18} />
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Skeleton height={80} />
                  <Skeleton width="70%" height={24} sx={{ mt: 2 }} />
                </Grid>
              </Grid>
            </Card>
          ))
        ) : mentors && mentors.length === 0 ? (
          <Card sx={{ p: 8, textAlign: "center", borderRadius: 3 }}>
            <Typography variant="h6" color="text.secondary">
              Mentor bulunamadı
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Arama kriterlerinizi değiştirerek tekrar deneyin.
            </Typography>
          </Card>
        ) : (
          mentors?.map((mentor) => <MentorCard key={mentor._id} mentor={mentor} onViewDetails={onViewDetails} />)
        )}
      </Stack>

      {pagination && mentors && mentors.length > 0 && (
        <Card sx={{ p: 2, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Toplam {pagination.totalMentors || 0} mentor
            </Typography>
            <Pagination
              count={pagination.totalPages || 1}
              page={pagination.currentPage || 1}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Stack>
        </Card>
      )}
    </Box>
  );
};

export default MentorTable;
