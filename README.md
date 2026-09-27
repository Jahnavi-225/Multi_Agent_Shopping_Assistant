# ShopWiseAI — Multi-Platform Shopping Comparison Agent

An AI-powered shopping assistant that helps users compare product prices across multiple e-commerce platforms (**Amazon, Flipkart, Myntra, Reliance Digital, Snapdeal, Croma**), featuring an agentic AI backend, RAG vector retrieval, price history tracking, dark/light mode toggle, and an interactive AI Chatbot with direct deep-linking capabilities.

---

## 🌟 Key Features

1. **Multi-Platform Price Comparison Engine**:
   - Accepts product names or e-commerce URLs (Amazon, Flipkart, Myntra, etc.).
   - Normalizes product titles and extracts specs (RAM, Storage, Brand, Model, Color).
   - Ranks platform listings by price, seller rating, and calculated **Deal Score (0–100)**.
   - Highlights the verified **Lowest Price / Best Deal** and potential price-spread savings.

2. **RAG AI Shopping Assistant Chatbot**:
   - Conversational AI backed by local vector search (`sentence-transformers` / SQLite vector store) and Groq LLM integration.
   - Character-by-character **Server-Sent Events (SSE)** streaming.
   - In-chat **Deep-Linking** action cards that jump directly to retailer listings or product comparison views.

3. **30-Day Price Trend Charts**:
   - Interactive area charts (Recharts) visualizing historical pricing trends.
   - Powered by an in-process **APScheduler** background runner that periodically logs price snapshots.

4. **Authentication**:
   - **Google OAuth** & **Phone OTP** login with JWT session tokens.
   - Fast demo sign-in options (`shopper@demo.com` and OTP `123456`).

5. **Price Drop Watchlist**:
   - Set price target alerts to receive notifications when listings drop below your desired threshold.

6. **Responsive Sleek UI**:
   - React + Vite + Tailwind CSS with glassmorphism styling.
   - **Dark / Light / System Mode** theme toggle.

---

## 🏗️ Architecture & Tech Stack

```
                          ┌────────────────────────────────────────────────────────┐
                          │            React + Vite + Tailwind Frontend            │
                          │ - Dashboard & Product Search                           │
                          │ - Comparison Matrix Grid & Best Deal Badges            │
                          │ - Interactive Price History Graph (Recharts)           │
                          │ - RAG AI Assistant Chatbot (SSE Streaming)            │
                          │ - Google OAuth / Phone OTP Modal & JWT Context         │
                          │ - Light / Dark / System Theme Switch                   │
                          └───────────────────────────┬────────────────────────────┘
                                                      │ REST & SSE
                                                      ▼
                          ┌────────────────────────────────────────────────────────┐
                          │               Python + Flask Backend API               │
                          │                                                        │
                          │ ┌────────────────────────────────────────────────────┐ │
                          │ │           Modular Agent AI Pipeline                │ │
                          │ │ - ProductIdentifierAgent (Specs & URL parsing)    │ │
                          │ │ - MultiPlatformScraperAgent (Multi-store search)   │ │
                          │ │ - RankingDealAgent (Deal scoring & price ranking)  │ │
                          │ │ - RAGChatAgent (Vector search & LLM streaming)     │ │
                          │ └────────────────────────────────────────────────────┘ │
                          │                                                        │
                          │ ┌────────────────────────────────────────────────────┐ │
                          │ │ APScheduler Background Job (Price Trend Refresher) │ │
                          │ └────────────────────────────────────────────────────┘ │
                          └───────────────────────────┬────────────────────────────┘
                                                      │
                                                      ▼
                          ┌────────────────────────────────────────────────────────┐
                          │       SQLite Database & Local Vector Index             │
                          │ - Products, Listings, Price History, Users, Watchlist  │
                          └────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)

### 1. Start Backend API (`server/`)
```bash
cd server
pip install -r requirements.txt
python run.py
```
> The backend server will initialize SQLite database schema, load seed e-commerce listings, start the APScheduler price reflector, and run on `http://127.0.0.1:5000`.

### 2. Start Frontend SPA (`client/`)
```bash
cd client
npm install
npm run dev
```
> The React dev server will launch on `http://localhost:5173`.

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/products/search` | Search product or parse URL, return ranked multi-platform listings |
| `GET` | `/api/products/compare/<id>` | Fetch comparison matrix & price trend history for a product |
| `GET` | `/api/products/featured` | Fetch curated deal spotlights for home dashboard |
| `POST` | `/api/chat/message` | Send message to RAG Shopping Assistant |
| `GET/POST` | `/api/chat/stream` | Server-Sent Events (SSE) streaming chat endpoint |
| `POST` | `/api/auth/google` | Google OAuth sign-in / JWT session token generator |
| `POST` | `/api/auth/otp/send` | Request Phone OTP code |
| `POST` | `/api/auth/otp/verify` | Verify Phone OTP code (`123456`) |
| `GET/POST` | `/api/alerts/watchlist` | Manage user price drop alert subscriptions |

---

## 🛡️ Free-Tier & Open Source Guarantees
- **No Paid APIs Required**: Runs on open-source packages (`sentence-transformers`, `BeautifulSoup`, `APScheduler`, `SQLite`).
- **Groq Free LLM / Smart Fallback**: Optional `GROQ_API_KEY` support with zero-cost fallback rule engine for seamless offline demo usage.
- **RapidAPI Live Amazon Search / Seed Fallback**: Optional `RAPIDAPI_KEY` enables real-time Amazon product searches via OpenWeb Ninja's *Real-Time Amazon Data* API on RapidAPI:
  - **100 Free Requests / Month Limit**: Uses the free BASIC plan (no credit card required). Monthly usage is automatically tracked in SQLite (`api_usage` table).
  - **15-Minute Aggressive In-Memory Cache**: Repeated searches within a 15-minute TTL window reuse cached results without hitting the API.
  - **Silent Seed Data Fallback**: If the monthly quota limit (100 requests) is reached, or if the live API errors/fails, the system logs a warning and silently falls back to local SQLite seed data without breaking the user experience.


---

## 🔐 Firebase Admin Authentication Setup

Production/real user authentication requires server-side token verification via the Firebase Admin SDK.

1. Obtain a Firebase Service Account JSON key from your Firebase Console under **Project Settings > Service accounts**.
2. Configure the server environment variable in `server/.env`:
   - **File Path**: Set `FIREBASE_SERVICE_ACCOUNT_PATH=path/to/serviceAccountKey.json`
   - **OR Inline JSON**: Set `FIREBASE_SERVICE_ACCOUNT_JSON={"type": "service_account", ...}`
3. When configured, `/api/auth/google` and `/api/auth/otp/verify` verify incoming client `idToken` signatures with Firebase Admin SDK before issuing application JWT tokens.
4. If unconfigured, the server operates in **Demo Mode** with explicit server warning logs.
