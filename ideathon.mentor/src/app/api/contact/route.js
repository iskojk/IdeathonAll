import { NextResponse } from 'next/server';

// Mock contact data - CONTACT_ADMIN_GUIDE.md'ye göre
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

// GET /api/contact - Listeleme endpoint'i
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');

    let filteredContacts = [...contactMessages];

    // Durum filtresi
    if (status && ['new', 'read', 'replied', 'closed'].includes(status)) {
      filteredContacts = filteredContacts.filter(contact => contact.status === status);
    }

    // Sayfalama
    const totalContacts = filteredContacts.length;
    const totalPages = Math.ceil(totalContacts / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

    const response = {
      success: true,
      data: {
        contacts: paginatedContacts,
        pagination: {
          currentPage: page,
          totalPages,
          totalContacts,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'İletişim mesajları getirilirken hata oluştu' },
      { status: 500 }
    );
  }
}

// POST /api/contact - Yeni iletişim mesajı oluşturma (public endpoint)
export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, message } = body;

    // Validasyon
    if (!firstName || !lastName || !email || !phone || !message) {
      return NextResponse.json(
        { success: false, message: 'Tüm zorunlu alanlar doldurulmalıdır' },
        { status: 400 }
      );
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz email formatı' },
        { status: 400 }
      );
    }

    const newContact = {
      _id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      message: message.trim(),
      status: 'new',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    contactMessages.unshift(newContact); // Yeni mesajları başa ekle

    return NextResponse.json({
      success: true,
      message: 'İletişim mesajınız başarıyla gönderildi',
      data: newContact
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'İletişim mesajı gönderilirken hata oluştu' },
      { status: 500 }
    );
  }
}

