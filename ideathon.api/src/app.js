const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

// Routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const entrepreneurRoutes = require('./routes/entrepreneurRoutes');
const entrepreneurAdminRoutes = require('./routes/entrepreneurAdminRoutes');
const contactRoutes = require('./routes/contactRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const juriRoutes = require('./routes/juriRoutes');
const mentornetRoutes = require('./routes/mentornetRoutes');
const userTeamRoutes = require('./routes/userTeamRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const ideathonRoutes = require('./routes/ideathonRoutes');
const teamRoutes = require('./routes/teamRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Compression — tum JSON response'lari gzip ile sikistir
app.use(compression());

// Genel API rate limit — authenticate edilmis kullanicilar user ID, degilse IP bazli
// Ayni agdaki (ayni IP) cok sayida juri uyesini engellemez
const generalLimiter = rateLimit({
  windowMs: 60 * 100000,
  max: 30000,
  keyGenerator: (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(
          authHeader.split(' ')[1],
          process.env.JWT_SECRET
        );
        if (decoded?.id) return `user_${decoded.id}`;
      } catch (_) { /* token gecersiz — IP'ye dusecek */ }
    }
    return `ip_${ipKeyGenerator(req.ip)}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Çok fazla istek. Lütfen biraz bekleyin.' }
});
app.use('/api/', generalLimiter);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS Configuration from Environment Variables
const getAllowedOrigins = () => {
  const origins = [];

  // Add frontend URLs from environment variables
  if (process.env.FRONTEND_URL) origins.push(process.env.FRONTEND_URL);
  if (process.env.ADMIN_PANEL_URL) origins.push(process.env.ADMIN_PANEL_URL);
  if (process.env.JURI_PANEL_URL) origins.push(process.env.JURI_PANEL_URL);
  if (process.env.MENTOR_PANEL_URL) origins.push(process.env.MENTOR_PANEL_URL);
  if (process.env.BACKEND_URL) origins.push(process.env.BACKEND_URL);

  // Add additional CORS origins from environment variable (comma-separated)
  if (process.env.CORS_ALLOWED_ORIGINS) {
    const additionalOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',').map(url => url.trim());
    origins.push(...additionalOrigins);
  }

  return origins;
};

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = getAllowedOrigins();

    // In development, allow all localhost origins
    if (process.env.NODE_ENV !== 'production') {
      if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}. Allowed origins:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-Ideathon-Id']
}));
app.use(morgan('combined'));
app.use('/api/entrepreneurs', express.json({ limit: '4mb' }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static file serving for uploads with CORS
app.use('/uploads', (req, res, next) => {
  const allowedOrigins = getAllowedOrigins();
  const origin = req.headers.origin;

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (process.env.NODE_ENV !== 'production' && origin &&
             (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
    // In development, allow all localhost origins
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // For production or unknown origins, allow all
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
}, express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/entrepreneurs/admin', entrepreneurAdminRoutes);
app.use('/api/entrepreneurs', entrepreneurRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/juri', juriRoutes);
app.use('/api/mentornet', mentornetRoutes);
app.use('/api/user-teams', userTeamRoutes);
app.use('/api/ideathons', ideathonRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', integrationRoutes);
app.use('/', integrationRoutes); // OAuth callback'leri /auth/... path'inden de calissin

app.get('/', (req, res) => {
  res.json({
    message: 'Emlak Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      applications: '/api/applications',
      contact: '/api/contact',
      mentors: '/api/mentors',
      juri: '/api/juri',
      mentornet: '/api/mentornet',
      ideathons: '/api/ideathons',
      teams: '/api/teams',
      health: '/health'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

module.exports = app;
