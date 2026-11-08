# La base Erriane, pas à pas

Ce dossier contient tout ce qui se passe dans Supabase. Le site, lui, reste sur
GitHub Pages : Supabase ne sert que de base de données et de porte d'entrée.

Le travail se fait sur la branche `supabase`. `main` continue de servir la
démonstration en ligne tant que la base n'est pas branchée.

## 1. Créer le projet

1. Ouvrir <https://supabase.com/dashboard> et se connecter.
2. **New project**.
3. Nom : `erriane`. Mot de passe de la base : en générer un et le garder (il ne
   sert pas au site, seulement à l'administration de la base).
4. Région : **Europe (Paris)**, la plus proche d'Alger.
5. Créer, puis attendre une minute que le projet soit prêt.

L'offre gratuite suffit pour ce site : une poignée de comptes, quelques
centaines de commandes par an. Deux limites à connaître, voir la section 6.

## 2. Poser les tables et les règles

1. Dans le projet : **SQL Editor** → **New query**.
2. Coller tout `schema.sql`, puis **Run**.
3. Ouvrir une seconde requête, coller `verifier.sql`, **Run**, et lire les
   réponses attendues en commentaire.

Le script est idempotent : on peut le relancer sans perdre les données.

## 3. Régler l'authentification

1. **Authentication → Providers → Email** : laisser activé.
2. Pour la mise au point, décocher **Confirm email**. Un compte créé sur le
   site fonctionne alors tout de suite, sans attendre un lien dans la boîte
   mail. À recocher avant une vraie mise en service.
3. **Authentication → URL Configuration** :
   - **Site URL** : `https://fennec-web.github.io/erriane-demo/`
   - **Redirect URLs** : la même adresse.

## 4. Créer le compte du traiteur

1. **Authentication → Users → Add user** : l'email et le mot de passe du
   gérant. C'est ce compte qui ouvrira l'espace traiteur.
2. Dans le **SQL Editor**, une seule fois, en remplaçant l'email :

   ```sql
   update public.profils set role = 'admin' where email = 'traiteur@exemple.dz';
   ```

3. Vérifier avec la requête 5 de `verifier.sql` : la ligne doit être en
   `admin`.

## 5. Brancher le site

1. **Project Settings → API** : copier **Project URL** et la clé **anon**
   (`public`).
2. Ouvrir `js/config-supabase.js` et remplir les deux valeurs :

   ```js
   window.SUPABASE_URL = 'https://xxxx.supabase.co';
   window.SUPABASE_ANON = 'eyJ...';
   ```

3. Commiter et pousser sur `main`. Le site bascule sur la base ; sans ces deux
   valeurs, il continue de fonctionner sur la mémoire du navigateur.

**La clé `anon` est publique par conception** : elle part dans la page, et ce
sont les règles RLS qui protègent les données. Ne jamais mettre la clé
`service_role` dans le site : elle contourne toutes les règles.

## 6. Ce que l'offre gratuite ne fait pas

- **Pas de sauvegarde automatique.** Les données sont écrites et restent, mais
  rien n'est archivé pour vous. Deux garde-fous, à faire nous-mêmes :
  un export `pg_dump` hebdomadaire par GitHub Actions, et un bouton
  **Exporter** dans l'espace traiteur (clients, commandes, versements).
- **Projet en veille après une semaine sans visite.** Les données restent, mais
  le site ne répond plus tant que le projet n'est pas réveillé depuis le
  tableau de bord. Pour un client qui ouvre son site rarement, c'est le vrai
  risque. Deux solutions : une visite automatique chaque semaine, ou l'offre
  payante au moment de la mise en service, aux frais du client.
- Les quotas (taille de base, trafic, nombre de comptes) changent : les
  vérifier sur la page de tarifs au moment de livrer.

## 7. Ce qui reste à faire après cette v1

- Le **catalogue** (packs, plats) passera de `js/data.js` à la base, pour que le
  traiteur le modifie depuis n'importe quel appareil.
- L'écran des **messages** du client au traiteur (la table est déjà prête).
- Le **mot de passe oublié**, que Supabase sait envoyer une fois les URL
  configurées.
