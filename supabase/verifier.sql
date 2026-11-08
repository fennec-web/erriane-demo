-- Erriane Foods — vérification de la base
--
-- À coller dans Supabase → SQL Editor après avoir exécuté schema.sql.
-- Chaque ligne doit répondre ce qui est écrit en commentaire.

-- 1. Les cinq tables existent.
--    Attendu : 5 lignes.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profils', 'commandes', 'commande_lignes', 'paiements', 'messages')
order by table_name;

-- 2. Les politiques d'accès sont posées.
--    Attendu : une vingtaine de lignes, aucune table sans politique.
select tablename, count(*) as politiques
from pg_policies
where schemaname = 'public'
group by tablename
order by tablename;

-- 3. La sécurité par ligne est active sur les cinq tables.
--    Attendu : rowsecurity = true partout.
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('profils', 'commandes', 'commande_lignes', 'paiements', 'messages')
order by relname;

-- 4. Le déclencheur d'inscription existe.
--    Attendu : 1 ligne sur auth.users.
select tgname, tgrelid::regclass as table_cible
from pg_trigger
where tgname = 'on_auth_user_created';

-- 5. Le traiteur est bien administrateur.
--    Attendu : au moins une ligne en role = admin (remplacer l'email).
select email, role, etab
from public.profils
order by role, email;

-- 6. Les références de commande sont prêtes.
--    Attendu : dernière_valeur à 1000 avant la première commande.
select last_value, is_called from public.commande_ref_seq;
