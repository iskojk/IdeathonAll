const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const {
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery
} = require('../middleware/auth');

const router = express.Router();

router.get('/stats',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  dashboardController.getStats
);

module.exports = router;
