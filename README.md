# DocuMind AI — Intelligent Document Processing Backend

Production-ready Node.js & Express REST API for **DocuMind AI**, featuring:
- Auditable 12-field Document Intelligence Extraction (Google Gemini 3.5 Flash)
- Document-Grounded Q&A with strict zero-hallucination fallback and verifiable source citations
- Interactive Action Center with live persistence
- Smart Deadline Detection and normalization ("Today", "Tomorrow", "In 3 days", "15 Oct 2026")
- Supabase PostgreSQL integration with resilient local fallback
- Robust PDF parsing pipeline handling corrupt, password-protected, and scanned PDFs
- JWT Authentication, bcrypt password hashing, and user data ownership isolation
- Security hardening (Helmet, CORS, rate limiting, and prompt injection defense)

---

## 🌐 Live Production Deployment
- 🚀 **Backend REST API (Render):** `https://documind-ai-backend-8ssm.onrender.com/api`
- 🩺 **Health Check Status:** [https://documind-ai-backend-8ssm.onrender.com/api/health](https://documind-ai-backend-8ssm.onrender.com/api/health)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_min_32_chars
CORS_ORIGIN=http://localhost:5173

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Run Development Server
```bash
npm run dev
```
Server runs at `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

### 4. Run Automated Tests
```bash
npm test
node tests/live-e2e.js
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check & active feature flags |
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Sign in with email & password |
| `POST` | `/api/auth/demo-login` | 1-Click Demo authentication |
| `GET` | `/api/auth/profile` | Current user profile |
| `POST` | `/api/documents/upload` | Upload & analyze document (PDF/TXT/MD) |
| `POST` | `/api/documents/demo/sample` | Load realistic fictional sample grant document |
| `GET` | `/api/documents` | List user documents & dashboard stats |
| `GET` | `/api/documents/:id` | Get document details, action items, health |
| `DELETE`| `/api/documents/:id` | Delete document & associated records |
| `PATCH`| `/api/documents/:id/actions/:actionId` | Toggle action status (`pending` / `completed`) |
| `GET` | `/api/documents/search?q=...` | Search inside documents & extract matches |
| `POST` | `/api/documents/:id/chat` | Ask grounded question (includes citations) |
| `GET` | `/api/documents/:id/chat` | Get document chat history |

---

## 📄 License
MIT
