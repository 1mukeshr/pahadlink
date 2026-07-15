# PahadLink

Himalayan products store — React + Express + MongoDB (`Pahadi_link`).

## Folder structure

```
pahadlink/
├── src/
│   ├── App.jsx                 # App shell
│   ├── main.jsx                # Entry
│   ├── config/                 # Routes, roles, API URL
│   ├── routes/AppRoutes.jsx    # All page routes
│   ├── context/                # AuthContext / useAuth
│   ├── services/               # API calls (auth, orders, crm)
│   ├── data/                   # Static site data
│   ├── assets/css/             # Global styles
│   ├── components/
│   │   ├── layout/             # Header, Footer, CategoryNav…
│   │   ├── auth/               # AuthLayout, ProtectedRoute
│   │   └── icons/              # SVG icons
│   └── pages/
│       ├── Home.jsx
│       ├── auth/               # Login, Register, Forgot, Reset
│       └── admin/              # Dashboard, Orders, CRM, Roles
└── server/
    ├── index.js                # Express entry
    ├── config/                 # db.js, constants.js
    ├── models/                 # User, Order, CrmLead
    ├── routes/                 # auth, orders, crm
    ├── middleware/             # JWT protect / roles
    └── scripts/                # seed:admin, seed:crm
```

## Quick start

```bash
npm install
npm run seed:admin
npm run seed:crm
npm start
```

- Website: http://localhost:5173  
- API: http://localhost:5000  
- DB: `mongodb://127.0.0.1:27017/Pahadi_link`  
- Admin: `admin` / `admin123`

## Where to edit what

| Task | File |
|------|------|
| New page route | `src/routes/AppRoutes.jsx` + `src/config` |
| Login / register UI | `src/pages/auth/` |
| Admin screens | `src/pages/admin/` |
| Header / footer | `src/components/layout/` |
| API helpers | `src/services/` |
| Mongo models | `server/models/` |
| API endpoints | `server/routes/` |
