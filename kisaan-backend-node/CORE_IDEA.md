# Kisaan Backend Node.js - Core Idea & Project Rules

## Core Idea
This project is a clean, modular Node.js backend for Kisaan Center, designed for maintainability, clarity, and easy evolution. All features, APIs, and database changes must be tracked and documented to avoid confusion and technical debt.

---

## Project Rules & Guidelines

### 1. API Structure & Location
- **All API route definitions** are in `src/routes/`.
- **All route handlers/controllers** are in `src/controllers/`.
- **Business logic/services** are in `src/services/`.
- **Data models** (ORM, validation) are in `src/models/`.
- **API schemas and documentation** are in `docs/`.

### 2. Login & Authentication
- If you are dealing with login/authentication:
  - APIs are defined in `src/routes/auth.routes.ts`.
  - Controllers are in `src/controllers/auth.controller.ts`.
  - Business logic is in `src/services/auth.service.ts`.
  - Update API docs in `docs/auth-api.md`.

### 3. Database Changes
- If you change the database schema:
  - Update the relevant model in `src/models/`.
  - Document the change in `CHANGELOG.md` (with date and reason).
  - Update or add migration scripts if needed.
  - Add/Update documentation in `docs/` (e.g., `docs/db-schema.md`).

### 4. Feature & API Changes
- Every new feature or API change must be:
  - Added to `CHANGELOG.md` with a date and summary.
  - Documented in the appropriate `docs/` file.

### 5. General Principles
- Keep code modular and well-commented.
- Prefer TypeScript for type safety.
- Keep this file (`CORE_IDEA.md`) up to date with any major vision or structure changes.

---

## For Agents & Developers
- **Read this file first** to understand the project’s philosophy and structure.
- **Always check `CHANGELOG.md` and `docs/`** before making changes.
- **Document everything**—future you (and other agents) will thank you!
