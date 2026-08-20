const express = require('express');
const router = express.Router();
const calcController = require('../controllers/calc-history.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const saveValidation = [
  body('kind').isIn(['storage', 'rack', 'cloud']),
  body('label').optional().isString().trim().isLength({ max: 200 }),
  body('inputs').isObject(),
  body('outputs').isObject(),
];

router.get('/', protect, calcController.getHistory);
router.post('/', protect, saveValidation, validate, calcController.saveCalc);
router.delete('/:id', protect, calcController.deleteCalc);

module.exports = router;
