const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const createValidation = [
  body('name').isString().trim().notEmpty().isLength({ max: 200 }),
  body('type').isString().trim().notEmpty().isLength({ max: 80 }),
];

router.get('/', protect, reportsController.getReports);
router.post('/', protect, createValidation, validate, reportsController.createReport);
router.delete('/:id', protect, reportsController.deleteReport);

module.exports = router;
