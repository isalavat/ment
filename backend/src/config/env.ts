function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`[config] Missing required environment variable: ${name}`);
  }
  return value;
}

export function validateEnvironment(): void {
  requireEnv("DATABASE_URL");
  requireEnv("JWT_ACCESS_SECRET");
  requireEnv("JWT_REFRESH_SECRET");
}
