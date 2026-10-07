// Status Helpers - Türkçe çeviriler

export const MEETING_STATUSES = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled',
};

export const SLOT_STATUSES = {
  OPEN: 'open',
  BOOKED: 'booked',
  CANCELLED: 'cancelled',
};

export const getStatusLabel = (status) => {
  const labels = {
    // Meeting Statuses
    'scheduled': 'Planlandı',
    'completed': 'Tamamlandı',
    'cancelled': 'İptal Edildi',
    'no_show': 'Katılmadı',
    'rescheduled': 'Yeniden Planlandı',
    
    // Slot Statuses
    'open': 'Müsait',
    'booked': 'Dolu',
  };
  
  return labels[status] || status;
};

export const getStatusColor = (status) => {
  const colors = {
    // Meeting Statuses
    'scheduled': 'primary',
    'completed': 'success',
    'cancelled': 'error',
    'no_show': 'warning',
    'rescheduled': 'info',
    
    // Slot Statuses
    'open': 'success',
    'booked': 'error',
  };
  
  return colors[status] || 'default';
};

export const getSlotColor = (status) => {
  const colors = {
    'open': '#4CAF50',      // Green - Müsait
    'booked': '#f44336',    // Red - Dolu
    'completed': '#7B1FA2', // Purple - Tamamlandı
    'cancelled': '#9E9E9E', // Gray - İptal
  };
  
  return colors[status] || '#9E9E9E';
};







