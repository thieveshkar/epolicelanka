exports.verifyToken = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized: No active session" });
  }

  req.user = {
    id: req.session.userId,
    role: req.session.role,
    username: req.session.username,
  };

  next();
};

exports.checkAdminRole = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};
