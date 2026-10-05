# 💰 Spendwise AI — AI Personal Finance Manager

> **See your money. Understand your future.**

Spendwise AI is a **privacy-first AI Personal Finance Manager** designed to help users track income and expenses, understand spending patterns, create realistic budgets, monitor savings goals, and receive AI-generated financial insights with mathematical integrity.

The core idea is:
**Track → Understand → Predict → Recommend → Improve**

---

## 🏗️ Production Architecture

Spendwise AI is built as a modern, decoupled full-stack application:

* **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS (Deployed on **Vercel**)
* **Backend:** Node.js + Express + TypeScript + Zod (Deployed on **Render**)
* **Database:** Managed **PostgreSQL** provisioned via **Prisma ORM**
* **AI Engine:** Server-Side **Google Gemini API** (with OpenAI/Groq support and a built-in **Deterministic Financial Reasoning Engine** fallback)

```text
 ┌────────────────────────────────────────────────────────┐
 │                   FRONTEND (Vercel)                    │
 │  • React 18 + Vite SPA                                 │
 │  • Client-side In-Memory Statement Parsing (CSV)       │
 │  • Configured via VITE_API_BASE_URL                    │
 └───────────────────────────┬────────────────────────────┘
                             │ HTTPS / CORS
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │                    BACKEND (Render)                    │
 │  • Express 4 REST API + TypeScript                     │
 │  • Rate Limiting, Helmet Security, Zod Validation      │
 │  • Strict User Isolation & Multi-Tenancy               │
 │  • JWT Authentication (Bearer Tokens)                  │
 └─────────────┬────────────────────────────┬─────────────┘
               │                            │
               ▼                            ▼
 ┌───────────────────────────┐ ┌──────────────────────────┐
 │   DATABASE (PostgreSQL)   │ │    AI ENGINE (Server)    │
 │ • Managed PostgreSQL      │ │ • Google Gemini API      │
 │ • Prisma ORM & Migrations │ │ • OpenAI / Groq Support  │
 │ • ACID Data Guarantees    │ │ • Deterministic Fallback │
 └───────────────────────────┘ └──────────────────────────┘
```

---

## 🔧 Actual Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS | High-performance SPA with client-side CSV processing and interactive charts |
| **Backend** | Node.js, Express 4, TypeScript | Modular REST API with typed Zod validation schemas and Helmet security |
| **Database** | PostgreSQL | Managed relational database with foreign keys, indexes, and ACID guarantees |
| **ORM** | Prisma ORM 5 | Type-safe queries, connection pooling, and automated schema migrations |
| **Authentication** | JWT & bcrypt | Bearer token authorization with 10-round salted bcrypt password hashing |
| **AI Integration** | Google Gemini / OpenAI / Groq | Server-side only; deterministic mathematical engine fallback |
| **Deployment** | Vercel (Frontend) + Render (Backend) | Automated deployments with Render Blueprints (`render.yaml`) |

---

## 🚀 Local Setup

### Prerequisites
* **Node.js** (v18 or higher)
* **npm** (v9 or higher)
* **PostgreSQL** instance (local or hosted like Supabase/Neon/Render)

### 1. Clone the repository
```bash
git clone https://github.com/roshanisingh12/SpendWise-AI.git
cd SpendWise-AI
```

### 2. Backend Setup
```bash
cd server
npm install

# Create environment configuration
cp .env.example .env
```

Edit `server/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/spendwise"
JWT_SECRET="a-very-secure-jwt-secret-with-at-least-32-characters"
JWT_EXPIRES_IN="7d"
PORT=5000
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
GEMINI_API_KEY="" # Optional: Add your Gemini key or leave blank for deterministic engine
```

Apply migrations and generate Prisma client:
```bash
npx prisma migrate dev
```

Start backend development server:
```bash
npm run dev
```
The API will run at `http://localhost:5000/api` (Health check: `http://localhost:5000/api/health`).

### 3. Frontend Setup
In a new terminal window at the repository root:
```bash
npm install

# Create frontend environment configuration
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## ⚙️ Environment Variables

### Frontend Variables (`.env`)
| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API (publicly exposed to browser bundle) | `https://spendwise-api.onrender.com/api` or `/api` |

> ⚠️ **IMPORTANT:** Never put database credentials, private API keys, or JWT secrets in `VITE_*` variables. They are compiled into the client-side JavaScript.

### Backend Variables (`server/.env`)
| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://user:pass@host:5432/spendwise` |
| `JWT_SECRET` | **Yes** | Secret string for signing auth tokens (minimum 32 characters) | `e.g. 64-char random hex string` |
| `JWT_EXPIRES_IN` | No | Expiration duration for JWT tokens (default: `7d`) | `7d` |
| `PORT` | No | Port to bind backend server (Render sets automatically) | `5000` or `10000` |
| `CLIENT_URL` | **Yes** (Prod) | Allowed origin(s) for CORS (comma-separated for multiples) | `https://spendwise-ai.vercel.app` |
| `NODE_ENV` | No | Runtime environment (`development` or `production`) | `production` |
| `GEMINI_API_KEY` | No | Google Gemini API Key for financial chatbot (optional) | `AIzaSy...` |
| `AI_PROVIDER` | No | Alternative AI provider (`gemini`, `openai`, `groq`) | `gemini` |
| `OPENAI_API_KEY` | No | OpenAI API Key if using OpenAI provider | `sk-...` |

---

## 🗄️ Database Setup & Migrations

Spendwise AI uses **Prisma Migrations** for zero-downtime automated schema deployment:

1. **Initialize fresh database in production:**
   ```bash
   npx prisma migrate deploy
   ```
   This executes the SQL migration history:
   * `20260917141950_init` (User, Category, Transaction, Budget, SavingsGoal, FinancialInsight, Notification tables)
   * `20260920000000_add_currency_columns` (Multi-currency support and indexing)

2. **Self-provisioning Accounts:**
   No seed script or demo data is required. When a user registers (`POST /api/auth/register`), default categories (Groceries, Dining, Transport, Housing, etc.) are automatically provisioned specifically for that user.

3. **Prisma Studio (Local DB Inspector):**
   ```bash
   npm run prisma:studio --prefix server
   ```

---

## 🌐 Deployment Guide

### 1. Backend Deployment on Render

1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Create a **Managed PostgreSQL Database**:
   * Name: `spendwise-db`
   * Database: `spendwise`
   * User: `spendwise_user`
   * Plan: `Free`
   * Copy the **Internal Database URL**.
3. Create a **Web Service**:
   * Connect your GitHub repository: `SpendWise-AI`
   * **Root Directory:** `server`
   * **Runtime:** `Node`
   * **Build Command:** `npm install && npm run build && npx prisma migrate deploy`
   * **Start Command:** `npm start`
   * **Health Check Path:** `/api/health`
4. Set **Environment Variables** in Render Dashboard:
   * `NODE_ENV` = `production`
   * `PORT` = `10000`
   * `DATABASE_URL` = (Reference `spendwise-db` or paste connection string)
   * `JWT_SECRET` = (Generate a strong 32+ character string)
   * `JWT_EXPIRES_IN` = `7d`
   * `CLIENT_URL` = `https://<your-vercel-app>.vercel.app`
   * `GEMINI_API_KEY` = *(Optional)* Your Google Gemini API key
5. Alternatively, deploy automatically using the included [`render.yaml`](render.yaml) Blueprint!

### 2. Frontend Deployment on Vercel

1. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Import your GitHub repository: `SpendWise-AI`.
3. Configure Project Settings:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `./` (Leave as root)
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. Configure **Environment Variables**:
   * `VITE_API_BASE_URL` = `https://<your-render-backend-name>.onrender.com/api`
5. Click **Deploy**.
6. Once deployed, copy your live Vercel domain and update `CLIENT_URL` in your Render backend settings!

---

## 🔐 Security & Privacy Architecture

* **Zero Banking Credentials Required:** Spendwise AI never requests passwords, UPI PINs, bank credentials, OTPs, or CVV.
* **Server-Side Secret Isolation:** AI keys (`GEMINI_API_KEY`), database URLs (`DATABASE_URL`), and `JWT_SECRET` reside solely in backend memory and are never sent to the browser.
* **Client-Side Statement Parsing:** Uploaded CSV statements are parsed in browser memory via the HTML5 `FileReader` API. File contents are never stored on local disks, server storage, or cloud buckets.
* **Strict User Isolation:** All database queries across transactions, budgets, goals, and analytics are scoped strictly to the authenticated user's ID (`req.user.id`). Cross-tenant access is blocked at the database query level.
* **Safe AI Integration:** Only calculated financial summaries (percentages, category sums, first name) are included in AI context prompts. Sensitive identifiers and authentication tokens are never shared with AI providers.
* **Deterministic Fallback:** If AI keys are absent or API quotas are exhausted, the built-in deterministic reasoning engine answers questions with 100% mathematical accuracy directly from real database metrics.

---

## 🧪 Testing & Validation

```bash
# Frontend validation
npm run typecheck
npm run lint
npm run build

# Backend automated test suites
npm test --prefix server
```

---

## 💙 Spendwise AI
**See your money. Understand your future.**
