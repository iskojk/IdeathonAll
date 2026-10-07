import { NextResponse } from 'next/server';

// Bu import'u üstteki route.js'den almalıyız, ama şimdilik mock data burada da tanımlayalım
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

// GET /api/mentors/:id - Mentor detay
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const mentor = mentors.find(m => m._id === id);

    if (!mentor) {
      return NextResponse.json(
        { success: false, message: 'Mentor bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mentor
    });

  } catch (error) {
    console.error('Mentor detail error:', error);
    return NextResponse.json(
      { success: false, message: 'Mentor detayı getirilirken hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT /api/mentors/:id - Mentor güncelleme
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const formData = await request.formData();

    const mentorIndex = mentors.findIndex(m => m._id === id);

    if (mentorIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Mentor bulunamadı' },
        { status: 404 }
      );
    }

    const existingMentor = mentors[mentorIndex];
    const photo = formData.get('photo');

    // Validasyon
    const name = formData.get('name');
    const status = formData.get('status');
    const description = formData.get('description');
    const order = formData.get('order');
    const isActive = formData.get('isActive');

    if (!name || !status || !description) {
      return NextResponse.json(
        { success: false, message: 'Mentör adı, statüsü ve açıklaması zorunludur' },
        { status: 400 }
      );
    }

    // Dosya kontrolü (varsa)
    let photoName = existingMentor.photo;
    let photoUrl = existingMentor.photoUrl;

    if (photo) {
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

      // Yeni fotoğraf adı oluştur
      photoName = `mentor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${photo.type.split('/')[1]}`;
      photoUrl = `http://localhost:5010/uploads/mentors/${photoName}`;
    }

    // Mentor güncelleme
    mentors[mentorIndex] = {
      ...existingMentor,
      name: name.trim(),
      status: status.trim(),
      description: description.trim(),
      photo: photoName,
      photoUrl: photoUrl,
      order: order ? parseInt(order) : existingMentor.order,
      isActive: isActive !== null ? isActive === 'true' : existingMentor.isActive,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Mentör başarıyla güncellendi',
      data: mentors[mentorIndex]
    });

  } catch (error) {
    console.error('Mentor update error:', error);
    return NextResponse.json(
      { success: false, message: 'Mentör güncellenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE /api/mentors/:id - Soft delete
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const mentorIndex = mentors.findIndex(m => m._id === id);

    if (mentorIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Mentor bulunamadı' },
        { status: 404 }
      );
    }

    // Soft delete - sadece isActive = false yap
    mentors[mentorIndex].isActive = false;
    mentors[mentorIndex].updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: 'Mentor başarıyla silindi'
    });

  } catch (error) {
    console.error('Mentor delete error:', error);
    return NextResponse.json(
      { success: false, message: 'Mentor silinirken hata oluştu' },
      { status: 500 }
    );
  }
}

