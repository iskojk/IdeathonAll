const express = require('express');
const teamController = require('../controllers/teamController');
const {
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery
} = require('../middleware/auth');

const router = express.Router();

// Tüm route'lar: authenticate + requireSuperAdminOrAdmin + attachIdeathonFromHeaderOrQuery

router.get('/',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  teamController.list
);

router.get('/:teamId',
  authenticate,
  requireSuperAdminOrAdmin,
  teamController.getById
);

router.post('/',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  teamController.create
);

router.put('/:teamId',
  authenticate,
  requireSuperAdminOrAdmin,
  teamController.update
);

router.delete('/:teamId',
  authenticate,
  requireSuperAdminOrAdmin,
  teamController.delete
);

// Takım lideri bilgi güncelleme
router.put('/:teamId/leader',
  authenticate,
  requireSuperAdminOrAdmin,
  teamController.updateLeader
);

// Üye yönetimi
router.post('/:teamId/members',
  authenticate,
  requireSuperAdminOrAdmin,
  teamController.addMember
);

router.put('/:teamId/members/:memberId',
  authenticate,
  requireSuperAdminOrAdmin,
  teamController.updateMember
);

router.delete('/:teamId/members/:memberId',
  authenticate,
  requireSuperAdminOrAdmin,
  teamController.removeMember
);

module.exports = router;
