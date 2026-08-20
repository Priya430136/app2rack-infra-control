const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');

const register = async (email, password, name) => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const result = await db.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, passwordHash]
  );
  const user = result.rows[0];

  await db.query('INSERT INTO profiles (id, email, display_name) VALUES ($1, $2, $3)', [user.id, user.email, name || ""]);

  return result.rows[0];
};

const login = async (email, password) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    token,
  };
};

module.exports = {
  register,
  login,
};
