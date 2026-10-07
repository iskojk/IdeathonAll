import { NextResponse } from 'next/server';

// Bu import'u üstteki route.js'den almalıyız, ama şimdilik mock data burada da tanımlayalım
const contactMessages = [
  {
    _id: "64f8d9e4c5a1b2c3d4e5f6g7",
    firstName: "Ahmet",
    lastName: "Yılmaz",
    email: "ahmet@example.com",
    phone: "+90 555 123 4567",
    message: "Merhaba, detaylı bilgi almak istiyorum. Program hakkında daha fazla bilgi verebilir misiniz?",
    status: "new",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    createdAt: "2023-09-04T12:31:14.956Z",
    updatedAt: "2023-09-04T12:31:14.956Z"
  },
  {
    _id: "64f8d9e4c5a1b2c3d4e5f6g8",
    firstName: "Ayşe",
    lastName: "Kaya",
    email: "ayse@example.com",
    phone: "+90 533 987 6543",
    message: "Fiyatlarınız hakkında bilgi almak istiyorum. Öğrenci indiriminiz var mı?",
    status: "read",
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
    createdAt: "2023-09-03T15:22:45.123Z",
    updatedAt: "2023-09-03T16:45:12.456Z"
  },
  {
    _id: "64f8d9e4c5a1b2c3d4e5f6g9",
    firstName: "Mehmet",
    lastName: "Demir",
    email: "mehmet@example.com",
    phone: "+90 542 456 7890",
    message: "Kurumlar için özel paketleriniz var mı? Toplu kayıt yaptırmak istiyoruz.",
    status: "replied",
    ipAddress: "192.168.1.102",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    createdAt: "2023-09-02T09:15:30.789Z",
    updatedAt: "2023-09-02T14:20:15.234Z"
  },
  {
    _id: "64f8d9e4c5a1b2c3d4e5f6ga",
    firstName: "Fatma",
    lastName: "Çelik",
    email: "fatma@example.com",
    phone: "+90 505 321 9876",
    message: "Kayıt işlemleri nasıl yapılıyor? Online kayıt mümkün mü?",
    status: "closed",
    ipAddress: "192.168.1.103",
    userAgent: "Mozilla/5.0 (Linux; Android 11; SM-G998B)",
    createdAt: "2023-09-01T11:45:22.567Z",
    updatedAt: "2023-09-01T17:30:45.890Z"
  },
  {
    _id: "64f8d9e4c5a1b2c3d4e5f6gb",
    firstName: "Ali",
    lastName: "Şahin",
    email: "ali@example.com",
    phone: "+90 536 147 2589",
    message: "Sertifika programı hakkında detaylı bilgi almak istiyorum.",
    status: "new",
    ipAddress: "192.168.1.104",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// PATCH /api/contact/:id/status - Durum güncelleme
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    // Geçerli durum değerlerini kontrol et
    const validStatuses = ['new', 'read', 'replied', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz durum değeri' },
        { status: 400 }
      );
    }

    const contactIndex = contactMessages.findIndex(c => c._id === id);

    if (contactIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'İletişim mesajı bulunamadı' },
        { status: 404 }
      );
    }

    // Durumu güncelle
    contactMessages[contactIndex].status = status;
    contactMessages[contactIndex].updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: 'İletişim mesajı durumu güncellendi',
      data: contactMessages[contactIndex]
    });

  } catch (error) {
    console.error('Contact status update error:', error);
    return NextResponse.json(
      { success: false, message: 'İletişim mesajı durumu güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}

