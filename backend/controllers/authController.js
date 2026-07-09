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

async function registerManager(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { identifier: email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    const credentialHash = await bcrypt.hash(password, 10);

    const manager = await prisma.user.create({
      data: {
        name,
        identifier: email,
        credentialHash,
        role: 'MANAGER',
        isActive: true,
      },
    });

    return res.status(201).json({
      message: 'Manager registered successfully',
      user: {
        id: manager.id,
        name: manager.name,
        identifier: manager.identifier,
        role: manager.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Manager registration failed', error: error.message });
  }
}

module.exports = {
  login,
  registerManager,
};