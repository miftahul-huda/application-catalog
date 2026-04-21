const { OAuth2Client } = require('google-auth-library');
const { User } = require('../models');
const { generateToken } = require('../utils/auth');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create new user, pending approval
      // First user could be Admin automatically? Let's check user count
      const userCount = await User.count();
      const role = userCount === 0 ? 'Admin' : 'User';
      const isApproved = userCount === 0; // First user (Admin) is auto-approved

      user = await User.create({
        email,
        name,
        picture,
        role,
        isApproved
      });
    }

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
      isApproved: user.isApproved,
      theme: user.theme,
      token
    });
  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(400).json({ message: 'Invalid Google token' });
  }
};

const getMe = async (req, res) => {
  res.json(req.user);
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  googleLogin,
  getMe,
  logout
};
