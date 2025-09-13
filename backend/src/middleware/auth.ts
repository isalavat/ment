import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";

export type AuthedRequest = Request & { user?: {id: number; email: string} };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if(!header?.startsWith("Bearer ")) return res.status(401).json({error: "Missing token"});
    const token = header.slice("Bearer ".length);
    try {
        const payload = verifyAccessToken(token);
        if(payload.type !== "access") return res.status(401).json({error: "Invalid or expired token"});

        req.user = { id: payload.sub, email: payload.email };
        next();
    } catch {
        return res.status(401).json({error: "Invalid or expired token"});
    }
    
}