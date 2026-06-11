import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./authMiddleware.ts";

export function superAdminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  if (user.role === "super-admin") {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Super Admin role required." });
  }
}
