const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const mentorStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/mentors');
    createUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `mentor-${uniqueSuffix}${extension}`);
  }
});

const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece JPEG, PNG ve WebP formatındaki resim dosyaları kabul edilir'), false);
  }
};

const uploadMentorPhoto = multer({
  storage: mentorStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
    files: 1 
  }
});

const presentationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/presentations');
    createUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `presentation-${uniqueSuffix}${extension}`);
  }
});

const presentationFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'text/plain'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya formatı. Lütfen PDF, Office dosyaları, resim veya video yükleyin.'), false);
  }
};

const uploadPresentation = multer({
  storage: presentationStorage,
  fileFilter: presentationFilter,
  limits: {
    fileSize: 70 * 1024 * 1024, 
    files: 1 
  }
});

createUploadDir(path.join(__dirname, '../../uploads'));
createUploadDir(path.join(__dirname, '../../uploads/presentations'));

module.exports = {
  uploadMentorPhoto,
  uploadPresentation
};









