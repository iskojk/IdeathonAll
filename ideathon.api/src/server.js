const app = require('./app');
const mongoose = require('mongoose');
const mentornetCronJobs = require('./services/mentornetCronJobs');
const socketService = require('./services/socketService');
const Conversation = require('./models/Conversation');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/emlak';

// Cleanup function: Drop old invalid index
async function cleanupOldIndexes() {
  try {
    console.log('🧹 Checking for old conversation indexes...');
    
    // Eski yanlış index'i drop et
    await Conversation.collection.dropIndex('participants_1_type_1');
    console.log('✅ Old index "participants_1_type_1" dropped successfully');
  } catch (error) {
    // Index yoksa hata alacağız, bu normal
    if (error.code === 27 || error.message.includes('index not found')) {
      console.log('ℹ️  Old index not found (already cleaned or never existed)');
    } else {
      console.error('⚠️  Error dropping old index:', error.message);
    }
  }
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 20,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
})
  .then(async () => {
    console.log('✅ Connected to MongoDB (poolSize: 20)');
    
    // Eski index'leri temizle
    await cleanupOldIndexes();
    
    // MentorNet Cron Jobs'ı başlat
    mentornetCronJobs.start();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Start server
const server = app.listen(PORT, process.env.HOST || '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  
  // Socket.IO'yu başlat
  socketService.initialize(server);
});

// Close WebSocket connections as well as HTTP before disconnecting MongoDB.
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down gracefully`);
  mentornetCronJobs.stop();
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
  try {
    await new Promise(resolve => {
      if (socketService.io) socketService.io.close(resolve);
      else server.close(resolve);
    });
    await mongoose.connection.close();
    clearTimeout(timeout);
    console.log('Process terminated');
    process.exit(0);
  } catch (error) {
    console.error('Shutdown failed:', error.message);
    process.exit(1);
  }
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;





