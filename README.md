# TaskHub — Full Stack Task Management Application

> **⚠️ IMPORTANT — Backend Deployed on Render Free Tier**
> **The backend server automatically shuts down after 15 minutes of inactivity. The first request after inactivity will take approximately 30 seconds to wake the server back up. This is a Render free tier limitation.**

---

## 🌐 Live Deployment

| | URL |
|--|-----|
| **Frontend** | https://to-do-tau-ivory.vercel.app/ |
| **Backend API** | https://to-do-86rt.onrender.com |

### Deployed API Endpoints

```
Health Check
  GET    https://to-do-86rt.onrender.com/health

Auth
  POST   https://to-do-86rt.onrender.com/api/auth/register
  POST   https://to-do-86rt.onrender.com/api/auth/login
  POST   https://to-do-86rt.onrender.com/api/auth/refresh
  POST   https://to-do-86rt.onrender.com/api/auth/logout
  GET    https://to-do-86rt.onrender.com/api/auth/me
  PATCH  https://to-do-86rt.onrender.com/api/auth/me
  GET    https://to-do-86rt.onrender.com/api/auth/google
  GET    https://to-do-86rt.onrender.com/api/auth/github

Tasks (JWT required)
  GET    https://to-do-86rt.onrender.com/api/tasks
  POST   https://to-do-86rt.onrender.com/api/tasks
  GET    https://to-do-86rt.onrender.com/api/tasks/:id
  PATCH  https://to-do-86rt.onrender.com/api/tasks/:id
  DELETE https://to-do-86rt.onrender.com/api/tasks/:id

Admin (JWT + admin role required)
  GET    https://to-do-86rt.onrender.com/api/admin/dashboard
  GET    https://to-do-86rt.onrender.com/api/admin/enums
  GET    https://to-do-86rt.onrender.com/api/admin/users
  GET    https://to-do-86rt.onrender.com/api/admin/users/:id
  PATCH  https://to-do-86rt.onrender.com/api/admin/users/:id/status
  PATCH  https://to-do-86rt.onrender.com/api/admin/users/:id/role
  DELETE https://to-do-86rt.onrender.com/api/admin/users/:id
  GET    https://to-do-86rt.onrender.com/api/admin/tasks
  DELETE https://to-do-86rt.onrender.com/api/admin/tasks/:id
  GET    https://to-do-86rt.onrender.com/api/admin/logs
```

---

## 🔐 Demo Credentials

```
┌─────────────────────────────────────────────┐
│  CREDENTIALS                                │
├─────────────────────────────────────────────┤
│  Admin   admin@taskapi.dev  Admin@1234      │
│  User 1  alice@taskapi.dev  Alice@1234      │
│  User 2  bob@taskapi.dev    Bob@12345       │
│  User 3  carol@taskapi.dev  Carol@1234      │
└─────────────────────────────────────────────┘
```

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Setup — Backend](#local-setup--backend)
- [Local Setup — Frontend](#local-setup--frontend)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Roles & Permissions](#roles--permissions)
- [Deploy on Render (Backend)](#deploy-on-render-backend)
- [Deploy on Vercel (Frontend)](#deploy-on-vercel-frontend)

---

## Features

### User Features
- Personal dashboard with task statistics and completion rate
- Full CRUD — create, read, update, delete tasks
- Filter tasks by status and priority
- Grid and list view toggle
- Real-time status updates

### Admin Features
- Platform-wide analytics with interactive charts (Recharts)
- User management — view, activate/deactivate, promote/demote, delete
- Task monitoring across all users
- Activity logs with filters by action, user, and date range

### Authentication
- Email and password login and registration
- OAuth2 via Google and GitHub (Passport.js)
- JWT access token + refresh token with rotation
- Role-based access control — `user` and `admin`
- Inactive account blocking at middleware level

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js v18+ |
| Framework | Express.js v4 |
| Database | MongoDB (Mongoose v8) |
| Authentication | JWT (jsonwebtoken) + Passport.js |
| OAuth2 | passport-google-oauth20, passport-github2 |
| Password Hashing | bcryptjs (salt rounds: 12) |
| Validation | express-validator |
| Logging | winston + morgan |
| Security | helmet, cors, express-rate-limit |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router DOM v6 |
| Build Tool | Vite |

---

## Project Structure

```
TO-DO/
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # Mongoose connection
│   │   │   ├── logger.js          # Winston logger
│   │   │   └── passport.js        # JWT + OAuth strategies
│   │   ├── controllers/
│   │   │   ├── authController.js  # register, login, OAuth, refresh, logout
│   │   │   ├── taskController.js  # user-scoped task CRUD
│   │   │   └── adminController.js # admin APIs + analytics
│   │   ├── middleware/
│   │   │   ├── auth.js            # authenticate, requireAdmin, requireRole
│   │   │   ├── errorHandler.js    # global error + 404 handler
│   │   │   └── validators.js      # request validators
│   │   ├── models/
│   │   │   ├── User.js            # User schema — roles, OAuth, status
│   │   │   ├── Task.js            # Task schema with owner ref
│   │   │   └── ActivityLog.js     # Activity log with 90-day TTL
│   │   ├── routes/
│   │   │   ├── auth.js            # /api/auth/*
│   │   │   ├── tasks.js           # /api/tasks/*
│   │   │   └── admin.js           # /api/admin/*
│   │   ├── utils/
│   │   │   ├── token.js           # JWT helpers
│   │   │   ├── activityLogger.js  # fire-and-forget log writer
│   │   │   ├── response.js        # standardised JSON helpers
│   │   │   └── seed.js            # DB seeder
│   │   ├── app.js                 # Express app setup
│   │   └── server.js              # entry point + graceful shutdown
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
└── Frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   └── DashboardLayout.tsx
    │   │   ├── ui/                # shadcn/ui components
    │   │   └── ProtectedRoute.tsx
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── hooks/
    │   │   └── use-toast.ts
    │   ├── lib/
    │   │   ├── api.ts             # API client with token refresh
    │   │   └── utils.ts
    │   ├── pages/
    │   │   ├── admin/
    │   │   │   ├── Dashboard.tsx
    │   │   │   ├── Users.tsx
    │   │   │   ├── Tasks.tsx
    │   │   │   └── Logs.tsx
    │   │   ├── auth/
    │   │   │   ├── LoginPage.tsx
    │   │   │   └── RegisterPage.tsx
    │   │   └── user/
    │   │       ├── Dashboard.tsx
    │   │       └── Tasks.tsx
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── .env.example
    └── package.json
```

---

## Local Setup — Backend

### Prerequisites
- **Node.js** v18+ → [nodejs.org](https://nodejs.org)
- **MongoDB** v6+ → [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
- **Git** → [git-scm.com](https://git-scm.com)

### 1. Navigate to backend folder

```bash
cd Backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` — see [Environment Variables — Backend](#backend-1) below.

### 4. Start MongoDB

```bash
# Windows
mongod

# macOS (Homebrew)
brew services start mongodb-community

# Verify connection
mongosh
```

### 5. Seed the database

```bash
npm run seed
```

### 6. Start development server

```bash
npm run dev
```

API runs at `http://localhost:5000`

---

## Local Setup — Frontend

### 1. Navigate to frontend folder

```bash
cd Frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

To point at the live deployed backend instead:

```env
VITE_API_URL=https://to-do-86rt.onrender.com
```

### 4. Start development server

```bash
npm run dev
```

App runs at `http://localhost:5173`

### 5. Build for production

```bash
npm run build
```

Built files go into the `dist/` folder.

---

## Environment Variables

### Backend

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
# Local:
MONGO_URI=mongodb://localhost:27017/taskapi
# Atlas (encode special chars — @ becomes %40):
MONGO_URI=mongodb+srv://username:password%40here@cluster0.xxxxx.mongodb.net/taskapi

# JWT — generate with:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_64_char_random_hex
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=another_different_64_char_random_hex
JWT_REFRESH_EXPIRE=30d

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Frontend URL
CLIENT_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Frontend

```env
VITE_API_URL=http://localhost:5000
```

---

## API Reference

All protected routes require:
```
Authorization: Bearer <accessToken>
```

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | Public | Create account (always role: user) |
| POST | `/login` | Public | Login — returns tokens + user with role |
| POST | `/refresh` | Public | Rotate tokens using refreshToken |
| POST | `/logout` | JWT | Invalidate refresh token |
| GET | `/me` | JWT | Current user profile |
| PATCH | `/me` | JWT | Update name or avatar |
| GET | `/google` | Public | Google OAuth redirect |
| GET | `/github` | Public | GitHub OAuth redirect |

### Tasks — `/api/tasks`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | JWT | My tasks — paginated, filterable |
| POST | `/` | JWT | Create task |
| GET | `/:id` | JWT | Single task |
| PATCH | `/:id` | JWT | Update task |
| DELETE | `/:id` | JWT | Delete task |

Query params: `?page=1&limit=10&status=todo&priority=high&search=text&sortBy=createdAt&order=desc`

### Admin — `/api/admin`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard` | Admin | Stats + charts + recent logins |
| GET | `/enums` | Admin | All valid filter values |
| GET | `/users` | Admin | All users paginated |
| GET | `/users/:id` | Admin | User + task summary + activity |
| PATCH | `/users/:id/status` | Admin | Set active / inactive |
| PATCH | `/users/:id/role` | Admin | Set user / admin |
| DELETE | `/users/:id` | Admin | Delete user + their tasks |
| GET | `/tasks` | Admin | All tasks across all users |
| DELETE | `/tasks/:id` | Admin | Delete any task |
| GET | `/logs` | Admin | Activity logs |

---

## Roles & Permissions

| Action | User | Admin |
|--------|:----:|:-----:|
| Register / Login | ✅ | ✅ |
| View own profile | ✅ | ✅ |
| Create task | ✅ | ✅ |
| View own tasks only | ✅ | ✅ |
| Update own tasks | ✅ | ✅ |
| Delete own tasks | ✅ | ✅ |
| View all users | ❌ | ✅ |
| Delete any user | ❌ | ✅ |
| Change user status | ❌ | ✅ |
| Change user role | ❌ | ✅ |
| View all tasks | ❌ | ✅ |
| Delete any task | ❌ | ✅ |
| View activity logs | ❌ | ✅ |
| View dashboard analytics | ❌ | ✅ |

> Roles are enforced server-side. `register` always creates role `user`. Admin must be assigned via `PATCH /api/admin/users/:id/role` or via seed script.

---

## Deploy on Render (Backend)

> **⚠️ Free tier spins down after 15 minutes of inactivity. First request after sleep takes ~30 seconds.**

### 1. Push to GitHub

```bash
cd Backend
git add .
git commit -m "deploy: backend"
git push
```

### 2. Create Web Service on Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect GitHub → select your repo
3. Configure:

```
Root Directory:  Backend
Runtime:         Node
Build Command:   npm install
Start Command:   npm start
```

### 3. Add Environment Variables in Render

```
NODE_ENV                 = production
PORT                     = 5000
MONGO_URI                = mongodb+srv://user:pass%40word@cluster.mongodb.net/taskapi
JWT_SECRET               = your_jwt_secret
JWT_EXPIRE               = 7d
JWT_REFRESH_SECRET       = your_refresh_secret
JWT_REFRESH_EXPIRE       = 30d
CLIENT_URL               = https://your-frontend.vercel.app
RATE_LIMIT_WINDOW_MS     = 900000
RATE_LIMIT_MAX           = 100
GOOGLE_CALLBACK_URL      = https://your-app.onrender.com/api/auth/google/callback
GITHUB_CALLBACK_URL      = https://your-app.onrender.com/api/auth/github/callback
```

### 4. Allow MongoDB Atlas Connections

MongoDB Atlas → **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`)

### 5. Seed Production DB

Render dashboard → your service → **Shell** tab:
```bash
npm run seed
```

---

## Deploy on Vercel (Frontend)

### 1. Push Frontend to GitHub

```bash
cd Frontend
git add .
git commit -m "deploy: frontend"
git push
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Set **Root Directory** to `Frontend`
4. Add environment variable:

```
VITE_API_URL = https://your-app.onrender.com
```

5. Click **Deploy**

---

## Available Scripts

### Backend
```bash
npm start        # production server
npm run dev      # development with nodemon
npm run seed     # seed database
```

### Frontend
```bash
npm run dev      # development server
npm run build    # production build
npm run preview  # preview production build
npm run lint     # ESLint
```

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `querySrv ENOTFOUND` | Wrong MongoDB URI | Check URI, encode `@` as `%40` in password |
| `401 Unauthorized` | Token expired | Call `POST /api/auth/refresh` |
| `403 Forbidden` | Wrong role | Admin-only route accessed with user token |
| `Exited with status 1` on Render | Wrong root directory | Set `Root Directory: Backend` in Render settings |
| Frontend shows blank page | Wrong `VITE_API_URL` | Check `.env` points to correct backend URL |
| CORS error in browser | `CLIENT_URL` mismatch | Set `CLIENT_URL` to exact frontend origin in backend env |

---

## Security Notes

- `.env` files are gitignored — never commit them
- JWT secrets should be 64+ random characters
- OAuth credentials must be rotated immediately if accidentally exposed
- Passwords hashed with bcrypt at 12 salt rounds
- Rate limiting: 100 req/15min globally, 10 req/15min on auth routes
- `register` endpoint always assigns `role: user` — role escalation blocked at validator level
