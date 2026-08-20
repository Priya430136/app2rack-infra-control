const calcService = require('../services/calc-history.service');

const getHistory = async (req, res, next) => {
  try {
    const { kind } = req.query;
    const history = await calcService.listCalcHistory(req.user.id, kind);
    res.json(history);
  } catch (err) {
    next(err);
  }
};

const saveCalc = async (req, res, next) => {
  try {
    const calc = await calcService.saveCalc(req.user.id, req.body);
    res.status(201).json(calc);
  } catch (err) {
    next(err);
  }
};

const deleteCalc = async (req, res, next) => {
  try {
    const { id } = req.params;
    await calcService.deleteCalc(req.user.id, id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHistory,
  saveCalc,
  deleteCalc
};
