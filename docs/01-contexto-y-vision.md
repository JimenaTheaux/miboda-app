# MiBoda · Contexto y visión

## Qué es
App web PWA (Progressive Web App) instalable en Android y desktop para que dos novias organicen su casamiento de forma colaborativa. Sin fricción, sin funciones de relleno, solo lo necesario para llegar al día con todo bajo control.

## Para quién
Dos novias (o cualquier pareja) que quieren un lugar único donde gestionar invitados, mesas, pagos y proveedores, sin usar planillas de Excel ni apps genéricas en inglés.

## Propuesta de valor
- Una sola app, dos cuentas vinculadas al mismo evento
- Todo en pesos argentinos, pensado para casamientos locales
- PWA instalable: funciona desde el celu como una app nativa
- Sin contraseña: acceso por magic link al email
- Archivos de presupuestos adjuntos en la misma app

## Nombre
**MiBoda**

## Paleta y tipografía
- **UI:** Nunito (Google Fonts) — redondeada, amena, legible en mobile
- **Nombres de la pareja:** Playfair Display italic — elegante, contrasta bien
- **Colores principales:**
  - Terracotta `#C4714A` — acento principal, CTAs
  - Teja oscura `#8B4A2F` — texto sobre terracotta
  - Salmón `#EAB898` — estados hover, fondos suaves
  - Salvia `#8A9B7E` — estados positivos / confirmado
  - Vino `#7B3D4A` — acento secundario
  - Crema `#F5F0E8` — fondo base
  - Blanco cálido `#FDFAF6` — superficies / cards
  - Arena `#E2D8CC` — bordes y separadores

## Flujo inicial (onboarding)
Al entrar por primera vez, antes de ver el dashboard, la app pide:
1. Nombre de la Novia 1
2. Nombre de la Novia 2
3. Fecha del casamiento
4. Foto de portada (desde el celu, opcional)

Estos datos se guardan en la tabla `event` y no se vuelven a pedir.

## Plataforma
- Frontend: React + Vite + Tailwind CSS
- PWA: Vite PWA Plugin (manifest + service worker)
- Backend/DB/Auth: Supabase
- Storage: Supabase Storage (PDFs, fotos)
- Deploy: Vercel
