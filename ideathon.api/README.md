# Emlak Konut Ideathon Platform - Backend API

Emlak Konut tarafindan duzenlenen Ideathon etkinliklerinin yonetimi icin gelistirilmis backend API servisi. Multi-tenant mimarisiyle birden fazla ideathon etkinligini es zamanli olarak yonetir.

## Ozellikler

- **Multi-Tenant Ideathon Yonetimi** - Birden fazla ideathon etkinligini bagimsiz olarak yonetme
- **Kullanici & Rol Yonetimi** - Superadmin, Admin, Juri, Mentor ve Katilimci rolleri
- **Basvuru Sistemi** - Bireysel ve takimli basvuru sureci, durum takibi
- **Takim Yonetimi** - Takım olusturma, uye atama, lider belirleme
- **Juri Degerlendirme** - Dinamik kriterlerle takim degerlendirme ve siralama
- **Mentor Sistemi** - Musaitlik yonetimi, toplanti planlama, mesajlasma
- **Gercek Zamanli Iletisim** - Socket.IO ile canli mesajlasma ve bildirimler
- **Toplanti Entegrasyonlari** - Google Meet, Microsoft Teams, Zoom ve Jitsi destegi
- **E-posta Bildirimleri** - Otomatik toplanti hatirlatmalari ve bilgilendirme mailleri
- **Excel Raporlama** - Detayli basvuru ve katilimci raporlari
- **Dosya Yukleme** - Sunum ve belge yukleme destegi

## Teknoloji Yigini

| Kategori | Teknoloji |
|----------|-----------|
| Runtime | Node.js 20 |
| Framework | Express.js 5 |
| Veritabani | MongoDB + Mongoose 8 |
| Gercek Zamanli | Socket.IO + Redis Adapter |
| Kimlik Dogrulama | JWT (jsonwebtoken) |
| E-posta | Nodemailer |
| Dosya Yukleme | Multer |
| Raporlama | ExcelJS |
| OAuth | Google, Microsoft, Zoom |
| Zamanlanmis Gorevler | node-cron |
| Guvenlik | Helmet, CORS, Rate Limiting, bcryptjs |
| Konteyner | Docker |

## Proje Yapisi

```
src/
├── app.js                  # Express uygulama yapilandirmasi
├── server.js               # HTTP sunucusu, MongoDB baglantisi, Socket.IO
├── controllers/            # API endpoint isleyicileri
│   ├── authController.js       # Kimlik dogrulama (login, register, JWT)
│   ├── applicationController.js # Basvuru CRUD islemleri
│   ├── juriController.js       # Juri degerlendirme islemleri
│   ├── teamController.js       # Takim yonetimi
│   ├── meetingController.js    # Toplanti yonetimi
│   ├── mentorController.js     # Mentor islemleri
│   ├── mentornetController.js  # Mentor ag yonetimi
│   ├── messagingController.js  # Mesajlasma sistemi
│   ├── ideathonController.js   # Ideathon CRUD
│   ├── userController.js       # Kullanici yonetimi
│   ├── dashboardController.js  # Dashboard istatistikleri
│   ├── availabilityController.js # Musaitlik yonetimi
│   ├── integrationController.js  # OAuth entegrasyonlari
│   └── contactController.js    # Iletisim formu
├── models/                 # Mongoose veri modelleri
│   ├── User.js
│   ├── Application.js
│   ├── Ideathon.js
│   ├── Team.js
│   ├── TeamEvaluation.js
│   ├── MentorProfile.js
│   ├── MentorMeeting.js
│   ├── Conversation.js
│   ├── Message.js
│   └── ...
├── routes/                 # API rota tanimlari
├── services/               # Is mantigi servisleri
│   ├── emailService.js         # E-posta sablonlari ve gonderimi
│   ├── socketService.js        # Socket.IO yapilandirmasi
│   ├── oauthService.js         # OAuth islemleri
│   ├── mentorService.js        # Mentor is mantigi
│   ├── mentornetCronJobs.js    # Zamanlanmis gorevler
│   └── ...
├── middleware/              # Express middleware
│   ├── auth.js                 # JWT dogrulama, rol kontrolu, rate limiting
│   └── upload.js               # Dosya yukleme yapilandirmasi
├── scripts/                # Yardimci scriptler (raporlama, veri aktarimi)
├── seeds/                  # Veritabani baslangic verileri
└── utils/                  # Yardimci fonksiyonlar
```

## Kurulum

### Gereksinimler

- Node.js >= 20
- MongoDB >= 6.0
- Redis (Socket.IO adapter icin, opsiyonel)

### Adimlar

1. **Bagimliliklari yukleyin:**
```bash
npm install
```

2. **Ortam degiskenlerini yapilandirin:**
```bash
cp .env.example .env
```
`.env` dosyasini kendi ortaminiza gore duzenleyin.

3. **Ilk superadmin hesabini olusturun:**
```bash
npm run seed
```

4. **Gelistirme sunucusunu baslatın:**
```bash
npm run dev
```

Sunucu varsayilan olarak `http://localhost:5010` adresinde calisir.

## API Endpointleri

| Yol | Aciklama |
|-----|----------|
| `POST /api/auth/login` | Kullanici girisi |
| `POST /api/auth/register` | Kullanici kaydi |
| `GET /api/auth/me` | Oturum bilgisi |
| `POST /api/auth/mentor-login` | Mentor girisi |
| `/api/users/*` | Kullanici yonetimi |
| `/api/applications/*` | Basvuru islemleri |
| `/api/ideathons/*` | Ideathon yonetimi |
| `/api/teams/*` | Takim yonetimi |
| `/api/juri/*` | Juri degerlendirme |
| `/api/mentors/*` | Mentor yonetimi |
| `/api/mentornet/*` | Mentor ag islemleri |
| `/api/dashboard/*` | Dashboard istatistikleri |
| `/api/contact` | Iletisim formu |
| `GET /health` | Saglik kontrolu |

## Docker ile Calistirma

```bash
# Image olusturma
npm run docker:build

# Container baslatma
npm run docker:start

# Durdurma
npm run docker:stop

# Tek komutla build + deploy
npm run docker:full
```

## Raporlama Scriptleri

`src/scripts/` klasorunde bulunan scriptler ile Excel raporlari olusturulabilir:

```bash
# Onaylanmis basvurulari disari aktar
npm run export:approved

# Ideathon bazli basvuru raporu
npm run export:ideathon

# Ozel raporlar
node src/scripts/exportIdeathon2025Summary.js
node src/scripts/exportAllIdeathonsReport.js
```

## Ortam Degiskenleri

Tum degiskenler icin `.env.example` dosyasina bakiniz. Temel kategoriler:

| Kategori | Degiskenler |
|----------|-------------|
| Sunucu | `PORT`, `NODE_ENV` |
| Veritabani | `MONGODB_URI` |
| Kimlik Dogrulama | `JWT_SECRET`, `JWT_EXPIRE` |
| E-posta | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| URL'ler | `FRONTEND_URL`, `BACKEND_URL`, `ADMIN_PANEL_URL` |
| Sifreleme | `INTEGRATION_ENCRYPTION_KEY`, `OAUTH_STATE_SECRET` |
| OAuth | Google, Microsoft, Zoom client bilgileri |

## Lisans

Bu yazilim Emlak Konut'a ozel olarak gelistirilmistir. Tum haklari saklidir.
