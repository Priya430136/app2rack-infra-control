const express = require('express');
const router = express.Router();
const optimizationController = require('../controllers/optimization-advisor.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

router.get('/', protect, optimizationController.getAnalyses);
router.post('/', protect, optimizationController.createAnalysis);
router.delete('/:id', protect, optimizationController.deleteAnalysis);
router.post('/chat', protect, [body('question').isString().trim().notEmpty()], validate, optimizationController.chat);

module.exports = router;
