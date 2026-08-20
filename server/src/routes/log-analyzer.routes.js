const express = require('express');
const router = express.Router();
const logAnalyzerController = require('../controllers/log-analyzer.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const analyzeValidation = [
  body('logs').isString().trim().notEmpty().withMessage('Logs are required').isLength({ max: 25 * 1024 * 1024 }),
];

router.get('/', protect, logAnalyzerController.getLogAnalyses);
router.post('/', protect, analyzeValidation, validate, logAnalyzerController.createLogAnalysis);
router.delete('/:id', protect, logAnalyzerController.deleteLogAnalysis);
router.post('/chat', protect, [body('question').isString().trim().notEmpty()], validate, logAnalyzerController.chat);

module.exports = router;
