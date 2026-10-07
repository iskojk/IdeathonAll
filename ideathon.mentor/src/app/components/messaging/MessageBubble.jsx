"use client";

import React from "react";
import { Box, Typography, Stack, Avatar, CircularProgress, Tooltip } from "@mui/material";
import { IconCheck, IconChecks, IconAlertCircle, IconClock } from "@tabler/icons-react";
import { format, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";

const MessageBubble = ({ message, currentUserId }) => {
  const isOwnMessage = message.senderUserId?._id === currentUserId;
  const isTemporary = message.isTemporary || false;
  const isSending = message.status === "sending";
  const isFailed = message.status === "failed";

  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, "HH:mm", { locale: tr });
    } else if (isYesterday(messageDate)) {
      return `Dün ${format(messageDate, "HH:mm", { locale: tr })}`;
    } else {
      return format(messageDate, "d MMM HH:mm", { locale: tr });
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignSelf: isOwnMessage ? "flex-end" : "flex-start",
        maxWidth: { xs: "85%", sm: "70%", md: "60%" },
        flexDirection: isOwnMessage ? "row-reverse" : "row",
        mb: 1.5,
      }}
    >
      {/* Avatar */}
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: isOwnMessage ? "#005DAD" : "#757575",
          fontSize: "0.75rem",
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {getInitials(message.senderUserId?.name)}
      </Avatar>

      {/* Mesaj Balonu */}
      <Box
        sx={{
          position: "relative",
        }}
      >
        <Box
          sx={{
            bgcolor: isFailed 
              ? "#FFEBEE" 
              : isOwnMessage ? "#005DAD" : "white",
            color: isFailed
              ? "#D32F2F"
              : isOwnMessage ? "white" : "text.primary",
            borderRadius: isOwnMessage
              ? "18px 18px 4px 18px"
              : "18px 18px 18px 4px",
            px: 2,
            py: 1.5,
            border: isFailed 
              ? "1px solid #EF5350"
              : isOwnMessage ? "none" : "1px solid #E0E0E0",
            boxShadow: isOwnMessage
              ? "0 2px 8px rgba(0, 93, 173, 0.15)"
              : "0 2px 8px rgba(0, 0, 0, 0.08)",
            opacity: isSending ? 0.7 : 1,
            transition: "all 0.2s ease",
          }}
        >
          {/* Mesaj İçeriği */}
          <Typography
            variant="body2"
            sx={{
              wordWrap: "break-word",
              whiteSpace: "pre-wrap",
              lineHeight: 1.5,
              fontSize: "0.95rem",
            }}
          >
            {message.text}
          </Typography>

          {/* Tarih ve Okundu Durumu */}
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            justifyContent="flex-end"
            sx={{ mt: 0.5 }}
          >
            <Typography
              variant="caption"
              sx={{
                color: isOwnMessage
                  ? "rgba(255, 255, 255, 0.75)"
                  : "text.secondary",
                fontSize: "0.65rem",
                fontWeight: 500,
              }}
            >
              {formatMessageTime(message.createdAt)}
            </Typography>

            {/* Mesaj Durumu İşareti (sadece kendi mesajlarında) */}
            {isOwnMessage && (
              <Box sx={{ display: "flex", alignItems: "center", ml: 0.25 }}>
                {isFailed ? (
                  <Tooltip title="Mesaj gönderilemedi">
                    <IconAlertCircle size={16} color="#D32F2F" stroke={2} />
                  </Tooltip>
                ) : isSending ? (
                  <Tooltip title="Gönderiliyor...">
                    <IconClock size={16} color="rgba(255, 255, 255, 0.75)" stroke={2} />
                  </Tooltip>
                ) : message.isRead ? (
                  <Tooltip title="Okundu">
                  <IconChecks size={16} color="#4CAF50" stroke={2.5} />
                  </Tooltip>
                ) : (
                  <Tooltip title="İletildi">
                  <IconCheck
                    size={16}
                    color="rgba(255, 255, 255, 0.75)"
                    stroke={2}
                  />
                  </Tooltip>
                )}
              </Box>
            )}
          </Stack>
        </Box>
      </Box>
    </Stack>
  );
};

export default MessageBubble;




