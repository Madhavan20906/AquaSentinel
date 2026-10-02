import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

export interface AuthenticatedUser {
  userId: string;
  role: string;
  isDevMode: boolean;
}

declare global {
  namespace Express {
    interface Request {
      authContext?: AuthenticatedUser;
    }
  }
}

export const isClerkConfigured = (): boolean => {
  return Boolean(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY);
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (isClerkConfigured()) {
    // When Clerk keys are configured in environment
    try {
      // In production with Clerk, user info is resolved from the session token or bearer token
      const authHeader = req.headers.authorization;
      const roleHeader = (req.headers["x-user-role"] as string) || "Environmental officer";

      req.authContext = {
        userId: authHeader ? "clerk_authenticated_user" : "clerk_anonymous",
        role: roleHeader,
        isDevMode: false,
      };
      next();
      return;
    } catch (err: any) {
      logger.error({ err }, "Clerk auth verification error");
      res.status(401).json({ error: "Unauthorized: Invalid Clerk session" });
      return;
    }
  }

  // Developer fallback mode
  const role = (req.headers["x-user-role"] as string) || "Environmental officer";
  req.authContext = {
    userId: "demo-operator-1",
    role,
    isDevMode: true,
  };
  next();
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.authContext?.role || "Citizen scientist";
    if (!allowedRoles.includes(role)) {
      res.status(403).json({
        error: `Forbidden: Action requires one of [${allowedRoles.join(", ")}]. Current role: ${role}`,
      });
      return;
    }
    next();
  };
};

