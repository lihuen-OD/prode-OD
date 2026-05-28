# Club Deportivo Barú - Backend

Backend real para el Prode Mundial 2026 del Club Deportivo Barú.

## Stack

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL en Neon
- JWT
- bcrypt
- Zod
- CORS

## Estructura

- `prisma/schema.prisma`: modelo de base de datos
- `prisma/seed.ts`: datos iniciales para probar rápido
- `src/app.ts`: configuración del servidor
- `src/modules/*`: módulos por dominio

## Instalación local

1. Entrá a la carpeta `backend`.
2. Instalá dependencias.
3. Copiá `.env.example` a `.env`.
4. Configurá `DATABASE_URL`, `JWT_SECRET` y `FRONTEND_URL`.
5. Ejecutá migraciones y seed.

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## Variables de entorno

```env
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
PORT=3000
FRONTEND_URL=
NODE_ENV=
```

## Login admin de prueba

- Usuario: `admin`
- Contraseña: `admin123`

## Endpoints principales

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/me/dashboard`
- `PUT /api/me/predictions/bulk`
- `GET /api/ranking?limit=100`
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/matches`
- `POST /api/admin/matches`
- `PUT /api/admin/matches/:id`
- `PUT /api/admin/matches/:id/result`
- `GET /api/settings/public`
- `PUT /api/admin/settings`

## Conexión con el frontend

En el frontend configurá:

```env
VITE_API_URL=http://localhost:3000/api
VITE_USE_MOCKS=false
```

Si `VITE_USE_MOCKS=true`, el frontend puede seguir usando mocks locales mientras probás el backend.

## Render + Neon + Netlify

- Neon: usá la URL de conexión como `DATABASE_URL`.
- Render: apuntá el servicio a `npm install`, `npm run prisma:generate`, `npm run build` y `npm start`.
- Netlify: configurá `FRONTEND_URL` con el dominio real del frontend desplegado.
- CORS: permití exactamente el dominio de Netlify en `FRONTEND_URL`.

> Cuando tengas la URL final de Netlify, reemplazá el placeholder en `FRONTEND_URL`.

## Notas de despliegue

- Corré las migraciones antes del primer deploy.
- Usá `prisma migrate deploy` en producción.
- Corré `prisma:seed` solo en entornos de prueba o staging.
