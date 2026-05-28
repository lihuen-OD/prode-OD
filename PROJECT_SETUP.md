# LOS O'DWYER - Prode Mundial 2026

## Estructura del Proyecto

```
prode-odwyer/
├── backend/              # Node.js + Express + TypeScript + Prisma backend
│   ├── src/             # TypeScript source files
│   │   ├── app.ts       # Express app setup
│   │   ├── server.ts    # Server entry point
│   │   ├── config/      # Config (env, prisma)
│   │   ├── middlewares/ # Auth, validation, error handling
│   │   ├── modules/     # API modules (auth, users, matches, etc)
│   │   ├── utils/       # Helpers (ranking, responses, errors)
│   │   └── types/       # TypeScript definitions
│   ├── prisma/          # Prisma ORM
│   │   ├── schema.prisma # Database schema (SQLite dev, PostgreSQL prod)
│   │   └── seed.ts      # Seed script with mock data
│   ├── dist/            # Compiled JavaScript (generated)
│   ├── .env             # Environment variables (local dev)
│   ├── .env.example     # Template for .env
│   ├── package.json     # Dependencies
│   ├── tsconfig.json    # TypeScript config
│   └── README.md        # Backend setup guide
│
├── frontend/            # React + Vite + TypeScript frontend
│   ├── src/            # Source code
│   │   ├── App.tsx     # Main app component
│   │   ├── main.tsx    # Entry point
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable UI components
│   │   ├── services/   # API services (with mock fallback)
│   │   ├── hooks/      # Custom React hooks
│   │   ├── types/      # TypeScript type definitions
│   │   ├── layouts/    # Layout components
│   │   ├── routes/     # Routing components
│   │   └── mocks/      # Mock data (fallback mode)
│   ├── public/         # Static assets
│   ├── dist/           # Build output (generated)
│   ├── .env            # Environment variables (local dev)
│   ├── .env.example    # Template for .env
│   ├── vite.config.ts  # Vite bundler config
│   ├── tsconfig.json   # TypeScript config
│   ├── package.json    # Dependencies
│   ├── eslint.config.js # Linting config
│   └── README.md       # Frontend setup guide
│
├── .git/               # Git repository
├── .gitignore          # Git ignore rules
└── PROJECT_SETUP.md    # This file
```

## Configuración Inicial

### Backend

#### 1. Instalar dependencias
```bash
cd backend
npm install
```

#### 2. Configurar variables de entorno
Crea `backend/.env` (ya existe con valores por defecto):
```
DATABASE_URL="file:./dev.db"
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

#### 3. Preparar la base de datos
```bash
# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate -- --name init

# Cargar datos de prueba
npm run prisma:seed
```

#### 4. Build y ejecución
```bash
# Build TypeScript
npm run build

# Ejecutar en desarrollo
npm run dev

# Ejecutar el build compilado
npm start
```

El backend estará disponible en: `http://localhost:3000`

### Frontend

#### 1. Instalar dependencias
```bash
cd frontend
npm install
```

#### 2. Configurar variables de entorno
Crea `frontend/.env` (ya existe con valores por defecto):
```
VITE_API_URL=http://localhost:3000/api
VITE_USE_MOCKS=false
```

**Nota:** Si `VITE_USE_MOCKS=true`, usa datos locales sin conectar al backend.

#### 3. Build y ejecución
```bash
# Desarrollo con hot-reload
npm run dev

# Build para producción
npm run build

# Preview del build
npm preview
```

El frontend estará disponible en: `http://localhost:5173`

## Ejecución Completa (Local)

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Luego abre: `http://localhost:5173`

### Credenciales de prueba

**Admin:**
- Usuario: `admin`
- Contraseña: `admin123`

**Participante:**
- Usuario: `juan.perez`
- Contraseña: `1234`

## Estructura API

### Autenticación
- `POST /api/auth/login` - Login con usuario/contraseña
- `GET /api/auth/me` - Obtener datos del usuario autenticado

### Usuario
- `GET /api/me/dashboard` - Dashboard agregado del usuario
- `PUT /api/me/predictions/bulk` - Guardar múltiples pronósticos

### Admin
- `GET /api/admin/dashboard` - Stats generales
- `GET /api/admin/users` - Listar usuarios
- `POST /api/admin/users` - Crear usuario
- `PUT /api/admin/users/:id` - Actualizar usuario
- `GET /api/admin/matches` - Listar partidos
- `POST /api/admin/matches` - Crear partido
- `PUT /api/admin/matches/:id` - Actualizar partido
- `PUT /api/admin/matches/:id/result` - Cargar resultado
- `PUT /api/admin/settings` - Actualizar configuración

### Público
- `GET /api/ranking` - Ranking general
- `GET /api/settings/public` - Configuración pública

## Despliegue en la Nube

### Frontend - Netlify
1. Conecta el repositorio a Netlify
2. Build command: `npm run build`
3. Base directory: `frontend`
4. Publish directory: `dist`
5. Variables de entorno:
   ```
   VITE_API_URL=https://tu-backend-en-render.onrender.com/api
   VITE_USE_MOCKS=false
   ```

### Backend - Render
1. Conecta el repositorio a Render
2. Build command: `npm install && npm run prisma:migrate -- --skip-generate && npm run build`
3. Start command: `npm start`
4. Selecciona PostgreSQL para la base de datos
5. Variables de entorno:
   ```
   DATABASE_URL=postgresql://...tu-conexion-neon...
   JWT_SECRET=tu-secret-key-fuerte
   JWT_EXPIRES_IN=7d
   PORT=3000
   FRONTEND_URL=https://tu-frontend-en-netlify.netlify.app
   NODE_ENV=production
   ```

## Notas de Desarrollo

- **Frontend**: Las páginas se cargan de forma asincrónica desde la API. Si `VITE_USE_MOCKS=true`, usará datos locales.
- **Backend**: Usa SQLite para desarrollo, PostgreSQL para producción.
- **Tipo de datos**: El frontend y backend comparten contratos a través de tipos TypeScript.
- **Base de datos**: Cambiar `provider` en `prisma/schema.prisma` si necesitas adaptar a otra BD.

## Troubleshooting

### Backend no conecta a la BD
- Verifica que `DATABASE_URL` esté correctamente configurado en `.env`
- Para SQLite, debe ser: `file:./dev.db` o `file:./dev.sqlite`
- Borra `dev.db` y vuelve a ejecutar `npm run prisma:migrate`

### Frontend no conecta al backend
- Verifica que el backend esté corriendo en `http://localhost:3000`
- Verifica `VITE_API_URL` en `frontend/.env`
- Si necesitas fallback, usa `VITE_USE_MOCKS=true`

### Build falla
- Limpia `node_modules` y `dist`: `rm -rf node_modules dist`
- Reinstala: `npm install`
- Vuelve a compilar: `npm run build`
