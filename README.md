# OSB Car Service Backend API (`osb.be`)

NestJS 10 + PostgreSQL + Prisma 5 backend application for the OSB Car Service booking platform.

## Architecture

- **Modular Architecture**: NestJS modules structured with `api/core/` (foundational infrastructure & shared domains) and `api/module/` (high-level business workflows).
- **CRUD Abstraction**: Every service extends `CrudService`. Only `CrudService` directly interacts with the Prisma client through generalized `findOne`, `findAll`, `create`, `update`, `delete`, and `transaction` operations.
- **Multi-Tenant Isolation**: Scoped by dealer via the `x-dealer-id` request header. Tenant models (`Customer`, `Booking`, `User`, `OperatingHour`, `DealerService`, `DealerPackage`) automatically enforce dealer isolation.
- **Optional Redis Cache**: Integrated caching through `RedisService`. If `REDIS_URL` is omitted, requests query PostgreSQL directly without failure.
- **i18n Localization**: Errors and responses use `t('KEY', params, locale)` reading from `api/i18n/{locale}/data.json` (`en` and `vi` supported).
- **Responsive Mail**: Transactional emails rendered via MJML (`booking-confirmation`, `password-reset`, `welcome`).

---

## Environment Configuration

Copy `.env.example` to `.env` and configure your credentials:

```bash
cp .env.example .env
```

Key variables:
- `DATABASE_URL`: PostgreSQL connection string (`postgresql://postgres:password@localhost:5432/osb_db?schema=public`)
- `PORT`: HTTP port (default: `3000`)
- `CORS_URL`: Allowed origins comma-separated (e.g. `http://localhost:3000,http://localhost:3001` or `*`)
- `LOG_LEVELS`: Logging verbosity (`log,error,warn,debug,verbose`)
- `JWT_*`: Distinct secret & expiration pairs for Staff Admin, Refresh, Customer, Customer Refresh, and Password Reset.
- `MAIL_*`: SMTP server credentials for Nodemailer.
- `REDIS_URL`: Redis URI (optional).

---

## Database Setup & Migration

Per project instructions, migration execution is handled manually by the operator:

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Create and apply initial migration
npx prisma migrate dev --name init

# 4. Seed initial database data (dealers, operating hours, packages, services, vehicle catalog, admin)
npm run seed
```

---

## Running the Application

```bash
# Development mode with hot-reload
npm run start:dev

# Type checking without emitting build files
npm run typecheck

# Production build & start
npm run build
npm run start:prod
```

---

## API Endpoints Reference

All routes are prefixed with `/api`. Multi-tenant requests should include the header `x-dealer-id: <id>`.

### 1. Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Staff login (admin / manager / technician) |
| `POST` | `/api/auth/refresh` | Public | Refresh staff JWT token |
| `POST` | `/api/auth/logout` | Staff JWT | Staff logout |
| `POST` | `/api/customer/login` | Public (`x-dealer-id`) | Customer login |
| `POST` | `/api/customer/refresh` | Public | Refresh customer JWT token |
| `GET` | `/api/customer/profile` | Customer JWT | Customer profile details |
| `POST` | `/api/customer/logout` | Customer JWT | Customer logout |
| `POST` | `/api/customer/forgot-password`| Public (`x-dealer-id`) | Send password reset email |
| `POST` | `/api/customer/reset-password` | Public | Reset password with token |
| `PATCH`| `/api/customer/change-password`| Customer JWT | Update customer password |
| `PATCH`| `/api/customer/profile-update` | Customer JWT | Update customer profile |
| `POST` | `/api/customer/check-email-exist` | Public (`x-dealer-id`) | Validate email availability |

### 2. Vehicle Catalog & Vehicles

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/vehicle-catalog/brands/search` | Public | Search vehicle makes/brands |
| `POST` | `/api/vehicle-catalog/models/search` | Public | Search vehicle models with size class |
| `GET`  | `/api/vehicles` | Customer JWT | List logged-in customer vehicles |
| `POST` | `/api/vehicles` | Customer JWT | Save customer vehicle |
| `PATCH`| `/api/vehicles/:id` | Customer JWT | Update customer vehicle |
| `DELETE`| `/api/vehicles/:id` | Customer JWT | Delete customer vehicle |

### 3. Dealers, Packages & Services

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/dealers/search` | Public | Search dealer branches |
| `POST` | `/api/dealers/:dealerId/public` | Public | Get dealer branch details |
| `PATCH`| `/api/dealers/:dealerId/edit-operating-hour` | Staff JWT | Update branch operating hours |
| `POST` | `/api/packages/public/search` | Public | Search active packages |
| `POST` | `/api/services/public/search` | Public | Search active services |

### 4. Booking & Appointments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/booking-appointment/time-slots-period` | Public (`x-dealer-id`) | Available booking dates and 30-min time slots |
| `POST` | `/api/booking-appointment/available-technicians`| Public (`x-dealer-id`) | Bookable technicians free at given slot |
| `POST` | `/api/booking` | Customer JWT (`x-dealer-id`)| Create customer booking |
| `POST` | `/api/booking/guest` | Public (`x-dealer-id`) | Create guest booking (auto-registers guest customer) |
| `POST` | `/api/booking/admin` | Staff JWT (`x-dealer-id`) | Create booking on behalf of customer |
| `POST` | `/api/booking/lookup` | Public | Lookup booking by `bookingId` and phone / plate |
| `PATCH`| `/api/booking/lookup/cancel` | Public | Cancel booking via lookup |
| `PATCH`| `/api/booking/lookup/reschedule` | Public | Reschedule booking date/time via lookup |
| `POST` | `/api/booking/search` | Staff JWT (`x-dealer-id`) | Search bookings (admin) |
| `PATCH`| `/api/booking/:id/status` | Staff JWT (`x-dealer-id`) | Update booking status |
| `PATCH`| `/api/booking/:id/cancelled` | Staff JWT (`x-dealer-id`) | Cancel booking (admin) |
| `PATCH`| `/api/booking/:id/completed` | Staff JWT (`x-dealer-id`) | Mark booking completed |
| `PATCH`| `/api/booking/:id/update-service` | Staff JWT (`x-dealer-id`) | Update booking services & recalculate quote |
| `PATCH`| `/api/booking/:id/update-appointment` | Staff JWT (`x-dealer-id`) | Reschedule appointment |

---

## Booking Status Mapping

| Backend Status (`BookingStatus`) | Frontend Status | Notes |
|---|---|---|
| `Pending` | `pending` | Newly created appointment awaiting check-in |
| `BookedIn` | `confirmed` | Confirmed appointment (blocks technician schedule) |
| `CheckIn` | `in-progress` | Vehicle checked into workshop |
| `Completed` | `completed` | Service complete (locked, immutable) |
| `Cancelled` | `cancelled` | Cancelled appointment (locked, immutable) |

---

## Vehicle Size Multipliers

For services flagged with `sizeSensitive: true`, prices and durations are scaled according to the model's `sizeClass`:
- `Compact`: `0.9x`
- `Sedan`: `1.0x` (base)
- `Suv`: `1.2x`
- `LargeSuvTruck`: `1.4x`
