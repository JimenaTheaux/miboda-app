# MiBoda · Stack técnico

## Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Build tool |
| Tailwind CSS | 3 | Estilos utilitarios |
| Vite PWA Plugin | latest | Service worker + manifest |
| React Router | 6 | Navegación |
| Zustand | 4 | Estado global (sesión, evento) |
| React Query (TanStack) | 5 | Fetching + cache de datos |
| React Hook Form | 7 | Formularios |

## Backend / Infraestructura
| Tecnología | Uso |
|---|---|
| Supabase | Auth (magic link), PostgreSQL, Storage, RLS |
| Supabase JS Client | SDK en el frontend |
| Vercel | Deploy del frontend |

## Fuentes
```html
<!-- en index.html -->
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;1,400&display=swap" rel="stylesheet">
```

## PWA
- Manifest con nombre "MiBoda", colores otoñales, icono propio
- Service worker via Vite PWA Plugin (Workbox)
- Estrategia: NetworkFirst para datos, CacheFirst para assets
- Instalable en Android (prompt nativo) y desktop Chrome/Edge
- Funciona offline en: dashboard (último estado cacheado), checklist

## Variables de entorno
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```

## Estructura de carpetas
```
miboda-app/
├── public/
│   ├── icons/          # PWA icons (192, 512)
│   └── manifest.json   # generado por Vite PWA
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/          # Una carpeta por módulo
│   │   ├── Dashboard/
│   │   ├── Guests/
│   │   ├── Tables/
│   │   ├── Payments/
│   │   ├── Vendors/
│   │   └── Checklist/
│   ├── lib/
│   │   └── supabase.js # Cliente Supabase
│   ├── store/          # Zustand stores
│   ├── hooks/          # Custom hooks
│   └── main.jsx
├── supabase/
│   └── migrations/     # SQL de estructura
├── .env.local
└── vite.config.js
```

## Comandos
```bash
npm create vite@latest miboda-app -- --template react
cd miboda-app
npm install
npm install @supabase/supabase-js @tanstack/react-query zustand react-router-dom react-hook-form
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa
npx tailwindcss init -p
```
