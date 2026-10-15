-- Bibliothèque de builds en ligne
--
-- Aujourd'hui les builds enregistrés vivent dans le localStorage du
-- navigateur : ils ne quittent jamais la machine, et rien d'extérieur ne
-- peut les lire — ni un autre navigateur, ni l'application.
--
-- Cette table leur donne une place côté serveur, visible uniquement de
-- leur propriétaire. Elle ne remplace pas « builds », qui reste la table
-- des builds PUBLIÉS sur la page de partage : ici, rien n'est public.
--
-- À exécuter une fois dans l'éditeur SQL de Supabase.

create table if not exists public.library (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null references auth.users(id) on delete cascade,
  champion    text not null,
  name        text not null,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- un même nom ne désigne qu'un build, pour un champion et une personne
  unique (owner, champion, name)
);

create index if not exists library_owner_champion_idx
  on public.library (owner, champion);

alter table public.library enable row level security;

-- Chacun ne voit, n'écrit et n'efface que ses propres lignes. Il n'y a
-- volontairement aucune politique de lecture publique : une bibliothèque
-- n'est pas une page de partage.
drop policy if exists library_select_own on public.library;
create policy library_select_own on public.library
  for select using (auth.uid() = owner);

drop policy if exists library_insert_own on public.library;
create policy library_insert_own on public.library
  for insert with check (auth.uid() = owner);

drop policy if exists library_update_own on public.library;
create policy library_update_own on public.library
  for update using (auth.uid() = owner) with check (auth.uid() = owner);

drop policy if exists library_delete_own on public.library;
create policy library_delete_own on public.library
  for delete using (auth.uid() = owner);

-- updated_at suit les modifications sans que le client ait à y penser
create or replace function public.library_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists library_touch_trg on public.library;
create trigger library_touch_trg
  before update on public.library
  for each row execute function public.library_touch();
