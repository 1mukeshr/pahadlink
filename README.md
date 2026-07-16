# PahadLink

Himalayan products store — React + Express + MongoDB (`Pahadi_link`).

## Quick start (local)

```bash
npm install
npm run seed:admin
npm run seed:crm
npm start
```

- Website: http://localhost:5173  
- API: http://localhost:5000/api/health  
- DB: `mongodb://127.0.0.1:27017/Pahadi_link`  
- Admin: `admin` / `admin123`

## GitHub Pages + real backend (required for login/register online)

GitHub Pages is **static** — it cannot run Express or MongoDB. You need a hosted API.

### 1) MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Database user + Network Access → allow `0.0.0.0/0` (or Render IPs)
3. Connection string, DB name **`Pahadi_link`**:
   `mongodb+srv://USER:PASS@CLUSTER.mongodb.net/Pahadi_link?retryWrites=true&w=majority`

### 2) Deploy API on Render

1. Open [render.com/deploy?repo=https://github.com/1mukeshr/pahadlink](https://render.com/deploy?repo=https://github.com/1mukeshr/pahadlink)  
   or Render → **New** → **Blueprint** → this repo (`render.yaml`)
2. Set:
   - `MONGODB_URI` = Atlas URI above
   - `ADMIN_PASSWORD` = strong password
3. Deploy, then open: `https://YOUR-SERVICE.onrender.com/api/health`  
   Expect: `{ "ok": true, "database": "Pahadi_link", ... }`

### 3) Point the GitHub Pages frontend at the API

1. Repo → **Settings → Secrets and variables → Actions**
2. New secret:
   - Name: `VITE_API_URL`
   - Value: `https://YOUR-SERVICE.onrender.com/api`  (must end with `/api`)
3. Push to `main` (or re-run **Deploy GitHub Pages** workflow)

Live site: https://1mukeshr.github.io/pahadlink/

> Free Render services sleep after idle. First login after sleep can take ~30–50 seconds.

## Folder structure

```
pahadlink/
├── src/          # React storefront
├── server/       # Express API (auth, orders, crm, contact)
├── render.yaml   # Render Blueprint for hosted API
└── .github/workflows/deploy-pages.yml
```

## Where to edit what

| Task | File |
|------|------|
| New page route | `src/routes/AppRoutes.jsx` + `src/config` |
| Login / register UI | `src/pages/auth/` |
| Header / footer | `src/components/layout/` |
| API helpers | `src/services/` |
| Mongo models | `server/models/` |
| API endpoints | `server/routes/` |
