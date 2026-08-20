const express = require('express');
const router = express.Router();
const infraController = require('../controllers/infra.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

// Validation schemas
const rackValidation = [
  body('name').notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('dc').notEmpty().withMessage('DC is required').isLength({ max: 120 }),
  body('capacity_u').isInt({ min: 1, max: 96 }),
  body('temperature_c').isFloat({ min: -20, max: 80 }),
];

const serverValidation = [
  body('name').notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('cpu').isInt({ min: 0, max: 100 }),
  body('ram').isInt({ min: 0, max: 100 }),
  body('storage').isInt({ min: 0, max: 100 }),
  body('status').isIn(['healthy', 'warning', 'critical', 'offline']),
];

const appValidation = [
  body('name').notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('env').isIn(['Production', 'UAT', 'Dev']),
  body('criticality').isIn(['Critical', 'High', 'Medium', 'Low']),
  body('status').isIn(['healthy', 'warning', 'critical', 'offline']),
];

// Racks
router.get('/racks', protect, infraController.getRacks);
router.post('/racks', protect, rackValidation, validate, infraController.upsertRack);
router.delete('/racks/:id', protect, infraController.deleteRack);

// Servers
router.get('/servers', protect, infraController.getServers);
router.post('/servers', protect, serverValidation, validate, infraController.upsertServer);
router.delete('/servers/:id', protect, infraController.deleteServer);

// Applications
router.get('/applications', protect, infraController.getApplications);
router.post('/applications', protect, appValidation, validate, infraController.upsertApplication);
router.delete('/applications/:id', protect, infraController.deleteApplication);

// Metrics
router.get('/metrics', protect, infraController.getMetrics);

// Demo seed
router.post('/seed', protect, infraController.seedDemoData);

module.exports = router;
