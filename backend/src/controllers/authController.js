import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import { generateToken } from '../utils/jwt.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, organizationName, phone, description, website, securityQuestion, securityAnswer } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // If signing up as organizer, require organizationName
    const isOrganizer = role?.toUpperCase() === 'ORGANIZER';

    // Hash security answer if provided
    const hashedAnswer = securityAnswer ? await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10) : null;

    // Create user (always as USER initially, even for organizers)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER',
        phone: phone || null,
        securityQuestion: securityQuestion || null,
        securityAnswer: hashedAnswer
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // If organizer signup, also create the organizer application
    if (isOrganizer && organizationName) {
      await prisma.organizerApplication.create({
        data: {
          userId: user.id,
          organizationName,
          phone: phone || '',
          description: description || 'Applied during signup',
          website: website || null
        }
      });

      // Notify all admins about the new organizer application
      const { notifyAdmins } = await import('./notificationController.js');
      await notifyAdmins(
        'NEW_ORGANIZER_APPLICATION',
        `New organizer application from ${name} (${organizationName}). Awaiting review.`
      );
    }

    // Generate JWT token
    const token = generateToken({ userId: user.id, role: user.role });

    res.status(201).json({
      success: true,
      message: isOrganizer 
        ? 'Registration successful. Your organizer application is pending admin approval. You can use the platform as a regular user in the meantime.'
        : 'Registration successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if organizer is verified
    let verified = true;
    if (user.role === 'ORGANIZER') {
      const application = await prisma.organizerApplication.findUnique({
        where: { userId: user.id }
      });
      verified = application?.status === 'APPROVED';
    }

    // Generate JWT token
    const token = generateToken({ userId: user.id, role: user.role });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { ...userWithoutPassword, verified },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        organizerApplication: {
          select: {
            id: true,
            organizationName: true,
            phone: true,
            description: true,
            website: true,
            documentFile: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            bookings: true,
            events: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let verified = true;
    if (user.role === 'ORGANIZER') {
      const application = await prisma.organizerApplication.findUnique({
        where: { userId: req.user.id }
      });
      verified = application?.status === 'APPROVED';
    }

    res.json({ success: true, data: { ...user, verified } });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, organizationName, description, website } = req.body;

    // Update user name, email, and phone
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    // If user has an organizer application, update it too
    const application = await prisma.organizerApplication.findUnique({
      where: { userId: req.user.id }
    });

    if (application) {
      const appUpdate = {};
      if (organizationName !== undefined) appUpdate.organizationName = organizationName;
      if (description !== undefined) appUpdate.description = description;
      if (website !== undefined) appUpdate.website = website;

      if (Object.keys(appUpdate).length > 0) {
        await prisma.organizerApplication.update({
          where: { userId: req.user.id },
          data: appUpdate
        });
      }
    }

    // Check verified status
    let verified = true;
    if (user.role === 'ORGANIZER') {
      const app = await prisma.organizerApplication.findUnique({
        where: { userId: req.user.id }
      });
      verified = app?.status === 'APPROVED';
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { ...user, verified }
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number'
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete your account'
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Delete user (cascades to bookings, notifications, etc.)
    await prisma.user.delete({
      where: { id: req.user.id }
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getSecurityQuestion = async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { securityQuestion: true }
    });

    // Always return success to prevent email enumeration
    if (!user || !user.securityQuestion) {
      return res.json({
        success: true,
        data: { securityQuestion: null }
      });
    }

    res.json({
      success: true,
      data: { securityQuestion: user.securityQuestion }
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, securityAnswer, newPassword } = req.body;

    if (!email || !securityAnswer || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, security answer, and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || !user.securityAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or security answer'
      });
    }

    // Verify security answer
    const isAnswerValid = await bcrypt.compare(securityAnswer.toLowerCase().trim(), user.securityAnswer);
    if (!isAnswerValid) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect security answer'
      });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if organizer is verified
    let verified = true;
    if (user.role === 'ORGANIZER') {
      const application = await prisma.organizerApplication.findUnique({
        where: { userId: user.id }
      });
      verified = application?.status === 'APPROVED';
    }

    res.json({
      success: true,
      data: { ...user, verified }
    });
  } catch (error) {
    next(error);
  }
};
