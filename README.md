# Admin Panel (MERN) — Guidopia

Full-stack MERN admin panel:

- `client/` React + Vite + Tailwind
- `server/` Node + Express + MongoDB Atlas (Mongoose) + JWT auth

## Quick start (dev)

### 1) Server env

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_uri
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### 2) Client env

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 3) Install + run

```bash
cd server
npm i
npm run dev
```

```bash
cd client
npm i
npm run dev
```

Open `http://localhost:5173`.

## Notes

- Login uses an existing user from your `users` collection with `role: "admin"` and a valid `password` hash.
- User schema is backward-compatible (missing fields default safely).

"# admin_panel" 
