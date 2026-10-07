"use client";

import React from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  CircularProgress,
  Divider,
  Button,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import { useHome } from "@/app/context/HomeContext"; // 📌 useHome kullan!
import { useRouter } from "next/navigation";

const HomeCalendar = () => {
  const { calendar, loading } = useHome(); // 📌 useCalendar değil, useHome!
  const router = useRouter();

  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", width: "100%" }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        📅 Yaklaşan Etkinlikler
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
          <CircularProgress size={24} />
        </Box>
      ) : calendar.length === 0 ? (
        <Typography color="textSecondary" textAlign="center">
          Henüz etkinlik bulunmamaktadır.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {calendar
            .sort((a, b) => new Date(a.start) - new Date(b.start)) // 📌 Tarihe göre sırala
            .slice(0, 5) // 📌 İlk 5 etkinliği göster
            .map((event) => (
              <Box key={event._id}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 2,
                    borderRadius: 1,
                    bgcolor: "grey.100",
                  }}
                >
                  <EventIcon sx={{ color: "primary.main", mr: 2 }} />
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {event.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {new Date(event.start).toLocaleDateString("tr-TR")}
                    </Typography>
                  </Box>
                </Box>
                <Divider />
              </Box>
            ))}
          <Button fullWidth variant="contained" color="primary" onClick={() => router.push("/apps/calendar")}>
            Tüm Etkinlikleri Gör
          </Button>
        </Stack>
      )}
    </Paper>
  );
};

export default HomeCalendar;
