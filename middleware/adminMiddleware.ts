import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./authMiddleware.ts";

export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());

  if (
    user.role === "admin" ||
    user.role === "super-admin" ||
    adminEmails.includes(user.email.toLowerCase())
  ) {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admin role required." });
  }
}
