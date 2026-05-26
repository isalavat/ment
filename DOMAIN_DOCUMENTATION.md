# Domain Documentation — Ment Platform

> Last updated: May 26, 2026

---

## Table of Contents

1. [Domain Overview](#1-domain-overview)
2. [Ubiquitous Language](#2-ubiquitous-language)
3. [Bounded Contexts](#3-bounded-contexts)
4. [Aggregate Roots & Entities](#4-aggregate-roots--entities)
   - [User](#41-user)
   - [MentorProfile](#42-mentorprofile)
   - [RefreshToken](#43-refreshtoken)
   - [Skill](#44-skill)
   - [Category](#45-category)
   - [Booking](#46-booking)
   - [TimeSlot](#47-timeslot)
   - [Availability](#48-availability)
   - [Review](#49-review)
5. [Value Objects](#5-value-objects)
6. [Enumerations](#6-enumerations)
7. [Domain Repository Interfaces](#7-domain-repository-interfaces)
8. [Application Use-Cases](#8-application-use-cases)
9. [Domain Invariants & Business Rules](#9-domain-invariants--business-rules)
10. [Entity Relationship Overview](#10-entity-relationship-overview)

---

## 1. Domain Overview

**Ment** operates in the **online mentorship** domain. Its core purpose is to enable people seeking guidance (mentees) to discover, connect with, and book sessions with experienced professionals (mentors).

The domain has five major capability areas:

| Capability            | Description                                                                |
| --------------------- | -------------------------------------------------------------------------- |
| **Identity & Access** | User registration, authentication, role-based permissions                  |
| **Mentor Discovery**  | Browsing/searching mentors by skill, category, rating, price               |
| **Mentor Onboarding** | Mentor profile creation, skill/category tagging, admin-driven verification |
| **Scheduling**        | Mentor availability management, time-slot generation                       |
| **Session Lifecycle** | Booking, confirmation, cancellation, completion, review                    |

---

## 2. Ubiquitous Language

| Term               | Definition                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **User**           | Any registered person on the platform. Has one of three roles: Mentee, Mentor, or Admin.                                                  |
| **Mentee**         | A user actively seeking guidance. Browses mentors, books sessions, writes reviews.                                                        |
| **Mentor**         | A user who offers sessions. Has a `MentorProfile`, manages availability, accepts bookings.                                                |
| **Admin**          | A platform operator who can manage all users, approve or reject mentor profiles.                                                          |
| **MentorProfile**  | The professional profile associated with a Mentor. Separate from the base `User` record.                                                  |
| **Verification**   | The admin-driven process of approving or rejecting a `MentorProfile` before it appears publicly.                                          |
| **Skill**          | A discrete technical or professional competency (e.g., "React", "Public Speaking"). Platform-level entity.                                |
| **Category**       | A broad topic area grouping mentors (e.g., "Engineering", "Career Growth"). Has a slug for URL routing.                                   |
| **Availability**   | A recurring weekly window or a one-off date range during which a mentor is open for bookings.                                             |
| **TimeSlot**       | A concrete, bounded time block (start + end `DateTime`) generated from an `Availability`. Can be `AVAILABLE`, `BOOKED`, or `UNAVAILABLE`. |
| **Booking**        | A mentee's reservation of a specific `TimeSlot` with a mentor. Captures a price snapshot at booking time.                                 |
| **Session**        | The meeting that takes place for a confirmed or completed `Booking`.                                                                      |
| **Review**         | A rating (1–5) and optional comment submitted by a mentee after a completed `Booking`.                                                    |
| **Token Rotation** | The process of exchanging a refresh token for a new access token + refresh token pair, invalidating the old refresh token.                |
| **Revocation**     | Explicitly invalidating a refresh token (e.g., on logout), recorded via `revokedAt` timestamp.                                            |

---

## 3. Bounded Contexts

The domain is organized into the following bounded contexts. Each context owns its own data and domain logic.

```
┌────────────────────────────────┐   ┌────────────────────────────────┐
│    Identity & Access Context   │   │   Mentor Catalogue Context     │
│                                │   │                                │
│  Entities: User, RefreshToken  │   │  Entities: MentorProfile,      │
│  Value Objects: Email, UserId, │   │    Skill, Category             │
│    HashedPassword, AccessToken │   │  Process: Verification         │
│  Use-cases: Register, Login,   │   │  Use-cases: Create/Update      │
│    Logout, RotateSession       │   │    MentorProfile, Add/Remove   │
│                                │   │    Skill/Category, Verify      │
└──────────────┬─────────────────┘   └───────────────┬────────────────┘
               │ User.id ref                         │ MentorProfile.id ref
               │                                     │
┌──────────────▼─────────────────────────────────────▼────────────────┐
│                     Scheduling Context                               │
│                                                                      │
│  Entities: Availability, TimeSlot                                    │
│  Ports: AvailabilityRepository, AvailabilityManagementRepository,     │
│    TimeSlotRepository, TimeSlotManagementRepository,                 │
│    TimeSlotGenerationService, AvailabilitySlotSyncService            │
│  Rules: Slots generated from Availability; only AVAILABLE slots      │
│    can be booked; Booking transitions slot to BOOKED                 │
└──────────────┬───────────────────────────────────────────────────────┘
               │ TimeSlot.id ref
               │
┌──────────────▼───────────────────────────────────────────────────────┐
│                     Booking Context                                  │
│                                                                      │
│  Entities: Booking, Review                                           │
│  Port: BookingRepository                                             │
│  Rules: Price snapshotted at booking; status machine enforced;       │
│    Review only after COMPLETED booking                               │
└──────────────────────────────────────────────────────────────────────┘
```

All four contexts above are now wired through domain ports + use-cases with Prisma adapters in the infra layer.

---

## 4. Aggregate Roots & Entities

### 4.1 User

**Aggregate root** of the Identity context.

| Field          | Type                            | Notes                                |
| -------------- | ------------------------------- | ------------------------------------ |
| `id`           | `UserId` (value object)         | UUIDv7                               |
| `email`        | `Email` (value object)          | Unique; validated with `z.email()`   |
| `passwordHash` | `HashedPassword` (value object) | Opaque; never exposed                |
| `role`         | `UserRole`                      | `USER` \| `MENTOR` \| `ADMIN`        |
| `firstName`    | `string`                        |                                      |
| `lastName`     | `string`                        |                                      |
| `avatarUrl`    | `string?`                       |                                      |
| `bio`          | `string?`                       |                                      |
| `goals`        | `string?`                       | Mentee-specific; learning objectives |

**Construction:** `User.create(...)` static factory. Constructor is private — prevents circumventing validation.

**Relations:**

| Relation        | Cardinality           | Description                            |
| --------------- | --------------------- | -------------------------------------- |
| `refreshTokens` | one-to-many           | Auth sessions                          |
| `mentorProfile` | one-to-one (optional) | Only present when `role === MENTOR`    |
| `bookings`      | one-to-many           | Bookings the user has made as a mentee |
| `reviews`       | one-to-many           | Reviews written as a mentee            |
| `favorites`     | one-to-many           | Saved/favourite mentors                |

---

### 4.2 MentorProfile

**Aggregate root** of the Mentor Catalogue context. Linked 1-to-1 to a `User` via `userId`.

| Field                | Type                 | Notes                                 |
| -------------------- | -------------------- | ------------------------------------- |
| `id`                 | `string` (UUIDv7)    |                                       |
| `userId`             | `string`             | FK → User (cascade delete)            |
| `title`              | `string?`            | Professional title or tagline         |
| `bio`                | `string?`            | Extended description                  |
| `yearsExperience`    | `number?`            |                                       |
| `hourlyRate`         | `Decimal?`           | Price per hour                        |
| `currency`           | `string?`            | Default `"USD"`                       |
| `avgRating`          | `float`              | Computed; default 0                   |
| `totalReviews`       | `int`                | Computed count                        |
| `verificationStatus` | `VerificationStatus` | `PENDING` \| `VERIFIED` \| `REJECTED` |
| `rejectionReason`    | `string?`            | Populated when status = `REJECTED`    |

**Construction:** Uses `static create()` / `static build()` factory. Private constructor.

**Owned collections (within aggregate):**

- `skills: Skill[]` — many-to-many via `MentorSkill` join
- `categories: Category[]` — many-to-many via `MentorCategory` join
- `availabilities: Availability[]`
- `bookings: Booking[]`
- `reviews: Review[]`

**Business rules:**

- Only `VERIFIED` mentor profiles appear in the public mentor listing
- `avgRating` and `totalReviews` are updated when a review is posted
- `hourlyRate` is snapshotted at the time of booking creation — changes after booking do not affect existing bookings

**Indexed fields:** `avgRating`, `hourlyRate`, `verificationStatus` — for efficient marketplace filtering.

---

### 4.3 RefreshToken

**Entity** within the Identity context.

| Field       | Type                            | Notes                         |
| ----------- | ------------------------------- | ----------------------------- |
| `id`        | `RefreshTokenId` (value object) | UUIDv4                        |
| `token`     | `string` (varchar 500)          | Raw JWT refresh token         |
| `userId`    | FK → User                       | Cascade delete                |
| `revokedAt` | `DateTime?`                     | Set on revocation or rotation |

**Behaviour:**

- `revoke()` — sets `revokedAt` to `now()`
- `isRevoked` getter — returns `true` if `revokedAt != null`

**Lifecycle:** Created on login. Rotated (old revoked → new issued) on `/auth/refresh`. Revoked on `/auth/logout`.

---

### 4.4 Skill

**Entity** in the Mentor Catalogue context. Platform-wide — not owned by any mentor.

| Field  | Type              |
| ------ | ----------------- |
| `id`   | `string` (UUIDv7) |
| `name` | `string` (unique) |

Linked to mentors via the `MentorSkill` join table.

---

### 4.5 Category

**Entity** in the Mentor Catalogue context. Platform-wide.

| Field         | Type                       | Notes               |
| ------------- | -------------------------- | ------------------- |
| `id`          | `string` (UUIDv7)          |                     |
| `name`        | `string` (unique)          |                     |
| `slug`        | `string` (unique, indexed) | URL-safe identifier |
| `description` | `string?`                  |                     |

Linked to mentors via the `MentorCategory` join table.

---

### 4.6 Booking

**Aggregate root** of the Booking context.

| Field         | Type                            | Notes                                    |
| ------------- | ------------------------------- | ---------------------------------------- |
| `id`          | `string` (UUIDv7)               |                                          |
| `mentorId`    | FK → MentorProfile              |                                          |
| `menteeId`    | FK → User                       |                                          |
| `timeSlotId`  | `string` (unique FK → TimeSlot) | One booking per slot                     |
| `status`      | `BookingStatus`                 | State machine (see §6)                   |
| `notes`       | `string?`                       | Mentee notes at booking time             |
| `hourlyRate`  | `Decimal`                       | **Snapshot** from mentor at booking time |
| `duration`    | `int` (minutes)                 | Session length                           |
| `totalAmount` | `Decimal`                       | `hourlyRate × duration / 60`             |
| `currency`    | `string`                        |                                          |
| `meetingLink` | `string?`                       | Set by mentor before/after confirmation  |
| `confirmedAt` | `DateTime?`                     |                                          |
| `completedAt` | `DateTime?`                     |                                          |
| `cancelledAt` | `DateTime?`                     |                                          |

**Status machine:**

```
PENDING
  ├──[mentor confirms]──▶ CONFIRMED
  │                           └──[admin/mentor marks done]──▶ COMPLETED
  │                                                               └──[mentee reviews]──▶ (Review created)
  ├──[mentee cancels]──▶ CANCELLED_BY_USER
  └──[mentor cancels]──▶ CANCELLED_BY_MENTOR
```

---

### 4.7 TimeSlot

**Entity** in the Scheduling context.

| Field       | Type               | Notes                                    |
| ----------- | ------------------ | ---------------------------------------- |
| `id`        | `string` (UUIDv7)  |                                          |
| `mentorId`  | FK → MentorProfile |                                          |
| `startTime` | `DateTime`         |                                          |
| `endTime`   | `DateTime`         |                                          |
| `status`    | `SlotStatus`       | `AVAILABLE` \| `BOOKED` \| `UNAVAILABLE` |
| `booking`   | `Booking?`         | One-to-one (cascade delete)              |

**Indexed:** `[mentorId, startTime, status]`, `[status, startTime]` — efficient querying for available slots.

**Lifecycle:** Generated in bulk from `Availability` windows through `TimeSlotGenerationService` (via `GenerateTimeSlotsUseCase`). Transitions to `BOOKED` when a `Booking` is created.

---

### 4.8 Availability

**Entity** in the Scheduling context.

| Field          | Type               | Notes                          |
| -------------- | ------------------ | ------------------------------ |
| `id`           | `string` (UUIDv7)  |                                |
| `mentorId`     | FK → MentorProfile |                                |
| `dayOfWeek`    | `int` (0–6)        | 0 = Sunday                     |
| `startTime`    | `string`           | `"HH:MM"` format               |
| `endTime`      | `string`           | `"HH:MM"` format               |
| `isRecurring`  | `boolean`          | `true` = weekly repeat         |
| `specificDate` | `DateTime?`        | Set when `isRecurring = false` |

**Indexed:** `[mentorId, dayOfWeek]`.

Two flavours: **recurring** (repeats every week on the specified day) and **specific-date** (one-off override). Time-slot generation ports process both types to generate concrete `TimeSlot` records.

---

### 4.9 Review

**Entity** in the Booking context. Created after a `Booking` reaches `COMPLETED` status.

| Field       | Type                           | Notes                  |
| ----------- | ------------------------------ | ---------------------- |
| `id`        | `string` (UUIDv7)              |                        |
| `bookingId` | `string` (unique FK → Booking) | One review per booking |
| `mentorId`  | FK → MentorProfile             |                        |
| `menteeId`  | FK → User                      |                        |
| `rating`    | `int` (1–5)                    |                        |
| `comment`   | `string?`                      |                        |

Creating a review triggers an update to `MentorProfile.avgRating` and `MentorProfile.totalReviews`.

---

## 5. Value Objects

Value objects are immutable, identity-less objects defined by their contents. They validate their own invariants at construction time and throw typed domain errors on failure.

| Value Object     | Location                                       | Invariants                                                             |
| ---------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| `Email`          | `domain/user/value-objects/Email.ts`           | Must match `z.email()` format; throws `InvalidEmailFormatError`        |
| `UserId`         | `domain/user/value-objects/UserId.ts`          | Must be a valid UUID (uuidValidate); throws `InvalidUserIdFormatError` |
| `HashedPassword` | `domain/user/value-objects/HashedPassword.ts`  | Opaque string wrapper; no plain-text exposure                          |
| `AccessToken`    | `domain/token/value-objects/AccessToken.ts`    | Frozen wrapper with `toString()`                                       |
| `RefreshTokenId` | `domain/token/value-objects/RefreshTokenId.ts` | Must be a valid UUID                                                   |

**Construction pattern** (example `Email`):

```ts
// Throws InvalidEmailFormatError if invalid — domain invariant protected at boundary
const email = Email.create("user@example.com");
```

---

## 6. Enumerations

### `UserRole`

| Value    | Description                                                      |
| -------- | ---------------------------------------------------------------- |
| `USER`   | Standard mentee — can browse mentors and book sessions           |
| `MENTOR` | Has a `MentorProfile`; manages availability and accepts bookings |
| `ADMIN`  | Platform operator; full access to admin endpoints                |

### `VerificationStatus`

| Value      | Description                                     |
| ---------- | ----------------------------------------------- |
| `PENDING`  | Mentor profile submitted, awaiting admin review |
| `VERIFIED` | Approved; mentor visible in public listing      |
| `REJECTED` | Rejected; `rejectionReason` field is populated  |

### `BookingStatus`

| Value                 | Triggered by                                       |
| --------------------- | -------------------------------------------------- |
| `PENDING`             | Initial state on booking creation                  |
| `CONFIRMED`           | Mentor confirms the booking                        |
| `COMPLETED`           | Session took place; mentor or admin marks complete |
| `CANCELLED_BY_USER`   | Mentee cancels                                     |
| `CANCELLED_BY_MENTOR` | Mentor cancels                                     |

### `SlotStatus`

| Value         | Description                     |
| ------------- | ------------------------------- |
| `AVAILABLE`   | Open for booking                |
| `BOOKED`      | Reserved by a confirmed booking |
| `UNAVAILABLE` | Manually blocked by the mentor  |

---

## 7. Domain Repository Interfaces

Domain repositories are **interfaces** defined in the domain layer. They are **implemented** in the infra layer (`infra/repositories/`) using Prisma.

### `UserRepository` (`domain/user/UserRepository.ts`)

| Method          | Signature                                | Description                      |
| --------------- | ---------------------------------------- | -------------------------------- |
| `save`          | `(user: User) → Promise<void>`           | Persist new user                 |
| `existsByEmail` | `(email: Email) → Promise<boolean>`      | Uniqueness check                 |
| `findByEmail`   | `(email: Email) → Promise<User \| null>` | Auth lookup                      |
| `findById`      | `(id: UserId) → Promise<User \| null>`   | By ID                            |
| `update`        | `(user: User) → Promise<void>`           | Full update                      |
| `updateProfile` | `(user: User) → Promise<void>`           | Profile-only update (bio, goals) |
| `delete`        | `(id: UserId) → Promise<void>`           | Permanent delete                 |

### `MentorProfileRepository` (`domain/mentor/MentorProfileRepository.ts`)

| Method                                       | Description                                             |
| -------------------------------------------- | ------------------------------------------------------- |
| `findAllMentorProfiles()`                    | All profiles (admin)                                    |
| `findAllWithFilters(filters: MentorFilters)` | Public listing with category/skill/rating/price filters |
| `findById(id)`                               | By mentor profile ID                                    |
| `findByUserId(userId)`                       | By associated user ID                                   |
| `create(profile)`                            | Persist new profile                                     |
| `updateByUserId(userId, data)`               | Update profile fields                                   |
| `verifyMentor(id, status, rejectionReason?)` | Update verification status                              |
| `addSkill(mentorId, skillId)`                | Attach skill                                            |
| `removeSkill(mentorId, skillId)`             | Detach skill                                            |
| `addCategory(mentorId, categoryId)`          | Attach category                                         |
| `removeCategory(mentorId, categoryId)`       | Detach category                                         |

**`MentorFilters`**

```ts
interface MentorFilters {
  category?: string; // category slug
  skill?: string; // skill name
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string; // full-text on name/bio/title
  page?: number;
  limit?: number;
}
```

### `RefreshTokenRepository` (`domain/token/RefreshTokenRepostory.ts`)

| Method                | Description                |
| --------------------- | -------------------------- |
| `save(token)`         | Persist new refresh token  |
| `findByRawToken(raw)` | Lookup by raw token string |
| `revoke(token)`       | Set `revokedAt`            |

### `SkillRepository` (`domain/skill/SkillRepository.ts`)

| Method             | Description          |
| ------------------ | -------------------- |
| `findAll()`        | All skills           |
| `findById(id)`     | By ID                |
| `findByName(name)` | By name (case check) |
| `create(skill)`    | Persist new skill    |

### `CategoryRepository` (`domain/category/CategoryRepository.ts`)

| Method             | Description    |
| ------------------ | -------------- |
| `findAll()`        | All categories |
| `findBySlug(slug)` | By URL slug    |

### `BookingRepository` (`domain/booking/BookingRepository.ts`)

| Method                                      | Description                                 |
| ------------------------------------------- | ------------------------------------------- |
| `findById(bookingId)`                       | Single booking with mentor/mentee/slot data |
| `findForMentee(menteeId, filters?)`         | List bookings for a mentee                  |
| `findForMentor(mentorId, filters?)`         | List bookings for a mentor                  |
| `findActiveOverlap(mentorId, start, end)`   | Prevent overlapping active sessions         |
| `create(input)`                             | Persist new booking snapshot                |
| `updateStatus(id, status, timestampField?)` | State transition with optional timestamp    |
| `updateMeetingLink(id, meetingLink)`        | Store/update session meeting URL            |

### `AvailabilityManagementRepository` (`domain/availability/AvailabilityManagementRepository.ts`)

| Method                                 | Description                                    |
| -------------------------------------- | ---------------------------------------------- |
| `create(data)`                         | Create one availability window                 |
| `createWeekly(data)`                   | Bulk-create weekly schedule                    |
| `findById(id)`                         | Lookup by availability ID                      |
| `findByIdWithMentor(id)`               | Lookup with mentor-user projection             |
| `findForMentor(mentorId)`              | All availability records for a mentor          |
| `findRecurringForMentor(id, day?)`     | Recurring windows with optional weekday filter |
| `findSpecificDateForMentor(id, date?)` | One-off date windows with optional day filter  |
| `update(id, data)`                     | Update availability fields                     |
| `delete(id)`                           | Delete availability                            |

### `AvailabilityRepository` (`domain/availability/AvailabilityRepository.ts`)

| Method                                     | Description                                              |
| ------------------------------------------ | -------------------------------------------------------- |
| `findForMentorInRange(mentorId, from, to)` | Read availability windows used by booking overlap checks |

### `TimeSlotRepository` (`domain/timeSlot/TimeSlotRepository.ts`)

| Method                                 | Description                                |
| -------------------------------------- | ------------------------------------------ |
| `findById(slotId)`                     | Find concrete slot by ID                   |
| `findByMentorAndRange(mentorId, s, e)` | Find exact slot for mentor/time range      |
| `findBlockedOverlap(mentorId, s, e)`   | Detect overlap with blocked slot           |
| `create(input)`                        | Create one concrete slot                   |
| `claimAvailable(slotId)`               | Atomic claim (AVAILABLE -> BOOKED)         |
| `releaseAvailable(slotId)`             | Release slot back to AVAILABLE when needed |

### `TimeSlotManagementRepository` (`domain/timeSlot/TimeSlotManagementRepository.ts`)

| Method                                        | Description                                   |
| --------------------------------------------- | --------------------------------------------- |
| `findAvailableForMentor(id, start?, end?)`    | Query only AVAILABLE slots                    |
| `findAllForMentor(id, start?, end?, status?)` | Query slots with optional status/date filters |
| `findById(slotId)`                            | Read single slot with booking projection      |
| `updateStatus(slotId, status)`                | Manual status override                        |
| `delete(slotId)`                              | Delete one slot                               |
| `deleteAvailableForMentorInRange(id, s, e)`   | Bulk-delete AVAILABLE slots in date range     |

### `TimeSlotGenerationService` (`domain/timeSlot/TimeSlotGenerationService.ts`)

| Method                            | Description                                             |
| --------------------------------- | ------------------------------------------------------- |
| `generateTimeSlots(input)`        | Materialize concrete slots from availability templates  |
| `getComputedBookableSlots(input)` | Compute bookable windows from availability and blockers |

### `AvailabilitySlotSyncService` (`domain/availability/AvailabilitySlotSyncService.ts`)

| Method                   | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| `reconcileForMentor(id)` | Rebuild/sync generated slots after availability mutations |

---

## 8. Application Use-Cases

Use-cases live in `src/use-cases/` and represent the **application's commands and queries**. Each use-case:

- Accepts a DTO / primitive input
- Orchestrates domain objects and repositories
- Returns a domain result or throws a typed application error

Scheduling and booking flows are now implemented as first-class use-cases over domain ports.

### Identity & Access

| Use-Case               | Input                                      | Core logic                                                                           |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------ |
| `RegisterUserUseCase`  | email, password, firstName, lastName, role | Check email unique → hash password → `User.create()` → save                          |
| `LoginUserUseCase`     | email, password                            | `findByEmail` → verify password → `signAccessToken` → generate + save `RefreshToken` |
| `LogoutUserUseCase`    | refreshToken                               | `findByToken` → `revoke()`                                                           |
| `RotateSessionUseCase` | refreshToken                               | Find → validate not revoked → revoke old → issue new pair                            |

### Errors (`use-cases/errors/`)

| Error                         | HTTP | Scenario                 |
| ----------------------------- | ---- | ------------------------ |
| `UserAlreadyExistsError`      | 409  | Email already registered |
| `InvalidEmailOrPasswordError` | 401  | Wrong credentials        |
| `InvalidRefreshTokenError`    | 401  | Token not found          |
| `RefreshTokenRevokedError`    | 401  | Token already revoked    |

### Mentor Catalogue

| Use-Case                           | Description                             |
| ---------------------------------- | --------------------------------------- |
| `CreateMentorProfileUseCase`       | Create a new profile for a user         |
| `ReadAllMentorsUseCase`            | Fetch all mentor profiles (admin)       |
| `ReadAllMentorsWithFiltersUseCase` | Public filtered listing                 |
| `ReadMentorByIdUseCase`            | Single mentor by profile ID             |
| `ReadMentorByUserIdUseCase`        | Single mentor by user ID                |
| `UpdateMentorByUserIdUseCase`      | Update profile fields                   |
| `VerifyMentorUseCase`              | Admin: approve or reject verification   |
| `AddSkillToMentorUseCase`          | Add skill (by ID or create new by name) |
| `RemoveSkillFromMentorUseCase`     | Remove skill                            |
| `AddCategoryToMentorUseCase`       | Add category                            |
| `RemoveCategoryFromMentorUseCase`  | Remove category                         |

### Profile

| Use-Case                 | Description                        |
| ------------------------ | ---------------------------------- |
| `GetMyProfileUseCase`    | Load current user + mentor profile |
| `UpdateMyProfileUseCase` | Update bio and goals               |

### Skill

| Use-Case               | Description                            |
| ---------------------- | -------------------------------------- |
| `CreateSkillUseCase`   | Admin: create platform-level skill tag |
| `ReadAllSkillsUseCase` | List all skills                        |

### Category

| Use-Case                   | Description         |
| -------------------------- | ------------------- |
| `ReadAllCategoriesUseCase` | List all categories |

### Admin User Management

| Use-Case                 | Description               |
| ------------------------ | ------------------------- |
| `AdminCreateUserUseCase` | Create user of any role   |
| `UpdateUserUseCase`      | Update any user's fields  |
| `DeleteUserUseCase`      | Permanently delete a user |

### Booking

| Use-Case                       | Description                                        |
| ------------------------------ | -------------------------------------------------- |
| `CreateBookingUseCase`         | Create booking from slot ID or explicit time range |
| `ConfirmBookingUseCase`        | Mentor confirms pending booking                    |
| `CancelBookingByMenteeUseCase` | Mentee cancellation + slot release in transaction  |
| `CancelBookingByMentorUseCase` | Mentor cancellation + slot release in transaction  |
| `CompleteBookingUseCase`       | Mark booking completed                             |
| `UpdateMeetingLinkUseCase`     | Set or update meeting link                         |
| `GetBookingByIdUseCase`        | Read single booking                                |
| `GetBookingsForMenteeUseCase`  | Query mentee bookings with filters                 |
| `GetBookingsForMentorUseCase`  | Query mentor bookings with filters                 |

### Scheduling — Availability

| Use-Case                               | Description                             |
| -------------------------------------- | --------------------------------------- |
| `CreateAvailabilityUseCase`            | Create one availability window          |
| `CreateWeeklyScheduleUseCase`          | Bulk-create weekly schedule             |
| `GetAvailabilitiesForMentorUseCase`    | List all mentor availabilities          |
| `GetRecurringAvailabilitiesUseCase`    | List recurring availability windows     |
| `GetSpecificDateAvailabilitiesUseCase` | List one-off availability windows       |
| `GetAvailabilityByIdUseCase`           | Read availability details               |
| `UpdateAvailabilityUseCase`            | Update availability + trigger slot sync |
| `DeleteAvailabilityUseCase`            | Delete availability + trigger slot sync |

### Scheduling — Time Slots

| Use-Case                          | Description                                 |
| --------------------------------- | ------------------------------------------- |
| `GenerateTimeSlotsUseCase`        | Materialize slots for date range            |
| `GetAllSlotsForMentorUseCase`     | Query all slots with date/status filters    |
| `GetAvailableSlotsUseCase`        | Query only available slots                  |
| `GetComputedBookableSlotsUseCase` | Compute bookable slots (availability-aware) |
| `GetTimeSlotByIdUseCase`          | Read single slot                            |
| `UpdateTimeSlotStatusUseCase`     | Manual status update                        |
| `DeleteTimeSlotUseCase`           | Delete single slot                          |
| `BulkDeleteTimeSlotsUseCase`      | Bulk delete available slots in date range   |

---

## 9. Domain Invariants & Business Rules

### User

- Email must be unique globally
- Password is always stored as a bcrypt hash; plain text never persisted
- `UserRole` is immutable post-registration through normal flows (admin can override)
- A user with `role: MENTOR` may have exactly one `MentorProfile` (1-to-1 enforced at DB level with unique constraint on `userId`)

### MentorProfile

- Only one profile per user (`userId` is `@unique`)
- Profile only appears in public listings when `verificationStatus === VERIFIED`
- `rejectionReason` is optional in the current implementation when status is set to `REJECTED`
- `avgRating` and `totalReviews` are computed fields — not directly mutable by users

### Booking

- A `TimeSlot` can have at most one `Booking` (`timeSlotId @unique`)
- `hourlyRate`, `duration`, and `totalAmount` are **snapshotted** at booking time — subsequent mentor price changes do not retroactively affect booked sessions
- Intended rule: a `Review` should only be created for a `Booking` with status `COMPLETED` (review creation endpoints are not implemented yet)
- Only one review per booking (`bookingId @unique` on `Review`)

### RefreshToken

- A revoked token cannot be rotated or used — checked before issuing new pair
- Token rotation atomically revokes the old token and issues the new pair

### Availability & Time Slots

- `TimeSlot` records are primarily derived from `Availability` (bulk generation and computed bookable flows)
- Booking flow can also create a concrete `TimeSlot` on demand when requested time is within mentor availability
- A slot can only be booked when `status === AVAILABLE`
- Booking a slot transitions its status to `BOOKED`

---

## 10. Entity Relationship Overview

```
User ──────────────────────────── RefreshToken (many)
 │
 ├── MentorProfile (0..1)
 │       │
 │       ├── MentorSkill[] ──── Skill (shared, platform-level)
 │       ├── MentorCategory[] ── Category (shared, platform-level)
 │       │
 │       ├── Availability[] ──── TimeSlot[]
 │       │                           │
 │       └── Booking[] ◄─────────────┘ (TimeSlot.booking 1:1)
 │               │
 │               └── Review (0..1)
 │
 ├── Booking[] (as mentee)
 │
 ├── Review[] (as reviewer)
 │
 └── FavoriteMentor[] (saved mentors)


Join tables (no entity model, pure association):
  MentorSkill:    mentorId + skillId (composite PK)
  MentorCategory: mentorId + categoryId (composite PK)
  FavoriteMentor: menteeId + mentorId (unique composite)
```

**Cascade deletes:**

| Parent deleted  | Cascades to                                                                                |
| --------------- | ------------------------------------------------------------------------------------------ |
| `User`          | `RefreshToken[]`, `MentorProfile`, `Booking[]` (as mentee), `Review[]`, `FavoriteMentor[]` |
| `MentorProfile` | (via User cascade) `Availability[]`, `TimeSlot[]` (via Booking cascade)                    |
| `TimeSlot`      | `Booking` (cascade)                                                                        |
| `Booking`       | `Review`                                                                                   |
