"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
} from "@mui/material";
import { toast } from "react-toastify";
import {
  getIntegrations,
  connectGoogle,
  disconnectProvider,
} from "@/utils/api/integration";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import Image from "next/image";

const MentorIntegrationsView = () => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);
  const [disconnectDialog, setDisconnectDialog] = useState({ open: false, provider: null });

  // Provider bilgileri - Sade ve kurumsal
  const providers = [
    {
      id: "google",
      name: "Google Meet",
      description: "Google Calendar entegrasyonu ile otomatik toplantı linkleri oluşturun",
      logo: "/images/entegre/meet.svg",
      color: "#005DAD",
    },
    {
      id: "jitsi",
      name: "Jitsi Meet",
      description: "Ücretsiz ve açık kaynaklı video konferans platformu",
      logo: "/images/entegre/jitsi.png",
      color: "#005DAD",
      isDefault: true,
    },
  ];

  // Sayfa yüklendiğinde entegrasyonları getir ve callback kontrolü yap
  useEffect(() => {
    fetchIntegrations();
    checkCallbackStatus();
  }, []);

  // Entegrasyonları getir
  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await getIntegrations();
      setIntegrations(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Entegrasyonlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  // OAuth callback durumunu kontrol et
  const checkCallbackStatus = () => {
    const params = new URLSearchParams(window.location.search);
    const provider = params.get("provider");
    const status = params.get("status");

    if (status === "success" && provider) {
      toast.success(`${getProviderName(provider)} başarıyla bağlandı!`);
      fetchIntegrations();
    } else if (status === "error" && provider) {
      const reason = params.get("reason") || "Bilinmeyen hata";
      toast.error(`${getProviderName(provider)} bağlantısı başarısız: ${reason}`);
    }

    // URL'den parametreleri temizle
    if (provider || status) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  };

  // Provider'ın bağlı olup olmadığını kontrol et
  const isConnected = (providerId) => {
    return integrations.some(
      (i) => i.provider === providerId && i.status === "connected"
    );
  };

  // Provider'ın hatalı durumda olup olmadığını kontrol et
  const hasError = (providerId) => {
    return integrations.some(
      (i) => i.provider === providerId && (i.status === "error" || i.status === "revoked")
    );
  };

  // Provider bilgilerini getir
  const getProviderInfo = (providerId) => {
    return integrations.find((i) => i.provider === providerId);
  };

  // Provider adını getir
  const getProviderName = (providerId) => {
    const provider = providers.find((p) => p.id === providerId);
    return provider?.name || providerId;
  };

  // Provider'a bağlan
  const handleConnect = async (providerId) => {
    try {
      setConnecting(providerId);

      let response;
      if (providerId === "google") {
        response = await connectGoogle();
      }

      if (response?.success && response?.authUrl) {
        // OAuth sayfasına yönlendir
        window.location.href = response.authUrl;
      } else {
        toast.error("Bağlantı başlatılamadı");
        setConnecting(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Bağlantı başlatılamadı");
      setConnecting(null);
    }
  };

  // Bağlantıyı kes dialog'unu aç
  const handleDisconnectClick = (providerId) => {
    setDisconnectDialog({ open: true, provider: providerId });
  };

  // Bağlantıyı kes
  const handleDisconnect = async () => {
    const { provider } = disconnectDialog;

    try {
      setConnecting(provider);
      setDisconnectDialog({ open: false, provider: null });

      const response = await disconnectProvider(provider);

      if (response?.success) {
        toast.success(`${getProviderName(provider)} bağlantısı kesildi`);
        fetchIntegrations();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Bağlantı kesilemedi");
    } finally {
      setConnecting(null);
    }
  };

  // Bağlı entegrasyon sayısı
  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  // Loading durumu
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Başlık */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          bgcolor: "#005DAD",
          color: "white",
          borderRadius: 2,
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Entegrasyonlar
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Toplantılarınızı profesyonel video platformları ile yönetin
          </Typography>
          <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {connectedCount}/1
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Aktif Entegrasyon
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.3)" }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                AES-256
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Güvenli Şifreleme
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      {/* Hatalı entegrasyon uyarısı */}
      {integrations.some((i) => i.status === "error" || i.status === "revoked") && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Dikkat: Bazı entegrasyonlarda sorun var
          </Typography>
          <Typography variant="body2">
            Lütfen sorunlu entegrasyonları kaldırıp tekrar bağlayın.
          </Typography>
        </Alert>
      )}

      {/* Provider Kartları */}
      <Grid container spacing={3}>
        {providers.map((provider) => {
          const providerInfo = getProviderInfo(provider.id);
          const connected = isConnected(provider.id);
          const error = hasError(provider.id);
          const isLoading = connecting === provider.id;

          return (
            <Grid item xs={12} sm={6} md={6} key={provider.id}>
              <Card
                sx={{
                  height: "100%",
                  border: connected ? `2px solid ${provider.color}` : "1px solid #E0E0E0",
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Logo ve Başlık */}
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        border: "1px solid #E0E0E0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "#FFFFFF",
                        position: "relative",
                      }}
                    >
                      <Image
                        src={provider.logo}
                        alt={provider.name}
                        width={40}
                        height={40}
                        style={{ objectFit: "contain" }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {provider.name}
                      </Typography>
                      {provider.isDefault && (
                        <Chip
                          label="Varsayılan"
                          size="small"
                          sx={{
                            bgcolor: "#E3F2FD",
                            color: "#005DAD",
                            fontWeight: 600,
                            height: 22,
                          }}
                        />
                      )}
                      {connected && (
                        <Chip
                          label="Bağlı"
                          size="small"
                          color="success"
                          sx={{ fontWeight: 600, height: 22 }}
                        />
                      )}
                      {error && (
                        <Chip
                          label="Hatalı"
                          size="small"
                          color="error"
                          sx={{ fontWeight: 600, height: 22 }}
                        />
                      )}
                    </Box>
                  </Stack>

                  {/* Açıklama */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {provider.description}
                  </Typography>

                  {/* Durum ve Butonlar */}
                  {!provider.isDefault && (
                    <Box>
                      {connected && !error ? (
                        <Stack spacing={2}>
                          {/* Bağlı Bilgileri */}
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              bgcolor: "#F8F9FA",
                              borderRadius: 1,
                            }}
                          >
                            <Stack spacing={1}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                  Bağlı Hesap
                                </Typography>
                                <Chip label="Aktif" size="small" color="success" />
                              </Stack>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {providerInfo?.email || "Yükleniyor..."}
                              </Typography>
                              {providerInfo?.updatedAt && (
                                <Typography variant="caption" color="text.secondary">
                                  Son güncelleme:{" "}
                                  {format(parseISO(providerInfo.updatedAt), "d MMM yyyy, HH:mm", {
                                    locale: tr,
                                  })}
                                </Typography>
                              )}
                            </Stack>
                          </Paper>

                          <Button
                            variant="outlined"
                            color="error"
                            fullWidth
                            onClick={() => handleDisconnectClick(provider.id)}
                            disabled={isLoading}
                          >
                            Bağlantıyı Kes
                          </Button>
                        </Stack>
                      ) : error ? (
                        <Stack spacing={2}>
                          <Alert severity="error">
                            <Typography variant="body2">
                              Bağlantı hatası oluştu. Lütfen tekrar bağlanın.
                            </Typography>
                          </Alert>

                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="contained"
                              fullWidth
                              onClick={() => handleConnect(provider.id)}
                              disabled={isLoading}
                              sx={{
                                bgcolor: "#005DAD",
                                "&:hover": { bgcolor: "#004080" },
                              }}
                            >
                              {isLoading ? "Bağlanıyor..." : "Tekrar Bağla"}
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => handleDisconnectClick(provider.id)}
                              disabled={isLoading}
                            >
                              Kaldır
                            </Button>
                          </Stack>
                        </Stack>
                      ) : (
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handleConnect(provider.id)}
                          disabled={isLoading}
                          sx={{
                            bgcolor: "#005DAD",
                            "&:hover": { bgcolor: "#004080" },
                            py: 1.5,
                          }}
                        >
                          {isLoading ? (
                            <>
                              <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                              Bağlanıyor...
                            </>
                          ) : (
                            "Şimdi Bağla"
                          )}
                        </Button>
                      )}
                    </Box>
                  )}

                  {/* Jitsi için özel alan */}
                  {provider.isDefault && (
                    <Alert severity="success">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Her zaman kullanılabilir
                      </Typography>
                      <Typography variant="caption">
                        Başka entegrasyon yoksa otomatik olarak kullanılır
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Bağlantıyı Kes Dialog */}
      <Dialog
        open={disconnectDialog.open}
        onClose={() => setDisconnectDialog({ open: false, provider: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Bağlantıyı Kes
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>{getProviderName(disconnectDialog.provider)}</strong> bağlantısını kesmek
              istediğinize emin misiniz?
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Bu platform ile artık toplantı oluşturamazsınız. İstediğiniz zaman tekrar bağlanabilirsiniz.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDisconnectDialog({ open: false, provider: null })}
            variant="outlined"
          >
            İptal
          </Button>
          <Button
            onClick={handleDisconnect}
            variant="contained"
            color="error"
          >
            Bağlantıyı Kes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alt Bilgi */}
      <Paper
        elevation={0}
        sx={{
          mt: 4,
          p: 3,
          bgcolor: "#F8F9FA",
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Bilgi
        </Typography>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            • Entegrasyon yaptığınızda, müsaitlik oluştururken bu platformlar otomatik olarak kullanılır
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Toplantı linki oluşturulurken, bağlı olan platformlardan uygun olanı seçilir
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Entegrasyon yapmazsanız, tüm toplantılar Jitsi Meet ile oluşturulur
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Verileriniz AES-256 şifreleme ile güvenli bir şekilde saklanır
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default MentorIntegrationsView;
