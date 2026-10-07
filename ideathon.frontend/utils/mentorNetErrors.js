const ERROR_MESSAGES = {
  // Authentication
  'jwt expired': 'Oturumunuz sona erdi, lütfen tekrar giriş yapın',
  'jwt malformed': 'Geçersiz oturum, lütfen tekrar giriş yapın',
  'No token provided': 'Bu işlem için giriş yapmanız gerekiyor',
  'Token süresi dolmuş': 'Oturum süreniz doldu, lütfen tekrar giriş yapın',

  // Mentor
  'Mentor bulunamadı': 'Aradığınız mentor bulunamadı',
  'Bu mentor henüz müsaitlik oluşturmamış': 'Bu mentor henüz randevu kabul etmiyor. Lütfen daha sonra tekrar deneyin.',
  'Mentor profili bulunamadı': 'Mentor bilgilerine ulaşılamıyor',

  // Meeting - Creation
  'Bu slot artık müsait değil': 'Bu saat başka biri tarafından alındı. Lütfen başka bir saat seçin.',
  'Mentor ve slot bilgisi zorunludur': 'Mentor ve randevu saati seçimi zorunludur',
  'Slot bulunamadı': 'Seçilen randevu saati artık mevcut değil',
  'Bu slot zaten rezerve edilmiş': 'Bu saat dolu. Lütfen başka bir saat seçin.',

  // Meeting - Actions
  'Toplantı bulunamadı': 'Toplantı bilgisi bulunamadı',
  'Toplantıya 24 saatten az kaldı, iptal edilemez': 'Toplantınıza 24 saatten az kaldığı için iptal edemezsiniz. Lütfen mentorunuzla iletişime geçin.',
  'Bu toplantı zaten iptal edilmiş': 'Bu toplantı zaten iptal edilmiş',
  'Bu toplantı zaten tamamlanmış': 'Bu toplantı zaten tamamlanmış',
  'Bu toplantıyı iptal etme yetkiniz yok': 'Bu toplantıyı iptal etme yetkiniz bulunmuyor',

  // Feedback
  'Bu toplantı için zaten feedback verdiniz': 'Bu toplantı için zaten değerlendirme yaptınız.',
  'Feedback vermek için toplantının tamamlanmış olması gerekir': 'Feedback vermek için toplantının tamamlanmış olması gerekiyor',
  'Bu toplantı için feedback veremezsiniz': 'Bu toplantı için feedback veremezsiniz',

  // Validation
  'Rating 1-5 arası olmalıdır': 'Lütfen 1-5 arası bir puan verin',
  'Comment en az 10 karakter olmalıdır': 'Yorumunuz en az 10 karakter olmalıdır',
  'Geçersiz tarih aralığı': 'Lütfen geçerli bir tarih aralığı seçin',

  // Network/Server
  'Network Error': 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.',
  'Failed to fetch': 'Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.',
  'Internal Server Error': 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
};

export const getUserFriendlyError = (errorMessage) => {
  if (!errorMessage) return 'Bir hata oluştu, lütfen daha sonra tekrar deneyin';
  
  // Direkt eşleşme
  if (ERROR_MESSAGES[errorMessage]) {
    return ERROR_MESSAGES[errorMessage];
  }
  
  // Kısmi eşleşme için kontrol
  for (const key of Object.keys(ERROR_MESSAGES)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return ERROR_MESSAGES[key];
    }
  }
  
  return errorMessage || 'Bir hata oluştu, lütfen daha sonra tekrar deneyin';
};

export default ERROR_MESSAGES;



