const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const {
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  attachIdeathonFromQuerySlugOptional
} = require('../middleware/auth');

// Public routes — Multi-Tenant: ?event=slug ile ideathonId opsiyonel olarak eklenir
router.post('/', attachIdeathonFromQuerySlugOptional, contactController.submitContactForm);

// Admin routes (ideathon filtresi opsiyonel)
router.get('/',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  contactController.getContactForms
);

router.get('/stats',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  contactController.getContactStats
);

router.get('/:id',
  authenticate,
  requireSuperAdminOrAdmin,
  contactController.getContactForm
);

router.patch('/:id/status',
  authenticate,
  requireSuperAdminOrAdmin,
  contactController.updateContactStatus
);

module.exports = router;

