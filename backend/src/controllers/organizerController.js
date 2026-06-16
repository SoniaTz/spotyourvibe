import prisma from '../config/database.js';
import { notifyAdmins } from './notificationController.js';

export const applyForOrganizer = async (req, res, next) => {
  try {
    const { organizationName, phone, description, website } = req.body;
    const userId = req.user.id;

    // Check if user already has an application
    const existingApplication = await prisma.organizerApplication.findUnique({
      where: { userId }
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an organizer application'
      });
    }

    // Handle uploaded document
    const documentPath = req.file ? `/uploads/documents/${req.file.filename}` : null;

    const application = await prisma.organizerApplication.create({
      data: {
        userId,
        organizationName,
        phone,
        description,
        website: website || null,
        documentFile: documentPath
      }
    });

    // Notify all admins about the new application
    const user = await prisma.user.findUnique({ where: { userId }, select: { name: true } });
    await notifyAdmins(
      'NEW_ORGANIZER_APPLICATION',
      `New organizer application from ${user?.name || 'a user'} (${organizationName}). Awaiting review.`
    );

    res.status(201).json({
      success: true,
      message: 'Organizer application submitted successfully. Waiting for admin approval.',
      data: application
    });
  } catch (error) {
    next(error);
  }
};

export const getMyApplication = async (req, res, next) => {
  try {
    const application = await prisma.organizerApplication.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No organizer application found'
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};
