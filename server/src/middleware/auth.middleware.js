const jwt = require('jsonwebtoken');

/**
 * Middleware to protect routes with JWT authentication
 * Replaces requireSupabaseAuth from the original implementation
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user ID to request context
    req.user = {
      id: decoded.id
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }
};

module.exports = { protect };
