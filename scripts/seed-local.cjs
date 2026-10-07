const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const apiRequire = createRequire(path.join(root, 'ideathon.api/package.json'));
apiRequire('dotenv').config({ path: path.join(root, 'ideathon.api/.env'), quiet: true });
const mongoose = apiRequire('mongoose');
const User = apiRequire('./src/models/User');
const Ideathon = apiRequire('./src/models/Ideathon');
const UserIdeathonRole = apiRequire('./src/models/UserIdeathonRole');
const MentorProfile = apiRequire('./src/models/MentorProfile');

async function seed() {
  if (process.env.NODE_ENV === 'production' || process.env.MONGODB_URI !== 'mongodb://127.0.0.1:27027/ideathon_local') {
    throw new Error('Bu seed yalnızca yerel ideathon_local veritabanı için çalışır.');
  }
  const credentialPath = path.join(root, '.local/credentials.json');
  fs.mkdirSync(path.dirname(credentialPath), { recursive: true });
  if (!fs.existsSync(credentialPath)) {
    const password = `Ideathon-${crypto.randomBytes(9).toString('base64url')}!`;
    fs.writeFileSync(credentialPath, JSON.stringify({
      note: 'Yalnızca yerel geliştirme hesapları; gerçek etkinlik verisi içermez.',
      accounts: [
        { name: 'Yerel Yönetici', email: 'admin@ideathon.dev', role: 'superadmin', password },
        { name: 'Yerel Jüri', email: 'juri@ideathon.dev', role: 'juri', password },
        { name: 'Yerel Mentor', email: 'mentor@ideathon.dev', role: 'mentor', password },
        { name: 'Yerel Katılımcı', email: 'katilimci@ideathon.dev', role: 'user', password }
      ]
    }, null, 2) + '\n', { mode: 0o600 });
  }
  const { accounts } = JSON.parse(fs.readFileSync(credentialPath, 'utf8'));
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const users = {};
  for (const account of accounts) {
    let user = await User.findOne({ email: account.email });
    if (!user) user = await User.create({ ...account, isActive: true });
    users[account.role] = user;
  }
  const events = [
    ['ideathon-2025', 'İstanbul'], ['ideathon-ankara', 'Ankara'],
    ['ideathon-izmir', 'İzmir'], ['ideathon-konya', 'Konya'],
    ['ideathon-kahramanmaras', 'Kahramanmaraş']
  ];
  let defaultEvent;
  for (const [slug, city] of events) {
    let event = await Ideathon.findOne({ slug });
    if (!event) event = await Ideathon.create({
      name: `${city} — Yerel Demo`, slug,
      description: 'Yerel kurulum için oluşturulmuş örnek etkinliktir; üretim verisi değildir.',
      status: 'active', isDefault: slug === 'ideathon-2025',
      createdBy: users.superadmin._id,
      evaluationCriteria: [
        { key: 'innovation', name: 'Yenilikçilik', maxScore: 50, order: 0 },
        { key: 'feasibility', name: 'Uygulanabilirlik', maxScore: 50, order: 1 }
      ]
    });
    if (slug === 'ideathon-2025') defaultEvent = event;
  }
  for (const role of ['juri', 'mentor', 'user']) {
    const user = users[role];
    if (!user.ideathonId) { user.ideathonId = defaultEvent._id; await user.save(); }
    if (!await UserIdeathonRole.exists({ userId: user._id, ideathonId: defaultEvent._id, role })) {
      await UserIdeathonRole.create({ userId: user._id, ideathonId: defaultEvent._id, role, assignedBy: users.superadmin._id });
    }
  }
  if (!await MentorProfile.exists({ userId: users.mentor._id })) {
    await MentorProfile.create({
      userId: users.mentor._id, title: 'Yerel Demo Mentoru',
      about: 'Mentor panelini ve yerel mesajlaşma akışını denemek için oluşturulmuştur.',
      expertiseTags: ['Yazılım', 'Girişimcilik'], createdBy: users.superadmin._id,
      ideathonId: defaultEvent._id, assignedUsers: [users.user._id]
    });
  }
  console.log('Yerel demo etkinlikleri ve dört test hesabı hazır. Giriş bilgileri: .local/credentials.json');
}
seed().catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
