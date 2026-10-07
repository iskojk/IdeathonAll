"use client";

import React from "react";
import { Box, Typography, keyframes } from "@mui/material";

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

const TypingIndicator = ({ userName }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1,
        bgcolor: "#F5F5F5",
        borderRadius: 2,
        width: "fit-content",
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
        {userName || "Kullanıcı"} yazıyor
      </Typography>
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 6,
              height: 6,
              bgcolor: "#757575",
              borderRadius: "50%",
              animation: `${bounce} 1.4s infinite ease-in-out both`,
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default TypingIndicator;
















