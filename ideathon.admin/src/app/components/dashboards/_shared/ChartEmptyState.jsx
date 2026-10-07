"use client";
import React from "react";
import { Box, Typography } from "@mui/material";

const ChartEmptyState = ({ text = "Gösterilecek veri yok." }) => {
  return (
    <Box
      sx={{
        height: 260,
        display: "grid",
        placeItems: "center",
        color: "text.secondary",
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Typography variant="body2">{text}</Typography>
    </Box>
  );
};
export default ChartEmptyState;
