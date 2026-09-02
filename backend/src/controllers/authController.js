import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { signToken } from '../utils/jwt.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'client', department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const validRole = ['client', 'agent', 'admin'].includes(role) ? role : 'client';
    const assignedDepartment = validRole === 'agent' ? (department || 'General') : null;

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: validRole,
        department: assignedDepartment,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(normalizedEmail)}`,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        avatar: true,
        createdAt: true,
      },
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration.',
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.',
      error: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};
