"use client";
import React, { useState, useEffect } from "react";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Scrollbar from "@/app/components/custom-scroll/Scrollbar";
import { NotificationsActive, Done } from "@mui/icons-material";
import { Stack } from "@mui/system";
import Link from "next/link";
import { fetchNotifications, markNotificationAsRead } from "@/services/notificationService";
import { toast } from "react-toastify";

const Notifications = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // LocalStorage'dan user bilgilerini al
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id; // Kullanıcı ID'si

  const isRead = (notification) => {
    if (!notification.is_read_by || notification.is_read_by.length === 0) {
      return false; // Eğer okunmamışsa
    }
    return notification.is_read_by.some(
      (read) => read.user_id === userId
    );
  };

  const getNotifications = async () => {
    const token = localStorage.getItem("token");
  
    if (!token) {
      return;
    }
  
    try {
      const data = await fetchNotifications();
      setNotifications(data.data);
      setUnreadCount(data.data.filter((notif) => !isRead(notif)).length);
    } catch (error) {
      console.error("Bildirimler yüklenirken hata:", error);
    }
  };
  

  useEffect(() => {
    getNotifications();
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (id) => {
    try {
      const response = await markNotificationAsRead(id);
      if (response.success && response.message === "Bildirim zaten okundu olarak işaretlenmiş.") {
        toast.info("Bildirim zaten okundu.");
      } else {
        toast.success("Bildirim okundu olarak işaretlendi!");
      }
      getNotifications(); // 🔄 API'den güncel veriyi tekrar çek
    } catch (error) {
      console.error("Bildirim okundu işaretlenirken hata:", error);
      toast.error("Bildirim işaretlenemedi.");
    }
  };

  return (
    <Box>
      <IconButton
        size="large"
        aria-label={`show ${unreadCount} new notifications`}
        color="inherit"
        aria-controls="notification-menu"
        aria-haspopup="true"
        sx={{ color: anchorEl ? "primary.main" : "text.secondary" }}
        onClick={handleClick}
      >
        <Badge badgeContent={unreadCount} color="primary">
          <NotificationsActive fontSize="small" />
        </Badge>
      </IconButton>
      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{ "& .MuiMenu-paper": { width: "360px" } }}
      >
        <Stack direction="row" sx={{ py: 2, px: 4, justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Bildirimler</Typography>
          <Chip label={`${unreadCount} yeni`} color="primary" size="small" />
        </Stack>
        <Scrollbar sx={{ height: "385px" }}>
          {notifications.map((notification) => (
            <MenuItem key={notification._id} sx={{ py: 2, px: 4 }}>
              <Stack direction="row" spacing={2}>
                <Avatar sx={{ bgcolor: "primary.light", color: "primary.main", width: 48, height: 48 }}>
                  {notification.title.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="textPrimary" noWrap sx={{ fontWeight: 600, width: "180px" }}>
                    {notification.title}
                  </Typography>
                  <Typography color="textSecondary" variant="subtitle2" noWrap sx={{ width: "180px" }}>
                    {notification.content}
                  </Typography>
                </Box>
              </Stack>
              <IconButton
                onClick={() => !isRead(notification) && handleMarkAsRead(notification._id)}
                color={isRead(notification) ? "success" : "primary"}
                size="small"
                sx={{ ml: "auto" }}
                disabled={isRead(notification)}
              >
                {isRead(notification) ? <Done fontSize="small" /> : <NotificationsActive fontSize="small" />}
              </IconButton>
            </MenuItem>
          ))}
        </Scrollbar>
        <Box sx={{ p: 3, pb: 1 }}>
          <Button href="/notifications" variant="outlined" component={Link} color="primary" fullWidth>
            Tüm Bildirimleri Gör
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Notifications;
