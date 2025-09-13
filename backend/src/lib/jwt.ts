import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export type JwtPayload = { sub: number; email: string; type: "access" | "refresh" };

export function signAccessToken(payload: Omit<JwtPayload, "type">) {
  return jwt.sign({ ...payload, type: "access" }, ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });
}

export function signRefreshToken(payload: Omit<JwtPayload, "type">) {
  return jwt.sign({ ...payload, type: "refresh" }, REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}