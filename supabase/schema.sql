create table if not exists public.birthday_uses (
    id bigint generated always as identity primary key,
    name text not null check (char_length(btrim(name)) between 1 and 50),
    age integer not null check (age between 1 and 120),
    consent_at timestamptz,
    created_at timestamptz not null default now()
);

alter table public.birthday_uses
    add column if not exists consent_at timestamptz;

alter table public.birthday_uses enable row level security;

revoke all on table public.birthday_uses from anon, authenticated;
drop policy if exists "Allow anonymous birthday submissions" on public.birthday_uses;
