# LOS O'DWYER - Frontend

Frontend en React + TypeScript + Vite para el Prode Mundial 2026.

## Configuración

Creá un archivo `.env` en esta carpeta con:

```env
VITE_API_URL=http://localhost:3000/api
VITE_USE_MOCKS=true
```

- `VITE_USE_MOCKS=true` usa los mocks locales.
- `VITE_USE_MOCKS=false` consume el backend real.

## Instalación local

```bash
npm install
npm run dev
```

## Conexión con el backend

- Login: `POST /api/auth/login`
- Dashboard de usuario: `GET /api/me/dashboard`
- Pronósticos: `PUT /api/me/predictions/bulk`
- Ranking: `GET /api/ranking?limit=100`
- Admin: `GET /api/admin/dashboard`

## Notas

- La UI mantiene el modo mock para desarrollo rápido.
- El backend vive en `../backend`.

## Despliegue en Netlify

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`
- Rutas SPA: se resuelven con la configuración de `netlify.toml`
- Variables de entorno: configurá `VITE_API_URL` apuntando al backend publicado y `VITE_USE_MOCKS=false`
