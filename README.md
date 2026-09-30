# DocuMind AI — Intelligent Document Processing Frontend

Modern, responsive React 18 + Vite web application for **DocuMind AI**:
- **Auditable Document Intelligence**: 12-field schema display with confidence estimates and source citations
- **Interactive Action Center**: Real-time status toggling between *Pending* and *Completed*
- **Smart Deadlines**: Visual indicators for urgent, upcoming, and overdue deadlines
- **Document-Grounded Chat**: Context-grounded AI chat with audit citation tags
- **Full-Text In-Document Search**: Keyword matching and highlighting
- **Document Health Grading**: Reliability score, text status, and completeness badges
- **1-Click Demo Mode**: Instant access for judges without registration

---

## 🛠️ Tech Stack
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS + PostCSS
- **Icons:** Lucide React
- **Routing:** React Router v6
- **HTTP Client:** Axios (with auth interceptors)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
If deploying to a separate backend URL, create a `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Development Server
```bash
npm run dev
```
Runs at: `http://localhost:5173`

### 4. Build for Production
```bash
npm run build
```
Generates production build in `dist/`.

---

## 📄 License
MIT
