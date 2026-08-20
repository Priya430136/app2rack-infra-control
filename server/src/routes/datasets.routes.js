const express = require('express');
const router = express.Router();
const datasetsController = require('../controllers/datasets.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const createValidation = [
  body('filename').isString().trim().notEmpty().isLength({ max: 255 }),
  body('kind').isIn(['csv', 'xlsx', 'json']),
  body('target_entity').isIn(['servers', 'applications', 'racks']),
  body('mapping').isObject(),
  body('rows').isArray({ min: 1, max: 5000 }),
];

router.get('/', protect, datasetsController.getDatasets);
router.post('/', protect, createValidation, validate, datasetsController.createDataset);
router.delete('/:id', protect, datasetsController.deleteDataset);

module.exports = router;
