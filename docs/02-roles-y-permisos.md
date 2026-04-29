# MiBoda · Roles y permisos

## Modelo de acceso
Sin contraseña. Acceso por **magic link** enviado al email. Supabase Auth maneja el envío y la sesión.

## Roles
Hay un solo rol de usuario: **novia**. No hay admins, no hay invitados con acceso.

| Acción | Novia 1 | Novia 2 |
|--------|---------|---------|
| Ver dashboard | ✓ | ✓ |
| Editar datos del evento | ✓ | ✓ |
| Agregar / editar invitados | ✓ | ✓ |
| Registrar pagos | ✓ | ✓ |
| Gestionar mesas | ✓ | ✓ |
| Subir archivos a proveedores | ✓ | ✓ |
| Ver proveedores | ✓ | ✓ |
| Editar checklist | ✓ | ✓ |

## Vinculación de cuentas
- El evento se crea con dos emails registrados en la tabla `event_users`
- Ambas emails se asocian al mismo `event_id`
- Cuando una novia hace login, la app detecta su `event_id` y carga el evento compartido
- Si el email no está registrado en ningún evento, se muestra el onboarding

## Row Level Security (RLS) en Supabase
Todas las tablas tienen RLS habilitado. La política base es:

```sql
-- El usuario autenticado solo accede a datos de su event_id
auth.uid() IN (
  SELECT user_id FROM event_users WHERE event_id = [tabla].event_id
)
```

Cada tabla implementa esta política para SELECT, INSERT, UPDATE y DELETE.

## Storage
Los archivos (PDFs, fotos) se guardan en buckets privados de Supabase Storage.
El acceso se controla por `event_id` en el path: `/{event_id}/proveedores/{archivo}`
Solo usuarias del mismo evento pueden leer/escribir.
