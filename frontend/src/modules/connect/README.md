# Frontend Connect Module

This directory contains the React (TypeScript + Vite) implementation of the **Connect Module**—a secure, dynamic matchmaking and messaging frequency transceiver system for wasteland survivors.

> [!NOTE]
> Local development server builds and production outputs (`dist/`) are excluded from Git version control due to `.gitignore` rules. Ensure you run a local development script to build or serve the application.

---

## 1. Setup & Development

### A. Install Dependencies
Run from the root of the `frontend/` directory:
```bash
npm install
```

### B. Run Local Development Server
Starts the Vite local server with hot module reloading:
```bash
npm run dev
```

### C. Build for Production
Verifies that all TypeScript types compile correctly and outputs optimized assets:
```bash
npm run build
```

---

## 2. Directory Structure

- `components/MatchMaking/`:
  - `MatchProfile.tsx`: Renders the active profile card, dynamic supply lists, risk calculations, and has a built-in glowing scanner fallback placeholder for missing/broken avatars.
  - `ActionBar.tsx`: Renders the action buttons (Pass, Like, Love) with match counts.
- `components/ChatMate/`: Renders sidebars and chat interface overlays.
- `hooks/`:
  - `useMatchMakingFeed.ts`: Manages survivor search radar feed telemetry.
  - `useChatMessages.ts`: Manages secure messaging history, input controls, and automated 4-second polling updates.
- `apis/Connect.api.ts`: API service wrappers around Axios connections.
- `types/connect.types.ts`: TypeScript contracts representing survivor profiles and dynamic supplies.
- `utils/mockSurvivors.ts`: Offline backup mock data containing matching structured supply items.
