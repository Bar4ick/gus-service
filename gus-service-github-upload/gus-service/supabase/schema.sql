-- ГУСЬ.СЕРВИС: Supabase SQL schema
-- Run the whole file in Supabase Dashboard -> SQL Editor -> New query.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null unique,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_]{3,20}$')
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id text not null,
  package_name text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null default 1 check (quantity between 1 and 10),
  addons jsonb not null default '[]'::jsonb,
  promo_code text,
  discount integer not null default 0 check (discount >= 0),
  total integer not null check (total >= 0),
  delivery_date date,
  preference text not null default 'surprise' check (preference in ('boiled','roasted','surprise')),
  comment text not null default '' check (char_length(comment) <= 1000),
  status text not null default 'new' check (status in ('new','processing','completed','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);

-- Create the profile after a successful Auth signup. A duplicate username fails signup safely.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
begin
  requested_username := coalesce(new.raw_user_meta_data ->> 'username', '');
  if requested_username !~ '^[A-Za-z0-9_]{3,20}$' then
    raise exception 'Invalid username format';
  end if;
  insert into public.profiles (id, username, email)
  values (new.id, lower(requested_username), lower(new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Keep the profile email synchronized if the user changes their Auth email.
create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = lower(new.email) where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute procedure public.handle_user_email_update();

alter table public.profiles enable row level security;
alter table public.orders enable row level security;

-- Users can read only their own profile. No client-side profile inserts/updates are allowed.
drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles
for select to authenticated using ((select auth.uid()) = id);

-- A user can read and create their own orders, but cannot change totals/status after insertion.
drop policy if exists "Read own orders" on public.orders;
create policy "Read own orders" on public.orders
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Create own orders" on public.orders;
create policy "Create own orders" on public.orders
for insert to authenticated with check ((select auth.uid()) = user_id);

-- No update/delete policy for orders on purpose. Admin order management can be added server-side later.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
revoke all on public.orders from anon, authenticated;
grant select, insert on public.orders to authenticated;
