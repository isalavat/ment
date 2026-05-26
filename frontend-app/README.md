# Ment Frontend App

React single-page application for the Ment platform.

## Tech Stack

- React + TypeScript
- React Router
- Axios
- Context API for auth/UI/i18n state
- Create React App build pipeline

## Run Locally

From this folder:

```bash
npm install
npm start
```

Default frontend URL: `http://localhost:3000`

The app expects backend API at `http://localhost:3000` (configured in `src/services/api.ts`).

## Scripts

```bash
npm start      # development server
npm run build  # production build
npm test       # test runner
```

## App Structure

```text
src/
	components/      # feature UI (auth, bookings, availability, admin, mentors, profile)
	contexts/        # AuthContext, UIContext
	i18n/            # LanguageContext and locale dictionaries
	services/        # api client + feature service modules
	styles/          # shared design tokens/theme files
	types/           # frontend TypeScript models
```

## Notes

- API auth uses bearer tokens via Axios interceptors in `src/services/api.ts`.
- On `401`, the client attempts refresh-token rotation and retries once.
- Availability and time-slot pages now avoid render-triggered request loops.
