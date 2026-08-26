/* authMiddleware.ts: JWT authentication middleware for protecting admin API endpoints. */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const getJwtSecret = () => process.env.JWT_SECRET || "npc_tracker_jwt_secret_key_2026";
export const JWT_SECRET = getJwtSecret();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : (req.headers["x-access-token"] as string);

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing authentication token" });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; username: string; role: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Forbidden: Invalid or expired token" });
  }
}
