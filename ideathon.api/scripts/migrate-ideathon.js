/**
 * Migration Script: Mevcut verilere ideathonId ekle
 * 
 * Kullanım:
 *   node scripts/migrate-ideathon.js
 * 
 * Bu script:
 * 1. Default ideathon'u bulur (isDefault: true veya ilk oluşturulan)
 * 2. Tüm mevcut kayıtlara ideathonId ekler
 * 3. TeamEvaluation'lara teamId ekler (teamName -> Team._id eşleştirmesi)
 * 4. Mevcut jüri/mentor kullanıcılarına UserIdeathonRole ataması yapar
 * 5. Eski unique index'leri drop eder
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Modelleri import et
const Ideathon = require('../src/models/Ideathon');
const UserIdeathonRole = require('../src/models/UserIdeathonRole');
const Application = require('../src/models/Application');
const Team = require('../src/models/Team');
const TeamEvaluation = require('../src/models/TeamEvaluation');
const MentorMeeting = require('../src/models/MentorMeeting');
const AvailabilityRule = require('../src/models/AvailabilityRule');
const AvailabilitySlot = require('../src/models/AvailabilitySlot');
const Conversation = require('../src/models/Conversation');
const Contact = require('../src/models/Contact');
const MentorProfile = require('../src/models/MentorProfile');
const Mentor = require('../src/models/Mentor');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function migrate() {
  console.log('🚀 Migration başlatılıyor...\n');

  // DB bağlantısı
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB bağlantısı kuruldu\n');

  // 1) Default ideathon'u bul
  let defaultIdeathon = await Ideathon.findOne({ isDefault: true });
  if (!defaultIdeathon) {
    defaultIdeathon = await Ideathon.findOne().sort({ createdAt: 1 });
  }

  if (!defaultIdeathon) {
    console.error('❌ Hiç ideathon bulunamadı! Önce bir ideathon oluşturun.');
    process.exit(1);
  }

  const ideathonId = defaultIdeathon._id;
  console.log(`📌 Default Ideathon: "${defaultIdeathon.name}" (${ideathonId})`);
  console.log(`   Slug: ${defaultIdeathon.slug}\n`);

  // İdeathon'u default olarak işaretle
  if (!defaultIdeathon.isDefault) {
    defaultIdeathon.isDefault = true;
    await defaultIdeathon.save();
    console.log('   ✅ isDefault: true olarak güncellendi\n');
  }

  // 2) Application'lara ideathonId ekle
  const appResult = await Application.updateMany(
    { ideathonId: { $exists: false } },
    { $set: { ideathonId } }
  );
  console.log(`📄 Application: ${appResult.modifiedCount} kayıt güncellendi`);

  // 3) Team'lere ideathonId ekle
  const teamResult = await Team.updateMany(
    { ideathonId: { $exists: false } },
    { $set: { ideathonId } }
  );
  console.log(`👥 Team: ${teamResult.modifiedCount} kayıt güncellendi`);

  // 4) TeamEvaluation — ideathonId + teamId ekle
  const evaluations = await TeamEvaluation.find({
    $or: [
      { ideathonId: { $exists: false } },
      { teamId: { $exists: false } }
    ]
  });

  let evalUpdated = 0;
  let evalSkipped = 0;

  for (const evaluation of evaluations) {
    const update = {};

    if (!evaluation.ideathonId) {
      update.ideathonId = ideathonId;
    }

    if (!evaluation.teamId && evaluation.teamName) {
      // teamName ile Team'i bul
      const team = await Team.findOne({ teamName: evaluation.teamName }).lean();
      if (team) {
        update.teamId = team._id;
      } else {
        console.warn(`   ⚠️ Team bulunamadı (teamName: "${evaluation.teamName}") — evaluation ${evaluation._id}`);
        evalSkipped++;
        continue;
      }
    }

    if (Object.keys(update).length > 0) {
      await TeamEvaluation.updateOne({ _id: evaluation._id }, { $set: update });
      evalUpdated++;
    }
  }
  console.log(`📊 TeamEvaluation: ${evalUpdated} güncellendi, ${evalSkipped} atlandı`);

  // 5) MentorMeeting'lere ideathonId ekle
  const meetingResult = await MentorMeeting.updateMany(
    { ideathonId: { $exists: false } },
    { $set: { ideathonId } }
  );
  console.log(`📅 MentorMeeting: ${meetingResult.modifiedCount} kayıt güncellendi`);

  // 6) AvailabilityRule'lara ideathonId ekle
  const ruleResult = await AvailabilityRule.updateMany(
    { ideathonId: { $exists: false } },
    { $set: { ideathonId } }
  );
  console.log(`📋 AvailabilityRule: ${ruleResult.modifiedCount} kayıt güncellendi`);

  // 7) AvailabilitySlot'lara ideathonId ekle
  const slotResult = await AvailabilitySlot.updateMany(
    { ideathonId: { $exists: false } },
    { $set: { ideathonId } }
  );
  console.log(`🕐 AvailabilitySlot: ${slotResult.modifiedCount} kayıt güncellendi`);

  // 8) Conversation'lara ideathonId ekle
  const convResult = await Conversation.updateMany(
    { ideathonId: { $exists: false } },
    { $set: { ideathonId } }
  );
  console.log(`💬 Conversation: ${convResult.modifiedCount} kayıt güncellendi`);

  // 9) Contact'lara ideathonId ekle
  const contactResult = await Contact.updateMany(
    { ideathonId: { $exists: false } },
    { $set: { ideathonId } }
  );
  console.log(`📞 Contact: ${contactResult.modifiedCount} kayıt güncellendi`);

  // 10) MentorProfile'lara ideathonId ekle
  const profileResult = await MentorProfile.updateMany(
    { ideathonId: { $exists: false } },
    { $set: { ideathonId } }
  );
  console.log(`👤 MentorProfile: ${profileResult.modifiedCount} kayıt güncellendi`);

  // 11) Mentor kartlarına ideathonId ekle
  const mentorCardResult = await Mentor.updateMany(
    { ideathonId: { $exists: false } },
    { $set: { ideathonId } }
  );
  console.log(`🎓 Mentor (kartlar): ${mentorCardResult.modifiedCount} kayıt güncellendi`);

  // 12) User'lara ideathonId ekle (superadmin/admin hariç tüm kullanıcılar)
  const userResult = await User.updateMany(
    { ideathonId: { $exists: false }, role: { $in: ['juri', 'mentor', 'user'] } },
    { $set: { ideathonId } }
  );
  console.log(`👤 User: ${userResult.modifiedCount} kayıt güncellendi`);

  // Ayrıca ideathonId null olanları da güncelle
  const userNullResult = await User.updateMany(
    { ideathonId: null, role: { $in: ['juri', 'mentor', 'user'] } },
    { $set: { ideathonId } }
  );
  if (userNullResult.modifiedCount > 0) {
    console.log(`👤 User (null → set): ${userNullResult.modifiedCount} kayıt güncellendi`);
  }

  // 13) Mevcut jüri/mentor/user kullanıcılarına UserIdeathonRole ata
  const juriMentorUsers = await User.find({
    role: { $in: ['juri', 'mentor', 'user'] },
    isActive: true
  }).lean();

  let rolesCreated = 0;
  let rolesSkipped = 0;
  // superadmin kullanıcısını bul (atayan olarak kullanılacak)
  const superAdmin = await User.findOne({ role: 'superadmin' }).lean();
  const assignedBy = superAdmin ? superAdmin._id : juriMentorUsers[0]?._id;

  for (const user of juriMentorUsers) {
    const existing = await UserIdeathonRole.findOne({
      userId: user._id,
      ideathonId,
      role: user.role
    }).lean();

    if (existing) {
      rolesSkipped++;
      continue;
    }

    try {
      await UserIdeathonRole.create({
        userId: user._id,
        ideathonId,
        role: user.role,
        assignedBy: assignedBy || user._id,
        isActive: true
      });
      rolesCreated++;
    } catch (err) {
      console.warn(`   ⚠️ UserIdeathonRole oluşturulamadı (${user.email}): ${err.message}`);
    }
  }
  console.log(`🔑 UserIdeathonRole: ${rolesCreated} oluşturuldu, ${rolesSkipped} zaten var`);

  // 10) Eski unique index'leri drop et
  console.log('\n🔧 Eski index\'leri temizleniyor...');
  try {
    const teDb = mongoose.connection.collection('teamevaluations');
    // Eski unique index: { juriId: 1, teamName: 1 }
    try {
      await teDb.dropIndex('juriId_1_teamName_1');
      console.log('   ✅ TeamEvaluation eski unique index (juriId_1_teamName_1) silindi');
    } catch (e) {
      console.log('   ℹ️ TeamEvaluation eski unique index bulunamadı (zaten silinmiş olabilir)');
    }
  } catch (e) {
    console.log('   ℹ️ Index temizleme atlandı:', e.message);
  }

  try {
    const arDb = mongoose.connection.collection('availabilityrules');
    try {
      await arDb.dropIndex('mentorUserId_1_dayOfWeek_1_startTime_1_endTime_1');
      console.log('   ✅ AvailabilityRule eski unique index silindi');
    } catch (e) {
      console.log('   ℹ️ AvailabilityRule eski unique index bulunamadı');
    }
  } catch (e) {
    console.log('   ℹ️ Index temizleme atlandı:', e.message);
  }

  try {
    const asDb = mongoose.connection.collection('availabilityslots');
    try {
      await asDb.dropIndex('mentorUserId_1_startAt_1_endAt_1');
      console.log('   ✅ AvailabilitySlot eski unique index silindi');
    } catch (e) {
      console.log('   ℹ️ AvailabilitySlot eski unique index bulunamadı');
    }
  } catch (e) {
    console.log('   ℹ️ Index temizleme atlandı:', e.message);
  }

  try {
    const convDb = mongoose.connection.collection('conversations');
    try {
      await convDb.dropIndex('participantsKey_1_type_1');
      console.log('   ✅ Conversation eski unique index silindi');
    } catch (e) {
      console.log('   ℹ️ Conversation eski unique index bulunamadı');
    }
  } catch (e) {
    console.log('   ℹ️ Index temizleme atlandı:', e.message);
  }

  // Eski Application unique index
  try {
    const appDb = mongoose.connection.collection('applications');
    try {
      await appDb.dropIndex('userId_1_personalInfo.email_1');
      console.log('   ✅ Application eski unique index silindi');
    } catch (e) {
      console.log('   ℹ️ Application eski unique index bulunamadı');
    }
  } catch (e) {
    console.log('   ℹ️ Index temizleme atlandı:', e.message);
  }

  console.log('\n✅ Migration tamamlandı!\n');
  console.log('📋 Özet:');
  console.log(`   Default Ideathon: ${defaultIdeathon.name} (${ideathonId})`);
  console.log(`   Application: ${appResult.modifiedCount}`);
  console.log(`   Team: ${teamResult.modifiedCount}`);
  console.log(`   TeamEvaluation: ${evalUpdated}`);
  console.log(`   MentorMeeting: ${meetingResult.modifiedCount}`);
  console.log(`   AvailabilityRule: ${ruleResult.modifiedCount}`);
  console.log(`   AvailabilitySlot: ${slotResult.modifiedCount}`);
  console.log(`   Conversation: ${convResult.modifiedCount}`);
  console.log(`   Contact: ${contactResult.modifiedCount}`);
  console.log(`   MentorProfile: ${profileResult.modifiedCount}`);
  console.log(`   Mentor (kartlar): ${mentorCardResult.modifiedCount}`);
  console.log(`   User: ${userResult.modifiedCount}`);
  console.log(`   UserIdeathonRole: ${rolesCreated} (yeni)`);

  await mongoose.disconnect();
  console.log('\n🔌 Bağlantı kapatıldı. İşlem bitti.');
}

migrate().catch(err => {
  console.error('❌ Migration hatası:', err);
  process.exit(1);
});



