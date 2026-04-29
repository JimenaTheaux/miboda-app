# MiBoda · Funcionalidades por módulo

## 1. Onboarding
- Pantalla de bienvenida al primer ingreso
- Campos: Nombre Novia 1, Nombre Novia 2, fecha del casamiento, email Novia 2
- Upload de foto de portada (opcional, desde el celu)
- Guarda en tabla `events` y envía magic link a Novia 2

## 2. Dashboard
- Foto de portada editable (tap para cambiar)
- Nombre de las novias con tipografía Playfair italic
- Contador regresivo en tiempo real (días, horas, min, seg)
- Cards de resumen:
  - Total invitados confirmados
  - Total recaudado (suma de pagos)
  - Cantidad de mesas armadas
  - Tareas pendientes en checklist
- Acceso rápido a todos los módulos

## 3. Invitados
**Lista:**
- Nombre completo
- Género (libre, solo para eventual filtro)
- Edad: adulto / adolescente / niño
- Invitado por: Novia 1 / Novia 2 / Ambas
- Estado: confirmado / pendiente / no_asiste
- Mesa asignada (referencia)
- Menú: adulto / infantil (se asigna automáticamente por edad, editable)

**Filtros:**
- Por edad (adulto, adolescente, niño)
- Por "invitado por" (Novia 1, Novia 2, Ambas)
- Por estado

**Acciones:**
- Agregar invitado (formulario)
- Editar invitado
- Cambiar estado
- Asignar mesa desde el perfil del invitado

## 4. Mesas
- Crear mesa con nombre/número personalizado
- Definir capacidad máxima por mesa (campo editable, sin valor fijo)
- Ver invitados asignados a cada mesa
- Asignar / desasignar invitados (drag & drop o selector)
- Indicador visual de cupos: X / capacidad
- Ver menús por mesa (cuántos adultos / infantiles)
- Filtro: mesas completas / con lugar / vacías

## 5. Pagos de invitados
> Registra lo que cada invitado aporta/paga para el casamiento.
> Tabla en DB: `payments` (guest_id, event_id, amount, is_sena, notes, paid_at)

**Por invitado:**
- Monto total acordado con ese invitado
- Registro de pagos parciales: cada pago tiene monto, fecha y nota opcional
- El primer pago puede marcarse como "seña" (checkbox `is_sena`)
- Estado calculado automáticamente según los registros:
  - `sin_pago` → no hay ningún pago registrado
  - `sena_pagada` → hay un único pago marcado como seña
  - `pago_parcial` → hay pagos pero no cubren el total acordado
  - `pagado` → la suma de pagos iguala o supera el monto acordado
- Historial cronológico de todos los pagos del invitado

**Vista general (pantalla principal del módulo):**
- Lista de todos los invitados con su estado de pago (badge de color)
- Total recaudado (suma de todos los pagos registrados)
- Total esperado (suma de montos acordados de invitados confirmados)
- Filtro por estado: sin_pago / sena_pagada / pago_parcial / pagado
- Al tocar un invitado → detalle con historial + formulario para agregar pago

**Lo que NO hace este módulo:**
- No registra pagos a proveedores (eso es módulo 6)
- No mezcla tablas de `vendor_payments` con `payments`

---

## 6. Proveedores
> Gestiona los prestadores de servicio del casamiento: salón, fotógrafa, catering, etc.
> Tablas en DB: `vendors`, `vendor_files`, `vendor_payments`

### 6a. Ficha del proveedor
- Nombre del proveedor
- Rubro: salón / fotografía / catering / música / flores / indumentaria / otros
- Estado del proveedor: `en_revision` / `confirmado` / `cancelado`
- Notas internas

### 6b. Presupuestos adjuntos
- Hasta 3 presupuestos por proveedor (PDF o imagen)
- Cada presupuesto tiene: label ("Presup. 1", "Presup. 2", "Presup. 3"), archivo, monto
- Se marca cuál es el presupuesto elegido (el activo)
- El monto del presupuesto activo se usa como "monto total acordado" con ese proveedor

### 6c. Galería de fotos
- Imágenes de referencia o portfolio del proveedor
- Se suben por separado de los presupuestos (tipo `foto` en `vendor_files`)
- Se muestran en grilla dentro de la ficha

### 6d. Pagos al proveedor
> Registra lo que se le paga al proveedor a lo largo del tiempo.
> Tabla en DB: `vendor_payments` (vendor_id, event_id, amount, is_sena, notes, paid_at)

- Monto total del contrato (tomado del presupuesto activo)
- Registro de pagos parciales al proveedor: monto, fecha, nota
- El primer pago puede marcarse como "seña" al proveedor
- Estado de pago al proveedor calculado automáticamente (misma lógica que invitados):
  - `sin_pago` / `sena_pagada` / `pago_parcial` / `pagado`
- Historial cronológico de pagos realizados al proveedor

### 6e. Vista general (pantalla principal del módulo)
- Lista de proveedores con: nombre, rubro, estado del proveedor, estado de pago, monto contratado
- Total comprometido (suma de montos activos de proveedores confirmados)
- Total pagado a proveedores (suma de `vendor_payments`)
- Saldo pendiente a proveedores (comprometido − pagado)
- Filtro por estado del proveedor y por estado de pago

**Separación conceptual clara:**
- `payments` → plata que entra (de invitados hacia las novias)
- `vendor_payments` → plata que sale (de las novias hacia proveedores)
- Son dos tablas distintas, dos módulos distintos, nunca se mezclan

## 7. Checklist
- Lista de tareas predefinidas (template de casamiento AR)
- Agregar tareas personalizadas
- Marcar como completada / revertir
- Asignar a Novia 1, Novia 2, o Ambas
- Agrupadas por categoría (ceremonia, salón, vestuario, etc.)
- Progreso general en porcentaje

## 8. Auth / Perfil
- Login por magic link (sin contraseña)
- Al entrar: se detecta el evento vinculado al email
- Editar datos del evento: nombres, fecha, foto de portada
- No hay logout explícito necesario (sesión persistente)
