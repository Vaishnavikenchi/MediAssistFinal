const { auth } = require('../../firebase/firebase-admin');

exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

exports.adminOnly = async (req, res, next) => {
  try {
    if (req.user.email !== 'baradmanik@gmail.com') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(403).json({ message: 'Access denied' });
  }
};