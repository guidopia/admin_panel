# Access Control API

Base URL: `http://localhost:5000/api/access`  
Auth header: `Authorization: Bearer <token>`

Roles: `super-admin` · `white-label-admin` · `counselor`

## Setup

```bash
cd server
npm install
npm run seed:super-admin
# optional demo org/admin/counselor/students:
npm run seed:access-demo
npm run dev
```

Default Super Admin: `superadmin@guidopia.com` / `SuperAdmin@123`

Import Postman collection: [`AccessControl.postman_collection.json`](./AccessControl.postman_collection.json)

## Auth

| Method | Path | Access | Body |
|--------|------|--------|------|
| POST | `/auth/login` | Public | `{ email, password }` |
| GET | `/auth/me` | Any access role | — |

Login response:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "accessRole": "super-admin|white-label-admin|counselor",
    "organizationId": "...|null",
    "counselorId": "...|null",
    "status": "active"
  }
}
```

JWT includes `typ: "access"` and is separate from the platform Users admin token (`/api/auth/login`).

## Organizations (Super Admin)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/organizations` | Includes admin/counselor/student counts |
| POST | `/organizations` | `{ name, branding?, primaryColor?, logoUrl? }` |
| GET | `/organizations/:id` | |
| PATCH | `/organizations/:id` | Partial update + optional `status` |
| PATCH | `/organizations/:id/status` | Toggle active/inactive |

## Admins (White-label)

| Method | Path | Access |
|--------|------|--------|
| GET | `/admins` | Super + Org Admin (scoped) |
| POST | `/admins` | Super only — `{ organizationId, name, email, password? }` |
| GET | `/admins/:id` | Super + Org Admin |
| PATCH | `/admins/:id` | Super only |

If `password` is omitted on create, a temporary password is returned once.

## Counselors

| Method | Path | Access |
|--------|------|--------|
| GET | `/counselors` | Role-scoped |
| POST | `/counselors` | Super + Org Admin — auto-generates unique referral code (6–8 uppercase) |
| GET | `/counselors/:id` | |
| PATCH | `/counselors/:id` | |
| DELETE | `/counselors/:id` | Unassigns students; does **not** delete them |
| POST | `/counselors/:id/referral-code` | Regenerate unique code |

## Students

| Method | Path | Access |
|--------|------|--------|
| POST | `/students/register` | **Public** — referral auto-assigns counselor + org |
| GET | `/students` | Role-scoped (counselor = assigned only) |
| GET | `/students/unassigned` | Super + Org Admin |
| GET | `/students/:id` | Scoped |
| PATCH | `/students/:id/assign` | `{ counselorId }` or `null` to unassign |
| POST | `/students/:id/notes` | `{ text }` |

### Registration rules

- **With `referralCode`**: finds active counselor → sets `organizationId`, `assignedCounselorId`, `registrationType: "referral"`.
- **Without referral**: requires `organizationId`; student stays unassigned (`registrationType: "skipped"`), visible to Org Admin only until assigned.

## Analytics

| Method | Path | Notes |
|--------|------|-------|
| GET | `/analytics` | Super: platform-wide; Org Admin: own org; Counselor: own students |
| GET | `/analytics?organizationId=` | Super Admin org filter |

## Isolation rules

- Org Admin / Counselor JWTs are locked to `organizationId`.
- Counselors only see students where `assignedCounselorId` matches their profile.
- Cross-organization reads/writes return `403`.
