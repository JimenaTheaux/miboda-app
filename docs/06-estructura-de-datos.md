# MiBoda · Estructura de datos (Supabase / PostgreSQL)

## Ejecutar en Supabase → SQL Editor, en este orden

---

### 1. events
```sql
create table events (
  id uuid primary key default gen_random_uuid(),
  bride1_name text not null,
  bride2_name text not null,
  wedding_date date not null,
  cover_photo_url text,
  created_at timestamptz default now()
);

alter table events enable row level security;

create policy "event access" on events
  for all using (
    auth.uid() in (
      select user_id from event_users where event_id = events.id
    )
  );
```

---

### 2. event_users
```sql
create table event_users (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'bride',
  created_at timestamptz default now(),
  unique(event_id, user_id)
);

alter table event_users enable row level security;

create policy "event_users access" on event_users
  for all using (auth.uid() = user_id);
```

---

### 3. guests
```sql
create type guest_age_group as enum ('adulto', 'adolescente', 'nino');
create type guest_status as enum ('pendiente', 'confirmado', 'no_asiste');
create type invited_by as enum ('novia1', 'novia2', 'ambas');
create type menu_type as enum ('adulto', 'infantil');

create table guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  full_name text not null,
  age_group guest_age_group not null default 'adulto',
  status guest_status not null default 'pendiente',
  invited_by invited_by not null default 'ambas',
  menu menu_type not null default 'adulto',
  table_id uuid references tables(id) on delete set null,
  dietary_notes text,
  created_at timestamptz default now()
);

alter table guests enable row level security;

create policy "guests access" on guests
  for all using (
    auth.uid() in (
      select user_id from event_users where event_id = guests.event_id
    )
  );
```

---

### 4. tables
```sql
create table tables (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  capacity int not null default 10,
  created_at timestamptz default now()
);

alter table tables enable row level security;

create policy "tables access" on tables
  for all using (
    auth.uid() in (
      select user_id from event_users where event_id = tables.event_id
    )
  );
```

> Nota: `guests` referencia `tables`, pero `tables` se crea después. Ejecutar en este orden o eliminar la FK de guests y agregarla luego con ALTER TABLE.

---

### 5. payments
```sql
create type payment_status as enum ('sin_pago', 'sena_pagada', 'pago_parcial', 'pagado');

create table payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  guest_id uuid references guests(id) on delete cascade,
  amount numeric(10,2) not null,
  is_sena boolean default false,
  notes text,
  paid_at date not null default current_date,
  created_at timestamptz default now()
);

alter table payments enable row level security;

create policy "payments access" on payments
  for all using (
    auth.uid() in (
      select user_id from event_users where event_id = payments.event_id
    )
  );

-- Vista calculada de estado de pago por invitado
create view guest_payment_summary as
select
  g.id as guest_id,
  g.event_id,
  g.full_name,
  coalesce(sum(p.amount), 0) as total_paid,
  case
    when coalesce(sum(p.amount), 0) = 0 then 'sin_pago'
    when bool_or(p.is_sena) and count(p.id) = 1 then 'sena_pagada'
    else 'pago_parcial'
  end as payment_status
from guests g
left join payments p on p.guest_id = g.id
group by g.id, g.event_id, g.full_name;
```

---

### 6. vendors (proveedores)
```sql
create type vendor_status as enum ('en_revision', 'confirmado', 'cancelado');

create table vendors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  category text not null,
  status vendor_status not null default 'en_revision',
  chosen_amount numeric(10,2),
  notes text,
  created_at timestamptz default now()
);

alter table vendors enable row level security;

create policy "vendors access" on vendors
  for all using (
    auth.uid() in (
      select user_id from event_users where event_id = vendors.event_id
    )
  );
```

---

### 7. vendor_files (presupuestos y fotos)
```sql
create type vendor_file_type as enum ('presupuesto', 'foto');

create table vendor_files (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  file_url text not null,
  file_type vendor_file_type not null default 'presupuesto',
  label text,
  created_at timestamptz default now()
);

alter table vendor_files enable row level security;

create policy "vendor_files access" on vendor_files
  for all using (
    auth.uid() in (
      select user_id from event_users where event_id = vendor_files.event_id
    )
  );
```

---

### 8. checklist_items
```sql
create type task_assigned_to as enum ('novia1', 'novia2', 'ambas');

create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  title text not null,
  category text not null default 'general',
  assigned_to task_assigned_to default 'ambas',
  completed boolean default false,
  completed_at timestamptz,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table checklist_items enable row level security;

create policy "checklist access" on checklist_items
  for all using (
    auth.uid() in (
      select user_id from event_users where event_id = checklist_items.event_id
    )
  );
```

---

### 9. Storage buckets
```sql
-- Ejecutar en Supabase → Storage → New bucket (desde la UI)
-- O via SQL:
insert into storage.buckets (id, name, public)
values ('miboda-files', 'miboda-files', false);

create policy "storage access" on storage.objects
  for all using (
    auth.uid() in (
      select user_id from event_users
      where event_id::text = (storage.foldername(name))[1]
    )
  );
```

---

### Orden de ejecución en Supabase
1. `events`
2. `event_users`
3. `tables`
4. `guests` (con FK a tables ya creada)
5. `payments`
6. `vendors`
7. `vendor_files`
8. `checklist_items`
9. Storage bucket desde la UI
