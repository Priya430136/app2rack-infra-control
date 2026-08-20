const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const user = await authService.register(email, password, name);
    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (err) {
    if (err.code === '23505') { // Unique violation in PG
      return res.status(400).json({ error: 'Email already exists' });
    }
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);
    res.status(200).json({
      success: true,
      user,
      token,
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

const getMe = async (req, res, next) => {
  try {
    // req.user.id is populated by the protect middleware
    const result = await require('../database').query(
      'SELECT u.id, u.email, p.display_name, p.avatar_url, u.created_at FROM users u LEFT JOIN profiles p ON u.id = p.id WHERE u.id = $1',
      [req.user.id]
    );
    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { display_name } = req.body;
    await require('../database').query(
      'UPDATE profiles SET display_name = $1, updated_at = NOW() WHERE id = $2',
      [display_name, req.user.id]
    );
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};
