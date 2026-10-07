"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Card,
  Stack,
  Typography,
  Avatar,
  TextField,
  IconButton,
  Badge,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
  Button,
  Alert,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  IconSend,
  IconArrowLeft,
  IconDots,
  IconArchive,
  IconInbox,
  IconRefresh,
  IconAlertCircle,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import { useSocket } from "@/app/context/SocketContext";
import {
  getConversationDetail,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  archiveConversation,
  unarchiveConversation,
  getOnlineStatus,
} from "@/utils/api/messages";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

const ConversationDetail = ({ conversationId, onBack, onConversationUpdate }) => {
  const { socket, isConnected, onlineUsers, joinConversation, leaveConversation, startTyping, stopTyping, addEventListener } = useSocket();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState("");
  const [participantOnline, setParticipantOnline] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const addedMessageIdsRef = useRef(new Set()); // Eklenen mesaj ID'lerini takip et
  const fetchTimeoutRef = useRef(null);
  const isInitialLoadRef = useRef(true); // İlk yükleme kontrolü için
  const currentUserId = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}")._id : null;

  const MAX_RETRIES = 3;

  // Conversation detayını ve mesajları getir (retry logic ile)
  const fetchConversationData = useCallback(async (isRetry = false) => {
    if (!conversationId) return;

    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }

      // Timeout kontrolü
      const controller = new AbortController();
      fetchTimeoutRef.current = setTimeout(() => controller.abort(), 15000);

      // Conversation detayı
      const convRes = await getConversationDetail(conversationId);
      
      if (!convRes.success || !convRes.data) {
        throw new Error("Konuşma verisi alınamadı");
      }
      
      setConversation(convRes.data);

      // Mesajları getir
      const messagesRes = await getMessages(conversationId, { limit: 50 });
      
      if (!messagesRes.success || !messagesRes.data) {
        throw new Error("Mesajlar alınamadı");
      }
      
      const fetchedMessages = Array.isArray(messagesRes.data) ? messagesRes.data.reverse() : [];
      setMessages(fetchedMessages);

      // Mevcut mesaj ID'lerini ref'e ekle
      addedMessageIdsRef.current = new Set(fetchedMessages.map(msg => msg._id));
      
      // İlk yükleme scroll - instant (hemen alta)
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
        isInitialLoadRef.current = false; // İlk yükleme tamamlandı
      }, 100);

      // Katılımcının online durumunu kontrol et
      const participant = convRes.data.participants?.find((p) => p.role !== "mentor");
      if (participant) {
        try {
          const statusRes = await getOnlineStatus(participant._id);
          setParticipantOnline(statusRes.data?.isOnline || false);
        } catch (error) {
          // Online status hatası kritik değil, devam et
        }
      }

      // Mesajları okundu işaretle
      try {
        await markMessagesAsRead(conversationId);
      } catch (error) {
        // Read marking hatası kritik değil
      }

      // WebSocket room'una katıl (eğer bağlıysa)
      if (isConnected && socket) {
        joinConversation(conversationId);
      }

      clearTimeout(fetchTimeoutRef.current);
      setRetryCount(0); // Başarılı olursa retry sayacını sıfırla
      setError(null);

    } catch (error) {
      clearTimeout(fetchTimeoutRef.current);

      // Retry logic
      if (!isRetry && retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchConversationData(true), 2000 * (retryCount + 1));
        return;
      }

      // Maksimum retry sayısına ulaşıldı
      const errorMessage = error.response?.data?.message || error.message || "Konuşma yüklenirken hata oluştu";
      setError(errorMessage);
      toast.error(errorMessage);
      
    } finally {
      if (!isRetry) {
      setLoading(false);
      }
    }
  }, [conversationId, isConnected, socket, joinConversation, retryCount]);

  useEffect(() => {
    fetchConversationData();
    
    // Yeni konuşma açıldığında ilk yükleme flag'ini sıfırla
    isInitialLoadRef.current = true;

    return () => {
      // Cleanup: Room'dan ayrıl
      if (conversationId) {
        leaveConversation(conversationId);
      }
    };
  }, [conversationId, fetchConversationData, leaveConversation]);

  // Socket event listener'ları
  useEffect(() => {
    if (!socket || !conversationId) {
      return;
    }


    // Yeni mesaj geldi
    const handleNewMessage = (data) => {
      // Eğer bu conversation'a aitse
      if (data.conversationId === conversationId) {
        // Mesaj validasyonu
        if (!data._id || !data.text) {
          return;
        }

        // Ref ile duplicate kontrolü (state batching sorununu önler)
        if (addedMessageIdsRef.current.has(data._id)) {
          return;
        }

        // Mesaj ID'sini ref'e ekle
        addedMessageIdsRef.current.add(data._id);

        // State'e ekle
        setMessages((prev) => {
          // Double-check: State'te de var mı?
          const exists = prev.some((msg) => msg._id === data._id);
          if (exists) {
            return prev;
          }

          // Geçici mesajları temizle (aynı text'e sahip olanlar)
          const withoutTemp = prev.filter(msg => 
            !msg.isTemporary || msg.text !== data.text
          );

          return [...withoutTemp, data];
        });
        
        // Mesajı okundu işaretle (sadece bizim göndermediğimiz mesajlar için)
        if (data.senderUserId?._id !== currentUserId) {
          try {
            markMessagesAsRead(conversationId);
          } catch (error) {
            // Mark as read error
          }
        }
        
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    // Mesaj okundu
    const handleMessageRead = (data) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderUserId?._id === currentUserId && !msg.isRead
              ? { ...msg, isRead: true, readAt: data.readAt }
              : msg
          )
        );
      }
    };

    // Typing başladı
    const handleTyping = (data) => {
      if (data.conversationId === conversationId) {
        setIsTyping(true);
        setTypingUserName(data.userName);
      }
    };

    // Typing durdu
    const handleStopTyping = (data) => {
      if (data.conversationId === conversationId) {
        setIsTyping(false);
        setTypingUserName("");
      }
    };

    // Event listener'ları ekle
    const cleanupNewMessage = addEventListener("message:new", handleNewMessage);
    const cleanupMessageRead = addEventListener("message:read", handleMessageRead);
    const cleanupTyping = addEventListener("user:typing", handleTyping);
    const cleanupStopTyping = addEventListener("user:stop-typing", handleStopTyping);

    return () => {
      cleanupNewMessage?.();
      cleanupMessageRead?.();
      cleanupTyping?.();
      cleanupStopTyping?.();
    };
  }, [socket, conversationId, currentUserId]);

  // Online/offline durumunu güncelle
  useEffect(() => {
    const participant = conversation?.participants?.find((p) => p.role !== "mentor");
    if (participant?._id) {
      const isOnline = onlineUsers.has(participant._id);
      setParticipantOnline(isOnline);
    } else {
      setParticipantOnline(false);
    }
  }, [onlineUsers, conversation]);

  // Scroll to bottom - sadece yeni mesajlarda smooth, ilk yüklemede instant
  useEffect(() => {
    // İlk yükleme dışındaki mesaj değişikliklerinde smooth scroll
    if (!isInitialLoadRef.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mesaj gönderme (retry logic ile)
  const handleSendMessage = async () => {
    if (!messageText.trim() || sending || !conversationId) {
      return;
    }

    const text = messageText.trim();
    const tempMessageId = `temp_${Date.now()}_${Math.random()}`;
    
    setMessageText("");
    setSending(true);

    // Typing'i durdur
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (stopTyping && conversationId) {
    stopTyping(conversationId);
    }

    // Optimistic UI: Mesajı hemen göster (geçici)
    const tempMessage = {
      _id: tempMessageId,
      text,
      senderUserId: { _id: currentUserId, name: "Sen" },
      createdAt: new Date().toISOString(),
      status: "sending",
      isTemporary: true
    };
    
    setMessages(prev => [...prev, tempMessage]);

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const response = await sendMessage(conversationId, {
        text,
        messageType: "text",
      });

      if (!response.success) {
        throw new Error(response.message || "Mesaj gönderilemedi");
      }

      // Geçici mesajı kaldır (Socket event'ten gerçek mesaj gelecek)
      setMessages(prev => prev.filter(msg => msg._id !== tempMessageId));

      // Socket event'i gelmezse (bağlantı yoksa), manuel ekle
      if (!isConnected) {
        const realMessage = response.data;
        if (realMessage && !addedMessageIdsRef.current.has(realMessage._id)) {
          addedMessageIdsRef.current.add(realMessage._id);
          setMessages(prev => [...prev.filter(msg => msg._id !== tempMessageId), realMessage]);
        }
      }

      // Conversation listesini güncelle (callback)
      if (onConversationUpdate) {
        onConversationUpdate();
      }

    } catch (error) {
      // Geçici mesajı hata durumuna çevir
      setMessages(prev => prev.map(msg => 
        msg._id === tempMessageId 
          ? { ...msg, status: "failed", isTemporary: true }
          : msg
      ));

      const errorMsg = error.response?.data?.message || error.message || "Mesaj gönderilemedi";
      toast.error(errorMsg);
      
      // Hata durumunda mesajı input'a geri koy
      setTimeout(() => {
        setMessageText(text);
        // Geçici mesajı kaldır
        setMessages(prev => prev.filter(msg => msg._id !== tempMessageId));
      }, 2000);

    } finally {
      setSending(false);
    }
  };

  // Typing indicator
  const handleTextChange = (e) => {
    setMessageText(e.target.value);

    // Typing event'i gönder
    startTyping(conversationId);

    // 1 saniye sonra durdur
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 1000);
  };

  // Enter tuşu ile gönder
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Arşivleme
  const handleArchiveToggle = async () => {
    try {
      if (conversation.isArchived) {
        await unarchiveConversation(conversationId);
        toast.success("Konuşma arşivden çıkarıldı");
      } else {
        await archiveConversation(conversationId);
        toast.success("Konuşma arşivlendi");
      }

      // Conversation listesini güncelle
      if (onConversationUpdate) {
        onConversationUpdate();
      }

      // Geri dön
      if (onBack) {
        onBack();
      }
    } catch (error) {
      toast.error("İşlem başarısız");
    }
    setAnchorEl(null);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const participant = conversation?.participants?.find((p) => p.role !== "mentor");

  if (loading) {
    return (
      <Card
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #E0E0E0",
          borderRadius: 2,
        }}
      >
        <CircularProgress sx={{ color: "#005DAD" }} />
      </Card>
    );
  }

  // Hata durumu
  if (error && !loading && !conversation) {
    return (
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #E0E0E0",
          borderRadius: 2,
          p: 3,
        }}
      >
        <IconAlertCircle size={60} color="#F44336" style={{ marginBottom: 16 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Konuşma yüklenemedi
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2, maxWidth: 400 }}>
          {error}
        </Typography>
        <Stack direction="row" spacing={1}>
          {onBack && (
            <Button
              variant="outlined"
              onClick={onBack}
              startIcon={<IconArrowLeft size={18} />}
            >
              Geri Dön
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => {
              setRetryCount(0);
              fetchConversationData();
            }}
            startIcon={<IconRefresh size={18} />}
            sx={{ bgcolor: "#005DAD", "&:hover": { bgcolor: "#004080" } }}
          >
            Yeniden Dene
          </Button>
        </Stack>
        {retryCount > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
            {retryCount} kez denendi
          </Typography>
        )}
      </Card>
    );
  }

  if (!conversation) {
    return (
      <Card
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #E0E0E0",
          borderRadius: 2,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Konuşma bulunamadı
        </Typography>
      </Card>
    );
  }

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
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid #E0E0E0",
          bgcolor: "white",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Geri Butonu (mobil için) */}
            <IconButton
              onClick={onBack}
              size="small"
              sx={{
                display: { xs: "flex", md: "none" },
                color: "#005DAD",
              }}
            >
              <IconArrowLeft size={20} />
            </IconButton>

            {/* Avatar */}
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
              sx={{
                "& .MuiBadge-badge": {
                  bgcolor: participantOnline ? "#4CAF50" : "#BDBDBD",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  border: "2px solid white",
                },
              }}
            >
              <Avatar
                sx={{
                  bgcolor: "#005DAD",
                  width: 36,
                  height: 36,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                {getInitials(participant?.name)}
              </Avatar>
            </Badge>

            {/* İsim ve Durum - Şık ve Sade */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
                  {participant?.name || "Katılımcı"}
                </Typography>
                {participant?.teamName && (
                  <Chip
                    label={participant.teamName}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: "0.7rem",
                      bgcolor: "#E3F2FD",
                      color: "#2196F3",
                      fontWeight: 600,
                      "& .MuiChip-label": {
                        px: 1,
                      },
                    }}
                  />
                )}
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: participantOnline ? "#4CAF50" : "#9E9E9E",
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                  {participantOnline ? "Çevrimiçi" : "Çevrimdışı"}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          {/* Menu */}
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
            <IconDots size={20} />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={handleArchiveToggle}>
              {conversation.isArchived ? (
                <>
                  <IconInbox size={18} style={{ marginRight: 8 }} />
                  Arşivden Çıkar
                </>
              ) : (
                <>
                  <IconArchive size={18} style={{ marginRight: 8 }} />
                  Arşivle
                </>
              )}
            </MenuItem>
          </Menu>
        </Stack>
      </Box>

      {/* Mesajlar */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          bgcolor: "#FAFAFA",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Henüz mesaj yok. İlk mesajı gönderin!
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message._id} message={message} currentUserId={currentUserId} />
            ))}
          </>
        )}

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator userName={typingUserName} />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* Mesaj Input */}
      <Box sx={{ p: 2, bgcolor: "white" }}>
        <Stack direction="row" spacing={1} alignItems="flex-end">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Mesajınızı yazın..."
            value={messageText}
            onChange={handleTextChange}
            onKeyPress={handleKeyPress}
            disabled={sending}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#F5F5F5",
                borderRadius: 2,
                "& fieldset": { border: "1px solid #E0E0E0" },
                "&:hover fieldset": { borderColor: "#005DAD" },
                "&.Mui-focused fieldset": { borderColor: "#005DAD" },
              },
            }}
          />
          <IconButton
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sending}
            sx={{
              bgcolor: "#005DAD",
              color: "white",
              "&:hover": { bgcolor: "#004080" },
              "&:disabled": { bgcolor: "#E0E0E0", color: "#757575" },
              width: 44,
              height: 44,
            }}
          >
            {sending ? <CircularProgress size={20} sx={{ color: "white" }} /> : <IconSend size={20} />}
          </IconButton>
        </Stack>
      </Box>
    </Card>
  );
};

export default ConversationDetail;

