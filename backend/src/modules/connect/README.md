# Backend Connect Module

This directory contains the backend implementation of the **Connect Module**—a secure, dynamic matchmaking and messaging frequency transceiver system for wasteland survivors.

> [!NOTE]
> Some critical files and folders (e.g., SQLite databases, local environment keys, uploads, and generated Prisma client artifacts) are excluded from Git version control due to `.gitignore` rules. Below is a guide on how to restore and set them up.

---

## 1. Excluded Files & Folders Setup

### A. Environment Variables (`.env`)
Create a `.env` file in the root of the `backend/` directory:
```env
DATABASE_URL="file:./prisma/dev.db"
PORT=3000
GEMINI_API_KEY="your-google-gemini-api-key"
```

### B. Prisma Generated Client (`generated/prisma`)
Prisma generated artifacts are excluded from version control to prevent stale builds. Regenerate the local client binary:
```bash
npx prisma generate
```
This writes the freshly generated TypeScript client interfaces directly to `backend/generated/prisma`.

### C. SQLite Database & Seeding (`prisma/dev.db`)
The local SQLite database and its journal are gitignored. Run the following to push the schema and populate the database with normalized survivor supply data:
```bash
# Push schema and reset the database instance
npx prisma db push --force-reset

# Seed the database
npx prisma db seed
```

### D. Uploads & Avatars (`uploads/`)
Avatar files are served locally from `backend/uploads/`. If this directory is missing or empty, ensure a directory named `uploads` exists inside the `backend/` directory and populate it with relevant mock image assets.

---

## 2. Directory Structure

- `controllers/connect.controller.ts`: Handles requests, computes distance, supply-based compatibility, and parses main-frame terminal AI opinions.
- `models/connect.model.ts`: Interacts with the Prisma Client, including matched survivor filtering/exclusions.
- `routers/connect.router.ts`: Exposes the endpoint paths (`/survivors`, `/swipe`, `/matches`, `/messages`, etc.).
- `types/connect.types.ts`: Holds type safety contracts for backend controllers and models.
- `schemas/connect.schema.schema.ts`: Validation schemas for request payloads.
