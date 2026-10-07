"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Stack,
  Typography,
  Avatar,
  Badge,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  IconButton,
  Divider,
  Tooltip,
  Alert,
} from "@mui/material";
import { IconSearch, IconArchive, IconInbox, IconRefresh, IconWifi, IconWifiOff } from "@tabler/icons-react";
import { format, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";
import { useSocket } from "@/app/context/SocketContext";

const ConversationsList = ({
  conversations,
  loading,
  onSelectConversation,
  selectedConversationId,
  showArchived,
  onToggleArchived,
  onRefresh,
  error
}) => {
  const { onlineUsers, isConnected } = useSocket();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState([]);

  // Arama filtresi
  useEffect(() => {
    if (!conversations) {
      setFilteredConversations([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter((conv) => {
      const participant = conv.participants?.find((p) => p.role !== "mentor");
      const name = participant?.name?.toLowerCase() || "";
      const email = participant?.email?.toLowerCase() || "";
      return name.includes(query) || email.includes(query);
    });

    setFilteredConversations(filtered);
  }, [conversations, searchQuery]);

  const formatLastMessageTime = (date) => {
    if (!date) return "";
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, "HH:mm", { locale: tr });
    } else if (isYesterday(messageDate)) {
      return "Dün";
    } else {
      return format(messageDate, "d MMM", { locale: tr });
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

  const getParticipant = (conversation) => {
    return conversation.participants?.find((p) => p.role !== "mentor");
  };

  const isOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.has(userId);
  };

  const getLastMessageText = (conversation) => {
    // lastMessage yoksa
    if (!conversation.lastMessage) {
      return "Henüz mesaj yok";
    }

    const lastMsg = conversation.lastMessage;

    // Text varsa göster
    if (lastMsg.text && typeof lastMsg.text === "string" && lastMsg.text.trim()) {
      return lastMsg.text.trim();
    }

    // Mesaj tiplerine göre fallback
    if (lastMsg.messageType) {
      switch (lastMsg.messageType) {
        case "text":
          return "Metin mesajı";
        case "file":
          return "📎 Dosya";
        case "image":
          return "🖼️ Resim";
        case "meeting":
          return "📅 Toplantı";
        default:
          return "Mesaj";
      }
    }


    // Son fallback
    return "Mesaj yok";
  };

  const getLastMessageTime = (conversation) => {
    const date = conversation.lastMessage?.sentAt
      || conversation.lastMessage?.createdAt
      || conversation.lastMessageAt;

    return formatLastMessageTime(date);
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #E0E0E0",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: "1px solid #E0E0E0", bgcolor: "white" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#005DAD" }}>
              Mesajlar
            </Typography>
            {/* Socket Bağlantı Durumu */}
            <Tooltip title={isConnected ? "Real-time bağlantı aktif" : "Real-time bağlantı yok"}>
              <IconButton size="small" sx={{ color: isConnected ? "#4CAF50" : "#757575" }}>
                {isConnected ? <IconWifi size={16} /> : <IconWifiOff size={16} />}
              </IconButton>
            </Tooltip>
          </Stack>

          <Stack direction="row" spacing={0.5}>
            {/* Yenile Butonu */}
            {onRefresh && (
              <Tooltip title="Yenile">
                <IconButton
                  size="small"
                  onClick={onRefresh}
                  disabled={loading}
                  sx={{
                    color: "#757575",
                    "&:hover": { bgcolor: "#E6F2FF", color: "#005DAD" },
                  }}
                >
                  <IconRefresh size={20} />
                </IconButton>
              </Tooltip>
            )}


          </Stack>
        </Stack>

        {/* Hata Mesajı */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2, fontSize: "0.875rem" }}>
            {error}
          </Alert>
        )}

        {/* Arama */}
        <TextField
          fullWidth
          size="small"
          placeholder="Konuşmalarda ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconSearch size={18} color="#757575" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "#F5F5F5",
              "& fieldset": { border: "none" },
            },
          }}
        />
      </Box>

      {/* Konuşmalar Listesi */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          bgcolor: "#FAFAFA",
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
            <CircularProgress size={32} sx={{ color: "#005DAD" }} />
          </Box>
        ) : filteredConversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? "Konuşma bulunamadı" : showArchived ? "Arşivlenmiş konuşma yok" : "Henüz konuşma yok"}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={0} divider={<Divider />}>
            {filteredConversations.map((conversation) => {
              const participant = getParticipant(conversation);
              const isSelected = conversation._id === selectedConversationId;
              const isUserOnline = participant ? isOnline(participant._id) : false;

              return (
                <Box
                  key={conversation._id}
                  onClick={() => onSelectConversation(conversation._id)}
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    bgcolor: isSelected ? "#E6F2FF" : "white",
                    borderLeft: isSelected ? "4px solid #005DAD" : "4px solid transparent",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: isSelected ? "#E6F2FF" : "#F5F5F5",
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    {/* Avatar */}
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      variant="dot"
                      sx={{
                        "& .MuiBadge-badge": {
                          bgcolor: isUserOnline ? "#4CAF50" : "#BDBDBD",
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          border: "2px solid white",
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: "#005DAD",
                          width: 38,
                          height: 38,
                          fontSize: "0.8rem",
                          fontWeight: 700,
                        }}
                      >
                        {getInitials(participant?.name)}
                      </Avatar>
                    </Badge>

                    {/* İçerik */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: conversation.unreadCount > 0 ? 700 : 600,
                              color: conversation.unreadCount > 0 ? "#005DAD" : "text.primary",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {participant?.name || "Katılımcı"}
                          </Typography>

                        </Stack>

                        <Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1 }}>
                            {getLastMessageTime(conversation)}

                          </Typography>
                          {/* Okunmamış Mesaj Badge */}
                          {conversation.unreadCount > 0 && (
                            <Chip
                              label={conversation.unreadCount}
                              size="small"
                              sx={{
                                height: 20,
                                minWidth: 20,
                                bgcolor: "#F44336",
                                color: "white",
                                fontWeight: 700,
                                fontSize: "0.7rem",
                                "& .MuiChip-label": {
                                  px: 0.8,
                                },
                              }}
                            />
                          )}
                        </Stack>



                      </Stack>

                      <Stack direction="row" justifyContent="end" alignItems="end">

                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </Card>
  );
};

export default ConversationsList;




