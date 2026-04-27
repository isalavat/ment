# Backend Setup

## Requirements
- Node.js 20+
- MySQL database

## 1. Install dependencies
```bash
npm install
```

## 2. Configure environment
Create `backend/.env` from `backend/.env.example`.

Required values:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Optional values:
- `PORT` (default `3000`)
- `NODE_ENV` (`development` or `test` enables demo-user bootstrap)
- `TEST_USERS_PASSWORD` (shared password for all demo quick-login users)

## 3. Prepare database
Run Prisma migrations:
```bash
npx prisma migrate dev
```

Optional seed data (categories/skills):
```bash
npm run prisma:seed
```

## 4. Run backend
```bash
npm run dev
```

Backend starts on `http://localhost:3000`.

## Demo Test Users (dev/test only)
On startup, the backend ensures these users exist:
- `dev.user@mentorhub.local` (USER)
- `dev.mentor@mentorhub.local` (MENTOR, verified profile, searchable, bookable)
- `dev.mentor.pending@mentorhub.local` (MENTOR, pending profile)
- `dev.mentor.noprofile@mentorhub.local` (MENTOR, no profile)
- `dev.admin@mentorhub.local` (ADMIN)

All demo users use `TEST_USERS_PASSWORD`.

## Build Output
TypeScript compile output is written to `backend/dist`.
Source files in `backend/src` stay TypeScript-only.
