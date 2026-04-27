# Technical Overview — Ment Platform

> Last updated: April 27, 2026

---

## Table of Contents

1. [System Description](#1-system-description)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Backend](#3-backend)
   - [Tech Stack](#31-tech-stack)
   - [Directory Structure](#32-directory-structure)
   - [Layered Architecture](#33-layered-architecture)
   - [API Surface](#34-api-surface)
   - [Authentication & Session Flow](#35-authentication--session-flow)
   - [Transaction Management](#36-transaction-management)
   - [Error Handling Strategy](#37-error-handling-strategy)
   - [Middleware Pipeline](#38-middleware-pipeline)
4. [Frontend](#4-frontend)
   - [Tech Stack](#41-tech-stack)
   - [Directory Structure](#42-directory-structure)
   - [Application Shell & Routing](#43-application-shell--routing)
   - [State Management](#44-state-management)
   - [Auth Flow (Client Side)](#45-auth-flow-client-side)
   - [API Integration Layer](#46-api-integration-layer)
   - [Internationalisation (i18n)](#47-internationalisation-i18n)
   - [Component Architecture](#48-component-architecture)
5. [Cross-Cutting Concerns](#5-cross-cutting-concerns)

---

## 1. System Description

**Ment** is a mentorship marketplace platform that connects mentees with mentors. It supports:

- User registration and role-based access (Mentee · Mentor · Admin)
- Mentor profile creation, skill/category tagging, and admin-driven verification workflow
- Mentor availability scheduling (recurring weekly + one-off slots) with time-slot generation
- Session booking, confirmation, cancellation, and review flows
- An admin panel for user and mentor management

The system is structured as a **monorepo** with two independently deployable applications:

| App | Path | Runtime |
|---|---|---|
| REST API | `backend/` | Node.js / Express |
| SPA | `frontend-app/` | React / Browser |

---

## 2. High-Level Architecture

```
Browser (React SPA)
       │
       │  HTTP REST (JSON)  ← localhost:3000 in dev
       ▼
┌─────────────────────────────────────────────┐
│              Express 5 API                  │
│                                             │
│  Routes → Middleware → Controllers          │
│               │                             │
│          Use-Cases (Application Layer)      │
│               │                             │
│       Domain Entities & Repositories        │
│               │                             │
│     Prisma Infra Implementations            │
│               │                             │
│          MySQL Database                     │
└─────────────────────────────────────────────┘
```

**No message broker, no microservices.** The backend is a single Express process. All async work is done in-process using `async/await`.

---

## 3. Backend

### 3.1 Tech Stack

| Concern | Technology | Version |
|---|---|---|
| Runtime | Node.js + TypeScript | TS 5.x, target ES2020, CommonJS |
| Web framework | Express | 5.1 |
| ORM | Prisma | 6.19 |
| Database | MySQL | — (via `DATABASE_URL`) |
| Auth tokens | jsonwebtoken | 8.5 |
| Password hashing | bcryptjs | 3 |
| Input validation | Zod | 4 |
| Logging | Pino + pino-pretty | 9 |
| ID generation | uuid (v7 entities, v4 tokens) | — |
| Linting / Formatting | Biome | 2 |
| Dev tooling | nodemon + ts-node | — |

**Token strategy:** Dual-token auth — short-lived **access token (15 min)** + long-lived **refresh token (7 days)**, both as JWTs. Refresh tokens are persisted in the DB (`RefreshToken` table) and can be individually revoked.

---

### 3.2 Directory Structure

```
backend/src/
├── index.ts                        # App bootstrap, route mounting, server start
├── Transaction.ts                  # Transaction port (interface)
│
├── controllers/                    # HTTP layer — Express handlers + DTOs
│   ├── auth/                       # Register, Login, Logout, RotateSession
│   ├── mentor/                     # Admin: mentor CRUD + verification
│   ├── profile/                    # Public & authenticated profile endpoints
│   ├── skill/                      # Admin: skill CRUD
│   └── user/                       # Admin: user CRUD
│
├── domain/                         # Pure domain model (zero infra deps)
│   ├── category/                   # Category entity + repository interface
│   ├── mentor/                     # MentorProfile entity + repository interface
│   ├── skill/                      # Skill entity + repository interface
│   ├── token/                      # RefreshToken entity + value objects
│   └── user/                       # User entity + value objects + repository interface
│
├── infra/                          # Infrastructure adapters
│   ├── PrismaClientGetway.ts       # Tx-aware Prisma client resolver
│   ├── PrismaTransactionalContext.ts # AsyncLocalStorage transaction context
│   ├── repositories/               # Prisma implementations of domain repos
│   ├── services/                   # BCrypt + JWT service implementations
│   └── transaction/                # PrismaTransaction (runs $transaction)
│
├── lib/
│   ├── error.ts                    # BaseError hierarchy
│   ├── jwt.ts                      # signAccessToken / verifyAccessToken
│   └── logger.ts                   # Pino logger singleton
│
├── middleware/
│   ├── auth.ts                     # requireAuth / requireAdmin guards
│   ├── errorHandler.ts             # Global Express error boundary
│   ├── RequestValidationError.ts   # 400 validation error type
│   └── requestValidator.ts         # validateBodyWith(zodSchema) factory
│
├── routes/                         # Thin route definitions (prefix mounting)
│   ├── admin.ts
│   ├── auth.ts
│   ├── availability.ts
│   ├── bookings.ts
│   ├── profiles.ts
│   └── timeSlots.ts
│
├── services/                       # Domain service interfaces + direct Prisma services
│   ├── PasswordHasher.ts           # Port interface
│   ├── TokenService.ts             # Port interface
│   ├── availabilityService.ts      # Direct Prisma (not yet migrated to DDD)
│   ├── bookingService.ts           # Direct Prisma
│   └── timeSlotService.ts          # Direct Prisma
│
└── use-cases/                      # Application commands/queries
    ├── LoginUserUseCase.ts
    ├── RegisterUserUseCase.ts
    ├── LogoutUserUseCase.ts
    ├── RotateSessionUseCase.ts
    ├── admin/                      # AdminCreateUser, UpdateUser, DeleteUser
    ├── category/                   # ReadAllCategories
    ├── errors/                     # Application error types
    ├── mentor/                     # Full mentor CRUD, verification, skills, categories
    ├── profile/                    # GetMyProfile
    ├── skill/                      # CreateSkill, ReadAllSkills
    └── user/                       # UpdateMyProfile
```

---

### 3.3 Layered Architecture

The backend follows **Domain-Driven Design (DDD)** combined with **Clean Architecture**. Dependencies only point inward — outer layers depend on inner layers, never the reverse.

```
┌──────────────────────────────────────────────────────────┐
│  HTTP / Presentation Layer                               │
│  controllers/  routes/  middleware/  (DTOs)              │
└────────────────────────┬─────────────────────────────────┘
                         │ calls use-cases via constructor DI
┌────────────────────────▼─────────────────────────────────┐
│  Application Layer                                       │
│  use-cases/  — orchestrate domain objects                │
│  Receives domain errors, translates to app errors        │
└────────────────────────┬─────────────────────────────────┘
                         │ depends only on domain interfaces
┌────────────────────────▼─────────────────────────────────┐
│  Domain Layer                                            │
│  domain/ — entities, value objects, repo interfaces      │
│  Zero external dependencies                              │
└────────────────────────┬─────────────────────────────────┘
                         │ implemented by
┌────────────────────────▼─────────────────────────────────┐
│  Infrastructure Layer                                    │
│  infra/repositories/  infra/services/  infra/transaction │
│  Prisma-backed implementations, bcrypt, JWT              │
└──────────────────────────────────────────────────────────┘
```

**Key design choices:**

| Pattern | Implementation |
|---|---|
| Repository | Every aggregate has a domain interface + Prisma impl; injected via constructor |
| Value Objects | `Email`, `UserId`, `HashedPassword`, `AccessToken`, `RefreshTokenId` — immutable, validated at construction |
| Entity factories | `private constructor` + `static create()` — prevents invalid state |
| Manual DI | No IoC container; repositories/services are instantiated per controller call |
| Ambient transactions | `AsyncLocalStorage` propagates the Prisma `TransactionClient`; repos pick it up automatically via `PrismaClientGetway` |

> **Migration note:** The `Availability`, `Booking`, and `TimeSlot` feature areas use direct-Prisma services (`services/availabilityService.ts`, `bookingService.ts`, `timeSlotService.ts`) rather than the full DDD pattern. These are identified areas for future refactoring.

---

### 3.4 API Surface

All routes are prefixed and mounted in `src/index.ts`.

#### Auth — `/auth`

| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register new user |
| POST | `/auth/login` | — | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | — | Rotate session (new token pair) |
| POST | `/auth/logout` | ✅ | Revoke refresh token |

#### Profiles — `/profiles`

| Method | Path | Auth required | Description |
|---|---|---|---|
| GET | `/profiles/me` | ✅ | Current user + mentor profile |
| PUT | `/profiles/me` | ✅ | Update bio/goals |
| GET | `/profiles/mentors` | — | Public mentor listing (filterable) |
| GET | `/profiles/mentors/:id` | — | Single public mentor profile |
| POST | `/profiles/mentor` | ✅ | Create own mentor profile |
| PUT | `/profiles/mentor` | ✅ | Update own mentor profile |
| POST | `/profiles/mentor/skills` | ✅ | Add skill to own profile |
| DELETE | `/profiles/mentor/skills/:id` | ✅ | Remove skill from own profile |
| POST | `/profiles/mentor/categories` | ✅ | Add category to own profile |
| DELETE | `/profiles/mentor/categories/:id` | ✅ | Remove category from own profile |

#### Admin — `/admin` (all routes require Auth + Admin role)

**Users**

| Method | Path | Description |
|---|---|---|
| GET | `/admin/users` | Paginated list (filter by role, search) |
| GET | `/admin/users/:id` | Single user with mentor profile |
| POST | `/admin/users` | Create user |
| PUT | `/admin/users/:id` | Update user |
| DELETE | `/admin/users/:id` | Delete user |

**Mentors**

| Method | Path | Description |
|---|---|---|
| GET | `/admin/mentors` | All mentors (filter by verificationStatus) |
| GET | `/admin/mentors/:id` | Single mentor by profile ID |
| GET | `/admin/mentors/by-user/:userId` | Mentor by user ID |
| POST | `/admin/mentors/by-user/:userId` | Create mentor profile for user |
| PUT | `/admin/mentors/by-user/:userId` | Update mentor profile |
| PATCH | `/admin/mentors/:id/verification` | Verify or reject mentor |
| POST | `/admin/mentors/by-user/:userId/skills` | Add skill |
| DELETE | `/admin/mentors/by-user/:userId/skills/:skillId` | Remove skill |
| POST | `/admin/mentors/by-user/:userId/categories` | Add category |
| DELETE | `/admin/mentors/by-user/:userId/categories/:categoryId` | Remove category |

**Skills**

| Method | Path |
|---|---|
| GET | `/admin/skills` |
| POST | `/admin/skills` |

#### Bookings — `/bookings` (all require Auth)

| Method | Path | Description |
|---|---|---|
| POST | `/bookings` | Create booking |
| GET | `/bookings/mentee/:menteeId` | Bookings for mentee |
| GET | `/bookings/mentor/:mentorId` | Bookings for mentor |
| GET | `/bookings/:id` | Single booking |
| PATCH | `/bookings/:id/status` | Update booking status |

#### Availability — `/availability` (all require Auth)

| Method | Path | Description |
|---|---|---|
| POST | `/availability` | Create single availability slot |
| POST | `/availability/weekly` | Set full weekly schedule |
| GET | `/availability/mentor/:mentorId` | All availabilities for mentor |
| GET | `/availability/mentor/:mentorId/recurring` | Recurring only |
| GET | `/availability/mentor/:mentorId/specific` | One-off dates only |
| DELETE | `/availability/:id` | Delete availability |

#### Time Slots — `/time-slots` (all require Auth)

| Method | Path | Description |
|---|---|---|
| POST | `/time-slots/generate` | Generate concrete slots from availability |
| GET | `/time-slots/mentor/:mentorId/available` | Available slots (with date filter) |
| GET | `/time-slots/mentor/:mentorId` | All slots for mentor |
| GET | `/time-slots/:id` | Single slot |
| PATCH | `/time-slots/:id/status` | Override slot status |

---

### 3.5 Authentication & Session Flow

```
Client                          API
  │                              │
  │── POST /auth/login ─────────▶│
  │                    validate  │── findByEmail → verify password
  │                              │── signAccessToken (15 min)
  │                              │── generate RefreshToken (7 days)
  │                              │── persist RefreshToken to DB
  │◀── { accessToken, refreshToken } ──│
  │                              │
  │── GET /protected ───────────▶│
  │  (Authorization: Bearer ...) │── verifyAccessToken → attach req.user
  │                              │── handler runs
  │◀── 200 OK ─────────────────│
  │                              │
  │  (access token expires)      │
  │── POST /auth/refresh ───────▶│
  │  (body: refreshToken)        │── findToken → verify not revoked
  │                              │── revoke old token
  │                              │── issue new token pair
  │◀── { accessToken, refreshToken } ──│
  │                              │
  │── POST /auth/logout ────────▶│
  │                              │── revoke refresh token in DB
  │◀── 204 ────────────────────│
```

**`requireAdmin` guard:** After JWT verification, does a DB lookup to confirm `user.role === 'ADMIN'`. This ensures role cannot be faked via token payload even if a key were compromised.

---

### 3.6 Transaction Management

Uses **ambient transaction context** via `AsyncLocalStorage`:

```
PrismaTransaction.run(work)
  └── prisma.$transaction(async (txClient) => {
        PrismaTransactionalContext.set(txClient)  ← stored in AsyncLocalStorage
        await work()
        PrismaTransactionalContext.clear()
      })

Any repository call inside work():
  └── PrismaClientGetway()
        └── returns AsyncLocalStorage.getStore() ?? globalPrismaClient
```

This allows all repository calls within a use-case to participate in the same transaction without passing a client reference through every function signature.

---

### 3.7 Error Handling Strategy

Structured error hierarchy under `lib/error.ts`:

```
Error
└── BaseError (abstract)
    ├── DomainError          (HTTP 422) — domain invariant violations
    ├── ApplicationError     (HTTP 409) — use-case level conflicts
    ├── NotFoundError        (HTTP 404)
    ├── BadRequestError      (HTTP 400)
    ├── ForbiddenError       (HTTP 403)
    ├── ConflictError        (HTTP 409)
    └── InternalServerError  (HTTP 500)
```

Use-case level application errors live in `use-cases/errors/`:
- `InvalidEmailOrPasswordError`
- `UserAlreadyExistsError`
- `InvalidRefreshTokenError`
- `RefreshTokenRevokedError`

The global `ErrorHandler` middleware:
- Inspects `instanceof BaseError` → uses `error.statusCode` and `error.code`
- Logs `warn` for 4xx, `error` for 5xx with structured context (correlationId, user)
- Returns `{ code, message, instance }` JSON — consistent API error contract

---

### 3.8 Middleware Pipeline

```
Request
  │
  ├── cors()              — allows localhost:3001 + localhost:3000, credentials: true
  ├── express.json()      — body parser
  │
  ├── requireAuth         — verifies Bearer JWT, attaches req.user
  ├── requireAdmin        — DB-confirmed admin role check
  ├── validateBodyWith()  — Zod schema validation, replaces req.body with typed data
  │
  ├── Route Handler
  │
  └── ErrorHandler        — global 4-arg Express error boundary
```

---

## 4. Frontend

### 4.1 Tech Stack

| Dependency | Version | Purpose |
|---|---|---|
| React | 19.2.0 | UI library |
| TypeScript | 4.9.5 | Type safety |
| react-router-dom | 7.9.6 | Client-side routing |
| axios | 1.13.2 | HTTP client |
| react-scripts (CRA) | 5.0.1 | Build toolchain |
| @testing-library/react | 16.3.0 | Component testing |
| web-vitals | 2.1.4 | Performance metrics |

**No UI component library** — all styles are custom CSS. **No external state management** — React Context API only. **No form library** — all forms are controlled components via `useState`.

---

### 4.2 Directory Structure

```
frontend-app/src/
├── App.tsx                         # Provider shell + route definitions
├── index.tsx                       # CRA entry point (ReactDOM.createRoot)
│
├── components/
│   ├── admin/                      # AdminUsers, AdminUserDetail, AdminCreateUser, AdminMentors
│   ├── auth/                       # Login, Register
│   ├── availability/               # AvailabilityManager, TimeSlotManager
│   ├── bookings/                   # Bookings, BookingDetail, BookingModal
│   ├── common/                     # AlertDialog, ConfirmDialog (reusable modals)
│   ├── dashboard/                  # Dashboard (role-aware hub)
│   ├── language/                   # LanguageSwitcher
│   ├── layout/                     # Header, Sidebar, ProtectedRoute
│   ├── mentors/                    # Mentors (marketplace), MentorDetail
│   └── profile/                    # MenteeProfileForm, MentorProfileForm
│
├── contexts/
│   └── AuthContext.tsx             # User auth state (user, login, logout, isAuthenticated)
│
├── i18n/
│   ├── LanguageContext.tsx         # Active locale + t() translation accessor
│   └── locales/
│       ├── en.ts                   # English (source of truth for type shape)
│       ├── ru.ts                   # Russian
│       └── ky.ts                   # Kyrgyz
│
├── services/
│   ├── api.ts                      # Axios instance, auth interceptor, silent refresh
│   ├── authService.ts              # login, register, logout, getUser
│   ├── profileService.ts           # profile + mentor profile CRUD
│   ├── mentorService.ts            # public mentor listing + detail
│   ├── bookingService.ts           # booking CRUD + status actions
│   ├── availabilityService.ts      # availability + time slot management
│   └── adminService.ts             # admin user + mentor management
│
└── types/
    ├── auth.ts                     # User, UserRole, AuthResponse, LoginRequest, RegisterRequest
    ├── booking.ts                  # Booking, TimeSlot, CreateBookingData
    └── profile.ts                  # MentorProfile, VerificationStatus, update request types
```

---

### 4.3 Application Shell & Routing

Provider nesting in `App.tsx`:

```jsx
<BrowserRouter>
  <LanguageProvider>       // i18n context
    <AuthProvider>         // auth state
      <AppContent />       // layout + Routes
    </AuthProvider>
  </LanguageProvider>
</BrowserRouter>
```

`AppContent` renders `<Sidebar>` and `<Header>` only when `user != null`. Mobile sidebar toggle state is owned at this level.

**Route table:**

| Path | Component | Protected |
|---|---|---|
| `/` | → `/dashboard` redirect | — |
| `/login` | `Login` | No |
| `/register` | `Register` | No |
| `/dashboard` | `Dashboard` | Yes |
| `/mentors` | `Mentors` | Yes |
| `/mentors/:id` | `MentorDetail` | Yes |
| `/bookings` | `Bookings` | Yes |
| `/bookings/:id` | `BookingDetail` | Yes |
| `/availability` | `AvailabilityManager` | Yes |
| `/time-slots` | `TimeSlotManager` | Yes |
| `/profile/me` | `MenteeProfileForm` | Yes |
| `/profile/mentor` | `MentorProfileForm` | Yes |
| `/admin/users` | `AdminUsers` | Yes |
| `/admin/users/create` | `AdminCreateUser` | Yes |
| `/admin/users/:id` | `AdminUserDetail` | Yes |
| `/admin/mentors` | `AdminMentors` | Yes |

`ProtectedRoute` only checks `isAuthenticated`. Role-based access is enforced inside components and via sidebar visibility — not at the router level.

---

### 4.4 State Management

| Scope | Mechanism |
|---|---|
| Auth user | `AuthContext` — React Context + `useState` |
| Active locale | `LanguageContext` — React Context + `useState` |
| Page/server data | Local `useState` + `useEffect` per component |
| No global data cache | — |

Every page component fetches independently on mount (`useEffect(() => { fetchData() }, [deps])`). There is no shared server-state cache (no React Query / SWR).

---

### 4.5 Auth Flow (Client Side)

```
Login form
  └── authService.login(credentials)
        ├── POST /auth/login
        ├── localStorage.setItem('accessToken', ...)
        ├── localStorage.setItem('refreshToken', ...)
        ├── GET /profiles/me  → build User object
        └── localStorage.setItem('user', JSON.stringify(user))
  └── useAuth().login(user)  → sets React state
  └── navigate('/dashboard')

Every API request (api.ts interceptor):
  └── reads localStorage['accessToken']
  └── injects Authorization: Bearer {token}

On 401 response (api.ts interceptor):
  ├── reads localStorage['refreshToken']
  ├── POST /auth/refresh → new token pair
  ├── updates localStorage
  └── retries original request once
      └── on failure → clears localStorage → window.location.href = '/login'

Logout:
  └── authService.logout() → clears localStorage
  └── useAuth().logout() → sets user = null
```

---

### 4.6 API Integration Layer

`src/services/api.ts` is a shared Axios instance (`baseURL: http://localhost:3000`) wrapping all API calls. All feature-specific service files import from this instance.

| Service file | Responsibility |
|---|---|
| `authService.ts` | Login, register, logout, current user hydration |
| `profileService.ts` | Own profile + mentor profile read/write + skill/category management |
| `mentorService.ts` | Public mentor directory (listing + detail) |
| `bookingService.ts` | Full booking lifecycle (create, confirm, cancel, complete, meeting link) |
| `availabilityService.ts` | Availability CRUD + time-slot generation |
| `adminService.ts` | Admin user CRUD + mentor verification actions |

---

### 4.7 Internationalisation (i18n)

Three supported locales: **English** (`en`), **Russian** (`ru`), **Kyrgyz** (`ky`).

The `en.ts` file defines the authoritative `TranslationKeys` type. All locale objects must structurally conform to it — TypeScript errors on any missing key.

Translation namespaces: `nav`, `common`, `dashboard`, `mentors`, `profile`, `bookings`, `availability`, `auth`, `admin`, `verification`.

Active locale is persisted in `localStorage['language']` and loaded on first render.

---

### 4.8 Component Architecture

| Group | Components | Role |
|---|---|---|
| `layout/` | `Header`, `Sidebar`, `ProtectedRoute` | App shell — navigation, auth guard |
| `auth/` | `Login`, `Register` | Unauthenticated entry points |
| `dashboard/` | `Dashboard` | Role-aware hub (sessions, stats, recommendations) |
| `mentors/` | `Mentors`, `MentorDetail` | Mentor marketplace with filter + pagination |
| `bookings/` | `Bookings`, `BookingDetail`, `BookingModal` | Full booking lifecycle UI |
| `availability/` | `AvailabilityManager`, `TimeSlotManager` | Mentor scheduling tools |
| `profile/` | `MenteeProfileForm`, `MentorProfileForm` | Profile editing (role-dependent forms) |
| `admin/` | `AdminUsers`, `AdminUserDetail`, `AdminCreateUser`, `AdminMentors` | Admin management panel |
| `common/` | `ConfirmDialog`, `AlertDialog` | Reusable modal dialogs |
| `language/` | `LanguageSwitcher` | Locale selector |

Role-based UI visibility:
- `Sidebar` shows **Mentor Tools** section only for `role === "MENTOR"` and **Admin** section only for `role === "ADMIN"`.
- `Header` shows verification status banners for mentors (`PENDING` / `REJECTED` / `VERIFIED` + no availability).
- `Dashboard` fetches different data depending on role (bookings-as-mentor vs bookings-as-mentee + recommended mentors).

---

## 5. Cross-Cutting Concerns

| Concern | Backend | Frontend |
|---|---|---|
| Auth | JWT Bearer (access + refresh) | localStorage tokens + Axios interceptor |
| Authorisation | `requireAuth` + `requireAdmin` middleware | Role checks inside components + `ProtectedRoute` |
| Validation | Zod schemas via `validateBodyWith()` | HTML `required` attributes + try/catch on submit |
| Error handling | Global `ErrorHandler` middleware, structured JSON errors | Component-level `error` state string |
| Logging | Pino structured logs (server-side) | None (console at best) |
| Internationalisation | — (API returns raw data) | Three-locale LanguageContext |
| Database access | Prisma ORM (MySQL) | — |
| Type safety | Domain value objects + Zod parsing | TypeScript interfaces in `types/` |
| CORS | `localhost:3001`, `localhost:3000`, `credentials: true` | — |
