-- Erriane Foods — base Supabase, version 1
--
-- À coller tel quel dans Supabase → SQL Editor → New query → Run.
-- Le script est idempotent : on peut le relancer sans casser ce qui existe.
--
-- Ce que la base ne contient pas encore : le catalogue (packs et plats). Il
-- reste dans js/data.js, et le traiteur continue de le modifier dans son
-- navigateur. C'est la deuxième étape, une fois que les comptes, les commandes
-- et les paiements tiennent.
--
-- Cinq tables : profils, commandes, commande_lignes, paiements, messages.
-- Trois rôles de lecture : le visiteur (rien), le client (ses lignes), le
-- traiteur (tout). Les règles sont dans les politiques RLS, à la fin.

-- ============================================================
-- 1. Profils
-- ============================================================
-- Un profil par compte d'authentification. Le rôle décide de tout : un client
-- ne lit que ce qui lui appartient, un admin lit et écrit partout.

create table if not exists public.profils (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'admin')),
  email text not null,
  etab text not null default '',
  nom text not null default '',
  tel text not null default '',
  cree_le timestamptz not null default now()
);

-- Le profil se crée tout seul à l'inscription. Les champs etab, nom et tel
-- viennent des métadonnées envoyées par le site au moment du signup.
create or replace function public.creer_profil()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profils (id, email, etab, nom, tel)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'etab', ''),
    coalesce(new.raw_user_meta_data->>'nom', ''),
    coalesce(new.raw_user_meta_data->>'tel', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.creer_profil();

-- ============================================================
-- 2. Commandes
-- ============================================================
-- client_id est rempli quand la commande vient d'un compte. client_email est
-- toujours rempli : c'est lui qui permet de rattacher au client les commandes
-- que le traiteur a tapées au téléphone, avant même que le client ait un compte.

create sequence if not exists public.commande_ref_seq start with 1000;

create table if not exists public.commandes (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null default ('ERR-' || lpad(nextval('public.commande_ref_seq')::text, 4, '0')),
  client_id uuid references public.profils(id) on delete set null,
  client_email text not null,
  client_nom text not null default '',
  client_etab text not null default '',
  client_tel text not null default '',
  date date not null,
  heure time not null default '12:00',
  lieu text not null default '',
  tel text not null default '',
  note text not null default '',
  statut text not null default 'attente' check (statut in ('attente', 'confirmee', 'annulee', 'reportee')),
  reportee_au date,
  total_ht numeric(12,2) not null default 0 check (total_ht >= 0),
  bdc_nom text not null default '',
  livreur text not null default '',
  cree_le timestamptz not null default now()
);

create index if not exists commandes_email_idx on public.commandes (lower(client_email));
create index if not exists commandes_date_idx on public.commandes (date);
create index if not exists commandes_client_idx on public.commandes (client_id);

-- ============================================================
-- 3. Lignes de commande
-- ============================================================
-- Ce que la cuisine doit servir. C'est aussi ce qui ne doit jamais apparaître
-- chez le client : ces cinq champs restent dans l'espace traiteur.

create table if not exists public.commande_lignes (
  id uuid primary key default gen_random_uuid(),
  commande_id uuid not null references public.commandes(id) on delete cascade,
  pack_id text not null default '',
  nom text not null default '',
  qty int not null default 1 check (qty > 0),
  pu numeric(12,2) not null default 0 check (pu >= 0),
  entree text not null default '',
  viande text not null default '',
  garnitures text not null default '',
  dessert text not null default '',
  boisson text not null default ''
);

create index if not exists lignes_commande_idx on public.commande_lignes (commande_id);

-- ============================================================
-- 4. Paiements
-- ============================================================
create table if not exists public.paiements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profils(id) on delete set null,
  client_email text not null,
  etab text not null default '',
  montant numeric(12,2) not null check (montant > 0),
  type text not null default 'Espèces' check (type in ('Espèces', 'Chèque', 'Virement')),
  num text not null default '',
  date date not null default current_date,
  statut text not null default 'enc' check (statut in ('enc', 'att')),
  cree_le timestamptz not null default now()
);

create index if not exists paiements_email_idx on public.paiements (lower(client_email));

-- ============================================================
-- 5. Messages du client au traiteur
-- ============================================================
-- L'écran n'existe pas encore dans le site. La table est posée pour que le
-- jour où il arrive, rien ne bouge dans les règles d'accès.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profils(id) on delete set null,
  email text not null default '',
  nom text not null default '',
  texte text not null check (length(trim(texte)) > 0),
  lu boolean not null default false,
  cree_le timestamptz not null default now()
);

-- ============================================================
-- 6. Qui est qui
-- ============================================================
-- Trois fonctions security definer, pour éviter que les politiques se relisent
-- elles-mêmes (une récursion RLS sur profils bloque tout).

create or replace function public.est_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profils p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.mon_email()
returns text
language sql
stable
security definer set search_path = public
as $$
  select p.email from public.profils p where p.id = auth.uid();
$$;

-- Une commande est visible par son compte, par l'email auquel elle est
-- rattachée, ou par le traiteur.
create or replace function public.commande_visible(cid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.commandes c
    where c.id = cid
      and (
        c.client_id = auth.uid()
        or lower(c.client_email) = lower(coalesce(public.mon_email(), ''))
        or public.est_admin()
      )
  );
$$;

-- Un client peut corriger son établissement, son nom et son téléphone. Il ne
-- peut pas se donner le rôle admin, ni changer l'email qui identifie son compte.
--
-- `auth.uid()` est nul quand la requête vient du tableau de bord ou du SQL
-- Editor (pas de jeton de connexion). C'est le seul chemin qui peut nommer un
-- administrateur : sans cette exception, la requête de la section 8 se
-- bloquerait elle-même.
create or replace function public.proteger_profil()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.est_admin() then
    if new.role is distinct from old.role then
      raise exception 'Seul le traiteur peut changer un rôle.';
    end if;
    if new.email is distinct from old.email then
      new.email := old.email;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profils_proteges on public.profils;
create trigger profils_proteges
  before update on public.profils
  for each row execute function public.proteger_profil();

-- ============================================================
-- 7. Règles d'accès (RLS)
-- ============================================================
-- Par défaut, personne ne lit rien. Chaque politique ouvre un geste précis.

alter table public.profils enable row level security;
alter table public.commandes enable row level security;
alter table public.commande_lignes enable row level security;
alter table public.paiements enable row level security;
alter table public.messages enable row level security;

-- ---------- profils ----------
drop policy if exists "profil: lire le sien" on public.profils;
create policy "profil: lire le sien"
  on public.profils for select
  using (id = auth.uid() or public.est_admin());

drop policy if exists "profil: modifier le sien" on public.profils;
create policy "profil: modifier le sien"
  on public.profils for update
  using (id = auth.uid() or public.est_admin())
  with check (id = auth.uid() or public.est_admin());

-- ---------- commandes ----------
drop policy if exists "commande: lire les siennes" on public.commandes;
create policy "commande: lire les siennes"
  on public.commandes for select
  using (
    client_id = auth.uid()
    or lower(client_email) = lower(coalesce(public.mon_email(), ''))
    or public.est_admin()
  );

drop policy if exists "commande: poser la sienne" on public.commandes;
create policy "commande: poser la sienne"
  on public.commandes for insert
  with check (
    (client_id = auth.uid() and lower(client_email) = lower(coalesce(public.mon_email(), '')))
    or public.est_admin()
  );

drop policy if exists "commande: le traiteur fait avancer" on public.commandes;
create policy "commande: le traiteur fait avancer"
  on public.commandes for update
  using (public.est_admin())
  with check (public.est_admin());

drop policy if exists "commande: le traiteur supprime" on public.commandes;
create policy "commande: le traiteur supprime"
  on public.commandes for delete
  using (public.est_admin());

-- ---------- lignes ----------
drop policy if exists "ligne: lire avec sa commande" on public.commande_lignes;
create policy "ligne: lire avec sa commande"
  on public.commande_lignes for select
  using (public.commande_visible(commande_id));

drop policy if exists "ligne: poser avec sa commande" on public.commande_lignes;
create policy "ligne: poser avec sa commande"
  on public.commande_lignes for insert
  with check (public.commande_visible(commande_id));

drop policy if exists "ligne: le traiteur modifie" on public.commande_lignes;
create policy "ligne: le traiteur modifie"
  on public.commande_lignes for update
  using (public.est_admin())
  with check (public.est_admin());

drop policy if exists "ligne: le traiteur supprime" on public.commande_lignes;
create policy "ligne: le traiteur supprime"
  on public.commande_lignes for delete
  using (public.est_admin());

-- ---------- paiements ----------
drop policy if exists "paiement: lire les siens" on public.paiements;
create policy "paiement: lire les siens"
  on public.paiements for select
  using (
    client_id = auth.uid()
    or lower(client_email) = lower(coalesce(public.mon_email(), ''))
    or public.est_admin()
  );

drop policy if exists "paiement: le traiteur enregistre" on public.paiements;
create policy "paiement: le traiteur enregistre"
  on public.paiements for insert
  with check (public.est_admin());

drop policy if exists "paiement: le traiteur corrige" on public.paiements;
create policy "paiement: le traiteur corrige"
  on public.paiements for update
  using (public.est_admin())
  with check (public.est_admin());

drop policy if exists "paiement: le traiteur supprime" on public.paiements;
create policy "paiement: le traiteur supprime"
  on public.paiements for delete
  using (public.est_admin());

-- ---------- messages ----------
-- Un message peut venir d'un compte comme d'un visiteur sans compte : le site
-- ne demande pas d'inscription pour écrire au traiteur.
drop policy if exists "message: écrire" on public.messages;
create policy "message: écrire"
  on public.messages for insert
  with check (length(trim(texte)) > 0);

drop policy if exists "message: lire les siens" on public.messages;
create policy "message: lire les siens"
  on public.messages for select
  using (client_id = auth.uid() or public.est_admin());

drop policy if exists "message: le traiteur marque lu" on public.messages;
create policy "message: le traiteur marque lu"
  on public.messages for update
  using (public.est_admin())
  with check (public.est_admin());

-- ============================================================
-- 8. Le compte du traiteur
-- ============================================================
-- 1. Authentication → Users → Add user : l'email et le mot de passe du traiteur.
-- 2. Puis, une seule fois, en remplaçant l'email :
--
--    update public.profils set role = 'admin' where email = 'traiteur@exemple.dz';
--
-- Le profil se crée tout seul au moment de l'ajout de l'utilisateur ; s'il
-- n'apparaît pas, c'est que le trigger n'a pas été créé, relancer la section 1.
