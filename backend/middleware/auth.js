const { verifyToken } = require('../utils/auth');
const { User } = require('../models');

const protect = async (req, res, next) => {
  let token;

  if (req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    req.user = await User.findByPk(decoded.id);
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

const approvedOnly = (req, res, next) => {
  if (req.user && req.user.isApproved) {
    next();
  } else {
    res.status(403).json({ message: 'Account pending approval' });
  }
};

module.exports = { protect, adminOnly, approvedOnly };
