# Boarding School Management System — Live Demo

This folder contains a **100% static, client-side only** version of the Enterprise-grade Boarding School Management System (SIAKAD v5.0). 

It was explicitly created to showcase the frontend architecture, complex UI/UX, and extensive features of the application without requiring a Laravel backend or MySQL database.

## 🚀 Live Demo

**[View the Live Demo on GitHub Pages](https://mradiputra480.github.io/boarding-school-management-system/)**

*(If the URL above doesn't work, ensure GitHub Pages is enabled in the repository settings).*

## 🔐 Demo Credentials

The application features 5 distinct user portals. You can log in using any of the following dummy credentials:

| Role | Username | Password | Access Level |
|---|---|---|---|
| **System Admin** | `admin` | `demo1234` | Full access to Master Data, Settings, and overrides. |
| **Teacher (Homeroom)** | `teacher1` | `demo1234` | Access to grading, schedule, and homeroom monitoring. |
| **Teacher (Discipline)** | `discipline1` | `demo1234` | Access to Discipline V2 module (Red Zone, violations). |
| **Parent/Guardian** | `parent1` | `demo1234` | Read-only access to child's academic and behavioral data. |
| **Administration (TU)** | `tu1` | `demo1234` | Access to document distribution and administrative tasks. |

## 🛠️ How it Works (Technical Details)

The original production application is a Monolithic Laravel 11 + React 19 app. To make this run on GitHub Pages:
1. **Mock API Layer**: The `axios` client has been intercepted. Instead of making real HTTP requests, it intercepts all calls to `/api/*` and returns complex, relational JSON dummy data.
2. **Client-Side Routing**: `BrowserRouter` was replaced with `HashRouter` to support static hosting.
3. **Zustand State**: Authentication and session management run entirely in memory and `localStorage`.

> **Note**: This is a read-only showcase. While you can click buttons, add data, and see toast notifications (simulated successes), any "saved" data will revert upon a page refresh since there is no persistent database.

## 🏗️ Build Locally

If you want to run this static version locally:

```bash
cd portfolio
npm install
npm run dev
```
Then open `http://localhost:5173`.
