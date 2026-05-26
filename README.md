# Ment Platform

This repository contains two deployable apps:

- `backend/` (Node.js + Express + Prisma API)
- `frontend-app/` (React single-page app)

## Current Architecture Status

- Backend feature modules for booking, availability, and time-slots are implemented with use-cases + domain ports + Prisma adapters.
- Legacy direct Prisma service modules for those features were removed.
- Backend auth middleware no longer logs raw bearer tokens.

## Deploy Notes

If you are deploying this project for the first time, read these docs in order:

1. [Technical Overview](TECHNICAL_OVERVIEW.md) - architecture, layers, API surface, and runtime details.
2. [Domain Documentation](DOMAIN_DOCUMENTATION.md) - business domain, entities, and rules.

These two documents are the source of truth for understanding how the system is structured before deployment changes.

## Local Run (Quick)

From repo root, run apps in separate terminals:

### Backend

```bash
cd backend
npm install
npm run dev
```

Optional backend quality checks:

```bash
npx biome check .
npm run build
```

### Frontend

```bash
cd frontend-app
npm install
npm start
```

## Deployment Checklist (High Level)

1. Provision MySQL and set backend `DATABASE_URL`.
2. Configure backend environment values (JWT secrets, token expiry settings, API port).
3. Run Prisma migrations from `backend/`.
4. Build and deploy backend service.
5. Build and deploy frontend with API base URL pointing to deployed backend.
6. Smoke test auth, mentor listing, availability, and booking flows.

## Deployment Parameters (Backend)

Use these backend environment parameters during deployment.

Reference template for non-production environments:
- [backend/.env.demo](backend/.env.demo)

| Parameter             | Required | Purpose                                                            | Example                                  |
| --------------------- | -------- | ------------------------------------------------------------------ | ---------------------------------------- |
| `DATABASE_URL`        | Yes      | MySQL connection string used by Prisma and app runtime             | `mysql://user:pass@db-host:3306/ment_db` |
| `JWT_ACCESS_SECRET`   | Yes      | Secret for signing access tokens                                   | `replace-with-long-random-string`        |
| `JWT_REFRESH_SECRET`  | Yes      | Secret for signing refresh tokens                                  | `replace-with-different-random-string`   |
| `JWT_ACCESS_EXPIRES`  | Yes      | Access token TTL                                                   | `15m`                                    |
| `JWT_REFRESH_EXPIRES` | Yes      | Refresh token TTL                                                  | `7d`                                     |
| `PORT`                | Yes      | Backend HTTP port                                                  | `3000`                                   |
| `NODE_ENV`            | Yes      | Runtime mode (`production` in real deploy)                         | `production`                             |
| `LOG_LEVEL`           | No       | Logger verbosity                                                   | `info`                                   |
| `TEST_USERS_PASSWORD` | No       | Shared password for auto-created demo users in non-production mode | `DevPass123!`                            |

## DB Setup Steps (Fresh Database)

Run from `backend/` after setting env values:

```bash
npm install
npx prisma migrate deploy
npm run prisma:seed
```

Notes:

- `npm run prisma:seed` currently seeds categories and skills.
- Demo users are not created by Prisma seed.

## Security Notes

- Always use long random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in deployed environments.
- Keep access and refresh secrets different.
- Set `NODE_ENV=production` in production.
- Never commit real `.env` values to git.

## Demo Users Behavior

- Demo users are created by backend startup bootstrap logic (`bootstrapDevUsers`), not by Prisma seed.
- This bootstrap runs automatically when backend starts and `NODE_ENV != production`.
- In production (`NODE_ENV=production`), demo bootstrap is skipped.
- Demo password source:
  - `TEST_USERS_PASSWORD` if provided
  - fallback `DevPass123!` if not set

If you need demo users in a non-production deployed environment, keep `NODE_ENV` non-production and set `TEST_USERS_PASSWORD` explicitly.
If you do not want demo users, set `NODE_ENV=production`.

For implementation details and architecture constraints, refer to:

- [TECHNICAL_OVERVIEW.md](TECHNICAL_OVERVIEW.md)
- [DOMAIN_DOCUMENTATION.md](DOMAIN_DOCUMENTATION.md)
