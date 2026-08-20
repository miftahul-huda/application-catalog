# Application Catalog — AI Project Context

This repository is an internal application catalog system for managing applications, app groups, deployment data, backlog items, and knowledge base articles.

## Purpose

The application helps internal teams track:
- application inventory and metadata
- app groups and ownership
- deployment environments and release details
- development backlog and bug history
- source code references
- documentation and knowledge-sharing content
- admin/master data management
- user approval flow and role-based access

## Stack

### Frontend
- React 19
- Vite
- React Router
- Framer Motion
- Lucide icons
- Axios

### Backend
- Node.js + Express
- Sequelize ORM
- PostgreSQL
- Google Cloud Storage integration
- JWT-based auth
- cookie-based session auth

## Repository Layout

- `/frontend` — React frontend app
- `/backend` — Express API server
- `/README.md` — project overview and deployment notes

## Key Architecture Notes

### Frontend
The frontend is a single-page app with protected routes and a shared layout shell.

Main entry point:
- `frontend/src/App.jsx` defines route mapping and auth guard wrappers
- `frontend/src/components/Layout.jsx` defines the left sidebar navigation and shared shell
- `frontend/src/contexts/AuthContext.jsx` controls auth state and user theme
- `frontend/src/contexts/UIContext.jsx` provides toast/confirm UI utilities

Important patterns:
- Use `PrivateRoute`, `PublicRoute`, and `InternalRoute` wrappers in `App.jsx` for access rules
- Most pages are under `frontend/src/pages/`
- Most reusable modals and UI blocks are in `frontend/src/components/`
- Use `api` service from `frontend/src/services/api.js` for API calls

### Backend
The backend exposes REST endpoints under `/api/*`.

Main entry point:
- `backend/server.js` sets up Express app, CORS, middleware, and route registration
- `backend/models/index.js` defines Sequelize associations and exports all models
- `backend/routes/` defines API endpoints by domain
- `backend/controllers/` is present for modular controller logic if needed; some route files may inline logic directly

Important patterns:
- Auth is enforced with `protect` and `internalOnly` middleware
- Data access is via Sequelize models under `backend/models/`
- Postgres is the primary database and tables are auto-managed by Sequelize sync/seeding patterns in `server.js`
- Seed/default master data is created automatically if no records are present

## Domain Model Overview

Core entities include:
- `User`
- `ApplicationGroup`
- `Application`
- `ApplicationCategory`
- `ApplicationFunction`
- `ApplicationDeveloper`
- `Backlog`
- `BacklogStatus`
- `Deployment`
- `Documentation`
- `SourceCode`
- `BugHistory`
- `KnowledgeBase`
- `Asset`

## Auth and Access Model

Authentication is implemented in the backend and UI.

Common rules in the app:
- users can login and get approved before full access
- `External` users may be redirected to specific views
- `Admin` users have elevated access to admin/master pages
- routes are protected by wrappers in `App.jsx`

## Route Conventions

Primary frontend routes include:
- `/login`
- `/pending`
- `/` (dashboard)
- `/app-groups`
- `/app-groups/:id`
- `/applications`
- `/deployments`
- `/documentations`
- `/knowledge-base`
- `/knowledge-base/:id`
- `/source-codes`
- `/backlogs`
- `/error-reports`
- `/admin`
- `/master`

## Data Flow Pattern

The normal flow in this app is:
1. frontend page loads and requests API via `api.get(...)` / `api.post(...)`
2. backend route validates auth and business rules
3. Sequelize model queries and returns data
4. frontend renders with state and modal components
5. user actions trigger refresh or update flows

## Workflow Expectations for Future AI Assistants

When editing this project:
- Keep frontend and backend changes aligned with the existing API contracts
- Preserve route guards and role-based access behavior
- Prefer matching the current project style and naming patterns in existing files
- Before making changes, inspect the corresponding page/component and related API route
- Preserve the existing `useUI` toast/confirm pattern for user feedback
- For UI changes, check both the component file and its CSS in `frontend/src/index.css`

## AI Agent Quick Guide

Use this repo-specific workflow when making changes:

- Start from the page or feature in `frontend/src/pages/` that matches the user-facing flow.
- Then inspect the corresponding route file under `backend/routes/` and the associated model in `backend/models/`.
- Preserve the existing UX conventions: `useUI` toast/confirm flow, route guards, and admin/internal restrictions.
- Prefer modifying existing patterns rather than introducing a new structure unless the feature requires it.
- For new entity features, check both the frontend form/modal and the backend CRUD route to keep the contract aligned.

### Typical edit mapping

- Menu/sidebar and app shell: `frontend/src/components/Layout.jsx`
- Route protection and page routing: `frontend/src/App.jsx`
- Auth and session state: `frontend/src/contexts/AuthContext.jsx`
- Toast/confirm feedback: `frontend/src/contexts/UIContext.jsx`
- CRUD page list/table: `frontend/src/pages/*.jsx`
- Create/edit modal forms: `frontend/src/components/*FormModal.jsx`
- API endpoint registration: `backend/server.js`
- Domain model associations: `backend/models/index.js`
- Domain route logic: `backend/routes/*.routes.js`
- Database schema: `backend/models/*.js`

## Useful Files to Inspect First

- `frontend/src/App.jsx`
- `frontend/src/components/Layout.jsx`
- `frontend/src/contexts/AuthContext.jsx`
- `frontend/src/contexts/UIContext.jsx`
- `frontend/src/pages/KnowledgeBasePage.jsx`
- `frontend/src/pages/KnowledgeBaseDetailPage.jsx`
- `backend/server.js`
- `backend/models/index.js`
- `backend/routes/knowledge-base.routes.js`
- `backend/models/KnowledgeBase.js`

## Run Commands

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Backend:
```bash
cd backend
npm install
npm run dev
```

Production build check:
```bash
cd frontend
npm run build
```

## Deployment Notes

The project is intended for deployment to Google Cloud Run, with frontend and backend separated as distinct services.
Refer to `README.md` for Cloud Run and environment configuration guidance.

## Notes for AI Assistance

This app is a business/internal management system, not a generic SaaS template. The user experience is focused on internal catalog workflows, data validation, and admin operations. Keep the implementation practical and consistent with this domain, especially for application tracking, release metadata, and user role restrictions.
