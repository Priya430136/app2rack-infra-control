const express = require('express');
const router = express.Router();
const incidentsController = require('../controllers/incidents.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const createIncidentValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('severity').isIn(['Critical', 'High', 'Medium', 'Low']),
  body('serverId').notEmpty().withMessage('Server ID is required'),
  body('downtimeMin').isInt({ min: 0 }),
];

const updateStatusValidation = [
  body('status').isIn(['Open', 'Investigating', 'Resolved']),
];

router.get('/', protect, incidentsController.getIncidents);
router.post('/', protect, createIncidentValidation, validate, incidentsController.createIncident);
router.post('/:id/status', protect, updateStatusValidation, validate, incidentsController.updateIncidentStatus);

module.exports = router;
