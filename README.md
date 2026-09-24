# RespiScan Frontend

A clinical web application for AI-powered bacterial pneumonia detection from chest X-ray (CXR) images. This is the frontend companion to the [RespiScan Backend](https://github.com/RalfNeis/RespiScan-backend) Django REST API.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Application Pages](#application-pages)
- [Authentication and Session Management](#authentication-and-session-management)
- [API Integration](#api-integration)
- [Configuration](#configuration)
- [Development Notes](#development-notes)

---

## Overview

RespiScan provides a clinical portal where healthcare professionals can upload chest X-rays, receive AI-driven pneumonia predictions with Grad-CAM heatmap overlays, manage patient records, generate analytical reports, and administer system users. The interface is designed around a role-based access model with two user types: **Administrators** and **Employees**.

## Technology Stack

| Layer                | Technologies                                              |
| :------------------- | :-------------------------------------------------------- |
| Framework            | React 18, TypeScript, Vite 6                              |
| Routing              | React Router v7 (data router via `createBrowserRouter`)   |
| Styling              | Tailwind CSS v4, Radix UI primitives, Lucide React icons  |
| Data Visualization   | Recharts (LineChart, BarChart, ComposedChart, PieChart)    |
| State Management     | React Context API (`AuthContext`)                         |
| Animation            | tw-animate-css, Motion                                    |
| Backend Integration  | Django REST Framework (proxied through Vite dev server)   |

## Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- A running instance of the [RespiScan Backend](https://github.com/RalfNeis/RespiScan-backend) on `http://localhost:8000`

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/RalfNeis/RespisScan-Frontend.git
   cd RespisScan-Frontend/respiscan-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000).

4. **Build for production**

   ```bash
   npm run build
   ```

   The production bundle is output to the `dist/` directory.

> **Note:** The backend must be running on port 8000 before starting the frontend. Vite's development proxy forwards all `/api` requests to the Django server.

## Project Structure

```
respiscan-frontend/
├── public/                          # Static assets
├── src/
│   ├── main.tsx                     # Application entry point
│   ├── app/
│   │   ├── App.tsx                  # Root component (AuthProvider + RouterProvider)
│   │   ├── routes.tsx               # Route definitions
│   │   ├── context/
│   │   │   └── AuthContext.tsx       # Authentication state, session polling, idle timeout
│   │   ├── utils/
│   │   │   ├── api.ts               # Fetch wrapper with CSRF token handling
│   │   │   └── cn.ts                # Tailwind class merge utility
│   │   ├── components/
│   │   │   ├── Layout.tsx           # Application shell (sidebar, header, content area)
│   │   │   ├── figma/               # Figma design integration helpers
│   │   │   └── ui/                  # Reusable UI component library
│   │   └── pages/
│   │       ├── Login.tsx            # Login with role selection and 2FA support
│   │       ├── Dashboard.tsx        # Summary KPIs and scan activity charts
│   │       ├── Diagnosis.tsx        # CXR upload and Grad-CAM result viewer
│   │       ├── PatientRecords.tsx   # Patient table with search and filters
│   │       ├── RegisterPatient.tsx  # Patient demographic intake form
│   │       ├── Reports.tsx          # Analytics charts and PDF report generation
│   │       ├── EmployeeManagement.tsx # Staff directory and access control (admin only)
│   │       └── AccountSettings.tsx  # Profile, security, notifications, system config
│   └── styles/
│       ├── fonts.css                # Font imports
│       ├── index.css                # Style entry point
│       ├── tailwind.css             # Tailwind v4 configuration
│       └── theme.css                # CSS custom properties and design tokens
├── vite.config.ts                   # Vite configuration with proxy and aliases
├── tsconfig.json                    # TypeScript project references
├── tsconfig.app.json                # App TypeScript config
└── package.json
```

## Application Pages

### Login

Provides a dual-tab interface for Employee and Administrator sign-in. Supports username or email authentication, a "Remember Me" option for extended sessions, and an optional two-factor authentication step using TOTP codes. Displays a session expiry dialog when a session is revoked remotely or times out due to inactivity.

### Dashboard

Displays four summary KPI cards (total patients, scans processed, positive detections, and reports generated) alongside a weekly scan activity line chart, an age-range bar chart for pneumonia breakdown, and a live activity feed. Includes inline filters for gender and age range.

### Diagnosis Workspace

The core clinical tool. Users select a patient, upload a chest X-ray image, and trigger inference. The system polls the backend until the AI model returns results, then displays the original CXR alongside its Grad-CAM heatmap overlay in a side-by-side dark viewer. Confidence scores, detection status, and a one-click PDF export are provided.

### Patient Records

A searchable, filterable table of all registered patients showing demographics, last scan date, and detection status. Supports inline editing and deletion of patient records, and links to the patient registration form and diagnosis workspace.

### Register Patient

A multi-section intake form capturing personal information, contact details, emergency contacts, clinical history (medical conditions, allergies, smoking status, medications), and referral data.

### Analytics and Reports

Presents monthly diagnosis trends as a composed bar and line chart, a donut chart for positive/negative distribution, a stacked demographics chart by age and gender, and automated key findings. Includes date-range selection and a configurable PDF export modal. Previously generated reports are listed in a history table.

### Employee Management (Admin Only)

Allows administrators to add, edit, approve, deactivate, and remove system users. Includes a profile modal with employee details and biography. Supports search by name, username, or department.

### Account Settings

Four tabs covering profile editing, password management with strength meter, two-factor authentication toggle, session timeout configuration, active session listing with remote revocation, notification preferences, and system-level AI configuration (confidence threshold, Grad-CAM defaults, data retention, audit logging).

## Authentication and Session Management

The application uses Django's session-cookie authentication. The `AuthContext` provider manages the authentication lifecycle:

- **CSRF Protection:** Every mutating request includes a CSRF token fetched from `/api/auth/csrf/`.
- **Session Restoration:** On page load, the app calls `/api/auth/me/` to restore any existing session.
- **Session Monitoring:** A polling interval checks session validity every few seconds. The session is also verified on tab focus and visibility change. If the session is revoked remotely, the user sees an expiry dialog.
- **Inactivity Timeout:** Tracks user interaction events and automatically logs out after a configurable idle period (15 minutes to 2 hours).
- **Two-Factor Authentication:** When TOTP is enabled on a user account, the login flow presents a secondary code input step.

## API Integration

All backend communication goes through the `api` utility in `src/app/utils/api.ts`, which provides `get`, `post`, `patch`, and `delete` methods. In development, Vite's proxy forwards `/api` requests to `http://localhost:8000`, making the frontend and backend appear same-origin for cookie-based authentication.

Key API endpoints consumed by the frontend:

| Endpoint                              | Purpose                                    |
| :------------------------------------ | :----------------------------------------- |
| `GET /api/auth/csrf/`                 | Fetch CSRF token                           |
| `POST /api/auth/login/`              | Authenticate with credentials and role     |
| `POST /api/auth/logout/`             | End the current session                    |
| `GET /api/auth/me/`                  | Retrieve current user profile              |
| `PATCH /api/auth/me/`               | Update profile fields                      |
| `PATCH /api/auth/me/password/`       | Change password                            |
| `GET /api/auth/sessions/`           | List active device sessions                |
| `DELETE /api/auth/sessions/:key/`   | Revoke a specific session                  |
| `GET/POST /api/auth/employees/`     | List or create employees (admin)           |
| `GET/POST /api/patients/`           | List or register patients                  |
| `POST /api/diagnostics/upload/`     | Upload a CXR for inference                 |
| `GET /api/diagnostics/:id/`         | Poll scan result                           |
| `GET /api/diagnostics/:id/export/`  | Download clinical PDF                      |
| `GET /api/analytics/dashboard/`     | Fetch dashboard and analytics data         |
| `POST /api/reports/generate/`       | Generate an analytics PDF report           |
| `GET/PATCH /api/notifications/preferences/` | Manage notification settings        |
| `GET/PATCH /api/analytics/system-settings/`  | AI and compliance configuration    |

## Configuration

### Vite Development Server

The dev server port and backend proxy are configured in `vite.config.ts`:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
},
```

If your backend runs on a different port, update the `target` value accordingly.

### Path Aliases

The `@` alias is mapped to the `src/` directory for cleaner imports:

```typescript
import { Button } from '@/app/components/ui/button';
```

## Development Notes

- **Role-Based Access:** The sidebar navigation and settings tabs are conditionally rendered based on the authenticated user's role. The Employee Management page and System Settings tab are restricted to administrators.
- **Component Library:** The `src/app/components/ui/` directory contains a set of accessible, composable UI primitives built on Radix UI. These include accordion, dialog, dropdown menu, select, tabs, tooltip, and many others.
- **Design Origin:** The interface was originally designed in Figma. The Vite configuration includes a custom `figmaAssetResolver` plugin for resolving Figma-exported assets.
