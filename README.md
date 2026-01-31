# RTWE ERP - Turborepo Monorepo

A high-performance monorepo for the RTWE Textile ERP System, powered by Turborepo.

## 🏗️ Project Structure

```
rtwe-erp/
├── apps/
│   ├── backend/              # Main Express API server
│   ├── frontend/             # Static HTML/CSS/JS frontend
│   ├── attendance-listener/  # Standalone attendance device listener
│   └── rapier-costing/       # Rapier costing calculator backend
├── packages/                 # Shared packages (future)
├── turbo.json               # Turborepo configuration
└── package.json             # Root workspace configuration
```

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Development

Run all applications in development mode:
```bash
npm run dev
```

Run specific applications:
```bash
npm run backend:dev        # Backend API only
npm run frontend:dev       # Frontend only
npm run attendance:dev     # Attendance listener only
npm run costing:dev        # Rapier costing only
```

### Production

Build all applications:
```bash
npm run build
```

Start all applications:
```bash
npm run start
```

## 📦 Applications

### Backend (`apps/backend`)
Main Express.js API server handling:
- User authentication & authorization
- Master data management
- Attendance management
- Salary management
- Company & vendor management

**Port:** 5000 (default)

### Frontend (`apps/frontend`)
Static HTML/CSS/JavaScript frontend served by the backend.

### Attendance Listener (`apps/attendance-listener`)
Standalone service for syncing attendance data from ZKTeco devices.
Can be built as a standalone executable:
```bash
cd apps/attendance-listener
npm run build
```

### Rapier Costing (`apps/rapier-costing`)
Specialized backend service for rapier fabric costing calculations.

**Port:** 5001 (default)

## 🔧 Environment Variables

Each application requires its own `.env` file. Copy from examples:

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Rapier Costing
cp apps/rapier-costing/.env.example apps/rapier-costing/.env

# Attendance Listener
# Edit apps/attendance-listener/config.json
```

## 🎯 Turborepo Features

- **Smart Caching:** Build outputs are cached for faster rebuilds
- **Parallel Execution:** Tasks run in parallel when possible
- **Dependency Awareness:** Tasks respect package dependencies
- **Remote Caching:** Share cache across team (configurable)

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run all apps in development mode |
| `npm run build` | Build all applications |
| `npm run start` | Start all applications |
| `npm run test` | Run tests across all apps |
| `npm run lint` | Lint all applications |
| `npm run clean` | Clean build artifacts and node_modules |

## 🔍 Filtering Workspaces

Run commands for specific workspaces using Turbo's filter flag:

```bash
# Run dev for backend only
turbo run dev --filter=backend

# Build attendance-listener only
turbo run build --filter=attendance-listener

# Run tests for all apps except frontend
turbo run test --filter=!frontend
```

## 📚 Documentation

- [Turborepo Documentation](https://turbo.build/repo/docs)
- Original project documentation in respective app directories

## 🤝 Contributing

1. Make changes in the appropriate app directory
2. Test locally with `npm run dev`
3. Build to verify with `npm run build`
4. Commit changes

## 📄 License

ISC
