# FITSYNC: QR-Based Membership Tracking (Capstone)

A modern fitness gym management system with QR-based attendance tracking, membership management, and payment tracking.

## Tech Stack

### Frontend

- **React** (v19.2.0) - UI library
- **Vite** (v7.2.4) - Build tool and dev server
- **React DOM** (v19.2.0) - React rendering for web

### Backend & Database

- **Supabase** (v2.101.1) - Backend-as-a-Service (PostgreSQL, Auth, Real-time)

### Libraries & Tools

- **html5-qrcode** (v2.3.8) - QR code scanning
- **jsPDF** (v4.2.1) - PDF generation (Member ID cards)
- **ExcelJS** (v4.4.0) - Excel file export
- **Recharts** (v3.8.1) - Data visualization/charting
- **EmailJS** (v4.4.1) - Email notifications

### Development Tools

- **ESLint** (v9.39.1) - Code linting
- **Vite React SWC Plugin** (v4.2.2) - Fast React compilation
- **TypeScript Support** - Type definitions for React and React DOM

## Features

-  QR-based member attendance tracking
-  Member management (create, edit, delete)
-  Payment recording and tracking
-  Dashboard with analytics
-  Data export (PDF, Excel)
-  Email notifications
-  Membership plans (monthly and yearly)
-  Member profiles and history

## Project Structure

```
src/
├── components/     # React components
│   ├── modals/     # Modal dialogs
│   └── sidebar/    # Navigation sidebar
├── pages/          # Page components
├── services/       # API and business logic
├── lib/            # Utilities (Supabase client)
├── utils/          # Helper functions
└── assets/         # Static assets
```

## Setup
///
1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm build
```

4. Lint code:

```bash
npm run lint
```
>>>>>>> 876fb500ba91de9b783324f5f0e174ae1be699ca
