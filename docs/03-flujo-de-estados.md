# MiBoda · Flujo de estados

## Estados de invitado
```
pendiente → confirmado
pendiente → no_asiste
confirmado → no_asiste
```
- **pendiente**: estado inicial al crear el invitado
- **confirmado**: confirmó asistencia
- **no_asiste**: no va a ir (no se elimina, se mantiene en la lista)

## Estados de pago (por invitado)
```
sin_pago → seña_pagada → pago_parcial → pagado
sin_pago → pagado (pago único)
```
- **sin_pago**: no registró ningún pago
- **seña_pagada**: se registró una seña (monto parcial inicial)
- **pago_parcial**: hay al menos un pago pero no cubre el total
- **pagado**: el total de pagos cubre el monto acordado

El estado se calcula automáticamente en base a los registros de `payments`.

## Estados de proveedor
```
en_revision → confirmado
en_revision → cancelado
confirmado → cancelado
```
- **en_revision**: se está evaluando el presupuesto
- **confirmado**: proveedor contratado
- **cancelado**: se descartó

## Estados de tarea (checklist)
```
pendiente → completada
completada → pendiente (reversible)
```

## Estados de mesa
Las mesas no tienen estado propio. Una mesa está "completa" cuando la cantidad de invitados asignados alcanza su capacidad máxima. Esto se muestra visualmente en la UI.

## Onboarding
```
nuevo_usuario → onboarding → dashboard
usuario_existente → dashboard
```
- Si `event_users` no tiene registro para el `auth.uid()` → onboarding
- Si ya tiene evento → dashboard directo
