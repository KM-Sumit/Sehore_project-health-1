# Bloodline Pathology — Medical Appointments & Diagnostic Platform

A clean, fast, clinical-grade medical platform for booking doctor consultations and scheduling home blood sample collection for diagnostic tests (Tuberculosis, Blood Sugar, Jaundice / Liver Function, CBC, Lipid Profile, Thyroid, and more).

---

## 🛠 Tech Stack Mapping

| Layer | Technology |
|---|---|
| **UI** | Svelte 5 (Runes `$state`, `$derived`, `$effect`, snippets), SvelteKit 3 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 (`@tailwindcss/vite`), Clinical Red Theme |
| **Dev server / build** | Vite 8 |
| **Runtime** | Bun 1.4+ |
| **Production Server** | Vercel Serverless (`@sveltejs/adapter-vercel`) |
| **Database** | PostgreSQL |
| **Database ORM** | Drizzle ORM (`drizzle-orm`, `drizzle-kit`, `postgres`) |
| **Form Validation** | Zod |
| **Authentication** | Google OAuth 2.0, Session JWT (`jose`), Passwords via `Bun.password` (bcrypt) |
| **Payments** | Razorpay REST API integration |
| **Files** | Cloudflare R2 / S3-compatible + local static files storage |
| **Cache** | Redis optional with fast in-memory Map fallback |
| **PDF Reports** | PDF generation engine & `unpdf` / PDF.js verification |
| **Medical Math & Notes** | KaTeX (clinical formula rendering) & Markdown (`marked`) |
| **Icons** | Lucide (`lucide-svelte`) |
| **AI Inquiries** | Google Gemini with fallback to OpenRouter & clinical rules |
| **Tests** | Bun Test (`bun test`) & Playwright ready |
| **Deployment** | Vercel, Docker (`Dockerfile`, `docker-compose.yml`), Render |

---

## 🌟 Key Features

### 1. 🩸 Blood Sample Collection Booking (`/book-test`)
- **Direct Test Selection**: Multi-select tests with real-time price counter & preparation guidelines.
- **Specific Clinical Panels**:
  - **Tuberculosis (TB)**: TB Gold IGRA blood test
  - **Sugar Panel**: Fasting Glucose, Post-Prandial (PP), HbA1c (3-month average)
  - **Jaundice / Liver Panel**: Total Bilirubin, Direct Bilirubin, SGOT, SGPT, ALP
  - **Routine & Comprehensive**: Complete Blood Count (CBC), Kidney Function (KFT), Lipid Profile, Thyroid Profile (T3/T4/TSH), Vitamin D & B12, Dengue NS1, Typhoid (Widal)
- **Patient Details Form**:
  - Full Patient Name
  - 10-digit Phone Number
  - Age & Gender
  - Home Sample Collection Address
  - Preferred Collection Date & Time Slot (8AM-10AM recommended for fasting, 10AM-12PM, 12PM-2PM, 2PM-4PM)
- **Instant Booking Confirmation**: Booking ID generation, phlebotomy scheduling summary, and report status tracking.

### 2. 👨‍⚕️ Doctor Appointment Booking (`/book-appointment`)
- Browse verified doctors across Cardiology, Dermatology, Orthopedics, Pediatrics, Neurology, and General Medicine.
- Detailed doctor profiles with qualifications, years of experience, and consultation fees.
- 7-day slot selector with time options.
- Reason for visit input & instant confirmation.

### 3. 📊 Patient Dashboard (`/dashboard`)
- Live tracking of blood sample pickup stages: `Booked` ➔ `Confirmed` ➔ `Sample Collected` ➔ `Lab Processing` ➔ `Report Ready`.
- **Downloadable PDF Diagnostic Reports**: Authenticated clinical laboratory report PDFs generated on `/api/reports/:bookingId`.
- **Clinical Guidelines & Reference Ranges**: KaTeX formulas for Estimated Average Glucose ($eAG$) and Jaundice Bilirubin Partition.
- Quick booking shortcuts.

### 4. 🔒 Authentication & Security
- Secure session cookie using JWT signed with HS256 (`jose`).
- Password hashing with `Bun.password.hash` (bcrypt, cost 12).
- Google OAuth 2.0 flow (`/api/auth/google`).
- Protected routes middleware via SvelteKit `hooks.server.ts`.

### 5. 🛠 Operations & Admin Console (`/admin`)
- Operations overview with live KPIs.
- Doctor directory management (add new doctors, configure fees).
- Phlebotomy booking status management (update sample status from collected to processing to completed).

---

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh) (v1.1+) or Node.js (v20+)

### 1. Environment Configuration
The `.env` file is pre-configured with local defaults:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/bloodline
JWT_SECRET=super-secret-jwt-key-for-bloodline-pathology-platform-2026
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/google/callback
RAZORPAY_KEY_ID=rzp_test_bloodline_mock_id
RAZORPAY_KEY_SECRET=rzp_test_bloodline_mock_secret
```

### 2. Run the Development Server
```bash
bun run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Automated Tests
```bash
bun test
```
All schema validations, PDF generation/inspection (`unpdf`), and AI QA tests execute in < 400ms.

### 4. Build for Production
```bash
bun run build
```

---

## 👤 Quick Demo Accounts

You can use the one-click demo login buttons on the `/login` page or use:

| Role | Email | Password |
|---|---|---|
| **Patient** | `patient@bloodlinepathology.in` | `password123` |
| **Admin** | `admin@bloodlinepathology.in` | `password123` |

---

## 🐳 Docker & Production Deployment

To run the complete stack with Docker:
```bash
docker compose up -d
```
