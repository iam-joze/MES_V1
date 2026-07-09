const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = require('../prismaClient');

async function login(req, res) {
  try {
    const { identifier, password, credential, pin } = req.body;
    const loginIdentifier = identifier || req.body.email;
    const incomingCredential = password || credential || pin;

    if (!loginIdentifier || !incomingCredential) {
      return res.status(400).json({ message: 'Identifier and credential are required' });
    }

    const user = await prisma.user.findUnique({
      where: { identifier: loginIdentifier },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidCredential = await bcrypt.compare(incomingCredential, user.credentialHash);

    if (!isValidCredential) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
}

module.exports = {
  login,
};