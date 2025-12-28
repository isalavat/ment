import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";
import logger from "../lib/logger";
import { prisma } from "../../prisma/client";


export type AuthedRequest = Request & { user?: {id: number; email: string} };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    logger.info("Auth header: " + header);
    if(!header?.startsWith("Bearer ")) return res.status(401).json({error: "Missing token"});
    const token = header.slice("Bearer ".length);
    logger.info("token: " + header);
    try {
        const payload = verifyAccessToken(token);
        if(payload.type !== "access") return res.status(401).json({error: "Invalid or expired token"});

        req.user = { id: payload.sub, email: payload.email };
        next();
    } catch {
        return res.status(401).json({error: "Invalid or expired token"});
    }
    
}

export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const user = await prisma.user.findUnique({ 
            where: { id: req.user.id },
            select: { role: true }
        });

        if (!user || user.role !== "ADMIN") {
            return res.status(403).json({ error: "Admin access required" });
        }

        next();
    } catch (error) {
        logger.error(`Admin auth check error: ${(error as Error).message}`);
        return res.status(500).json({ error: "Internal server error" });
    }
}