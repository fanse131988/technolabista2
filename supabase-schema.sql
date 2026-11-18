-- ============================================================================
-- TechnoLAB-ISTA — Console Studio : schéma Supabase (à coller dans SQL Editor)
-- ----------------------------------------------------------------------------
-- 3 tables : contenu publié, historique des publications, brouilles de l'admin.
-- Sécurité (RLS) : lecture publique du contenu, écriture réservée aux
-- administrateurs connectés. Aucune clé secrète n'est utilisée côté navigateur.
-- ============================================================================

-- 1) CONTENU PUBLIÉ -----------------------------------------------------------
create table if not exists public.ista_content (
  id            text primary key,                -- toujours 'published'
  payload       jsonb not null default '{}'::jsonb,
  version       bigint not null default 1,
  published_at  timestamptz not null default now(),
  published_by  text
);
alter table public.ista_content enable row level security;

-- tout le monde peut lire (le site public s'en sert)
drop policy if exists "ista_content_lecture_publique" on public.ista_content;
create policy "ista_content_lecture_publique"
  on public.ista_content for select
  using (true);

-- seuls les utilisateurs authentifiés écrivent
drop policy if exists "ista_content_ecriture_admin" on public.ista_content;
create policy "ista_content_ecriture_admin"
  on public.ista_content for insert
  to authenticated
  with check (true);

drop policy if exists "ista_content_maj_admin" on public.ista_content;
create policy "ista_content_maj_admin"
  on public.ista_content for update
  to authenticated
  using (true) with check (true);

-- 2) HISTORIQUE DES PUBLICATIONS ---------------------------------------------
create table if not exists public.ista_history (
  id         bigserial primary key,
  version    bigint,
  label      text,
  payload    jsonb,
  created_at timestamptz not null default now(),
  created_by text
);
alter table public.ista_history enable row level security;

drop policy if exists "ista_history_lecture_admin" on public.ista_history;
create policy "ista_history_lecture_admin"
  on public.ista_history for select
  to authenticated
  using (true);

drop policy if exists "ista_history_ecriture_admin" on public.ista_history;
create policy "ista_history_ecriture_admin"
  on public.ista_history for insert
  to authenticated
  with check (true);

-- 3) BROUILLONS (un par administrateur) --------------------------------------
create table if not exists public.ista_drafts (
  user_id    text primary key,
  payload    jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.ista_drafts enable row level security;

drop policy if exists "ista_drafts_proprietaire" on public.ista_drafts;
create policy "ista_drafts_proprietaire"
  on public.ista_drafts for all
  to authenticated
  using (true) with check (true);

-- 4) TEMPS RÉEL : diffusion des changements de contenu ------------------------
-- (si la publication existe déjà, l'instruction suivante renvoie une notice bénigne)
alter publication supabase_realtime add table public.ista_content;

-- 5) LIGNE INITIALE (facultative : la console la crée à la 1re publication)
insert into public.ista_content (id, payload, version, published_at)
values ('published', '{}'::jsonb, 0, now())
on conflict (id) do nothing;

-- 6) ESPACE DE STOCKAGE DES IMAGES (facultatif) ------------------------------
-- Dashboard → Storage → New bucket → nom « ista-media », Public = ON.
-- Les politiques ci-dessous autorisent la lecture publique et l'écriture
-- seulement aux administrateurs connectés.
insert into storage.buckets (id, name, public)
values ('ista-media', 'ista-media', true)
on conflict (id) do nothing;

drop policy if exists "ista_media_lecture_publique" on storage.objects;
create policy "ista_media_lecture_publique"
  on storage.objects for select
  using (bucket_id = 'ista-media');

drop policy if exists "ista_media_envoi_admin" on storage.objects;
create policy "ista_media_envoi_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'ista-media');

drop policy if exists "ista_media_maj_admin" on storage.objects;
create policy "ista_media_maj_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'ista-media');

-- ============================================================================
-- À FAIRE ENSUITE (interface Supabase, 1 minute)
--   Authentication → Users → Add user : e-mail + mot de passe de l'administrateur.
--   (désactiver « Confirm email » pour un compte interne, ou confirmer le lien)
--   Project Settings → API : copier « Project URL » et la clé « anon public ».
-- ============================================================================
