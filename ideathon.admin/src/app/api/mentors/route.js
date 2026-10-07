import { NextResponse } from 'next/server';

// Mock mentor data - MENTOR_ADMIN_GUIDE.md'ye göre
const mentors = [
  {
    _id: "64f8d9e4c5a1b2c3d4e5f6g7",
    name: "Ahmet Yılmaz",
    photo: "mentor-1693846274956-123456789.jpg",
    photoUrl: "http://localhost:5010/uploads/mentors/mentor-1693846274956-123456789.jpg",
    status: "Yazılım Geliştirme Mentoru",
    description: "10+ yıllık yazılım geliştirme deneyimi ile React, Node.js ve Python teknolojilerinde uzman. Startup'larda lead developer olarak çalıştı. Açık kaynak projelere katkıda bulunuyor.",
    isActive: true,
    order: 1,
    createdBy: {
      _id: "64f8d9e4c5a1b2c3d4e5f6g8",
      name: "Admin User"
    },
    createdAt: "2023-09-04T12:31:14.956Z",
    updatedAt: "2023-09-04T12:31:14.956Z"
  },
  {
    _id: "64f8d9e4c5a1b2c3d4e5f6g8",
    name: "Mehmet Kaya",
    photo: "mentor-1693846274956-987654321.jpg",
    photoUrl: "http://localhost:5010/uploads/mentors/mentor-1693846274956-987654321.jpg",
    status: "Mobil Uygulama Geliştirme Mentoru",
    description: "React Native ve Flutter uzmanı. 8+ yıllık mobil geliştirme deneyimi. iOS ve Android uygulama mağazalarında 20+ yayınlanmış uygulaması var.",
    isActive: true,
    order: 2,
    createdBy: {
      _id: "64f8d9e4c5a1b2c3d4e5f6g8",
      name: "Admin User"
    },
    createdAt: "2023-09-03T10:15:30.123Z",
    updatedAt: "2023-09-03T10:15:30.123Z"
  },
  {
    _id: "64f8d9e4c5a1b2c3d4e5f6g9",
    name: "Ayşe Demir",
    photo: "mentor-1693846274956-456789123.jpg",
    photoUrl: "http://localhost:5010/uploads/mentors/mentor-1693846274956-456789123.jpg",
    status: "UI/UX Tasarım Mentoru",
    description: "Kullanıcı deneyimi ve arayüz tasarımı uzmanı. Figma, Adobe XD ve Sketch araçlarında profesyonel. Büyük ölçekli projelerde tasarım sistemi geliştirdi.",
    isActive: true,
    order: 3,
    createdBy: {
      _id: "64f8d9e4c5a1b2c3d4e5f6g8",
      name: "Admin User"
    },
    createdAt: "2023-09-02T14:22:45.567Z",
    updatedAt: "2023-09-02T14:22:45.567Z"
  },
  {
    _id: "64f8d9e4c5a1b2c3d4e5f6ga",
    name: "Fatma Çelik",
    photo: "mentor-1693846274956-789123456.jpg",
    photoUrl: "http://localhost:5010/uploads/mentors/mentor-1693846274956-789123456.jpg",
    status: "Veri Bilimi Mentoru",
    description: "Makine öğrenmesi ve veri analizi uzmanı. Python, R ve TensorFlow teknolojilerinde uzman. Finans ve sağlık sektöründe veri projeleri geliştirdi.",
    isActive: false,
    order: 4,
    createdBy: {
      _id: "64f8d9e4c5a1b2c3d4e5f6g8",
      name: "Admin User"
    },
    createdAt: "2023-09-01T09:30:15.890Z",
    updatedAt: "2023-09-01T09:30:15.890Z"
  },
  {
    _id: "64f8d9e4c5a1b2c3d4e5f6gb",
    name: "Ali Şahin",
    photo: "mentor-1693846274956-321654987.jpg",
    photoUrl: "http://localhost:5010/uploads/mentors/mentor-1693846274956-321654987.jpg",
    status: "DevOps Mentoru",
    description: "Bulut altyapısı ve CI/CD süreçleri uzmanı. AWS, Docker ve Kubernetes teknolojilerinde sertifikalı. Mikroservis mimarilerinde deneyimli.",
    isActive: true,
    order: 5,
    createdBy: {
      _id: "64f8d9e4c5a1b2c3d4e5f6g8",
      name: "Admin User"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET /api/mentors - Mentor listesi
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'order';

    let filteredMentors = [...mentors];

    // Aktif filtre
    if (isActive !== null && isActive !== undefined) {
      filteredMentors = filteredMentors.filter(mentor => mentor.isActive === (isActive === 'true'));
    }

    // Arama filtre
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMentors = filteredMentors.filter(mentor =>
        mentor.name.toLowerCase().includes(searchLower) ||
        mentor.status.toLowerCase().includes(searchLower) ||
        mentor.description.toLowerCase().includes(searchLower)
      );
    }

    // Sıralama
    filteredMentors.sort((a, b) => {
      if (sort === '-createdAt') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sort === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sort === 'order') {
        return (a.order || 0) - (b.order || 0);
      }
      return 0;
    });

    // Sayfalama
    const totalMentors = filteredMentors.length;
    const totalPages = Math.ceil(totalMentors / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMentors = filteredMentors.slice(startIndex, endIndex);

    const response = {
      success: true,
      data: {
        mentors: paginatedMentors,
        pagination: {
          currentPage: page,
          totalPages,
          totalMentors,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Mentor list error:', error);
    return NextResponse.json(
      { success: false, message: 'Mentor listesi getirilirken hata oluştu' },
      { status: 500 }
    );
  }
}

// POST /api/mentors - Yeni mentor ekleme
export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const status = formData.get('status');
    const description = formData.get('description');
    const order = formData.get('order');
    const photo = formData.get('photo');

    // Validasyon
    if (!name || !status || !description || !photo) {
      return NextResponse.json(
        { success: false, message: 'Mentör adı, statüsü, açıklaması ve fotoğrafı zorunludur' },
        { status: 400 }
      );
    }

    // Dosya tipi kontrolü
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(photo.type)) {
      return NextResponse.json(
        { success: false, message: 'Sadece JPEG, PNG ve WebP formatındaki resim dosyaları kabul edilir' },
        { status: 415 }
      );
    }

    // Dosya boyutu kontrolü (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (photo.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'Dosya boyutu çok büyük (max 5MB)' },
        { status: 413 }
      );
    }

    // Mock dosya yükleme - gerçek uygulamada dosyayı server'a kaydet
    const photoName = `mentor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${photo.type.split('/')[1]}`;
    const photoUrl = `http://localhost:5010/uploads/mentors/${photoName}`;

    const newMentor = {
      _id: `mentor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      photo: photoName,
      photoUrl,
      status: status.trim(),
      description: description.trim(),
      isActive: true,
      order: order ? parseInt(order) : 0,
      createdBy: {
        _id: "64f8d9e4c5a1b2c3d4e5f6g8",
        name: "Admin User"
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mentors.unshift(newMentor); // Yeni mentorları başa ekle

    return NextResponse.json({
      success: true,
      message: 'Mentör başarıyla oluşturuldu',
      data: newMentor
    }, { status: 201 });

  } catch (error) {
    console.error('Mentor creation error:', error);
    return NextResponse.json(
      { success: false, message: 'Mentör eklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

