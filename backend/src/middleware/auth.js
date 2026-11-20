const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    req.userId = jwt.verify(token, process.env.JWT_SECRET).sub;
    next();
  } catch {
    res.status(401).json({ code: 'TOKEN_INVALIDE', error: 'Session expirée' });
  }
};
