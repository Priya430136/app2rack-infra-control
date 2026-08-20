const incidentsService = require('../services/incidents.service');

const getIncidents = async (req, res, next) => {
  try {
    const incidents = await incidentsService.getIncidents(req.user.id);
    res.json({ incidents });
  } catch (err) {
    next(err);
  }
};

const createIncident = async (req, res, next) => {
  try {
    const incident = await incidentsService.createIncident(req.user.id, req.body);
    res.status(201).json({ incident });
  } catch (err) {
    next(err);
  }
};

const updateIncidentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await incidentsService.updateIncidentStatus(req.user.id, id, status);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getIncidents,
  createIncident,
  updateIncidentStatus,
};
