-- ============================================================================
-- PIERCEMAP · v0.8 MVP · INTAKES + CONSENTS
-- Run this in Supabase SQL editor (Project Alicyn).
-- Idempotent: safe to re-run.
-- ============================================================================

-- INTAKES TABLE -------------------------------------------------------------
create table if not exists public.intakes (
    id            text primary key,                          -- client-generated ('i_<ts>')
    user_id       uuid references auth.users(id) on delete set null,
    studio_slug   text,                                      -- 'piercemap.com/s/<slug>' or studio code
    mode          text not null default 'standard',          -- 'standard' | 'walkin'
    intent        text,                                      -- 'new' | 'change' | 'review' | 'consult'
    zone          text,                                      -- 'ear', 'nose', etc.
    specific      text,
    refs          jsonb default '[]'::jsonb,
    client_name   text,
    client_age    int,
    client_email  text,
    allergies     text,
    created_at    timestamptz not null default now()
);

create index if not exists intakes_user_id_idx     on public.intakes(user_id);
create index if not exists intakes_studio_slug_idx on public.intakes(studio_slug);
create index if not exists intakes_created_at_idx  on public.intakes(created_at desc);

alter table public.intakes enable row level security;

-- Allow authenticated users to insert their own intake
drop policy if exists intakes_insert_own on public.intakes;
create policy intakes_insert_own on public.intakes
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Anonymous insert for walk-in (no user_id) -- studio captures the intake
drop policy if exists intakes_insert_anon_walkin on public.intakes;
create policy intakes_insert_anon_walkin on public.intakes
    for insert
    to anon
    with check (user_id is null and mode = 'walkin');

-- Owner can read their own intakes
drop policy if exists intakes_select_own on public.intakes;
create policy intakes_select_own on public.intakes
    for select
    to authenticated
    using (auth.uid() = user_id);

-- TODO: studio members read intakes for their studio (requires studios + studio_members tables)
-- drop policy if exists intakes_select_studio on public.intakes;
-- create policy intakes_select_studio on public.intakes
--     for select to authenticated
--     using (studio_slug in (select slug from studios where id in (select studio_id from studio_members where user_id = auth.uid())));


-- CONSENTS TABLE ------------------------------------------------------------
create table if not exists public.consents (
    id                 text primary key,                     -- client-generated ('c_<ts>')
    user_id            uuid references auth.users(id) on delete set null,
    intake_id          text references public.intakes(id) on delete cascade,
    studio_slug        text,
    version            text not null default 'v1.0',
    accepted_at        timestamptz not null default now(),
    signature_present  boolean not null default false,
    signature_url      text,                                 -- optional, only if uploaded to Storage
    client_age         int
);

create index if not exists consents_intake_id_idx on public.consents(intake_id);
create index if not exists consents_user_id_idx   on public.consents(user_id);

alter table public.consents enable row level security;

drop policy if exists consents_insert_own on public.consents;
create policy consents_insert_own on public.consents
    for insert
    to authenticated
    with check (auth.uid() = user_id);

drop policy if exists consents_insert_anon on public.consents;
create policy consents_insert_anon on public.consents
    for insert
    to anon
    with check (user_id is null);

drop policy if exists consents_select_own on public.consents;
create policy consents_select_own on public.consents
    for select
    to authenticated
    using (auth.uid() = user_id);


-- OPTIONAL · STORAGE BUCKET FOR SIGNATURES ----------------------------------
-- Run only if you want to store signature PNG files (recommended for legal trazabilidad).
-- insert into storage.buckets (id, name, public) values ('signatures', 'signatures', false)
-- on conflict (id) do nothing;
--
-- create policy "Authenticated upload signatures" on storage.objects for insert to authenticated
--     with check (bucket_id = 'signatures' and (storage.foldername(name))[1] = auth.uid()::text);
-- create policy "Owner read signatures" on storage.objects for select to authenticated
--     using (bucket_id = 'signatures' and (storage.foldername(name))[1] = auth.uid()::text);


-- VERIFICATION --------------------------------------------------------------
-- Run after applying:
--   select count(*) from public.intakes;
--   select count(*) from public.consents;
-- Expect: 0 rows, no errors.
