import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, type IUser } from "../models/User.ts";
import type { Request } from "express";

export interface AuthRequest extends Request {
  user?: IUser;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Access denied. No token provided." });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "Access denied. Invalid token format." });
      return;
    }

    const secret = process.env.JWT_SECRET || "supersecretkey-andra-amruth-2026";
    const decoded = jwt.verify(token, secret) as { id: string; email: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}
