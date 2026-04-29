# MiBoda · Estilos y diseño

## Tipografía
```css
/* Google Fonts — incluir en index.html */
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;1,400&display=swap');

font-family: 'Nunito', sans-serif;     /* toda la UI */
font-family: 'Playfair Display', serif; /* solo nombres de la pareja */
```

| Elemento | Fuente | Peso | Tamaño |
|----------|--------|------|--------|
| Nombres pareja (portada) | Playfair Display italic | 400 | 22–28px |
| Títulos de sección | Nunito | 700 | 14–16px |
| Labels y UI | Nunito | 600 | 10–12px |
| Cuerpo / listas | Nunito | 500 | 12–14px |
| Números grandes (stats) | Nunito | 700 | 20–24px |
| Labels muted | Nunito | 500 | 9–10px |

## Paleta de colores
```js
// tailwind.config.js → extend.colors
colors: {
  cream:       '#F5F0E8',
  sand:        '#E2D8CC',
  terracotta:  '#C4714A',
  'terra-light': '#EAB898',
  'terra-dark':  '#8B4A2F',
  sage:        '#8A9B7E',
  'sage-light':  '#C8D4C0',
  'sage-dark':   '#4E6044',
  wine:        '#7B3D4A',
  'warm-white':  '#FDFAF6',
}
```

## Uso semántico del color
| Contexto | Color |
|----------|-------|
| CTA principal, acento | `terracotta` |
| Fondo base de la app | `cream` |
| Superficies / cards | `warm-white` |
| Bordes y separadores | `sand` |
| Estado: confirmado | `sage` |
| Estado: pendiente | amber/`#C4944A` |
| Estado: no asiste | rojo suave `#C47A7A` |
| Estado: en revisión | `terra-light` |
| Texto principal | `#2C2420` |
| Texto secundario | `#6B5B52` |
| Texto muted | `#9A8A82` |

## Componentes UI — guía rápida

### Cards
```jsx
// Card base
<div className="bg-warm-white border border-sand rounded-2xl p-4">
```

### Badges de estado
```jsx
// Confirmado
<span className="bg-sage-light text-sage-dark text-xs font-semibold px-2.5 py-1 rounded-full">
  Confirmado
</span>

// Pendiente
<span className="bg-amber-50 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
  Pendiente
</span>

// No asiste
<span className="bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
  No asiste
</span>
```

### Botón primario
```jsx
<button className="bg-terracotta text-warm-white font-semibold rounded-2xl px-5 py-2.5 active:scale-95 transition-transform">
  Guardar
</button>
```

### Nav bar inferior
```jsx
// 5 tabs: Inicio, Invitados, Mesas, Pagos, Más
// Tab activo: text-terra-dark, ícono relleno
// Tab inactivo: text-muted, ícono outline
```

### Contador regresivo
```jsx
// Cada unidad en pill redondeada
<div className="bg-cream rounded-xl px-3 py-2 text-center">
  <span className="text-2xl font-bold text-terra-dark">147</span>
  <span className="text-xs text-muted font-semibold block">días</span>
</div>
```

## Border radius
| Elemento | Valor |
|----------|-------|
| Cards grandes | `rounded-2xl` (16px) |
| Cards chicas / pills | `rounded-xl` (12px) |
| Badges / chips | `rounded-full` |
| Botones | `rounded-2xl` |
| Avatares | `rounded-full` |
| Inputs | `rounded-xl` |

## Espaciado
- Padding de pantalla: `px-4` (16px)
- Gap entre cards: `gap-2` (8px)
- Padding interno de card: `p-4` (16px)
- Separadores: `border-b border-sand`

## PWA Manifest
```json
{
  "name": "MiBoda",
  "short_name": "MiBoda",
  "theme_color": "#C4714A",
  "background_color": "#F5F0E8",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/"
}
```

## Mobile-first
- Diseñado para 390px de ancho (iPhone 14 Pro)
- Máximo ancho de contenido en desktop: 480px centrado
- Nav bar fija en el bottom (no top)
- Sin hover states como única interacción — siempre hay tap/active state
