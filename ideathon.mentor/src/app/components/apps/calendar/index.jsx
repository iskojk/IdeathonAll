"use client";
import React, { useContext, useState } from "react";
import { CalendarContext } from "@/app/context/CalendarContext";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    Fab,
    Stack,
    MenuItem,
    Card
} from "@mui/material";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { tr } from "date-fns/locale";
import moment from "moment";
import "moment/locale/tr";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./Calendar.css";
import { toast } from "react-toastify";
import { IconCheck } from "@tabler/icons-react";

moment.locale("tr");
const localizer = momentLocalizer(moment);

const ColorVariation = [
    { id: 1, eColor: "#1a97f5", value: "default" },
    { id: 2, eColor: "#39b69a", value: "green" },
    { id: 3, eColor: "#fc4b6c", value: "red" },
    { id: 4, eColor: "#615dff", value: "azure" },
    { id: 5, eColor: "#fdd43f", value: "warning" },
];

const CalendarPage = () => {
    const { events, addEvent, updateEvent, deleteEvent } = useContext(CalendarContext);

    const [open, setOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;
    const userRole = user?.role;

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: new Date(),
        start_time: "",
        end_time: "",
        location: "",
        color: "default",
        visibility: "public",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleDateChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleColorChange = (value) => {
        setFormData({ ...formData, color: value });
    };

    const handleSave = async () => {
        if (!formData.title || !formData.start_time || !formData.end_time) {
            toast.error("Lütfen tüm zorunlu alanları doldurun!");
            return;
        }

        const created_by = userId;
        if (!created_by) {
            toast.error("Kullanıcı bilgisi alınamadı!");
            return;
        }

        const eventData = { ...formData, created_by };

        try {
            if (editMode) {
                await updateEvent(selectedEvent._id, eventData);
            } else {
                await addEvent(eventData);
            }
            setOpen(false);
            resetForm();
        } catch (error) {
            toast.error("Etkinlik işlemi sırasında bir hata oluştu!");
        }
    };

    const handleEdit = (event) => {
        resetForm();
        if (event.created_by !== userId && userRole !== "admin") {
            setSelectedEvent(event);
            setDetailModalOpen(true);
            return;
        }

        setEditMode(true);
        setSelectedEvent(event);
        setFormData({
            title: event.title,
            description: event.description,
            date: new Date(event.date),
            start_time: event.start_time,
            end_time: event.end_time,
            location: event.location,
            color: event.color,
            visibility: event.visibility,
        });
        setOpen(true);
    };

    const handleDelete = async () => {
        await deleteEvent(selectedEvent._id);
        setOpen(false);
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            date: new Date(),
            start_time: "",
            end_time: "",
            location: "",
            color: "default",
            visibility: "public",
        });
        setEditMode(false);
        setSelectedEvent(null);
    };

    return (
        <>
            <Card>

                <Calendar
                    selectable
                    events={events}
                    localizer={localizer}
                    defaultView="month"
                    onSelectEvent={handleEdit}
                    onSelectSlot={({ start }) => {
                        resetForm();
                        setFormData({ ...formData, date: start });
                        setOpen(true);
                    }}
                    eventPropGetter={(event) => ({
                        className: `event-${event.color || "default"}`,
                    })}
                    messages={{
                        today: "Bugün",
                        previous: "Geri",
                        next: "İleri",
                        month: "Ay",
                        week: "Hafta",
                        day: "Gün",
                        agenda: "Ajanda",
                        date: "Tarih",
                        time: "Saat",
                        event: "Etkinlik",
                        allDay: "Tüm Gün",
                        weekViewTitle: "Haftalık Görünüm",
                        dayViewTitle: "Günlük Görünüm",
                        monthViewTitle: "Aylık Görünüm",
                        noEventsInRange: "Bu aralıkta etkinlik yok.",
                        showMore: (count) => `+${count} daha`,
                    }}
                    style={{ height: "calc(100vh - 200px)" }}
                />


                {/* Etkinlik Detayları Modalı */}
                <Dialog
                    open={detailModalOpen}
                    onClose={() => setDetailModalOpen(false)}
                    fullWidth
                    maxWidth="sm"
                    PaperProps={{
                        style: {
                            borderRadius: "15px",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            backgroundColor: "#1a97f5",
                            color: "white",
                            textAlign: "center",
                            fontWeight: "bold",
                            fontSize: "1.5rem",
                            borderTopLeftRadius: "15px",
                            borderTopRightRadius: "15px",
                        }}
                    >
                        Etkinlik Detayları
                    </DialogTitle>
                    <DialogContent sx={{ padding: "20px 30px", backgroundColor: "#f9f9f9" }}>
                        <Typography
                            variant="h5"
                            sx={{ fontWeight: "bold", textAlign: "center", color: "#333", mb: 2 }}
                        >
                            {selectedEvent?.title}
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                backgroundColor: "#eaf7ff",
                                padding: "10px",
                                borderRadius: "8px",
                                mb: 2,
                                boxShadow: "inset 0 1px 4px rgba(0, 0, 0, 0.1)",
                                fontWeight: "bold",
                            }}
                        >
                            {selectedEvent?.description || "Açıklama Yok"}
                        </Typography>
                        <Stack
                            direction="row"
                            spacing={2}
                            sx={{
                                justifyContent: "space-between",
                                alignItems: "center",
                                backgroundColor: "white",
                                padding: "10px",
                                borderRadius: "8px",
                                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
                                mb: 2,
                            }}
                        >
                            <Typography variant="body1" sx={{ fontWeight: "bold", color: "#555" }}>
                                Tarih:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: "bold", color: "#1a97f5" }}>
                                {moment(selectedEvent?.date).format("DD MMMM YYYY")}
                            </Typography>
                        </Stack>
                        <Stack
                            direction="row"
                            spacing={2}
                            sx={{
                                justifyContent: "space-between",
                                alignItems: "center",
                                backgroundColor: "white",
                                padding: "10px",
                                borderRadius: "8px",
                                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
                                mb: 2,
                            }}
                        >
                            <Typography variant="body1" sx={{ fontWeight: "bold", color: "#555" }}>
                                Saat:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: "bold", color: "#1a97f5" }}>
                                {selectedEvent?.start_time} - {selectedEvent?.end_time}
                            </Typography>
                        </Stack>
                        <Stack
                            direction="row"
                            spacing={2}
                            sx={{
                                justifyContent: "space-between",
                                alignItems: "center",
                                backgroundColor: "white",
                                padding: "10px",
                                borderRadius: "8px",
                                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
                                mb: 2,
                            }}
                        >
                            <Typography variant="body1" sx={{ fontWeight: "bold", color: "#555" }}>
                                Konum:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: "bold", color: "#1a97f5" }}>
                                {selectedEvent?.location || "Belirtilmemiş"}
                            </Typography>
                        </Stack>
                    </DialogContent>
                    <DialogActions
                        sx={{
                            padding: "10px 20px",
                            justifyContent: "center",
                            backgroundColor: "#f9f9f9",
                            borderBottomLeftRadius: "15px",
                            borderBottomRightRadius: "15px",
                        }}
                    >
                        <Button
                            onClick={() => setDetailModalOpen(false)}
                            sx={{
                                backgroundColor: "#1a97f5",
                                color: "white",
                                textTransform: "none",
                                padding: "8px 20px",
                                borderRadius: "20px",
                                "&:hover": {
                                    backgroundColor: "#006bb3",
                                },
                            }}
                        >
                            Kapat
                        </Button>
                    </DialogActions>
                </Dialog>


                {/* Etkinlik Ekle/Güncelle Modalı */}
                <Dialog open={open}  onClose={() => {
                    setOpen(false);
                    resetForm();
                }} fullWidth maxWidth="sm" >
                    <DialogTitle >{editMode ? "Etkinliği Düzenle" : "Yeni Etkinlik Ekle"}</DialogTitle>
                    <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1, py: 4, mt: 2 }}>
                        <TextField
                            label="Başlık"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            label="Açıklama"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            fullWidth
                            multiline
                            rows={3}
                            sx={{ mb: 2 }}
                        />
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                            <DatePicker
                                label="Tarih"
                                value={formData.date}
                                onChange={(value) => handleDateChange("date", value)}
                                slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
                            />
                        </LocalizationProvider>
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                            <TextField
                                label="Başlangıç Saati"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleInputChange}
                                fullWidth
                            />
                            <TextField
                                label="Bitiş Saati"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleInputChange}
                                fullWidth
                            />
                        </Stack>
                        <TextField
                            label="Konum"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            fullWidth
                            sx={{ mb: 2 }}
                        />
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            Renk Seçimi
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                            {ColorVariation.map((color) => (
                                <Fab
                                    key={color.id}
                                    sx={{
                                        backgroundColor: color.eColor,
                                        transform: formData.color === color.value ? "scale(1.1)" : "scale(1)",
                                        height: 30,
                                        width: 30,
                                    }}
                                    onClick={() => handleColorChange(color.value)}
                                >
                                    {formData.color === color.value && <IconCheck />}
                                </Fab>
                            ))}
                        </Stack>
                        <TextField
                            select
                            label="Görünürlük"
                            name="visibility"
                            value={formData.visibility}
                            onChange={handleInputChange}
                            fullWidth
                        >
                            <MenuItem value="public">Herkese Açık</MenuItem>
                            <MenuItem value="private">Özel</MenuItem>
                        </TextField>
                    </DialogContent>
                    <DialogActions>
                        {editMode && (
                            <Button onClick={handleDelete} color="error" variant="outlined">
                                Sil
                            </Button>
                        )}
                        <Button onClick={() => setOpen(false)}>İptal</Button>
                        <Button onClick={handleSave} variant="contained">
                            {editMode ? "Güncelle" : "Ekle"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Card>

        </>
    );
};

export default CalendarPage;
