import jwt from "jsonwebtoken";

//const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
//const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

// 1) Rename to avoid clashing with the library's JwtPayload
export type AppJwtPayload = {
  sub: string;
  email: string;
  type: "access" | "refresh";
};

// 2) Runtime guard to narrow from unknown to AppJwtPayload
function isAppJwtPayload(v: unknown): v is AppJwtPayload {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.sub === "string" &&
    typeof o.email === "string" &&
    (o.type === "access" || o.type === "refresh")
  );
}

export function signAccessToken(payload: Omit<AppJwtPayload, "type">) {
  const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
  if (!ACCESS_SECRET) throw new Error("JWT_ACCESS_SECRET is not defined");
  return jwt.sign({ ...payload, type: "access" }, ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES ?? "15m",
  });
}

export function signRefreshToken(payload: Omit<AppJwtPayload, "type">) {
  const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  if (!REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET is not defined");
  return jwt.sign({ ...payload, type: "refresh" }, REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES ?? "7d",
  });
}

export function verifyAccessToken(token: string): AppJwtPayload {
  const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
  if (!ACCESS_SECRET) throw new Error("JWT_ACCESS_SECRET is not defined");
  const decoded = jwt.verify(token, ACCESS_SECRET); // string | jwt.JwtPayload
  if (typeof decoded === "string") throw new Error("Invalid token payload");
  if (!isAppJwtPayload(decoded)) throw new Error("Malformed token payload");
  if (decoded.type !== "access") throw new Error("Wrong token type");
  return decoded;
}

export function verifyRefreshToken(token: string): AppJwtPayload {
  const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  if (!REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET is not defined");
  const decoded = jwt.verify(token, REFRESH_SECRET);
  if (typeof decoded === "string") throw new Error("Invalid token payload");
  if (!isAppJwtPayload(decoded)) throw new Error("Malformed token payload");
  if (decoded.type !== "refresh") throw new Error("Wrong token type");
  return decoded;
}
