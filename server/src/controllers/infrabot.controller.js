const infrabotService = require('../services/infrabot.service');

const chat = async (req, res, next) => {
  try {
    const { messages } = req.body;
    const result = await infrabotService.chat(req.user.id, messages);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { chat };
