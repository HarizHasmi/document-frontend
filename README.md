# Document Frontend

Frontend application for the document management system, built with React + Vite and styled with Tailwind CSS.

This app connects to a Laravel Sanctum backend and provides:
- authentication (login/logout)
- dashboard analytics
- document browsing, filtering, sorting, and pagination
- document upload, details, update, delete, and download (permission-based)

## Features

### Authentication
- Login page (`/login`)
- Token-based API auth (Bearer token from Sanctum)
- Protected app routes
- Auto-logout behavior on `401` responses

### Dashboard
- Welcome header with user name and role
- Quick stat cards:
  - Total Accessible Documents
  - Department Documents
  - Total Downloads
- Download statistics widgets:
  - downloads by category
  - top downloaded documents
- Recent activity feed from latest uploads

### Documents
- Documents list page (`/documents`)
- Search by title/description
- Filter by category and department
- Date range filter (upload date from/to)
- Sort documents by:
  - name
  - date
  - downloads
  - size
- Pagination (20 documents per page request)
- Document actions (role-based):
  - view
  - download
  - edit
  - delete (with confirmation dialog)

### Upload + Details + Edit
- Upload page (`/documents/upload`)
  - file validation
  - metadata fields
  - loading/success/error states
- Details page (`/documents/:id`)
- Edit page (`/documents/:id/edit`)

## Tech Stack

- React 19
- React Router
- Axios
- Tailwind CSS v4
- Vite
- ESLint

## Routes

Public:
- `/login`

Protected:
- `/dashboard`
- `/documents`
- `/documents/upload`
- `/documents/:id`
- `/documents/:id/edit`

## Requirements

- Node.js 18+ (recommended)
- npm 9+
- Running backend API (Laravel) with CORS enabled for frontend origin

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create/update environment variables:

```bash
# .env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

3. Start development server:

```bash
npm run dev
```

4. Open in browser:

`http://localhost:5173`

## Available Scripts

- `npm run dev` - start local development server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

## Backend API Notes

This frontend expects backend endpoints like:

Auth:
- `POST /login`
- `POST /logout`
- `GET /user`

Documents:
- `GET /documents`
- `GET /documents/{id}`
- `POST /documents`
- `PATCH /documents/{id}`
- `DELETE /documents/{id}`
- `GET /documents/{id}/download`

Master data:
- `GET /departments`
- `GET /categories`

The app supports resource-wrapped responses (`{ data: ... }`) and paginated resource responses (`{ data: [...], meta: ... }`).

## Current Scope

- User self-registration page and admin user management panel are intentionally not included in the current UI.

## Troubleshooting

- If styles look broken, restart dev server after pulling latest changes:

```bash
npm run dev
```

- If login fails with network/CORS errors:
  - verify backend is running
  - verify `VITE_API_BASE_URL`
  - verify backend CORS allows `http://localhost:5173`
