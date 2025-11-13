// Minimal role-based middleware using headers for demo
export function requireAuth(req, res, next) {
  const role = req.header('x-role') || process.env.DEFAULT_ROLE || 'agent';
  if (!role || role === 'guest') return res.status(401).json({ message: 'Unauthorized' });
  req.user = { id: 'u1', role };
  next();
}

export function requireRole(roles = []) {
  return (req, res, next) => {
    const role = (req.user?.role) || req.header('x-role') || 'guest';
    if (roles.length && !roles.includes(role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}


