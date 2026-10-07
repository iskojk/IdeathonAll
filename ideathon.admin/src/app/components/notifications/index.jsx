"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tab,
  Tabs,
  Stack,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { NotificationsActive } from "@mui/icons-material";
import { fetchNotifications, markNotificationAsRead } from "@/services/notificationService";
import { toast } from "react-toastify";

const NotificationsContent = () => {
  const [tabValue, setTabValue] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const userId = JSON.parse(localStorage.getItem("user"))?.id;

  const isRead = (notification) =>
    notification.is_read_by?.some((read) => read.user_id === userId);

  const getNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data.data);
    } catch (error) {
      console.error("Bildirimler yüklenirken hata:", error);
    }
  };

  useEffect(() => {
    getNotifications();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMarkAsRead = async (id) => {
    try {
      const response = await markNotificationAsRead(id);
      if (response.success) {
        toast.success("Bildirim okundu olarak işaretlendi!");
        getNotifications();
      }
    } catch (error) {
      console.error("Bildirim okundu işaretlenirken hata:", error);
      toast.error("Bildirim işaretlenemedi.");
    }
  };

  const filteredNotifications = () => {
    if (tabValue === 1) {
      return notifications.filter((notification) => !isRead(notification));
    } else if (tabValue === 2) {
      return notifications.filter((notification) => isRead(notification));
    }
    return notifications;
  };

  const openNotificationDetails = (notification) => {
    setSelectedNotification(notification);
  };

  const closeNotificationDetails = () => {
    setSelectedNotification(null);
  };

  return (
    <Box sx={{ px: 3, py: 2, width: "100%" }}>
      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        centered
        sx={{ mb: 3 }}
      >
        <Tab label="Tüm Bildirimler" />
        <Tab label="Okunmamış" />
        <Tab label="Okundu" />
      </Tabs>

      {/* Bildirim Listesi */}
      <Box>
        {filteredNotifications().length === 0 ? (
          <Typography
            variant="subtitle1"
            color="textSecondary"
            textAlign="center"
            sx={{ mt: 5 }}
          >
            {tabValue === 1
              ? "Henüz okunmamış bildirim yok."
              : tabValue === 2
              ? "Henüz okunan bildirim yok."
              : "Henüz bildirim bulunmamaktadır."}
          </Typography>
        ) : (
          <Stack spacing={3}>
            {filteredNotifications().map((notification) => (
              <Box
                key={notification._id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: isMobile ? 2 : 3,
                  borderRadius: 2,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  backgroundColor: isRead(notification) ? "grey.100" : "white",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={isMobile ? 0 : 2}
                >
                  {!isMobile && (
                    <Avatar
                      sx={{
                        bgcolor: "primary.light",
                        color: "primary.main",
                        width: 56,
                        height: 56,
                      }}
                    >
                      {notification.title.charAt(0)}
                    </Avatar>
                  )}
                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      noWrap
                      sx={{
                        maxWidth: isMobile ? "150px" : "100%",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {notification.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{
                        maxWidth: isMobile ? "150px" : "100%",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {notification.content}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  {!isRead(notification) && (
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleMarkAsRead(notification._id)}
                    >
                      <NotificationsActive />
                    </IconButton>
                  )}
                  <Button
                    variant="text"
                    color="primary"
                    onClick={() => openNotificationDetails(notification)}
                  >
                    Detaylar
                  </Button>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Detay Modal */}
      {selectedNotification && (
        <Dialog
          open={!!selectedNotification}
          onClose={closeNotificationDetails}
          maxWidth="sm"
          fullWidth={!isMobile}
          sx={{
            "& .MuiDialog-paper": {
              margin: isMobile ? 2 : "auto",
              maxHeight: "80vh",
              padding: isMobile ? 2 : 3,
            },
          }}
        >
          <DialogTitle>{selectedNotification.title}</DialogTitle>
          <DialogContent>
            <Typography variant="body1">{selectedNotification.content}</Typography>
            <Typography
              variant="caption"
              color="textSecondary"
              display="block"
              sx={{ mt: 2 }}
            >
              Gönderim Tarihi:{" "}
              {new Date(selectedNotification.created_at).toLocaleString()}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeNotificationDetails} color="primary">
              Kapat
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default NotificationsContent;
