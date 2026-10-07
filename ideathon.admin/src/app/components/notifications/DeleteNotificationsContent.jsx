"use client";
import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Stack,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress,
} from "@mui/material";
import { Delete, ExpandMore } from "@mui/icons-material";
import { NotificationsActive } from "@mui/icons-material";
import { fetchNotifications, deleteNotification } from "@/services/notificationService";
import { toast } from "react-toastify";

const DeleteNotificationsContent = () => {
    const [notifications, setNotifications] = useState([]);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const handleDelete = async () => {
        if (!selectedNotification) return;
        setLoading(true);
        try {
            await deleteNotification(selectedNotification._id);
            toast.success("Bildirim başarıyla silindi!");
            getNotifications();
            setSelectedNotification(null);
        } catch (error) {
            toast.error("Bildirim silinemedi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Button
                variant="contained"
                startIcon={<NotificationsActive />} // İkon eklendi
                color="secondary" // Daha şık bir renk
                fullWidth
                onClick={() => setIsModalOpen(true)}
                sx={{
                    mb: 2,
                    py: 2, // Yüksekliği artırmak için padding ekledik
                    fontSize: "16px", // Font boyutu daha belirgin
                    fontWeight: "bold", // Kalın yazı
                    borderRadius: "12px", // Daha yumuşak köşeler
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)", // Hafif gölge efekti
                    "&:hover": {
                        backgroundColor: "secondary.dark", // Hover durumunda koyu renk
                        boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)", // Hover durumunda daha belirgin gölge
                    },
                }}
            >
                Oluşturulan Bildirimleri Görüntüle
            </Button>


            {/* Bildirim Modal */}
            <Dialog
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                fullWidth
                maxWidth="md"
                sx={{
                    "& .MuiDialog-paper": {
                        borderRadius: 3,
                    },
                }}
            >
                <DialogTitle>Bildirimler</DialogTitle>
                <DialogContent
                    dividers
                    sx={{
                        maxHeight: "500px", // Maksimum 500px yüksekliğe kadar görünür, sonrası kaydırılabilir
                        overflowY: "auto", // Dikey kaydırmayı etkinleştirir
                    }}
                >
                    {notifications.length === 0 ? (
                        <Typography color="textSecondary">
                            Henüz bildirim bulunmamaktadır.
                        </Typography>
                    ) : (
                        <Stack spacing={2}>
                            {notifications.map((notification) => (
                                <Accordion key={notification._id}>
                                    <AccordionSummary
                                        expandIcon={<ExpandMore />}
                                        sx={{
                                            backgroundColor: "grey.100",
                                            borderRadius: 1,
                                            "& .MuiAccordionSummary-content": {
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            },
                                        }}
                                    >
                                        <Typography variant="subtitle1" noWrap sx={{ maxWidth: "70%" }}>
                                            {notification.title}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography variant="body2" sx={{ mb: 2 }}>
                                            {notification.content}
                                        </Typography>
                                        <Box textAlign="right">
                                            <Button
                                                color="error"
                                                startIcon={<Delete />}
                                                onClick={() => setSelectedNotification(notification)}
                                            >
                                                Sil
                                            </Button>
                                        </Box>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Stack>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setIsModalOpen(false)} color="primary">
                        Kapat
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Silme Onay Modal */}
            <Dialog open={!!selectedNotification} onClose={() => setSelectedNotification(null)}>
                <DialogTitle>Bildirim Sil</DialogTitle>
                <DialogContent>
                    <Typography>Bu bildirimi silmek istediğinizden emin misiniz?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedNotification(null)} color="primary">
                        İptal
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        disabled={loading}
                        startIcon={loading && <CircularProgress size={20} />}
                    >
                        {loading ? "Siliniyor..." : "Sil"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DeleteNotificationsContent;
