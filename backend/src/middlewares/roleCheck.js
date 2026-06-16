export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

export const requireSuperAdmin = requireRole('SUPERADMIN');
export const requireAdmin = requireRole('ADMIN', 'SUPERADMIN');
export const requireOrganizer = requireRole('ORGANIZER', 'ADMIN', 'SUPERADMIN');
export const requireUser = requireRole('USER', 'ORGANIZER', 'ADMIN', 'SUPERADMIN');