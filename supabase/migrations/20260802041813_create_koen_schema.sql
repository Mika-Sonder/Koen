-- Koen: esquema inicial para el proyecto Supabase existente.
-- Todas las tablas expuestas usan RLS y las políticas están limitadas por propietario.

create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.media_type as enum ('ANIME', 'MANGA', 'NOVEL');
create type public.list_status as enum ('watching', 'reading', 'completed', 'planning', 'paused', 'dropped', 'repeating');
create type public.list_visibility as enum ('public', 'private');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique check (char_length(username) between 3 and 30 and username ~ '^[a-zA-Z0-9_]+$'),
  avatar_url text,
  bio text check (char_length(bio) <= 500),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_id bigint not null check (media_id > 0),
  media_type public.media_type not null,
  title text not null check (char_length(title) between 1 and 500),
  cover_url text,
  status public.list_status not null default 'planning',
  progress integer not null default 0 check (progress >= 0),
  progress_total integer check (progress_total is null or progress_total >= 0),
  score numeric(3,1) check (score is null or score between 0 and 10),
  notes text check (char_length(notes) <= 3000),
  start_date date,
  finish_date date,
  repeat_count integer not null default 0 check (repeat_count >= 0),
  priority smallint not null default 0 check (priority between 0 and 5),
  custom_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, media_id, media_type),
  check (progress_total is null or progress <= progress_total),
  check (finish_date is null or start_date is null or finish_date >= start_date)
);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_id bigint not null check (media_id > 0),
  media_type public.media_type not null,
  title text not null check (char_length(title) between 1 and 500),
  cover_url text,
  created_at timestamptz not null default now(),
  unique (user_id, media_id, media_type)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('season_start', 'new_chapter', 'new_volume', 'upcoming_episode', 'recommendation', 'system')),
  title text not null check (char_length(title) between 1 and 200),
  message text not null check (char_length(message) between 1 and 1000),
  data jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_id bigint not null check (media_id > 0),
  media_type public.media_type not null,
  title text not null,
  cover_url text,
  reason text not null check (char_length(reason) <= 500),
  confidence numeric(4,3) not null default 0.5 check (confidence between 0 and 1),
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, media_id, media_type)
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  locale text not null default 'es' check (locale = 'es'),
  notifications_email boolean not null default true,
  notifications_push boolean not null default true,
  list_visibility public.list_visibility not null default 'private',
  adult_content boolean not null default false,
  title_language text not null default 'romaji' check (title_language = 'romaji'),
  updated_at timestamptz not null default now()
);

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('list_created', 'list_updated', 'progress_updated', 'completed', 'favorite_added', 'import')),
  media_id bigint,
  media_type public.media_type,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  check ((media_id is null and media_type is null) or (media_id is not null and media_type is not null))
);

-- Índices alineados con filtros, orden temporal y predicados RLS.
create index user_lists_user_updated_idx on public.user_lists (user_id, updated_at desc);
create index user_lists_user_status_idx on public.user_lists (user_id, status);
create index user_lists_media_idx on public.user_lists (media_type, media_id);
create index favorites_user_created_idx on public.favorites (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
create index recommendations_user_confidence_idx on public.recommendations (user_id, confidence desc) where dismissed_at is null;
create index activity_user_created_idx on public.activity (user_id, created_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger user_lists_set_updated_at before update on public.user_lists for each row execute function private.set_updated_at();
create trigger user_settings_set_updated_at before update on public.user_settings for each row execute function private.set_updated_at();

-- Requiere SECURITY DEFINER porque el trigger de auth.users crea filas con RLS.
-- La función vive en un esquema no expuesto, tiene search_path vacío y no es ejecutable por clientes.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_username text;
begin
  base_username := regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'usuario'), '[^a-zA-Z0-9_]', '', 'g');
  if char_length(base_username) < 3 then base_username := 'usuario'; end if;

  insert into public.profiles (id, username)
  values (new.id, left(base_username, 20) || '_' || left(replace(new.id::text, '-', ''), 8));

  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

-- RLS: habilitado explícitamente en toda tabla del esquema público.
alter table public.profiles enable row level security;
alter table public.user_lists enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
alter table public.recommendations enable row level security;
alter table public.user_settings enable row level security;
alter table public.activity enable row level security;

create policy "Perfiles públicos o propios visibles" on public.profiles for select to anon, authenticated
using (is_public or (select auth.uid()) = id);
create policy "Usuario inserta su perfil" on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);
create policy "Usuario actualiza su perfil" on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Usuario elimina su perfil" on public.profiles for delete to authenticated
using ((select auth.uid()) = id);

create policy "Usuario lee su lista" on public.user_lists for select to authenticated using ((select auth.uid()) = user_id);
create policy "Usuario crea en su lista" on public.user_lists for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Usuario actualiza su lista" on public.user_lists for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Usuario elimina de su lista" on public.user_lists for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Usuario lee sus favoritos" on public.favorites for select to authenticated using ((select auth.uid()) = user_id);
create policy "Usuario crea sus favoritos" on public.favorites for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Usuario elimina sus favoritos" on public.favorites for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Usuario lee sus notificaciones" on public.notifications for select to authenticated using ((select auth.uid()) = user_id);
create policy "Usuario actualiza sus notificaciones" on public.notifications for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Usuario elimina sus notificaciones" on public.notifications for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Usuario lee sus recomendaciones" on public.recommendations for select to authenticated using ((select auth.uid()) = user_id);
create policy "Usuario actualiza sus recomendaciones" on public.recommendations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Usuario elimina sus recomendaciones" on public.recommendations for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Usuario lee su configuración" on public.user_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "Usuario crea su configuración" on public.user_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Usuario actualiza su configuración" on public.user_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Usuario elimina su configuración" on public.user_settings for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Usuario lee su actividad" on public.activity for select to authenticated using ((select auth.uid()) = user_id);
create policy "Usuario crea su actividad" on public.activity for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Usuario elimina su actividad" on public.activity for delete to authenticated using ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.user_lists, public.favorites, public.notifications, public.recommendations, public.user_settings, public.activity to authenticated;

-- Avatares públicos; cada usuario solo puede escribir dentro de su propia carpeta UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Avatares visibles" on storage.objects for select to anon, authenticated using (bucket_id = 'avatars');
create policy "Usuario sube su avatar" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Usuario actualiza su avatar" on storage.objects for update to authenticated using (bucket_id = 'avatars' and owner_id = (select auth.uid())::text) with check (bucket_id = 'avatars' and owner_id = (select auth.uid())::text);
create policy "Usuario elimina su avatar" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and owner_id = (select auth.uid())::text);

-- Permite suscribirse a nuevas notificaciones mediante Supabase Realtime.
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
