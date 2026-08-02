# Access Control API

Base URL: `http://localhost:5000/api/access`  
Auth header (role APIs): `Authorization: Bearer <access-jwt>`  
S2S header (website APIs): `x-internal-key: <INTERNAL_REGISTER_KEY>`

Roles: `super-admin` · `white-label-admin` · `counselor`

**Admin (`MONGODB_ADMIN`) is the single source of truth** for organizations, counselors, referral codes, roles, and student ownership mapping. Vidhyasaarthi stores only the IDs Admin returns.

Architecture + env matrix: [INTEGRATION.md](./INTEGRATION.md).

## Setup

```bash
cd server
npm install
npm run seed:super-admin
# Create organizations / counselors / admins in the Access Control UI
npm run seed:default-org   # optional: org id for students who skip referral
npm run dev
```

## Environment

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | Prodigy users (Users tab / `/api/auth/login`) |
| `MONGODB_ADMIN` | Access Control DB (orgs, counselors, referral codes, access students) |
| `MONGODB_URI_VIDHYASAARTHI` | Vidhyasaarthi platform users (Users tab only) |
| `INTERNAL_REGISTER_KEY` | Shared secret with student website; **required in production** |
| `DEFAULT_ORGANIZATION_ID` | Org for students who skip / have invalid referral |
| `JWT_SECRET` | Signs Access + Prodigy JWTs |
| `CORS_ORIGIN` | Allowed frontends |

---

## Website ↔ Admin contract (S2S)

All three endpoints require `x-internal-key` when `INTERNAL_REGISTER_KEY` is set (always required on Vercel / `NODE_ENV=production`).

Referral codes live in the Admin `referral_codes` collection (soft-revoke history). Uniqueness is **global** on `code` (active + revoked — dead codes are never reissued). Index `{ counselorId: 1, status: 1 }` for active-code lookup.

### `GET /referral/validate?code=`

Empty / whitespace code → `{ "valid": false, "reason": "not_provided", ... }` (treat as optional skip on the website, not a hard error for idle UI).

**Valid:**
```json
{
  "valid": true,
  "organizationId": "...",
  "counselorId": "...",
  "counselorName": "...",
  "referralCode": "RAHAVA",
  "counselor": { "id": "...", "name": "...", "referralCode": "..." }
}
```

**Invalid (always includes `reason`):**
```json
{ "valid": false, "reason": "not_found|revoked|malformed|counselor_inactive|org_inactive", "message": "..." }
```

### `POST /students/register`

Body (callers must **not** send `organizationId`):
```json
{ "name": "...", "email": "...", "phone?": "...", "referralCode?": "..." }
```

Rules:
- **No code / empty string:** Admin places student in `DEFAULT_ORGANIZATION_ID` as unassigned (`registrationType: "skipped"`).
- **With valid `referralCode`:** sets `organizationId` + `assignedCounselorId` + immutable `referredCounselorId` + `referralCodeEntered` from the active `referral_codes` row.
- **With invalid / revoked / malformed code:** **400 hard-block** — student is **not** created. Response includes `reason`.
- Never trust client/website-supplied organization IDs.

**201:** `{ "student": { "id", "organizationId", "assignedCounselorId", "referredCounselorId", "referralCodeEntered", ... } }`

### `GET /students/lookup?email=`

```json
{
  "assignmentStatus": "assigned|unassigned|not-registered",
  "student": { ... } | null,
  "counselor": { "id", "name", "email", "phone" } | null
}
```

---

## Auth (Access Control UI)

| Method | Path | Access | Body |
|--------|------|--------|------|
| POST | `/auth/login` | Public | `{ email, password }` |
| GET | `/auth/me` | Any access role | — |

JWT includes `typ: "access"` and is separate from Prodigy `/api/auth/login`.

## Organizations / Admins / Counselors / Students (JWT)

| Area | Notes |
|------|-------|
| Organizations | Super Admin CRUD + status toggle + hard delete (cascades admins/counselors/students/codes) |
| Admins | Super creates WL admins for an org |
| Counselors | Super + Org Admin; **referral code auto-generated** on create |
| Students | List/assign/notes; counselors see assigned only |

Import Postman: [`AccessControl.postman_collection.json`](./AccessControl.postman_collection.json)
