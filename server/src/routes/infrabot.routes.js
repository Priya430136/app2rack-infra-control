const express = require('express');
const router = express.Router();
const infrabotController = require('../controllers/infrabot.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const chatValidation = [
  body('messages').isArray({ min: 1, max: 50 }),
  body('messages.*.role').isIn(['system', 'user', 'assistant']),
  body('messages.*.content').isString().isLength({ max: 4000 }),
];

router.post('/chat', protect, chatValidation, validate, infrabotController.chat);

module.exports = router;
