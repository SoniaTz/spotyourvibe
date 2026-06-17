import prisma from '../config/database.js';

export const getContactInfo = async (req, res, next) => {
  try {
    // Fetch the first SUPERADMIN user to get their contact details
    const superadmin = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' },
      select: {
        name: true,
        email: true,
        phone: true
      }
    });

    if (!superadmin) {
      return res.json({
        success: true,
        data: {
          email: 'admin@spotyourvibe.com',
          phone: '+1 (555) 000-0000',
          name: 'Super Admin'
        }
      });
    }

    res.json({
      success: true,
      data: superadmin
    });
  } catch (error) {
    next(error);
  }
};