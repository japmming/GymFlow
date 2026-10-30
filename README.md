# GymFlow

Sistema de gestión para gimnasios. Monorepo inicial con React + TypeScript, NestJS y PostgreSQL.

## Requisitos
- Node.js LTS compatible con NestJS
- npm
- Git
- Docker Desktop (recomendado para PostgreSQL)

## Estructura
- `apps/web`: frontend React + TypeScript + Vite
- `apps/api`: backend NestJS
- `docker-compose.yml`: PostgreSQL local

## Inicio rápido

### 1. Base de datos
```bash
docker compose up -d db
```

### 2. API
```bash
cd apps/api
npm install
npm run start:dev
```

API: http://localhost:3000/api/v1  
Health check: http://localhost:3000/api/v1/health

### 3. Frontend
En otra terminal:
```bash
cd apps/web
npm install
npm run dev
```

Frontend: http://localhost:5173

## Nota
Esta es la estructura inicial de la Fase 1. La conexión a PostgreSQL, Prisma, autenticación y módulos de negocio se incorporarán en las siguientes fases. No introduzcas datos personales reales en esta versión.
