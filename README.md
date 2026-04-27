# Ment Platform

## Requirements
- Node.js 20+
- MySQL database

## Project Structure
- `backend/` - Express + Prisma + TypeScript API
- `frontend-app/` - React TypeScript app

## Backend Setup
1. Open `backend/`
2. Install dependencies:
```bash
npm install
```
3. Create `backend/.env` from `backend/.env.example`
4. Run migrations:
```bash
npx prisma migrate dev
```
5. Start backend:
```bash
npm run dev
```

Backend URL: `http://localhost:3000`

## Frontend Setup
1. Open `frontend-app/`
2. Install dependencies:
```bash
npm install
```
3. Create `frontend-app/.env` from `frontend-app/.env.example`
4. Start frontend:
```bash
npm start
```

Frontend URL: `http://localhost:3000` (CRA default)

## Demo Login (dev/test)
The backend auto-creates demo users on startup in `NODE_ENV=development` or `test`.

Keep passwords aligned:
- `backend/.env` -> `TEST_USERS_PASSWORD`
- `frontend-app/.env` -> `REACT_APP_TEST_USERS_PASSWORD`

If these differ, quick login will fail.
