# SalesVision AI 🚀

SalesVision AI is a production-ready, predictive SaaS dashboard designed to analyze and forecast sales performance. Users can upload raw transaction spreadsheets, and the application instantly cleans records, resolves data anomalies, generates programmatically computed AI business insights, and executes Scikit-learn trend forecasts with confidence intervals.

---

## Technical Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Recharts, Framer Motion, Axios, React Router.
- **Backend**: Python 3.14, FastAPI, Pandas, NumPy, SQLAlchemy, Scikit-learn, Uvicorn.
- **Database**: PostgreSQL (Production) / SQLite (Zero-Config local fallback).

---

## Project Structure

```
salesvision-ai/
  ├── client/             # React SPA (Vite + TypeScript)
  │     ├── src/
  │     │     ├── components/  # Custom UI Components (Card, Button, Table, Tabs, layout)
  │     │     ├── context/     # Auth Context state manager
  │     │     ├── pages/       # Dashboard views (Landing, Dashboard, Upload, Analytics, Predictions, Reports, Settings)
  │     │     ├── utils/       # Axios API client setup
  │     │     ├── App.tsx      # Routing and access guard configs
  │     │     └── index.css    # Custom variables, dark theme classes, print-media styles
  │     ├── tailwind.config.js
  │     └── vite.config.ts     # Dev server reverse proxy config
  │
  └── server/             # FastAPI REST Server
        ├── app/
        │     ├── core/        # Database sessions, JWT Security dependencies
        │     ├── models.py    # SQLAlchemy user, uploads, sales records mapping schemas
        │     ├── schemas.py   # Pydantic request/response validations
        │     ├── services/    # Cleaning algorithms, OLS predictor, Insights generator
        │     ├── routers/     # Auth, Upload, Dashboard, Predictions, Reports routes
        │     └── main.py      # Entry point with CORS and sliding-window rate limiters
        └── requirements.txt
```

---

## Local Installation & Setup

### 1. Backend Setup
1. Open terminal and navigate to the backend server directory:
   ```bash
   cd server
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv .venv
   # On Windows (CMD)
   .venv\Scripts\activate
   # On Linux/macOS
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server (runs SQLite fallback automatically if no `DATABASE_URL` is set):
   ```bash
   python -m uvicorn app.main:app --reload
   ```
   *The Swagger interactive documentation will be available at `http://localhost:8000/docs`.*

### 2. Frontend Setup
1. Open a separate terminal and navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the browser and visit `http://localhost:5173`.

---

## Environment Variables

### Backend (`/server/.env`)
Create a `.env` file inside the `server/` directory:
```env
SECRET_KEY="salesvision_secret_key_change_me_in_production"
DATABASE_URL="postgresql://user:password@localhost:5432/salesvision"  # Fallback: SQLite
```

### Frontend (`/client/.env`)
Vite proxies `/api` requests to `http://localhost:8000` in development. In production, configure environment variables:
```env
VITE_API_URL="https://your-railway-backend-url.railway.app"
```

---

## Deployment Strategies

### 1. Database & Backend Deployment (Railway)
1. Sign in to your [Railway](https://railway.app) console.
2. Click **New Project** &rarr; **Provision PostgreSQL**.
3. Once initialized, click **New Project** &rarr; **Deploy from GitHub repository** &rarr; select your repository.
4. Go to the service **Variables** section and add the root folder config:
   - `RAILWAY_ROOT_PROJECT_DIRECTORY` &rarr; `server`
   - `SECRET_KEY` &rarr; `your-super-random-jwt-key`
   - `DATABASE_URL` &rarr; `${{Postgres.DATABASE_URL}}` (Railway handles PostgreSQL connection injection automatically).
5. Deploy. The backend will spin up under Uvicorn and bind to `$PORT`.

### 2. Frontend Deployment (Vercel)
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New Project** &rarr; import your repository.
3. In **Project Settings**:
   - **Framework Preset**: select `Vite`.
   - **Root Directory**: `client`.
   - **Build Command**: `npm run build`.
   - **Output Directory**: `dist`.
4. In **Environment Variables**, add:
   - `VITE_API_URL` &rarr; `https://your-railway-backend-url.railway.app`
5. Click **Deploy**. Vercel will build and serve your SPA over edge CDN.

---

## Core API Documentation

All routes are rate-limited to **120 requests/min** and expect/return JWT authentication headers (`Authorization: Bearer <token>`).

- **Authentication (`/api/auth`)**:
  - `POST /register`: Registers user credentials.
  - `POST /login`: Validates credentials and returns JWT bearer token.
  - `GET /me`: Returns details of active profile.

- **CSV Upload (`/api/upload`)**:
  - `POST /upload`: Expects form-data `file` (CSV). Renames header synonyms, removes duplicate records, validates fields, and populates database. Returns structural mapping logs and stats.

- **Dashboard Operations (`/api/dashboard`)**:
  - `GET /metrics`: Aggregates the 5 key cards (Sales, Profit, Orders, Customers, Margin) along with growth changes.
  - `GET /charts`: Returns aggregated datasets mapped for Recharts components.
  - `GET /raw`: Returns list of cleaned transactions for instant front-end filtering.

- **ML Projections (`/api/prediction`)**:
  - `GET /prediction`: Trains OLS trend regression over monthly transactions and projects next month's targets alongside 95% confidence intervals.

- **Deep Analytics (`/api/analytics`)**:
  - `GET /overview`: Returns efficiency ratios (AOV, CLV, margins, regional and category winners).

- **AI Insights (`/api/insights`)**:
  - `GET /insights`: Computes 10+ dynamic auditing notifications (heavy discounting, concentration risks, MoM fluctuations).

- **Reports Generation (`/api/reports`)**:
  - `GET /export/csv`: Streams database rows as a raw CSV file.
  - `GET /export/excel`: Streams database rows as a formatted Microsoft Excel file.
