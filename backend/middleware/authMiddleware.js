const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization token' });
  }

  const token = authorizationHeader.slice(7).trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(targetRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== targetRole) {
      return res.status(403).json({ message: 'Forbidden: insufficient privileges' });
    }

    return next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
};