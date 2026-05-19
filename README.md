# FITSYNC: QR-Based Membership Tracking (Capstone)

A web-based gym management system for tracking memberships, payments, attendance via QR scanning, and staff accounts.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| [React](https://react.dev/) | 19 | UI framework |
| [Vite](https://vite.dev/) | 7 | Build tool & dev server |
| CSS Modules | — | Component-scoped styling |

### Backend & Database
| Technology | Version | Purpose |
|---|---|---|
| [Supabase](https://supabase.com/) | 2 | PostgreSQL database, real-time subscriptions, authentication |

### Libraries
| Library | Version | Purpose |
|---|---|---|
| [html5-qrcode](https://github.com/mebjas/html5-qrcode) | 2.3.8 | QR code scanning |
| [Recharts](https://recharts.org/) | 3 | Charts and data visualization |
| [jsPDF](https://github.com/parallax/jsPDF) | 4 | PDF export |
| [ExcelJS](https://github.com/exceljs/exceljs) | 3 | Excel (.xlsx) export |
| [EmailJS](https://www.emailjs.com/) | 4 | Client-side email sending |

### Dev Tools
| Tool | Purpose |
|---|---|
| ESLint | Linting |
| @vitejs/plugin-react-swc | Fast React refresh via SWC compiler |

---

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
