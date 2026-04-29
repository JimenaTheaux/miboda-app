# MiBoda · Guía de desarrollo iterativo

## Principio
Un módulo a la vez. Cada módulo entregable y funcional antes de pasar al siguiente. No avanzar al módulo N+1 si N no tiene CRUD completo.

## Orden de desarrollo

### Iteración 1 — Base y auth
- [ ] Setup proyecto: `npm create vite`, Tailwind, React Router
- [ ] Configurar Supabase client (`src/lib/supabase.js`)
- [ ] Pantalla de login con magic link
- [ ] Detección de evento vinculado al email → redirige a onboarding o dashboard
- [ ] Pantalla de onboarding (nombres, fecha, foto de portada)
- [ ] Guardar en `events` + `event_users`
- [ ] Store de Zustand con `event`, `user`

### Iteración 2 — Dashboard
- [ ] Layout base con nav bar inferior (5 tabs)
- [ ] Foto de portada con nombres y tipografía
- [ ] Contador regresivo en tiempo real
- [ ] Cards de resumen (queries a Supabase)
- [ ] Checklist preview (últimas 4 tareas)

### Iteración 3 — Invitados
- [ ] Lista de invitados con filtros
- [ ] Formulario agregar/editar invitado
- [ ] Cambio de estado (tap en badge)
- [ ] Contadores por categoría en el header

### Iteración 4 — Mesas
- [ ] CRUD de mesas (nombre, capacidad)
- [ ] Asignar invitados a mesa (selector)
- [ ] Vista de cupos (X/capacidad)
- [ ] Indicador de menús por mesa

### Iteración 5 — Pagos
- [ ] Monto total por invitado
- [ ] Registro de pagos parciales
- [ ] Marcar seña
- [ ] Vista de estado calculado
- [ ] Resumen general de recaudación

### Iteración 6 — Proveedores
- [ ] CRUD de proveedores
- [ ] Upload de PDF / imagen a Supabase Storage
- [ ] Selector de presupuesto activo (1, 2, 3)
- [ ] Galería de fotos del proveedor
- [ ] Cambio de estado

### Iteración 7 — Checklist
- [ ] Template predefinido de tareas AR
- [ ] Agregar tareas custom
- [ ] Completar / revertir
- [ ] Asignar a novia
- [ ] Barra de progreso

### Iteración 8 — PWA y polish
- [ ] Configurar Vite PWA Plugin (manifest, icons)
- [ ] Service worker con estrategia NetworkFirst/CacheFirst
- [ ] Probar instalación en Android y Chrome desktop
- [ ] Modo offline en dashboard y checklist
- [ ] Deploy en Vercel

## Reglas para el desarrollo con Claude en VS Code
- Siempre trabajar en un archivo a la vez
- Pedir el componente completo, no fragmentos
- Si hay un bug, pegar el error exacto de consola
- Antes de cada módulo, pegar el `.md` correspondiente como contexto
- Usar `@workspace` en Copilot/Claude para dar contexto del repo completo

## Archivos de contexto a abrir en VS Code (por módulo)
| Módulo | Archivos de contexto a mencionar |
|--------|----------------------------------|
| Auth | `01-contexto`, `02-roles`, `06-datos` |
| Dashboard | `01-contexto`, `04-funcionalidades`, `08-estilos` |
| Invitados | `04-funcionalidades`, `06-datos`, `03-estados` |
| Mesas | `04-funcionalidades`, `06-datos` |
| Pagos | `04-funcionalidades`, `06-datos`, `03-estados` |
| Proveedores | `04-funcionalidades`, `06-datos`, `05-stack` |
| Checklist | `04-funcionalidades`, `06-datos` |
| PWA | `05-stack` |
