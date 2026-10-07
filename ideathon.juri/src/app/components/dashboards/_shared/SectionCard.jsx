"use client";
import React from "react";
import { Paper, Stack, Typography } from "@mui/material";

const SectionCard = ({ title, action, children, sx }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        ...sx,
      }}
    >
      {(title || action) && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          sx={{ mb: 1.5, gap: 1 }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          {action || null}
        </Stack>
      )}
      {children}
    </Paper>
  );
};

export default SectionCard;
