const express = require('express');
const router = express.Router();
const rcaController = require('../controllers/rca.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const createValidation = [
  body('title').isString().trim().notEmpty().isLength({ max: 300 }),
];

const analyzeValidation = [
  body('incidentId').optional({ values: 'null' }).isUUID(),
  body('serverId').optional({ values: 'null' }).isUUID(),
  body('title').optional().isString().trim().isLength({ max: 300 }),
];

router.get('/', protect, rcaController.getAnalyses);
router.post('/analyze', protect, analyzeValidation, validate, rcaController.analyze);
router.post('/', protect, createValidation, validate, rcaController.createAnalysis);
router.delete('/:id', protect, rcaController.deleteAnalysis);

module.exports = router;
