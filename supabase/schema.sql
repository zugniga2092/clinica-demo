-- schema.sql — Ejecutar en el SQL Editor de Supabase
-- Orden: ejecutar de una vez, las tablas no tienen dependencias entre sí

-- ── conversaciones ────────────────────────────────────────────────────────────
create table if not exists conversaciones (
  id          uuid primary key default gen_random_uuid(),
  business_id text not null,
  chat_id     text not null,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz default now()
);
create index on conversaciones (business_id, chat_id, created_at desc);

-- ── pacientes ─────────────────────────────────────────────────────────────────
create table if not exists pacientes (
  id                      uuid primary key default gen_random_uuid(),
  business_id             text not null,
  chat_id                 text not null,
  nombre                  text,
  telefono                text,
  idioma_preferido        text default 'es' check (idioma_preferido in ('es', 'en')),
  primera_visita          date,
  ultima_visita           date,
  visitas_total           integer default 0,
  tratamientos_realizados text[],
  tipo_piel               text check (tipo_piel in ('sensible', 'mixta', 'seca', 'grasa')),
  alergias_cosmeticos     text,
  contraindicaciones      text,
  notas                   text,
  activo                  boolean default true,
  created_at              timestamptz default now(),
  unique (business_id, chat_id)
);
create index on pacientes (business_id, chat_id);

-- ── citas ─────────────────────────────────────────────────────────────────────
create table if not exists citas (
  id              uuid primary key default gen_random_uuid(),
  business_id     text not null,
  chat_id         text not null,
  nombre          text not null,
  telefono        text,
  fecha_cita      date not null,
  hora            text not null,
  servicio        text not null default 'tratamiento'
                  check (servicio in ('consulta', 'tratamiento', 'revisión', 'seguimiento')),
  tratamiento     text,
  profesional     text,
  estado          text not null default 'pendiente'
                  check (estado in ('pendiente', 'confirmada', 'rechazada', 'completada', 'no_show', 'cancelada')),
  idioma          text default 'es' check (idioma in ('es', 'en')),
  notas           text,
  created_at      timestamptz default now()
);
create index on citas (business_id, fecha_cita, estado);
create index on citas (business_id, chat_id, estado);

-- ── lista_espera ──────────────────────────────────────────────────────────────
create table if not exists lista_espera (
  id               uuid primary key default gen_random_uuid(),
  business_id      text not null,
  chat_id          text not null,
  nombre           text not null,
  tratamiento      text not null,
  franja_preferida text default 'indiferente'
                   check (franja_preferida in ('mañana', 'tarde', 'indiferente')),
  estado           text default 'activa'
                   check (estado in ('activa', 'asignada', 'cancelada')),
  created_at       timestamptz default now()
);
create index on lista_espera (business_id, estado, tratamiento);

-- ── recordatorios_tratamiento ─────────────────────────────────────────────────
create table if not exists recordatorios_tratamiento (
  id                   uuid primary key default gen_random_uuid(),
  business_id          text not null,
  chat_id              text not null,
  nombre_paciente      text not null,
  tratamiento          text not null,
  ultima_sesion        date not null,
  proxima_sesion       date not null,
  frecuencia_dias      integer not null,
  recordatorio_enviado boolean default false,
  estado               text default 'activo'
                       check (estado in ('activo', 'pausado', 'completado')),
  created_at           timestamptz default now(),
  unique (business_id, chat_id, tratamiento)
);
create index on recordatorios_tratamiento (business_id, proxima_sesion, estado);

-- ── preguntas_desconocidas ────────────────────────────────────────────────────
-- chat_id es nullable: las entradas de KB insertadas vía saveKnowledgeDirect
-- o kb-seed.sql no tienen chat_id (no provienen de un paciente concreto).
create table if not exists preguntas_desconocidas (
  id          uuid primary key default gen_random_uuid(),
  business_id text not null,
  chat_id     text,
  pregunta    text not null,
  respuesta   text,
  estado      text default 'pendiente'
              check (estado in ('pendiente', 'respondida')),
  created_at  timestamptz default now()
);
create index on preguntas_desconocidas (business_id, estado);

-- ── notificaciones ────────────────────────────────────────────────────────────
create table if not exists notificaciones (
  id           uuid primary key default gen_random_uuid(),
  business_id  text not null,
  tipo         text not null,
  contenido    text,
  destinatario text,
  enviado      boolean default false,
  created_at   timestamptz default now()
);
create index on notificaciones (business_id, tipo, created_at desc);

-- ── agenda_dia ────────────────────────────────────────────────────────────────
create table if not exists agenda_dia (
  id            uuid primary key default gen_random_uuid(),
  business_id   text not null,
  fecha         date not null,
  profesional   text,
  plazas_libres integer,
  promocion     text,
  notas_dia     text,
  activo        boolean default true,
  created_at    timestamptz default now(),
  unique (business_id, fecha)
);
create index on agenda_dia (business_id, fecha, activo);

-- ── Migraciones (ejecutar solo si las tablas ya existen) ──────────────────────
-- Añade valoracion a citas para guardar respuesta de encuesta de satisfacción (1-5)
alter table citas add column if not exists valoracion integer check (valoracion between 1 and 5);

-- Añade idioma a lista_espera para notificaciones bilingües
alter table lista_espera add column if not exists idioma text default 'es' check (idioma in ('es', 'en'));
