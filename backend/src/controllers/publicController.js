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
          email: 'info@spotyourvibe.com',
          phone: '+1 (555) 000-0000',
          name: 'Super Admin'
        }
      });
    }

    // Always serve info@spotyourvibe.com as the superadmin contact
    const data = {
      ...superadmin,
      email: 'info@spotyourvibe.com'
    };

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};