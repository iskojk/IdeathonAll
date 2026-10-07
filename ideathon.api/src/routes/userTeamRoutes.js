const express = require('express');
const userTeamController = require('../controllers/userTeamController');
const {
  authenticate,
  requireActiveUser,
  attachIdeathonFromQuerySlug
} = require('../middleware/auth');

const router = express.Router();

// === USER TEAM MANAGEMENT ROUTES ===
// Kullanıcılar başvuru yapmadan önce takım oluşturabilir

// Kendi takımını getir
router.get('/my-team',
  authenticate,
  requireActiveUser,
  attachIdeathonFromQuerySlug,
  userTeamController.getMyTeam
);

// Takım oluştur
router.post('/my-team',
  authenticate,
  requireActiveUser,
  attachIdeathonFromQuerySlug,
  userTeamController.createTeam
);

// Takım bilgilerini güncelle
router.put('/my-team',
  authenticate,
  requireActiveUser,
  userTeamController.updateTeam
);

// Takımı sil
router.delete('/my-team',
  authenticate,
  requireActiveUser,
  userTeamController.deleteTeam
);

// Takıma üye ekle
router.post('/my-team/members',
  authenticate,
  requireActiveUser,
  userTeamController.addMember
);

// Takım üyesini güncelle
router.put('/my-team/members/:memberIndex',
  authenticate,
  requireActiveUser,
  userTeamController.updateMember
);

// Takım üyesini sil
router.delete('/my-team/members/:memberIndex',
  authenticate,
  requireActiveUser,
  userTeamController.deleteMember
);

module.exports = router;














