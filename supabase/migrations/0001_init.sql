-- ============================================================
-- OneLife v1 — initial schema, RLS, indexes, triggers
-- ============================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- shared trigger: bump updated_at on every update
-- ---------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ================================================================
-- area
-- ================================================================
create table public.area (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  name text not null,
  color text
);

create index area_user_deleted_idx on public.area (user_id, deleted);
create index area_user_id_idx on public.area (user_id);

alter table public.area enable row level security;

create policy area_select on public.area for select using (auth.uid() = user_id);
create policy area_insert on public.area for insert with check (auth.uid() = user_id);
create policy area_update on public.area for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy area_delete on public.area for delete using (auth.uid() = user_id);

create trigger area_set_updated_at
  before update on public.area
  for each row execute function public.set_updated_at();

-- ================================================================
-- task
-- ================================================================
create table public.task (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  title text not null,
  notes text,
  status text not null default 'later' check (status in ('later', 'now', 'done')),
  priority smallint not null default 0 check (priority between 0 and 3),
  due_date date,
  completed_at timestamptz,
  area_id uuid references public.area(id)
);

create index task_user_deleted_idx on public.task (user_id, deleted);
create index task_user_id_idx on public.task (user_id);
create index task_user_status_idx on public.task (user_id, status);
create index task_user_due_date_idx on public.task (user_id, due_date);

alter table public.task enable row level security;

create policy task_select on public.task for select using (auth.uid() = user_id);
create policy task_insert on public.task for insert with check (auth.uid() = user_id);
create policy task_update on public.task for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy task_delete on public.task for delete using (auth.uid() = user_id);

create trigger task_set_updated_at
  before update on public.task
  for each row execute function public.set_updated_at();

-- completed_at transition lives in the DB (not app code) so it's correct
-- no matter which client/path writes the row (see CLAUDE.md rule).
create or replace function public.set_task_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'done' and (tg_op = 'INSERT' or old.status is distinct from 'done') then
    new.completed_at = now();
  elsif new.status is distinct from 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger task_set_completed_at
  before insert or update on public.task
  for each row execute function public.set_task_completed_at();

-- ================================================================
-- habit
-- ================================================================
create table public.habit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  name text not null,
  area_id uuid references public.area(id),
  target_days smallint[],  -- 0=Sunday..6=Saturday, null = every day
  active boolean not null default true
);

create index habit_user_deleted_idx on public.habit (user_id, deleted);
create index habit_user_id_idx on public.habit (user_id);

alter table public.habit enable row level security;

create policy habit_select on public.habit for select using (auth.uid() = user_id);
create policy habit_insert on public.habit for insert with check (auth.uid() = user_id);
create policy habit_update on public.habit for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy habit_delete on public.habit for delete using (auth.uid() = user_id);

create trigger habit_set_updated_at
  before update on public.habit
  for each row execute function public.set_updated_at();

-- ================================================================
-- habit_log
-- ================================================================
create table public.habit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  habit_id uuid not null references public.habit(id),
  log_date date not null,
  done boolean not null default true,
  unique (habit_id, log_date)
);

create index habit_log_user_deleted_idx on public.habit_log (user_id, deleted);
create index habit_log_user_id_idx on public.habit_log (user_id);
-- (habit_id, log_date) is already indexed by the unique constraint above,
-- so no separate index is added for it.

alter table public.habit_log enable row level security;

create policy habit_log_select on public.habit_log for select using (auth.uid() = user_id);
create policy habit_log_insert on public.habit_log for insert with check (auth.uid() = user_id);
create policy habit_log_update on public.habit_log for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy habit_log_delete on public.habit_log for delete using (auth.uid() = user_id);

create trigger habit_log_set_updated_at
  before update on public.habit_log
  for each row execute function public.set_updated_at();

-- ================================================================
-- Realtime: broadcast changes on all four tables so the sync layer
-- can treat a change notification as an extra pull trigger, on top
-- of the existing focus/interval/online-event polling (see CLAUDE.md).
-- ================================================================
alter publication supabase_realtime add table
  public.area,
  public.task,
  public.habit,
  public.habit_log;
