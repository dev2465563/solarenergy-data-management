# Solar Energy Data Management

Full-stack application for managing solar inverter energy data. Upload CSV files, filter records, view total energy, and edit or delete records inline.

## Prerequisites

- **Node.js** >= 20
- **pnpm** (recommended) or npm

## Install

```bash
pnpm install
```

## Run

### Development (backend + frontend)

```bash
pnpm run dev
```

This starts:
- **Backend** at http://localhost:3000
- **Frontend** at http://localhost:5173 (Vite dev server)

### Run separately

```bash
# Backend only
pnpm run dev:backend

# Frontend only
pnpm run dev:frontend
```

## Test

```bash
# All packages
pnpm test

# Backend only
pnpm test:backend

# Frontend only
pnpm test:frontend
```

## Upload Sample CSV

1. Start the app (`pnpm run dev`)
2. Open http://localhost:5173 in your browser
3. On first visit, you'll see the upload screen — drag & drop or click to select `SampleData.csv` (in the project root)
4. After upload, the table and filters become available

### CSV format

- **Required:** `timestamp` column (format: `M/D/YYYY H:MM`, e.g. `7/9/2019 0:00`)
- **Device columns:** Any other columns are treated as device outputs (e.g. `INV1`, `INV2`)
- Empty cells → `null`; numbers → energy values (kWh)

## Environment variables

| Variable | Package | Default | Description |
|----------|---------|---------|-------------|
| `PORT` | backend | 3000 | Server port |
| `CORS_ORIGIN` | backend | `*` | Allowed CORS origin for API |
| `LOG_LEVEL` | backend | `debug` (dev) / `info` (prod) | Pino log level |
| `VITE_API_URL` | frontend | `""` | Backend API base URL (empty = same origin) |
| `STATIC_DIR` | backend | — | When set, serve frontend static files (for Docker) |
| `DATA_DIR` | backend | `packages/backend/data` | Path for persisted records (for Docker volume) |

## Docker

```bash
# Build and run with Docker Compose
docker compose up --build
```

App runs at http://localhost:3000. Data persists in a Docker volume (`solar-data`).

```bash
# Build image only
docker build -t solar-energy-app .

# Run with custom port
docker run -p 8080:3000 -v solar-data:/data solar-energy-app
```

## Build

```bash
pnpm run build
```

Builds backend (`packages/backend/dist`) and frontend (`packages/frontend/dist`).

## Project structure

```
packages/
  backend/     # Express API, file-based persistence
  frontend/    # React + Vite + TanStack Table
  types/       # Shared domain types
```
