# FITSYNC: QR-Based Membership Tracking (Capstone)

A modern fitness gym management system with QR-based attendance tracking, membership management, payment tracking, and admin/staff dashboards.

## Tech Stack

### Frontend

- React v19.2.0
- React DOM v19.2.0
- React Router DOM v7.15.1
- Vite v7.2.4

### Backend & Database

- Supabase v2.101.1

### Libraries & Tools

- html5-qrcode v2.3.8
- jsPDF v4.2.1
- ExcelJS v3.4.0
- Recharts v3.8.1
- EmailJS v4.4.1
- Tabler Icons v3.44.0

### Development Tools

- ESLint v9.39.1
- @vitejs/plugin-react-swc v4.2.2
- TypeScript type packages for React and React DOM

## Features

- QR-based member attendance tracking
- Member management (create, edit, delete)
- Payment recording and tracking
- Dashboard analytics and summaries
- Data export (PDF, Excel)
- Email notifications
- Membership plans (monthly and yearly)
- Member profiles and history

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

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Lint the code:

```bash
npm run lint
```
