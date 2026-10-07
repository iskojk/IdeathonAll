"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Stack,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Tooltip,
  Switch,
  FormControlLabel,
  Autocomplete,
} from "@mui/material";
import {
  IconCalendar,
  IconClock,
  IconPlus,
  IconTrash,
  IconEdit,
  IconCheck,
  IconX,
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconAlertCircle,
} from "@tabler/icons-react";
import { toast } from "react-toastify";
import {
  getMyAvailabilityRules,
  createAvailabilityRule,
  updateAvailabilityRule,
  deleteAvailabilityRule,
  getMySlots,
  deleteSlot,
  createManualSlot,
  getMyAssignedUsers,
} from "@/utils/api/mentor";
import { getIntegrations } from "@/utils/api/integration";
import { getStatusLabel, getSlotColor } from "@/utils/statusHelpers";
import PlanMeetingDialog from "./PlanMeetingDialog";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  addWeeks, 
  parseISO, 
  addDays,
  isSameDay,
  isToday,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  getDay,
  eachDayOfInterval,
  isSameMonth,
  isPast,
  isFuture,
} from "date-fns";
import { tr } from "date-fns/locale";

const DAYS_OF_WEEK = [
  { value: 0, label: "Pazar" },
  { value: 1, label: "Pazartesi" },
  { value: 2, label: "Salı" },
  { value: 3, label: "Çarşamba" },
  { value: 4, label: "Perşembe" },
  { value: 5, label: "Cuma" },
  { value: 6, label: "Cumartesi" },
];

const MEETING_DURATIONS = [
  { value: 15, label: "15 dakika" },
  { value: 25, label: "25 dakika" },
  { value: 30, label: "30 dakika" },
  { value: 45, label: "45 dakika" },
  { value: 60, label: "60 dakika" },
  { value: 90, label: "90 dakika" },
  { value: 120, label: "120 dakika" },
];

const BREAK_TIMES = [
  { value: 0, label: "Mola Yok" },
  { value: 5, label: "5 dakika" },
  { value: 10, label: "10 dakika" },
  { value: 15, label: "15 dakika" },
  { value: 30, label: "30 dakika" },
];

// Base meeting types - dinamik provider listesi useEffect'te eklenecek
// "auto" seçeneği kaldırıldı - artık zorunlu olarak platf orm seçilecek
const BASE_MEETING_TYPES = [
  { value: "google-meet", label: "Google Meet", requiresIntegration: true, provider: "google" },
  { value: "jitsi", label: "Jitsi Meet" },
  { value: "private", label: "Özel Konum" },
];

// Saat ve dakika seçenekleri
const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: String(i).padStart(2, '0')
}));

const MINUTES = Array.from({ length: 60 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: String(i).padStart(2, '0')
}));

// Saat string'ini saat ve dakikaya ayır
const parseTime = (timeString) => {
  const [hour, minute] = timeString.split(':');
  return { hour, minute };
};

// Saat ve dakikayı birleştir
const combineTime = (hour, minute) => {
  return `${hour}:${minute}`;
};

// Seçilen tarih bugünse ve saat geçmişse true döner
const isPastTime = (selectedDate, hour, minute) => {
  const today = format(new Date(), "yyyy-MM-dd");
  
  // Seçilen tarih bugün değilse, geçmiş değildir
  if (selectedDate !== today) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  const selectedHour = parseInt(hour, 10);
  const selectedMinute = parseInt(minute, 10);
  
  // Saat geçmişse
  if (selectedHour < currentHour) return true;
  
  // Saat aynı ama dakika geçmişse
  if (selectedHour === currentHour && selectedMinute < currentMinute) return true;
  
  return false;
};

const MentorAvailabilityView = () => {
  const [tabValue, setTabValue] = useState(0);
  const [rules, setRules] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [slotToDelete, setSlotToDelete] = useState(null);
  const [slotDeleteDialogOpen, setSlotDeleteDialogOpen] = useState(false);
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [meetingTypes, setMeetingTypes] = useState(BASE_MEETING_TYPES);

  // Form state
  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    startTime: "14:00",
    endTime: "17:00",
    startHour: "14",
    startMinute: "00",
    endHour: "17",
    endMinute: "00",
    meetingDuration: 30,
    breakTime: 0,
    meetingType: "jitsi", // Default olarak jitsi (auto kaldırıldı)
    customLocation: "",
    notes: "",
  });

  // Calendar state
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotDetailDialog, setSlotDetailDialog] = useState(false);
  const [manualSlotDialog, setManualSlotDialog] = useState(false);
  const [manualSlotData, setManualSlotData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "14:00",
    endTime: "14:30",
    startHour: "14",
    startMinute: "00",
    endHour: "14",
    endMinute: "30",
    meetingType: "jitsi", // Default olarak jitsi (auto kaldırıldı)
    customLocation: "",
    notes: "",
  });

  // Monthly calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlySlots, setMonthlySlots] = useState([]);
  const [loadingMonthlySlots, setLoadingMonthlySlots] = useState(false);

  // Plan meeting dialog state
  const [planMeetingDialogOpen, setPlanMeetingDialogOpen] = useState(false);
  const [planMeetingSlot, setPlanMeetingSlot] = useState(null);

  // Assigned users for manual slot participant selection
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loadingAssignedUsers, setLoadingAssignedUsers] = useState(false);
  const [manualSlotParticipant, setManualSlotParticipant] = useState(null);

  useEffect(() => {
    loadRules();
    loadIntegrations();
    loadAssignedUsers();
  }, []);

  const loadAssignedUsers = async () => {
    setLoadingAssignedUsers(true);
    try {
      const response = await getMyAssignedUsers();
      if (response.success) {
        setAssignedUsers(response.data || []);
      }
    } catch (error) {
    } finally {
      setLoadingAssignedUsers(false);
    }
  };

  const handleOpenPlanMeetingDialog = (slot) => {
    setPlanMeetingSlot(slot);
    setPlanMeetingDialogOpen(true);
    setSlotDetailDialog(false);
  };

  const handlePlanMeetingSuccess = () => {
    loadSlots();
    loadMonthlySlots();
  };

  // Entegrasyonları yükle ve meeting types listesini güncelle
  const loadIntegrations = async () => {
    try {
      const response = await getIntegrations();
      if (response.success) {
        const connectedIntegrations = response.data || [];
        setIntegrations(connectedIntegrations);

        // Bağlı provider'ları filtrele (status: connected)
        const connectedProviders = connectedIntegrations
          .filter((i) => i.status === "connected")
          .map((i) => i.provider);

        // Meeting types listesini güncelle (sadece bağlı olanları göster)
        const availableTypes = BASE_MEETING_TYPES.filter((type) => {
          // Entegrasyon gerektirmeyen (auto, jitsi, private) her zaman göster
          if (!type.requiresIntegration) return true;
          
          return connectedProviders.includes(type.provider || type.value);
        });

        setMeetingTypes(availableTypes);
      }
    } catch (error) {
      // Hata durumunda sadece auto, jitsi ve private göster
      setMeetingTypes(BASE_MEETING_TYPES.filter((t) => !t.requiresIntegration));
    }
  };

  useEffect(() => {
    if (tabValue === 1) {
      loadSlots();
    }
  }, [tabValue, currentWeek, includeCancelled]);

  useEffect(() => {
    loadMonthlySlots();
  }, [currentMonth, includeCancelled]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const response = await getMyAvailabilityRules();
      if (response.success) {
        setRules(response.data || []);
      } else {
        toast.error("Kurallar yüklenirken hata oluştu");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Kurallar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    setLoadingSlots(true);
    try {
      const weekStart = startOfWeek(currentWeek, { locale: tr, weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { locale: tr, weekStartsOn: 1 });

      const params = {
        fromDate: format(weekStart, "yyyy-MM-dd"),
        toDate: format(weekEnd, "yyyy-MM-dd"),
      };

      if (includeCancelled) {
        params.includeCancelled = 'true';
      }

      const response = await getMySlots(params);

      if (response.success) {
        setSlots(response.data || []);
      } else {
        toast.error("Randevu saatleri yüklenirken hata oluştu");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Randevu saatleri yüklenirken hata oluştu");
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadMonthlySlots = async () => {
    setLoadingMonthlySlots(true);
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const params = {
        fromDate: format(monthStart, "yyyy-MM-dd"),
        toDate: format(monthEnd, "yyyy-MM-dd"),
      };

      if (includeCancelled) {
        params.includeCancelled = 'true';
      }

      const response = await getMySlots(params);

      if (response.success) {
        setMonthlySlots(response.data || []);
      }
    } catch (error) {
    } finally {
      setLoadingMonthlySlots(false);
    }
  };

  const handleOpenDialog = (rule = null) => {
    if (rule) {
      const startParsed = parseTime(rule.startTime);
      const endParsed = parseTime(rule.endTime);
      
      setEditingRule(rule);
      setFormData({
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        startHour: startParsed.hour,
        startMinute: startParsed.minute,
        endHour: endParsed.hour,
        endMinute: endParsed.minute,
        meetingDuration: rule.meetingDuration,
        breakTime: rule.breakTime || 0,
        meetingType: rule.meetingType || "jitsi",
        customLocation: rule.customLocation || "",
        notes: rule.notes || "",
      });
    } else {
      setEditingRule(null);
      setFormData({
        dayOfWeek: 1,
        startTime: "14:00",
        endTime: "17:00",
        startHour: "14",
        startMinute: "00",
        endHour: "17",
        endMinute: "00",
        meetingDuration: 30,
        breakTime: 0,
        meetingType: "jitsi", // Default olarak jitsi (auto kaldırıldı)
        customLocation: "",
        notes: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRule(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Saat veya dakika değiştiğinde time string'ini güncelle
    let updates = { [name]: value };
    
    if (name === 'startHour' || name === 'startMinute') {
      const hour = name === 'startHour' ? value : formData.startHour;
      const minute = name === 'startMinute' ? value : formData.startMinute;
      updates.startTime = combineTime(hour, minute);
    }
    
    if (name === 'endHour' || name === 'endMinute') {
      const hour = name === 'endHour' ? value : formData.endHour;
      const minute = name === 'endMinute' ? value : formData.endMinute;
      updates.endTime = combineTime(hour, minute);
    }
    
    setFormData((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleSaveRule = async () => {
    // Validation: meetingType zorunlu
    if (!formData.meetingType || formData.meetingType === "") {
      toast.error("Toplantı şekli seçilmelidir!");
      return;
    }

    // Validation: meetingType="private" ise customLocation zorunlu
    if (formData.meetingType === "private" && !formData.customLocation?.trim()) {
      toast.error("Özel konum seçildiğinde konum/link bilgisi zorunludur!");
      return;
    }

    // Validation: Saat kontrolü
    if (formData.endTime <= formData.startTime) {
      toast.error("Bitiş saati başlangıç saatinden sonra olmalıdır!");
      return;
    }

    try {
      // customLocation boşsa null gönder
      const payload = {
        ...formData,
        customLocation: formData.customLocation?.trim() || null,
        notes: formData.notes?.trim() || null,
      };

      if (editingRule) {
        const response = await updateAvailabilityRule(editingRule._id, payload);
        if (response.success) {
          // Response'daki bilgileri kullan
          const { cancelledSlotsCount = 0, generatedSlotsCount = 0 } = response;
          
          let message = "Kural başarıyla güncellendi";
          if (cancelledSlotsCount > 0 && generatedSlotsCount > 0) {
            message = `Kural güncellendi: ${cancelledSlotsCount} randevu saati iptal edildi, ${generatedSlotsCount} yeni randevu saati oluşturuldu`;
          } else if (cancelledSlotsCount > 0) {
            message = `Kural güncellendi ve ${cancelledSlotsCount} randevu saati iptal edildi`;
          } else if (generatedSlotsCount > 0) {
            message = `Kural güncellendi ve ${generatedSlotsCount} yeni randevu saati oluşturuldu`;
          }
          
          toast.success(message);
          loadRules();
          loadSlots();
          loadMonthlySlots();
          handleCloseDialog();
        }
      } else {
        const response = await createAvailabilityRule(payload);
        if (response.success) {
          const slotsCount = response.data?.generatedSlotsCount || response.generatedSlotsCount || 0;
          toast.success(
            `Kural oluşturuldu ve ${slotsCount} randevu saati üretildi`
          );
          loadRules();
          loadSlots();
          loadMonthlySlots();
          handleCloseDialog();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "İşlem başarısız");
    }
  };

  const handleOpenDeleteDialog = (rule) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRuleToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;

    try {
      const response = await deleteAvailabilityRule(ruleToDelete._id);
      if (response.success) {
        toast.success(
          `Kural silindi. ${response.deletedSlotsCount} randevu saati kaldırıldı.`
        );
        loadRules();
        loadSlots();
        loadMonthlySlots(); // Aylık takvimi de güncelle
        handleCloseDeleteDialog();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Kural silinemedi");
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      const response = await updateAvailabilityRule(rule._id, {
        isActive: !rule.isActive,
      });
      if (response.success) {
        const { cancelledSlotsCount = 0, generatedSlotsCount = 0 } = response;
        
        let message = rule.isActive ? "Kural pasif edildi" : "Kural aktif edildi";
        if (cancelledSlotsCount > 0) {
          message += ` ve ${cancelledSlotsCount} randevu saati iptal edildi`;
        } else if (generatedSlotsCount > 0) {
          message += ` ve ${generatedSlotsCount} randevu saati oluşturuldu`;
        }
        
        toast.success(message);
        loadRules();
        loadSlots();
        loadMonthlySlots();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "İşlem başarısız");
    }
  };

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setSlotDetailDialog(true);
  };

  const handleOpenSlotDeleteDialog = (slot) => {
    setSlotToDelete(slot);
    setSlotDeleteDialogOpen(true);
    setSlotDetailDialog(false); // Detay modalını kapat
  };

  const handleCloseSlotDeleteDialog = () => {
    setSlotDeleteDialogOpen(false);
    setSlotToDelete(null);
  };

  const handleConfirmSlotDelete = async () => {
    if (!slotToDelete) return;

    try {
      const response = await deleteSlot(slotToDelete._id);
      if (response.success) {
        toast.success("Randevu saati başarıyla silindi");
        loadSlots();
        loadMonthlySlots(); // Aylık takvimi de güncelle
        handleCloseSlotDeleteDialog();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Randevu saati silinemedi");
    }
  };

  const handleOpenManualSlotDialog = (selectedDate = null) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = selectedDate ? new Date(selectedDate) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    const dateToUse = targetDate < today ? today : targetDate;
    
    setManualSlotData({
      date: format(dateToUse, "yyyy-MM-dd"),
      startTime: "14:00",
      endTime: "14:30",
      startHour: "14",
      startMinute: "00",
      endHour: "14",
      endMinute: "30",
      meetingType: "jitsi",
      customLocation: "",
      notes: "",
    });
    setManualSlotParticipant(null);
    setManualSlotDialog(true);
  };

  const handleCloseManualSlotDialog = () => {
    setManualSlotDialog(false);
    // Form verilerini sıfırla
    setManualSlotData({
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "14:00",
      endTime: "14:30",
      startHour: "14",
      startMinute: "00",
      endHour: "14",
      endMinute: "30",
      meetingType: "jitsi", // Default olarak jitsi (auto kaldırıldı)
      customLocation: "",
      notes: "",
    });
  };

  const handleManualSlotChange = (field, value) => {
    let updates = { [field]: value };
    
    // Saat veya dakika değiştiğinde time string'ini güncelle
    if (field === 'startHour' || field === 'startMinute') {
      const hour = field === 'startHour' ? value : manualSlotData.startHour;
      const minute = field === 'startMinute' ? value : manualSlotData.startMinute;
      updates.startTime = combineTime(hour, minute);
    }
    
    if (field === 'endHour' || field === 'endMinute') {
      const hour = field === 'endHour' ? value : manualSlotData.endHour;
      const minute = field === 'endMinute' ? value : manualSlotData.endMinute;
      updates.endTime = combineTime(hour, minute);
    }
    
    setManualSlotData((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleCreateManualSlot = async () => {
    if (!manualSlotData.meetingType || manualSlotData.meetingType === "") {
      toast.error("Toplantı şekli seçilmelidir!");
      return;
    }

    if (manualSlotData.meetingType === "private" && !manualSlotData.customLocation?.trim()) {
      toast.error("Özel konum seçildiğinde konum/link bilgisi zorunludur!");
      return;
    }

    if (manualSlotData.endTime <= manualSlotData.startTime) {
      toast.error("Bitiş saati başlangıç saatinden sonra olmalıdır!");
      return;
    }

    try {
      const startAt = new Date(`${manualSlotData.date}T${manualSlotData.startTime}:00+03:00`).toISOString();
      const endAt = new Date(`${manualSlotData.date}T${manualSlotData.endTime}:00+03:00`).toISOString();

      const payload = {
        startAt,
        endAt,
        meetingType: manualSlotData.meetingType,
        customLocation: manualSlotData.customLocation?.trim() || null,
        notes: manualSlotData.notes?.trim() || null,
        timezone: "Europe/Istanbul",
      };

      if (manualSlotParticipant) {
        payload.participantUserId = manualSlotParticipant._id;
        if (manualSlotParticipant.applicationId) {
          payload.participantApplicationId = manualSlotParticipant.applicationId;
        }
        if (manualSlotParticipant.teamId) {
          payload.teamId = manualSlotParticipant.teamId;
        }
      }

      const response = await createManualSlot(payload);
      if (response.success) {
        if (response.meeting) {
          toast.success(`Randevu saati oluşturuldu ve ${manualSlotParticipant.name} ile toplantı planlandı`);
        } else {
          toast.success("Randevu saati başarıyla oluşturuldu");
        }
        loadSlots();
        loadMonthlySlots();
        handleCloseManualSlotDialog();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Randevu saati oluşturulamadı");
    }
  };

  const getSlotStatusColor = (status) => {
    switch (status) {
      case "open":
        return { bg: "#E8F5E9", color: "#2E7D32", border: "#2E7D32" };
      case "booked":
        return { bg: "#FFEBEE", color: "#C62828", border: "#C62828" };
      case "completed":
        return { bg: "#F3E5F5", color: "#7B1FA2", border: "#7B1FA2" }; // Mor/Purple
      case "cancelled":
        return { bg: "#F5F5F5", color: "#757575", border: "#757575" };
      default:
        return { bg: "#F5F5F5", color: "#757575", border: "#757575" };
    }
  };

  const getSlotStatusLabel = (status) => {
    return getStatusLabel(status);
  };

  // Takvim için günlük slots
  const getWeekDays = () => {
    const weekStart = startOfWeek(currentWeek, { locale: tr, weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };

  const getSlotsForDay = (day) => {
    return slots.filter((slot) =>
      isSameDay(parseISO(slot.startAt), day)
    );
  };

  // Aylık takvim için helper fonksiyonlar
  const getMonthlySlotsForDay = (day) => {
    return monthlySlots.filter((slot) =>
      isSameDay(parseISO(slot.startAt), day)
    );
  };

  const getMonthDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Ayın ilk gününün haftanın hangi günü olduğunu bul (0 = Pazar)
    const startDayOfWeek = getDay(monthStart);
    
    // Pazartesi başlangıçlı yapmak için ayarlama (0 = Pazartesi)
    const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    // Önceki ayın son günlerini ekle
    const daysFromPrevMonth = [];
    for (let i = adjustedStartDay - 1; i >= 0; i--) {
      daysFromPrevMonth.push(addDays(monthStart, -i - 1));
    }
    
    // Mevcut ayın günleri
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Sonraki ayın ilk günlerini ekle (42 gün = 6 hafta)
    const totalDays = daysFromPrevMonth.length + daysInMonth.length;
    const daysNeeded = 42 - totalDays;
    const daysFromNextMonth = [];
    for (let i = 1; i <= daysNeeded; i++) {
      daysFromNextMonth.push(addDays(monthEnd, i));
    }
    
    return [...daysFromPrevMonth, ...daysInMonth, ...daysFromNextMonth];
  };

  // Aylık Takvim Render Komponenti
  const renderMonthlyCalendar = () => {
    const monthDays = getMonthDays();
    const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

    return (
      <Card sx={{ borderRadius: 2, border: "1px solid #E0E0E0" }}>
        <CardContent>
          <Stack spacing={2}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1}>
                <IconButton
                  size="small"
                  onClick={() => setCurrentMonth((prev) => addMonths(prev, -1))}
                  sx={{
                    border: "1px solid #005DAD",
                    color: "#005DAD",
                    "&:hover": {
                      bgcolor: "#E6F2FF",
                    },
                  }}
                >
                  <IconChevronLeft size={18} />
                </IconButton>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setCurrentMonth(new Date())}
                  sx={{
                    borderColor: "#005DAD",
                    color: "#005DAD",
                    minWidth: "140px",
                    "&:hover": {
                      borderColor: "#004080",
                      bgcolor: "#E6F2FF",
                    },
                  }}
                >
                  {format(currentMonth, "MMMM yyyy", { locale: tr })}
                </Button>
                <IconButton
                  size="small"
                  onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                  sx={{
                    border: "1px solid #005DAD",
                    color: "#005DAD",
                    "&:hover": {
                      bgcolor: "#E6F2FF",
                    },
                  }}
                >
                  <IconChevronRight size={18} />
                </IconButton>
              </Stack>
              
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#005DAD" }}>
                Aylık Görünüm
              </Typography>
            </Stack>

            <Divider />

            {loadingMonthlySlots ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={40} />
              </Box>
            ) : (
              <>
                {/* Haftanın Günleri */}
                <Grid container spacing={0.5}>
                  {weekDays.map((day, index) => (
                    <Grid item xs={12 / 7} key={index}>
                      <Box
                        sx={{
                          textAlign: "center",
                          py: 1,
                          fontWeight: 700,
                          color: "#005DAD",
                          bgcolor: "#E6F2FF",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="caption">{day}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* Takvim Grid */}
                <Grid container spacing={0.5}>
                  {monthDays.map((day, dayIndex) => {
                    const daySlots = getMonthlySlotsForDay(day);
                    const isCurrentDay = isToday(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isPastDay = isPast(day) && !isCurrentDay;

                    const openSlots = daySlots.filter((s) => s.status === "open").length;
                    const bookedSlots = daySlots.filter((s) => s.status === "booked").length;

                    return (
                      <Grid item xs={12 / 7} key={dayIndex}>
                        <Paper
                          onClick={() => {
                            // Geçmiş günlere tıklanamaz
                            if (isPastDay) return;
                            
                            if (daySlots.length > 0) {
                              // İlk slotu göster
                              handleSlotClick(daySlots[0]);
                            }
                          }}
                          sx={{
                            p: 1,
                            minHeight: 80,
                            cursor: isPastDay 
                              ? "not-allowed" 
                              : daySlots.length > 0 
                              ? "pointer" 
                              : "default",
                            borderRadius: 1,
                            border: isCurrentDay ? "2px solid #005DAD" : "1px solid #E0E0E0",
                            bgcolor: isCurrentDay
                              ? "#E6F2FF"
                              : !isCurrentMonth
                              ? "#FAFAFA"
                              : isPastDay
                              ? "#F5F5F5"
                              : "white",
                            opacity: !isCurrentMonth ? 0.5 : isPastDay ? 0.6 : 1,
                            transition: "all 0.2s ease",
                            "&:hover": isPastDay 
                              ? {} 
                              : daySlots.length > 0
                              ? {
                                  transform: "translateY(-2px)",
                                  boxShadow: 2,
                                }
                              : {},
                          }}
                        >
                          <Stack spacing={0.5}>
                            {/* Gün Numarası */}
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: isCurrentDay ? 700 : 600,
                                color: isCurrentDay ? "#005DAD" : "text.primary",
                                display: "block",
                                textAlign: "right",
                              }}
                            >
                              {format(day, "d")}
                            </Typography>

                            {/* Slot Göstergeleri */}
                            {daySlots.length > 0 && (
                              <Stack spacing={0.3}>
                                {openSlots > 0 && (
                                  <Box
                                    sx={{
                                      bgcolor: "#E8F5E9",
                                      borderRadius: 0.5,
                                      px: 0.5,
                                      py: 0.3,
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: "0.65rem",
                                        fontWeight: 600,
                                        color: "#2E7D32",
                                      }}
                                    >
                                      {openSlots} Müsait
                                    </Typography>
                                  </Box>
                                )}
                                {bookedSlots > 0 && (
                                  <Box
                                    sx={{
                                      bgcolor: "#FFEBEE",
                                      borderRadius: 0.5,
                                      px: 0.5,
                                      py: 0.3,
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: "0.65rem",
                                        fontWeight: 600,
                                        color: "#C62828",
                                      }}
                                    >
                                      {bookedSlots} Dolu
                                    </Typography>
                                  </Box>
                                )}
                              </Stack>
                            )}
                          </Stack>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Takvim Özeti */}
                <Paper sx={{ p: 2, bgcolor: "#F5F5F5", borderRadius: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Stack spacing={0.5} alignItems="center">
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#2E7D32" }}>
                          {monthlySlots.filter((s) => s.status === "open").length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Müsait 
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={4}>
                      <Stack spacing={0.5} alignItems="center">
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#C62828" }}>
                          {monthlySlots.filter((s) => s.status === "booked").length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Dolu 
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={4}>
                      <Stack spacing={0.5} alignItems="center">
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#005DAD" }}>
                          {monthlySlots.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Toplam 
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 2,
          background: "linear-gradient(135deg, #005DAD 0%, #004080 100%)",
          color: "white",
          boxShadow: "0 4px 12px rgba(0, 93, 173, 0.15)",
        }}
      >
        <CardContent sx={{ py: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.2)",
                borderRadius: 2,
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconCalendar size={40} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                Müsaitlik Yönetimi
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Haftalık müsaitliklerinizi yönetin
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
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
          <Tab label="Müsaitlik Kuralları" icon={<IconClock size={18} />} iconPosition="start" />
          <Tab label="Takvim Görünümü" icon={<IconCalendarEvent size={18} />} iconPosition="start" />
        </Tabs>
      </Card>

      {/* Tab Content: Kurallar */}
      {tabValue === 0 && (
        <Box>
          {/* Kural İstatistikleri */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: "2px solid #E6F2FF",
                  bgcolor: "#E6F2FF",
                }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      Toplam Kural
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#005DAD" }}>
                      {rules.length}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: "2px solid #E8F5E9",
                  bgcolor: "#E8F5E9",
                }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      Aktif Kurallar
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#2E7D32" }}>
                      {rules.filter((r) => r.isActive).length}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: "2px solid #F5F5F5",
                  bgcolor: "#F5F5F5",
                }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      Pasif Kurallar
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#757575" }}>
                      {rules.filter((r) => !r.isActive).length}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: "2px solid #E1F5FE",
                  bgcolor: "#E1F5FE",
                }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      Haftalık Günler
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#0277BD" }}>
                      {new Set(rules.filter((r) => r.isActive).map((r) => r.dayOfWeek)).size}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#005DAD" }}>
                  Haftalık Müsaitlikleriniz
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<IconPlus size={18} />}
                  onClick={() => handleOpenDialog()}
                  sx={{
                    bgcolor: "#005DAD",
                    "&:hover": {
                      bgcolor: "#004080",
                    },
                  }}
                >
                  Yeni Kural Ekle
                </Button>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              {rules.length === 0 ? (
                <Alert severity="info" icon={<IconAlertCircle />}>
                  Henüz müsaitlik kuralı eklemediniz. Yeni bir kural ekleyerek başlayın.
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {rules.map((rule) => (
                    <Grid item xs={12} md={6} lg={4} key={rule._id}>
                      <Paper
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          border: "2px solid",
                          borderColor: rule.isActive ? "#005DAD" : "#E0E0E0",
                          opacity: rule.isActive ? 1 : 0.6,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          },
                        }}
                      >
                        <Stack spacing={2}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" sx={{ fontWeight: 700, color: "#005DAD" }}>
                              {rule.dayOfWeekName}
                            </Typography>
                            <Chip
                              label={rule.isActive ? "Aktif" : "Pasif"}
                              size="small"
                              sx={{
                                bgcolor: rule.isActive ? "#E8F5E9" : "#F5F5F5",
                                color: rule.isActive ? "#2E7D32" : "#757575",
                                fontWeight: 600,
                              }}
                            />
                          </Stack>

                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <IconClock size={16} color="#005DAD" />
                              <Typography variant="body2" color="text.secondary">
                                <strong>{rule.timeRange || `${rule.startTime} - ${rule.endTime}`}</strong>
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <IconCalendarEvent size={16} color="#005DAD" />
                              <Typography variant="body2" color="text.secondary">
                                Toplantı: <strong>{rule.meetingDuration} dk</strong>
                                {rule.breakTime > 0 && (
                                  <span style={{ color: "#F57C00", marginLeft: 4 }}>
                                    (+{rule.breakTime} dk mola)
                                  </span>
                                )}
                              </Typography>
                            </Stack>
                            {rule.meetingType && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" color="text.secondary">
                                  <strong>{meetingTypes.find((t) => t.value === rule.meetingType)?.label || rule.meetingType}</strong>
                                </Typography>
                              </Stack>
                            )}
                            {rule.customLocation && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem", fontStyle: "italic" }}>
                                  {rule.customLocation}
                                </Typography>
                              </Stack>
                            )}
                            {rule.notes && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem", fontStyle: "italic" }}>
                                  {rule.notes}
                                </Typography>
                              </Stack>
                            )}
                            {rule.slotCount !== undefined && (
                              <Chip
                                label={`${rule.slotCount} slot/gün`}
                                size="small"
                                sx={{
                                  bgcolor: "#E1F5FE",
                                  color: "#0277BD",
                                  fontWeight: 600,
                                  fontSize: "0.7rem",
                                  height: 20,
                                  mt: 0.5,
                                }}
                              />
                            )}
                          </Stack>

                          <Divider />

                          <Stack direction="row" spacing={1} justifyContent="space-between">
                            <Stack direction="row" spacing={1}>
                              <Tooltip title={rule.isActive ? "Pasif Et" : "Aktif Et"}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleToggleActive(rule)}
                                  sx={{
                                    minWidth: 40,
                                    color: rule.isActive ? "#F57C00" : "#2E7D32",
                                    borderColor: rule.isActive ? "#F57C00" : "#2E7D32",
                                  }}
                                >
                                  {rule.isActive ? "Pasif" : "Aktif"}
                                </Button>
                              </Tooltip>
                              <Tooltip title="Düzenle">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(rule)}
                                  sx={{
                                    color: "#005DAD",
                                    "&:hover": {
                                      bgcolor: "#E6F2FF",
                                    },
                                  }}
                                >
                                  <IconEdit size={18} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                            <Tooltip title="Sil">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDeleteDialog(rule)}
                                sx={{
                                  color: "#C62828",
                                  "&:hover": {
                                    bgcolor: "#FFEBEE",
                                  },
                                }}
                              >
                                <IconTrash size={18} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Aylık Takvim - Sabit */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#005DAD", mb: 2 }}>
              Aylık Takvim Görünümü
            </Typography>
            {renderMonthlyCalendar()}
          </Box>
        </Box>
      )}

      {/* Tab Content: Takvim */}
      {tabValue === 1 && (
        <Box>
          {/* Slot İstatistikleri */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: "2px solid #E8F5E9",
                  bgcolor: "#E8F5E9",
                }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      Müsaitlikler
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#2E7D32" }}>
                      {slots.filter((s) => s.status === "open").length}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: "2px solid #FFEBEE",
                  bgcolor: "#FFEBEE",
                }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      Dolu
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#C62828" }}>
                      {slots.filter((s) => s.status === "booked").length}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: "2px solid #F5F5F5",
                  bgcolor: "#F5F5F5",
                }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      Toplam
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#757575" }}>
                      {slots.length}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mb: 3, borderRadius: 2, border: "1px solid #E0E0E0" }}>
            <CardContent>
              {/* Header - Responsive */}
              <Stack spacing={2} sx={{ mb: 2 }}>
                <Stack 
                  direction={{ xs: "column", sm: "row" }} 
                  justifyContent="space-between" 
                  alignItems={{ xs: "stretch", sm: "center" }}
                  spacing={2}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#005DAD" }}>
                    Haftalık Müsaitlik Takvimi
                  </Typography>
                  
                  {/* Manuel Randevu Saati Ekle Butonu */}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<IconPlus size={16} />}
                    onClick={() => handleOpenManualSlotDialog()}
                    sx={{
                      width: { xs: "100%", sm: "auto" },
                      borderColor: "#005DAD",
                      color: "#005DAD",
                      "&:hover": {
                        borderColor: "#004080",
                        bgcolor: "#E6F2FF",
                        color: "#005DAD",
                      },
                    }}
                  >
                    Manuel Ekle
                  </Button>
                </Stack>
                
                {/* Navigasyon Butonları - Responsive */}
                <Stack 
                  direction="row" 
                  spacing={1}
                  sx={{
                    flexWrap: { xs: "wrap", sm: "nowrap" },
                    gap: { xs: 1, sm: 0 },
                  }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<IconChevronLeft size={16} />}
                    onClick={() => setCurrentWeek((prev) => addWeeks(prev, -1))}
                    sx={{
                      flex: { xs: "1 1 auto", sm: "0 0 auto" },
                      minWidth: { xs: "auto", sm: "100px" },
                      borderColor: "#005DAD",
                      color: "#005DAD",
                      "&:hover": {
                        borderColor: "#004080",
                        bgcolor: "#E6F2FF",
                        color: "#005DAD",
                      },
                    }}
                  >
                    <Box sx={{ display: { xs: "none", sm: "block" } }}>Önceki</Box>
                    <Box sx={{ display: { xs: "block", sm: "none" } }}>
                      <IconChevronLeft size={16} />
                    </Box>
                  </Button>
                  
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setCurrentWeek(new Date())}
                    sx={{
                      flex: { xs: "1 1 100%", sm: "0 0 auto" },
                      minWidth: { xs: "100%", sm: "100px" },
                      bgcolor: "#005DAD",
                      "&:hover": {
                        bgcolor: "#004080",
                      },
                    }}
                  >
                    Bu Hafta
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<IconChevronRight size={16} />}
                    onClick={() => setCurrentWeek((prev) => addWeeks(prev, 1))}
                    sx={{
                      flex: { xs: "1 1 auto", sm: "0 0 auto" },
                      minWidth: { xs: "auto", sm: "100px" },
                      borderColor: "#005DAD",
                      color: "#005DAD",
                      "&:hover": {
                        borderColor: "#004080",
                        bgcolor: "#E6F2FF",
                        color: "#005DAD",
                      },
                    }}
                  >
                    <Box sx={{ display: { xs: "none", sm: "block" } }}>Sonraki</Box>
                    <Box sx={{ display: { xs: "block", sm: "none" } }}>
                      <IconChevronRight size={16} />
                    </Box>
                  </Button>
                </Stack>
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {format(startOfWeek(currentWeek, { locale: tr, weekStartsOn: 1 }), "d MMMM", { locale: tr })} -{" "}
                {format(endOfWeek(currentWeek, { locale: tr, weekStartsOn: 1 }), "d MMMM yyyy", { locale: tr })}
              </Typography>

              <Divider sx={{ mb: 2 }} />

              {loadingSlots ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {/* Takvim Grid */}
                  <Grid container spacing={1}>
                    {getWeekDays().map((day, dayIndex) => {
                      const daySlots = getSlotsForDay(day);
                      const isCurrentDay = isToday(day);
                      const isPastDay = isPast(day) && !isCurrentDay;

                      return (
                        <Grid item xs={12} sm={6} md={4} lg={1.71} key={dayIndex}>
                          <Paper
                            sx={{
                              p: 1.5,
                              minHeight: 300,
                              borderRadius: 2,
                              border: isCurrentDay ? "2px solid #005DAD" : "1px solid #E0E0E0",
                              bgcolor: isCurrentDay ? "#E6F2FF" : isPastDay ? "#F5F5F5" : "white",
                              cursor: isPastDay ? "not-allowed" : "pointer",
                              opacity: isPastDay ? 0.6 : 1,
                              transition: "all 0.2s ease",
                              "&:hover": isPastDay ? {} : {
                                boxShadow: 3,
                                transform: "translateY(-2px)",
                                borderColor: "#005DAD",
                              },
                            }}
                          >
                            {/* Gün Başlığı - Tıklanabilir Alan */}
                            <Box
                              onClick={() => {
                                // Geçmiş günlere slot eklenemez
                                if (!isPastDay) {
                                  handleOpenManualSlotDialog(day);
                                }
                              }}
                              sx={{
                                cursor: isPastDay ? "not-allowed" : "pointer",
                                "&:hover": isPastDay ? {} : {
                                  opacity: 0.8,
                                },
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 700,
                                  mb: 1,
                                  textAlign: "center",
                                  color: isCurrentDay ? "#005DAD" : "text.primary",
                                }}
                              >
                                {format(day, "EEE", { locale: tr })}
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 700,
                                  mb: 1,
                                  textAlign: "center",
                                  color: isCurrentDay ? "#005DAD" : "text.primary",
                                }}
                              >
                                {format(day, "d")}
                              </Typography>
                              {!isPastDay ? (
                                <Tooltip title="Bu güne randevu saati eklemek için tıklayın" placement="top">
                                <Chip
                                  icon={<IconPlus size={14} />}
                                    label="Saat Ekle"
                                  size="small"
                                  sx={{
                                    width: "100%",
                                    bgcolor: "#E6F2FF",
                                    color: "#005DAD",
                                    fontWeight: 600,
                                    fontSize: "0.7rem",
                                    height: 24,
                                    mb: 1,
                                    "&:hover": {
                                      bgcolor: "#005DAD",
                                      color: "white",
                                    },
                                  }}
                                />
                              </Tooltip>
                              ) : (
                                <Chip
                                  label="Geçmiş Gün"
                                  size="small"
                                  disabled
                                  sx={{
                                    width: "100%",
                                    fontWeight: 600,
                                    fontSize: "0.7rem",
                                    height: 24,
                                    mb: 1,
                                  }}
                                />
                              )}
                            </Box>

                            <Divider sx={{ mb: 1 }} />

                            <Stack spacing={0.5}>
                              {daySlots.length === 0 ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ textAlign: "center", display: "block", py: 1 }}
                                >
                                  Randevu yok
                                </Typography>
                              ) : (
                                daySlots.map((slot) => {
                                  const statusColor = getSlotStatusColor(slot.status);
                                  return (
                                    <Paper
                                      key={slot._id}
                                      onClick={() => handleSlotClick(slot)}
                                      sx={{
                                        p: 1,
                                        cursor: "pointer",
                                        bgcolor: statusColor.bg,
                                        border: `1px solid ${statusColor.border}`,
                                        borderRadius: 1,
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                          transform: "translateY(-2px)",
                                          boxShadow: 2,
                                        },
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontWeight: 600,
                                          color: statusColor.color,
                                          display: "block",
                                        }}
                                      >
                                        {format(parseISO(slot.startAt), "HH:mm")}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontSize: "0.65rem",
                                          color: statusColor.color,
                                          display: "block",
                                        }}
                                      >
                                        {getSlotStatusLabel(slot.status)}
                                      </Typography>
                                    </Paper>
                                  );
                                })
                              )}
                            </Stack>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {/* Legend */}
                  <Box sx={{ mt: 3, p: 2, bgcolor: "#F5F5F5", borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 1 }}>
                      Durum Açıklamaları:
                    </Typography>
                    <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                      {[
                        { status: "open", label: "Müsait" },
                        { status: "booked", label: "Dolu" },
                        { status: "completed", label: "Tamamlandı" },
                        { status: "cancelled", label: "İptal" },
                      ].map(({ status, label }) => {
                        const color = getSlotStatusColor(status);
                        return (
                          <Stack key={status} direction="row" spacing={1} alignItems="center">
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                bgcolor: color.bg,
                                border: `2px solid ${color.border}`,
                                borderRadius: 0.5,
                              }}
                            />
                            <Typography variant="caption">{label}</Typography>
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>

          {/* Aylık Takvim - Sabit */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#005DAD", mb: 2 }}>
              Aylık Takvim Görünümü
            </Typography>
            {renderMonthlyCalendar()}
          </Box>
        </Box>
      )}

      {/* Dialog: Kural Ekle/Düzenle */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: "#005DAD", fontWeight: 700 }}>
          {editingRule ? "Kuralı Düzenle" : "Yeni Müsaitlik Kuralı Ekle"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Gün</InputLabel>
              <Select
                name="dayOfWeek"
                value={formData.dayOfWeek}
                onChange={handleInputChange}
                label="Gün"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <MenuItem key={day.value} value={day.value}>
                    {day.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Başlangıç Saati */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: "#2c3e50" }}>
                Başlangıç Saati
              </Typography>
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Saat</InputLabel>
                  <Select
                    name="startHour"
                    value={formData.startHour}
                    onChange={handleInputChange}
                    label="Saat"
                  >
                    {HOURS.map((hour) => (
                      <MenuItem key={hour.value} value={hour.value}>
                        {hour.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", pt: 1 }}>
                  :
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Dakika</InputLabel>
                  <Select
                    name="startMinute"
                    value={formData.startMinute}
                    onChange={handleInputChange}
                    label="Dakika"
                  >
                    {MINUTES.map((minute) => (
                      <MenuItem key={minute.value} value={minute.value}>
                        {minute.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            {/* Bitiş Saati */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: "#2c3e50" }}>
                Bitiş Saati
              </Typography>
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Saat</InputLabel>
                  <Select
                    name="endHour"
                    value={formData.endHour}
                    onChange={handleInputChange}
                    label="Saat"
                  >
                    {HOURS.map((hour) => (
                      <MenuItem key={hour.value} value={hour.value}>
                        {hour.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", pt: 1 }}>
                  :
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Dakika</InputLabel>
                  <Select
                    name="endMinute"
                    value={formData.endMinute}
                    onChange={handleInputChange}
                    label="Dakika"
                  >
                    {MINUTES.map((minute) => (
                      <MenuItem key={minute.value} value={minute.value}>
                        {minute.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Toplantı Süresi</InputLabel>
              <Select
                name="meetingDuration"
                value={formData.meetingDuration}
                onChange={handleInputChange}
                label="Toplantı Süresi"
              >
                {MEETING_DURATIONS.map((duration) => (
                  <MenuItem key={duration.value} value={duration.value}>
                    {duration.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Toplantılar Arası Mola</InputLabel>
              <Select
                name="breakTime"
                value={formData.breakTime}
                onChange={handleInputChange}
                label="Toplantılar Arası Mola"
              >
                {BREAK_TIMES.map((breakTime) => (
                  <MenuItem key={breakTime.value} value={breakTime.value}>
                    {breakTime.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Toplantı Şekli</InputLabel>
              <Select
                name="meetingType"
                value={formData.meetingType}
                onChange={handleInputChange}
                label="Toplantı Şekli"
              >
                {meetingTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                     {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Entegrasyon bilgilendirmesi */}
            {integrations.length === 0 && (
              <Alert severity="info" sx={{ mt: -1 }}>
                <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                  <strong>💡 İpucu:</strong> Google Meet, Microsoft Teams veya Zoom ile toplantı oluşturmak için önce entegrasyon yapmalısınız.
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.open("/mentor/integrations", "_blank")}
                  sx={{ mt: 1 }}
                >
                  Entegrasyonları Yönet
                </Button>
              </Alert>
            )}

            {formData.meetingType === "private" && (
              <TextField
                fullWidth
                name="customLocation"
                label="Özel Konum / Link (Zorunlu)"
                value={formData.customLocation}
                onChange={handleInputChange}
                placeholder="Örn: Ofis - Toplantı Odası 3 veya özel link"
                required
                error={formData.meetingType === "private" && !formData.customLocation?.trim()}
                helperText={
                  formData.meetingType === "private" && !formData.customLocation?.trim()
                    ? "Özel konum seçildiğinde bu alan zorunludur"
                    : "Toplantının yapılacağı özel konumu veya link'i girin"
                }
              />
            )}

            <TextField
              fullWidth
              name="notes"
              label="Notlar (Opsiyonel)"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Bu kural hakkında notlar..."
              multiline
              rows={2}
              helperText="Kural hakkında hatırlatmak istediğiniz notlar"
            />

            <Alert severity="info" icon={<IconAlertCircle />}>
              Kural oluşturulduğunda önümüzdeki 30 gün için otomatik olarak slotlar üretilecektir.
              {formData.breakTime > 0 && (
                <span style={{ display: "block", marginTop: 4 }}>
                  <strong>Mola süresi:</strong> Her toplantı sonrası {formData.breakTime} dakika mola verilecektir.
                </span>
              )}
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} startIcon={<IconX size={16} />}>
            İptal
          </Button>
          <Button
            onClick={handleSaveRule}
            variant="contained"
            startIcon={<IconCheck size={16} />}
            sx={{
              bgcolor: "#005DAD",
              "&:hover": {
                bgcolor: "#004080",
              },
            }}
          >
            {editingRule ? "Güncelle" : "Oluştur"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Kural Silme Onayı */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: "#C62828", fontWeight: 700 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconAlertCircle size={24} />
            <span>Kuralı Sil</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>{ruleToDelete?.dayOfWeekName}</strong> günü için oluşturduğunuz müsaitlik kuralını silmek istediğinize emin misiniz?
          </Typography>
          <Alert severity="warning">
            Bu işlem geri alınamaz. İlgili tüm boş slotlar silinecek, ancak rezerve edilmiş ve dolu slotlar korunacaktır.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteDialog} startIcon={<IconX size={16} />}>
            İptal
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            startIcon={<IconTrash size={16} />}
          >
            Evet, Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Slot Detayları */}
      <Dialog
        open={slotDetailDialog}
        onClose={() => setSlotDetailDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: "#005DAD", fontWeight: 700 }}>
          Slot Detayları
        </DialogTitle>
        <DialogContent>
          {selectedSlot && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Paper sx={{ p: 2, bgcolor: "#F5F5F5", borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Tarih
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {format(parseISO(selectedSlot.startAt), "d MMMM yyyy", { locale: tr })}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Gün
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {format(parseISO(selectedSlot.startAt), "EEEE", { locale: tr })}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Başlangıç
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {format(parseISO(selectedSlot.startAt), "HH:mm")}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Bitiş
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {format(parseISO(selectedSlot.endAt), "HH:mm")}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Durum
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={getSlotStatusLabel(selectedSlot.status)}
                        size="small"
                        sx={{
                          bgcolor: getSlotStatusColor(selectedSlot.status).bg,
                          color: getSlotStatusColor(selectedSlot.status).color,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Kaynak
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {selectedSlot.source === "rule" ? "Kural" : "Manuel"}
                    </Typography>
                  </Grid>
                  {selectedSlot.meetingType && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Toplantı Şekli
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {meetingTypes.find((t) => t.value === selectedSlot.meetingType)?.label || selectedSlot.meetingType}
                      </Typography>
                    </Grid>
                  )}
                  {selectedSlot.customLocation && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Konum / Link
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, fontStyle: "italic" }}>
                        {selectedSlot.customLocation}
                      </Typography>
                    </Grid>
                  )}
                  {selectedSlot.notes && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Notlar
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary" }}>
                        {selectedSlot.notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {selectedSlot.bookedMeetingId && (
                <Alert severity="warning">
                  Bu randevu saati için toplantı rezervasyonu bulunmaktadır. Silinemez.
                </Alert>
              )}

              {selectedSlot.status === "open" && !selectedSlot.bookedMeetingId && (
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<IconCalendarEvent size={18} />}
                  onClick={() => handleOpenPlanMeetingDialog(selectedSlot)}
                  sx={{
                    bgcolor: "#005DAD",
                    "&:hover": { bgcolor: "#004080" },
                  }}
                >
                  Toplantı Planla
                </Button>
              )}

              {(selectedSlot.status === "open" || selectedSlot.status === "cancelled") && (
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  startIcon={<IconTrash size={18} />}
                  onClick={() => handleOpenSlotDeleteDialog(selectedSlot)}
                >
                  Randevu Saatini Sil
                </Button>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSlotDetailDialog(false)}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Manuel Randevu Saati Ekle */}
      <Dialog
        open={manualSlotDialog}
        onClose={handleCloseManualSlotDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: "#005DAD", fontWeight: 700 }}>
          Randevu Saati Ekle
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              type="date"
              label="Tarih"
              value={manualSlotData.date}
              onChange={(e) => handleManualSlotChange("date", e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ 
                min: format(new Date(), "yyyy-MM-dd") // Bugünden önceki tarihler seçilemez
              }}
              helperText="Geçmiş tarihler seçilemez"
            />

            {/* Başlangıç Saati */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: "#2c3e50" }}>
                Başlangıç Saati
              </Typography>
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Saat</InputLabel>
                  <Select
                    value={manualSlotData.startHour}
                    onChange={(e) => handleManualSlotChange("startHour", e.target.value)}
                    label="Saat"
                  >
                    {HOURS.map((hour) => {
                      const isDisabled = isPastTime(manualSlotData.date, hour.value, "59");
                      return (
                        <MenuItem 
                          key={hour.value} 
                          value={hour.value}
                          disabled={isDisabled}
                          sx={{
                            opacity: isDisabled ? 0.4 : 1,
                          }}
                        >
                        {hour.label}
                      </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", pt: 1 }}>
                  :
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Dakika</InputLabel>
                  <Select
                    value={manualSlotData.startMinute}
                    onChange={(e) => handleManualSlotChange("startMinute", e.target.value)}
                    label="Dakika"
                  >
                    {MINUTES.map((minute) => {
                      const isDisabled = isPastTime(manualSlotData.date, manualSlotData.startHour, minute.value);
                      return (
                        <MenuItem 
                          key={minute.value} 
                          value={minute.value}
                          disabled={isDisabled}
                          sx={{
                            opacity: isDisabled ? 0.4 : 1,
                          }}
                        >
                        {minute.label}
                      </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Stack>
              {format(new Date(), "yyyy-MM-dd") === manualSlotData.date && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  Geçmiş saatler seçilemez
                </Typography>
              )}
            </Box>

            {/* Bitiş Saati */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: "#2c3e50" }}>
                Bitiş Saati
              </Typography>
              <Stack direction="row" spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Saat</InputLabel>
                  <Select
                    value={manualSlotData.endHour}
                    onChange={(e) => handleManualSlotChange("endHour", e.target.value)}
                    label="Saat"
                  >
                    {HOURS.map((hour) => {
                      const isDisabled = isPastTime(manualSlotData.date, hour.value, "59");
                      return (
                        <MenuItem 
                          key={hour.value} 
                          value={hour.value}
                          disabled={isDisabled}
                          sx={{
                            opacity: isDisabled ? 0.4 : 1,
                          }}
                        >
                        {hour.label}
                      </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", pt: 1 }}>
                  :
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Dakika</InputLabel>
                  <Select
                    value={manualSlotData.endMinute}
                    onChange={(e) => handleManualSlotChange("endMinute", e.target.value)}
                    label="Dakika"
                  >
                    {MINUTES.map((minute) => {
                      const isDisabled = isPastTime(manualSlotData.date, manualSlotData.endHour, minute.value);
                      return (
                        <MenuItem 
                          key={minute.value} 
                          value={minute.value}
                          disabled={isDisabled}
                          sx={{
                            opacity: isDisabled ? 0.4 : 1,
                          }}
                        >
                        {minute.label}
                      </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Toplantı Şekli</InputLabel>
              <Select
                value={manualSlotData.meetingType}
                onChange={(e) => handleManualSlotChange("meetingType", e.target.value)}
                label="Toplantı Şekli"
              >
                {meetingTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Entegrasyon bilgilendirmesi */}
            {integrations.length === 0 && (
              <Alert severity="info" sx={{ mt: -1 }}>
                <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                  <strong>💡 İpucu:</strong> Google Meet, Microsoft Teams veya Zoom ile toplantı oluşturmak için önce entegrasyon yapmalısınız.
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => window.open("/mentor/integrations", "_blank")}
                  sx={{ mt: 1 }}
                >
                  Entegrasyonları Yönet
                </Button>
              </Alert>
            )}

            {manualSlotData.meetingType === "private" && (
              <TextField
                fullWidth
                label="Özel Konum / Link (Zorunlu)"
                value={manualSlotData.customLocation}
                onChange={(e) => handleManualSlotChange("customLocation", e.target.value)}
                placeholder="Örn: Ofis - Toplantı Odası 3 veya özel link"
                required
                error={manualSlotData.meetingType === "private" && !manualSlotData.customLocation?.trim()}
                helperText={
                  manualSlotData.meetingType === "private" && !manualSlotData.customLocation?.trim()
                    ? "Özel konum seçildiğinde bu alan zorunludur"
                    : "Toplantının yapılacağı özel konumu veya link'i girin"
                }
              />
            )}

            <TextField
              fullWidth
              label="Notlar (Opsiyonel)"
              value={manualSlotData.notes}
              onChange={(e) => handleManualSlotChange("notes", e.target.value)}
              placeholder="Bu slot hakkında notlar..."
              multiline
              rows={2}
              helperText="Slot hakkında hatırlatmak istediğiniz notlar"
            />

            {/* Katılımcı seçimi - opsiyonel */}
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#005DAD" }}>
              Direkt Toplantı Planla (Opsiyonel)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1, display: "block" }}>
              Bir katılımcı seçerseniz slot oluşturulurken otomatik olarak toplantı da planlanır.
            </Typography>

            {loadingAssignedUsers ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                <CircularProgress size={24} />
              </Box>
            ) : assignedUsers.length > 0 ? (
              <Autocomplete
                options={assignedUsers}
                getOptionLabel={(option) =>
                  `${option.name} (${option.email})${option.teamName ? ` - ${option.teamName}` : ""}`
                }
                filterOptions={(options, { inputValue }) => {
                  const q = inputValue.toLowerCase();
                  return options.filter(
                    (o) =>
                      o.name?.toLowerCase().includes(q) ||
                      o.email?.toLowerCase().includes(q) ||
                      o.teamName?.toLowerCase().includes(q)
                  );
                }}
                value={manualSlotParticipant}
                onChange={(_, newValue) => setManualSlotParticipant(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Katılımcı Seç (Opsiyonel)"
                    placeholder="Ad, e-posta veya takım adı ile arayın..."
                    size="small"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option._id}>
                    <Stack spacing={0.3}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email}
                      </Typography>
                      {option.teamName && (
                        <Chip
                          label={option.teamName}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.7rem",
                            bgcolor: "#E6F2FF",
                            color: "#005DAD",
                            fontWeight: 600,
                            mt: 0.3,
                            width: "fit-content",
                          }}
                        />
                      )}
                    </Stack>
                  </li>
                )}
                noOptionsText="Katılımcı bulunamadı"
                isOptionEqualToValue={(option, value) => option._id === value?._id}
              />
            ) : (
              <Alert severity="info" sx={{ py: 0.5 }}>
                <Typography variant="caption">
                  Atanmış katılımcı bulunmuyor. Slot boş olarak oluşturulacaktır.
                </Typography>
              </Alert>
            )}

            {manualSlotParticipant && (
              <Alert severity="success" sx={{ py: 0.5 }}>
                <Typography variant="caption">
                  <strong>{manualSlotParticipant.name}</strong> ile otomatik toplantı planlanacak.
                </Typography>
              </Alert>
            )}

            <Alert severity="info" icon={<IconAlertCircle />}>
              {manualSlotParticipant 
                ? "Slot oluşturulacak ve seçilen katılımcı ile otomatik olarak toplantı planlanacaktır."
                : "Manuel slot, tekrar eden kural dışında özel bir tarihte müsaitlik açmak için kullanılır."
              }
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseManualSlotDialog} startIcon={<IconX size={16} />}>
            İptal
          </Button>
          <Button
            onClick={handleCreateManualSlot}
            variant="contained"
            startIcon={manualSlotParticipant ? <IconCalendarEvent size={16} /> : <IconPlus size={16} />}
            sx={{
              bgcolor: "#005DAD",
              "&:hover": {
                bgcolor: "#004080",
              },
            }}
          >
            {manualSlotParticipant ? "Slot + Toplantı Oluştur" : "Slot Oluştur"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Toplantı Planla */}
      <PlanMeetingDialog
        open={planMeetingDialogOpen}
        onClose={() => setPlanMeetingDialogOpen(false)}
        slot={planMeetingSlot}
        meetingTypes={meetingTypes}
        onSuccess={handlePlanMeetingSuccess}
      />

      {/* Dialog: Slot Silme Onayı */}
      <Dialog
        open={slotDeleteDialogOpen}
        onClose={handleCloseSlotDeleteDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                bgcolor: "#FFEBEE",
                borderRadius: 2,
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconAlertCircle size={28} color="#C62828" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#C62828" }}>
                Slotu Sil
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Bu işlem geri alınamaz
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {slotToDelete && (
            <Stack spacing={2}>
              <Paper sx={{ p: 2, bgcolor: "#F5F5F5", borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Silinecek Slot
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#005DAD", mt: 0.5 }}>
                      {format(parseISO(slotToDelete.startAt), "d MMMM yyyy, EEEE", { locale: tr })}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Saat Aralığı
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {format(parseISO(slotToDelete.startAt), "HH:mm")} -{" "}
                      {format(parseISO(slotToDelete.endAt), "HH:mm")}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Durum
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={getSlotStatusLabel(slotToDelete.status)}
                        size="small"
                        sx={{
                          bgcolor: getSlotStatusColor(slotToDelete.status).bg,
                          color: getSlotStatusColor(slotToDelete.status).color,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              <Alert severity="warning" icon={<IconAlertCircle />}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Bu randevu saatini silmek istediğinize emin misiniz?
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  Silinen randevu saati geri getirilemez. Eğer bu saat için bir toplantı rezervasyonu varsa,
                  işlem başarısız olacaktır.
                </Typography>
              </Alert>

              {slotToDelete.source === "rule" && (
                <Alert severity="info" icon={<IconAlertCircle />}>
                  <Typography variant="caption">
                    Bu randevu saati bir kural tarafından otomatik oluşturulmuştur. Kalıcı olarak kaldırmak için
                    kuralı silmeniz veya düzenlemeniz gerekebilir.
                  </Typography>
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={handleCloseSlotDeleteDialog}
            variant="outlined"
            startIcon={<IconX size={16} />}
            sx={{
              borderColor: "#E0E0E0",
              color: "text.primary",
              "&:hover": {
                borderColor: "#BDBDBD",
                bgcolor: "#F5F5F5",
              },
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleConfirmSlotDelete}
            variant="contained"
            color="error"
            startIcon={<IconTrash size={16} />}
            sx={{
              bgcolor: "#C62828",
              "&:hover": {
                bgcolor: "#B71C1C",
              },
            }}
          >
            Evet, Slotu Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MentorAvailabilityView;
