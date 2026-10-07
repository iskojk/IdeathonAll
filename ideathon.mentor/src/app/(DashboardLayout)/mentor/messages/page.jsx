"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Grid, Typography, Card, Button, Stack, CircularProgress, Alert, Tabs, Tab } from "@mui/material";
import { IconMessageCircle, IconInbox, IconRefresh, IconArchive } from "@tabler/icons-react";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";
import PageContainer from "@/app/components/container/PageContainer";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import { getConversations, createOrGetConversation, getArchivedConversations } from "@/utils/api/messages";
import ConversationsList from "@/app/components/messaging/ConversationsList";
import ConversationDetail from "@/app/components/messaging/ConversationDetail";
import { useSocket } from "@/app/context/SocketContext";

const BCrumb = [
  {
    to: "/",
    title: "Ana Sayfa",
  },
  {
    title: "Mesajlar",
  },
];

const MentorMessagesPage = () => {
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participantId");
  const { isConnected, addEventListener } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [tabValue, setTabValue] = useState(0); // 0: Aktif, 1: Arşivlenenler
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const fetchTimeoutRef = useRef(null);
  const MAX_RETRIES = 3;


  // Konuşmaları getir (retry logic ile)
  const fetchConversations = useCallback(async (isRetry = false) => {
    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }

      // Timeout kontrolü (10 saniye)
      const controller = new AbortController();
      fetchTimeoutRef.current = setTimeout(() => controller.abort(), 10000);

      let res;
      if (tabValue === 1) {
        // Arşivlenenler sekmesi
        res = await getArchivedConversations();
      } else {
        // Aktif konuşmalar sekmesi
        res = await getConversations(false);
      }
      
      clearTimeout(fetchTimeoutRef.current);
      
      setConversations(res.data || []);
      setRetryCount(0); // Başarılı olursa retry sayacını sıfırla
      setError(null);
      
    } catch (error) {
      clearTimeout(fetchTimeoutRef.current);
      
      // Retry logic
      if (!isRetry && retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchConversations(true), 2000 * (retryCount + 1));
        return;
      }
      
      // Maksimum retry sayısına ulaşıldı
      const errorMessage = error.response?.data?.message || error.message || "Konuşmalar yüklenirken hata oluştu";
      setError(errorMessage);
      toast.error(errorMessage);
      
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  }, [tabValue, retryCount]);

  // participantId ile konuşma oluştur veya getir
  const handleCreateOrGetConversation = useCallback(async (participantUserId) => {
    if (!participantUserId) {
      return;
    }

    try {
      setCreatingConversation(true);
      setError(null);
      

      // Timeout kontrolü
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await createOrGetConversation(participantUserId);
      clearTimeout(timeout);

      if (res.success && res.data) {
        const conversationId = res.data._id;
        
        if (res.isNew) {
          toast.success("Yeni konuşma başlatıldı");
        } else {
        }

        // Conversation listesini yenile
        await fetchConversations();

        // Conversation'ı seç
        setSelectedConversationId(conversationId);
        setIsMobileDetailView(true);
      } else {
        const errorMsg = res.message || "Konuşma oluşturulamadı";
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Konuşma oluşturulurken hata oluştu";
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setCreatingConversation(false);
    }
  }, [fetchConversations]);

  // İlk yükleme ve tab değiştiğinde konuşmaları getir
  useEffect(() => {
    fetchConversations();
  }, [tabValue]); // tabValue değiştiğinde yeniden fetch et

  // Socket event listener: Real-time conversation güncellemeleri
  useEffect(() => {
    if (!isConnected || !addEventListener) return;

    // Yeni mesaj geldiğinde conversation listesini güncelle
    const cleanupNewMessage = addEventListener("message:new", (data) => {
      
      setConversations(prev => {
        return prev.map(conv => {
          if (conv._id === data.conversationId) {
            // lastMessage'ı güncelle
            return {
              ...conv,
              lastMessage: {
                text: data.text,
                senderUserId: data.senderUserId,
                sentAt: data.createdAt,
                createdAt: data.createdAt
              },
              lastMessageAt: data.createdAt,
              messageCount: (conv.messageCount || 0) + 1,
              // Eğer mesajı gönderen biz değilsek unread count'u artır
              unreadCount: data.senderUserId?._id !== JSON.parse(localStorage.getItem("user") || "{}")._id 
                ? (conv.unreadCount || 0) + 1 
                : conv.unreadCount || 0
            };
          }
          return conv;
        }).sort((a, b) => {
          // Son mesaja göre sırala (en yeni üstte)
          const dateA = new Date(a.lastMessageAt || 0);
          const dateB = new Date(b.lastMessageAt || 0);
          return dateB - dateA;
        });
      });
    });

    // Mesaj okundu
    const cleanupMessageRead = addEventListener("message:read", (data) => {
      
      setConversations(prev => {
        return prev.map(conv => {
          if (conv._id === data.conversationId) {
            return {
              ...conv,
              unreadCount: 0
            };
          }
          return conv;
        });
      });
    });

    return () => {
      cleanupNewMessage?.();
      cleanupMessageRead?.();
    };
  }, [isConnected, addEventListener]);

  // participantId varsa konuşma oluştur/getir
  useEffect(() => {

    // participantId varsa ve loading bittiyse konuşma oluştur
    // (conversations.length > 0 koşulunu kaldırdık çünkü ilk mesaj olabilir)
    if (participantId && !loading && !selectedConversationId && !creatingConversation) {
      handleCreateOrGetConversation(participantId);
    } else {
    }
  }, [participantId, loading, selectedConversationId, creatingConversation, handleCreateOrGetConversation]);

  // Conversation seçimi
  const handleSelectConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
    setIsMobileDetailView(true);
  };

  // Mobil geri butonu
  const handleBackToList = () => {
    setIsMobileDetailView(false);
    setSelectedConversationId(null);
  };

  // Tab değişimi
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSelectedConversationId(null);
  };

  // Conversation güncellemesi (mesaj gönderme sonrası)
  const handleConversationUpdate = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Manuel yenileme
  const handleRefresh = () => {
    setRetryCount(0);
    fetchConversations();
  };

  // Konuşma oluşturuluyorsa loading göster
  if (creatingConversation) {
    return (
      <PageContainer title="Mesajlar | Emlak Konut Mentor Paneli" description="Mesajlaşma sistemi">
        <Breadcrumb title="Mesajlar" items={BCrumb} />
        <Box
          sx={{
            height: "calc(100vh - 250px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <CircularProgress size={48} sx={{ color: "#005DAD" }} />
          <Typography variant="body1" color="text.secondary">
            Konuşma hazırlanıyor...
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  // Hata durumu
  if (error && !loading && conversations.length === 0) {
    return (
      <PageContainer title="Mesajlar | Emlak Konut Mentor Paneli" description="Mesajlaşma sistemi">
        <Box
          sx={{
            height: "calc(100vh - 250px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            p: 3,
          }}
        >
          <Alert 
            severity="error" 
            sx={{ maxWidth: 500, width: "100%" }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleRefresh}
                startIcon={<IconRefresh size={18} />}
              >
                Yeniden Dene
              </Button>
            }
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Mesajlar yüklenemedi
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
          {retryCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              {retryCount} kez denendi
            </Typography>
          )}
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Mesajlar | Emlak Konut Mentor Paneli" description="Mesajlaşma sistemi">
      {/* Breadcrumb */}

      {/* Socket Bağlantı Durumu */}
      {!isConnected && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => window.location.reload()}
            >
              Yenile
            </Button>
          }
        >
          <Typography variant="body2">
            Real-time mesajlaşma bağlantısı kurulamadı. Mesajlar otomatik olarak güncellenmeyebilir.
          </Typography>
        </Alert>
      )}

      {/* Tabs - Aktif / Arşivlenenler */}
      <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ 
            borderBottom: 1, 
            borderColor: "divider",
            "& .MuiTab-root": {
              fontWeight: 600,
            },
            "& .Mui-selected": {
              color: "#005DAD",
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#005DAD",
            },
          }}
        >
          <Tab 
            label="Aktif Konuşmalar" 
            icon={<IconInbox size={18} />} 
            iconPosition="start"
          />
          <Tab 
            label="Arşivlenenler" 
            icon={<IconArchive size={18} />} 
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {/* Desktop Layout */}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Grid container spacing={3} sx={{ height: "calc(100vh - 200px)" }}>
          {/* Sol: Conversations List */}
          <Grid item xs={12} md={4} lg={3} sx={{ height: "100%" }}>
            <ConversationsList
              conversations={conversations}
              loading={loading}
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversationId}
              showArchived={tabValue === 1}
              onToggleArchived={() => {}} // Artık kullanılmıyor
              onRefresh={handleRefresh}
              error={error}
            />
          </Grid>

          {/* Sağ: Conversation Detail */}
          <Grid item xs={12} md={8} lg={9} sx={{ height: "100%" }}>
            {selectedConversationId ? (
              <ConversationDetail
                conversationId={selectedConversationId}
                onConversationUpdate={handleConversationUpdate}
              />
            ) : (
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #E0E0E0",
                  borderRadius: 2,
                  p: 4,
                }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    bgcolor: "#E6F2FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 3,
                  }}
                >
                  <IconMessageCircle size={60} color="#005DAD" />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#005DAD", mb: 1 }}>
                  Mesajlarınız
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 400 }}>
                  Katılımcılarla mesajlaşmak için sol taraftaki listeden bir konuşma seçin veya yeni bir konuşma
                  başlatın.
                </Typography>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Mobile Layout */}
      <Box sx={{ display: { xs: "block", md: "none" }, height: "calc(100vh - 280px)" }}>
        {!isMobileDetailView ? (
          <ConversationsList
            conversations={conversations}
            loading={loading}
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversationId}
            showArchived={tabValue === 1}
            onToggleArchived={() => {}} // Artık kullanılmıyor
          />
        ) : (
          <ConversationDetail
            conversationId={selectedConversationId}
            onBack={handleBackToList}
            onConversationUpdate={handleConversationUpdate}
          />
        )}
      </Box>
    </PageContainer>
  );
};

export default MentorMessagesPage;
