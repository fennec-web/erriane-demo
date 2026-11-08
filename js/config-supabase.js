/* Erriane Foods — accès à la base Supabase.
   Remplir les deux valeurs depuis Supabase : Project Settings → API.

   SUPABASE_URL  : « Project URL », du type https://abcdefgh.supabase.co
   SUPABASE_ANON : la clé « anon » / « public ».

   La clé anon est publique par conception : elle part dans la page, et ce sont
   les règles d'accès de la base qui protègent les données. En revanche, la clé
   « service_role » ne doit JAMAIS apparaître ici : elle contourne toutes les
   règles.

   Tant que ces deux valeurs sont vides, le site continue de fonctionner sur la
   mémoire du navigateur, exactement comme la démonstration. */
window.SUPABASE_URL = '';
window.SUPABASE_ANON = '';
