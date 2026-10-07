"use client";
import React from "react";
import { Box, Stack, Typography, Paper } from "@mui/material";

const formatNumber = (n) => {
  if (n === null || n === undefined) return "-";
  try {
    return new Intl.NumberFormat("tr-TR").format(n);
  } catch {
    return String(n);
  }
};

const StatCard = ({ icon, title, value, subtitle, color = "primary", onClick }) => {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        transition: "all .16s ease",
        cursor: onClick ? "pointer" : "default",
        "&:hover": {
          borderColor: (t) => t.palette[color].main,
          boxShadow: (t) => `0 6px 24px rgba(${t.palette.mode === "light" ? "2,6,23" : "0,0,0"},.08)`,
          transform: "translateY(-1px)",
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: (t) => (t.palette.mode === "light" ? t.palette.grey[100] : t.palette.grey[900]),
            border: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" noWrap>
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{ lineHeight: 1.2, mt: 0.5, fontWeight: 700 }}
          >
            {formatNumber(value)}
          </Typography>
          {subtitle ? (
            <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Paper>
  );
};

export default StatCard;
