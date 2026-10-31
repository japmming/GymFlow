# GymFlow

Sistema de gestión para gimnasios. Monorepo con React + TypeScript, NestJS y PostgreSQL.

## Requisitos
- Node.js LTS compatible con NestJS
- npm
- Git
- Docker Desktop (recomendado para PostgreSQL)

## Estructura
- `apps/web`: frontend React + TypeScript + Vite
- `apps/api`: backend NestJS + Prisma
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
cp .env.example .env
```

Edita `.env` y define al menos `DATABASE_URL` y un `JWT_ACCESS_SECRET` propio. Para generar uno:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Aplica el esquema, crea los usuarios iniciales y levanta la API:

```bash
npx prisma migrate deploy
npm run db:seed
npm run start:dev
```

API: http://localhost:3000/api/v1  
Health check: http://localhost:3000/api/v1/health  
Swagger: http://localhost:3000/api/docs

### 3. Frontend
En otra terminal:
```bash
cd apps/web
npm install
npm run dev
```

Frontend: http://localhost:5173

## Autenticación y roles

El acceso requiere iniciar sesión. La API emite un **access token JWT** de corta duración que el frontend mantiene en memoria y un **refresh token** opaco de 7 días guardado en una cookie `httpOnly`. El refresh rota en cada uso; si se detecta reutilización se revocan todas las sesiones del usuario.

| Rol | Alcance |
| --- | --- |
| `ADMIN` | Acceso completo: socios, membresías, pagos, asistencias, planes y usuarios; reversos, cancelaciones y activación/desactivación. |
| `RECEPTION` | Operación diaria (socios, membresías, pagos, asistencias). Sin gestión de planes ni usuarios, sin reversos de pagos, sin cancelaciones de membresías/asistencias ni activación/desactivación de socios. |

Endpoints de sesión:
- `POST /api/v1/auth/login`: inicia sesión y entrega el access token.
- `POST /api/v1/auth/refresh`: rota el refresh token y entrega un nuevo access token.
- `POST /api/v1/auth/logout`: revoca el refresh token actual.
- `GET /api/v1/auth/me`: devuelve el perfil autenticado.

### Credenciales demo

El seed crea estas cuentas cuando no existen:

| Rol | Correo | Contraseña |
| --- | --- | --- |
| `ADMIN` | `admin@gymflow.local` | `Admin123!` |
| `RECEPTION` | `recepcion@gymflow.local` | `Recepcion123!` |

Puedes cambiarlas con las variables `SEED_ADMIN_*` y `SEED_RECEPTION_*` antes de ejecutar el seed. **Cámbialas antes de usar datos reales.**

## Scripts útiles

### API (`apps/api`)
```bash
npm run lint          # ESLint
npm run test          # pruebas unitarias
npm run build         # compila a dist/
npm run db:seed       # crea gimnasio y usuarios iniciales
npx prisma migrate dev    # nueva migración en desarrollo
npx prisma migrate deploy # aplica migraciones pendientes
```

### Web (`apps/web`)
```bash
npm run typecheck
npm run build
```

## Datos demo y privacidad

Los datos de demostración usan el marcador `DEMO` en `memberCode` y `documentNumber`. No introduzcas datos personales reales en esta versión.
