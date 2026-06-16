import prisma from '../config/database.js';

// Get all notifications for the current user
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, read: false }
    });

    res.json({
      success: true,
      data: { notifications, unreadCount }
    });
  } catch (error) {
    next(error);
  }
};

// Mark a notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// Delete a notification
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

// Helper: Create a notification
export const createNotification = async (userId, type, message, eventId = null) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        eventId
      }
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

// Helper: Notify all admins
export const notifyAdmins = async (type, message, eventId = null) => {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: { id: true }
    });
    for (const admin of admins) {
      await createNotification(admin.id, type, message, eventId);
    }
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
};
