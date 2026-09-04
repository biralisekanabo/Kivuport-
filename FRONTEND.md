# Fonctionnement du front KivuPort

## 1. Vue d'ensemble

KivuPort est une application Next.js 16 (App Router) en React 19. Le front permet de :

- consulter les voyages disponibles sur le lac Kivu ;
- afficher le détail d'un voyage, de son bateau et de ses pavillons ;
- créer et suivre des réservations passager ou cargaison ;
- payer une réservation via MaishaPay ;
- consulter son tableau de bord, ses notifications et son profil ;
- administrer les voyages, réservations, utilisateurs et opérations.

La majorité des écrans interactifs sont des composants client (`"use client"`). Ils gèrent leur état local, déclenchent les requêtes Supabase ou les appels aux routes API, puis affichent les états de chargement et d'erreur.

## 2. Démarrage de l'application

1. Le serveur Next.js démarre avec `npm run dev`.
2. Le point d'entrée global est [`src/app/layout.tsx`](src/app/layout.tsx).
3. Le layout définit :
   - la langue HTML en français ;
   - les métadonnées de KivuPort ;
   - les styles globaux ;
   - le chatbot global ;
   - le composant `Toaster` de Sonner pour les notifications temporaires.
4. Chaque URL est ensuite résolue par une page `page.tsx` dans [`src/app/`](src/app/).
5. Les erreurs globales et les états de chargement sont pris en charge par [`src/app/error.tsx`](src/app/error.tsx), [`src/app/loading.tsx`](src/app/loading.tsx) et [`src/app/not-found.tsx`](src/app/not-found.tsx).

## 3. Structure visuelle des pages publiques

Les pages publiques utilisent [`PublicLayout`](src/app/components/public-layout.tsx) :

1. `PublicLayout` affiche la barre de navigation [`Navbar`](src/app/components/navbar.tsx).
2. Le bouton de connexion redirige vers `/login`.
3. Le bouton d'inscription redirige vers `/signup`.
4. Le contenu de la page est rendu dans `<main>`.
5. Le pied de page [`Footer`](src/app/components/footer.tsx) est affiché en bas.

La page d'accueil `/` est plus riche : elle contient le hero, les services, les bénéfices, des informations de ports et une carte Leaflet. Leaflet et React-Leaflet sont chargés dynamiquement avec `ssr: false`, car la carte dépend d'objets disponibles uniquement dans le navigateur. Pendant ce chargement, un placeholder est affiché.

Les pages informatives (`/about`, `/services`, `/faq`, `/help`, `/contact`, `/legal`, `/privacy` et `/terms`) présentent le contenu institutionnel, l'aide, la FAQ ou les formulaires associés.

## 4. Authentification

### Création de compte

1. `/signup` rend [`AuthForm`](src/app/components/auth-form.tsx) en mode `signup`.
2. L'utilisateur saisit son nom, son email, son téléphone et son mot de passe.
3. Le formulaire valide localement le nom, le format du téléphone et une longueur minimale de six caractères pour le mot de passe.
4. Le compte est créé avec `supabase.auth.signUp`.
5. Le nom et le téléphone sont enregistrés dans `user_metadata`.
6. Si la confirmation email est activée, l'utilisateur est invité à vérifier son email via `/verify-email`.
7. Si Supabase renvoie directement une session, l'utilisateur est redirigé vers `/dashboard`.

### Connexion

1. `/login` rend `AuthForm` en mode `login`.
2. Le formulaire appelle `supabase.auth.signInWithPassword`.
3. Après connexion, l'utilisateur est redirigé vers son espace.
4. La connexion OAuth Google (et les composants prévus pour GitHub) utilise `signInWithOAuth`, avec une URL de retour vers `/dashboard`.
5. L'adresse email d'administration est traitée séparément par [`src/lib/admin.ts`](src/lib/admin.ts).

### Mot de passe oublié

Le modal de connexion contient un flux OTP en quatre étapes :

1. saisie de l'email et appel de `/api/auth/forgot-password` ;
2. saisie du code à six chiffres et appel de `/api/auth/verify-otp` ;
3. saisie et confirmation du nouveau mot de passe ;
4. mise à jour via `/api/auth/update-password`, puis retour vers la connexion.

Les codes, erreurs et compteurs de renvoi sont gérés dans l'état React du modal.

## 5. Consultation des voyages

### Liste `/voyages`

1. [`src/app/voyages/page.tsx`](src/app/voyages/page.tsx) charge les voyages depuis la table Supabase `voyages`.
2. Les informations du bateau, des pavillons et des trajets sont récupérées avec des requêtes associées.
3. La liste est filtrable par port, date, code et bateau.
4. Elle peut être triée par date ou par prix.
5. Les résultats sont paginés par groupes de dix.
6. Chaque voyage est rendu dans une carte animée avec Framer Motion.
7. Une carte peut être développée pour afficher les capacités, l'heure et les étapes.
8. Le bouton de détail ouvre `/voyages/[id]`.

Pendant la requête, des skeletons sont affichés. Les erreurs sont remontées à l'utilisateur avec Sonner.

### Détail `/voyages/[id]`

1. L'identifiant est lu avec `useParams`.
2. La page charge le voyage, le bateau, les trajets et les pavillons depuis Supabase.
3. Des cartes présentent la date, le bateau, les capacités, le trajet et les tarifs.
4. Les pavillons indiquent leur capacité, leur unité et leur prix.
5. L'action « Réserver » ouvre le parcours de réservation avec le voyage et le pavillon sélectionnés.

## 6. Création et suivi d'une réservation

La page `/reservations` est protégée côté interface :

1. Elle vérifie l'utilisateur courant avec `supabase.auth.getUser`.
2. Un utilisateur absent est redirigé vers `/`.
3. La page charge les voyages, les bateaux, les pavillons, les réservations de l'utilisateur et les paiements associés.
4. Le formulaire permet de choisir un voyage, un pavillon, le type de réservation et les informations nécessaires.
5. La création est exécutée par la fonction RPC Supabase `create_kivuport_reservation`.
6. Une notification de réservation peut être envoyée par `/api/reservations/notification`.
7. Le lien de paiement retourné par la réservation ouvre `/paiement/[token]`.
8. Une réservation confirmée peut être payée ; une réservation annulée peut être retirée du parcours.
9. Les transitions de statut passent par la fonction RPC `transition_kivuport_reservation`.
10. Les actions réussies ou échouées sont signalées avec des toasts.

Les cartes de réservation affichent le statut, le voyage, la date d'embarquement, le pavillon, le montant et les actions disponibles. Une réservation peut être développée pour voir plus de détails.

## 7. Paiement MaishaPay

Le paiement public est accessible par `/paiement/[token]`. Le token est un lien bearer : toute personne qui le possède peut tenter d'afficher le paiement. Il ne doit donc pas être partagé.

### Chargement du paiement

1. La page lit le token de l'URL.
2. Elle appelle `GET /api/payments/details?token=...`.
3. Le serveur retrouve la réservation avec son `token_paiement`.
4. Le serveur vérifie si la réservation est déjà payée ou si le token a expiré après 24 heures.
5. Le front affiche le montant, la référence, le client, le voyage et l'état du paiement.

### Envoi de la demande

1. Le client sélectionne l'unique méthode autorisée : `maisha_pay`.
2. Le numéro est validé et l'opérateur mobile est détecté.
3. Le front appelle `POST /api/payments/token` avec le token, la méthode et le téléphone.
4. Le serveur vérifie la réservation, l'expiration, le téléphone et la configuration MaishaPay.
5. Le serveur transmet la demande à l'API officielle MaishaPay en devise CDF.
6. Le front affiche l'état `pending` et demande à l'utilisateur de confirmer sur son téléphone.

Aucun paiement n'est simulé dans le front.

### Confirmation asynchrone

1. MaishaPay appelle `/api/payments/webhook`.
2. Le serveur vérifie la signature HMAC du webhook.
3. Le payload est contrôlé (référence, statut et montant).
4. La fonction RPC `process_kivuport_payment_webhook` met à jour la transaction et la réservation.
5. Le front peut ensuite recharger les détails ou rediriger l'utilisateur vers son tableau de bord.

## 8. Tableau de bord et espace personnel

### Tableau de bord `/dashboard`

1. La page vérifie la session Supabase.
2. Elle charge le profil client, les prochaines traversées, les réservations, les paiements et les notifications.
3. Elle calcule les indicateurs et les séries nécessaires aux graphiques Chart.js.
4. Les graphiques sont chargés côté client pour éviter les problèmes SSR.
5. Le tableau de bord propose des liens vers les réservations, l'historique, le profil et les paramètres.
6. La déconnexion appelle `supabase.auth.signOut`, puis redirige vers `/`.

### Autres pages

- `/profile` lit l'utilisateur Supabase et affiche son nom, son email et sa localisation.
- `/settings` contient les préférences du compte.
- `/history` affiche l'historique de réservations actuellement présenté par la page.
- `/reservation/[token]` permet de consulter publiquement le résumé d'une réservation à partir d'un token.

## 9. Administration

Les écrans `/admin`, `/admin/bookings` et `/admin/users` sont des interfaces client dédiées aux opérations d'administration :

1. la session est vérifiée ;
2. le rôle et l'état administrateur sont contrôlés par les routes et fonctions Supabase ;
3. les données sont chargées depuis Supabase ;
4. les actions sensibles passent par les routes `/api/admin/*` ;
5. les changements de statut, incidents, remboursements, rapports et confirmations sont ensuite reflétés dans l'interface.

Les routes d'administration disponibles incluent notamment les statuts, rapports, incidents, remboursements, tests email et confirmations de réservation.

## 10. Couche de données et routes API

Le client Supabase du navigateur est centralisé dans [`src/lib/supabase-browser.ts`](src/lib/supabase-browser.ts). Il utilise uniquement les variables publiques `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Les routes API Next.js de [`src/app/api/`](src/app/api/) servent de façade serveur pour :

- l'authentification et les OTP ;
- les détails et tokens de paiement ;
- le webhook MaishaPay ;
- les tickets PDF ou QR ;
- les notifications ;
- le chatbot ;
- les emails et tâches cron ;
- les opérations d'administration ;
- l'API mobile des voyages.

Les clés privées (service role Supabase, Brevo et MaishaPay) restent côté serveur et ne doivent jamais être importées dans un composant client.

## 11. États d'interface et expérience utilisateur

Les composants utilisent principalement `useState`, `useEffect`, `useMemo` et `useCallback` :

1. l'écran démarre avec un état de chargement ;
2. les données sont demandées dans un effet ou lors d'une action ;
3. les skeletons ou spinners restent visibles pendant la requête ;
4. les données reçues alimentent l'état local ;
5. les erreurs sont affichées dans l'écran ou via Sonner ;
6. les animations Framer Motion accompagnent les apparitions, expansions et transitions.

Tailwind CSS est utilisé pour la mise en page, les couleurs, la responsivité et les états de survol. Les composants restent conçus pour les écrans mobiles et desktop.

## 12. Configuration et sécurité

Le front nécessite notamment :

- `NEXT_PUBLIC_SUPABASE_URL` ;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ;
- `NEXT_PUBLIC_APP_URL` ;
- les variables Brevo pour les emails ;
- `MAISHA_API_KEY`, `MAISHA_API_SECRET` et `MAISHA_API_URL` ;
- `SUPABASE_SERVICE_ROLE_KEY` et `PAYMENT_WEBHOOK_SECRET` côté serveur.

Après une modification de `.env.local`, le serveur Next.js doit être redémarré. Les fichiers `.env` contenant des clés ne doivent pas être commités ni copiés dans la documentation.

Les politiques Supabase et les migrations SQL du dossier [`supabase/`](supabase/) complètent la sécurité du front : un utilisateur authentifié ne doit accéder qu'à ses propres données, tandis que les opérations privilégiées restent côté serveur.

## 13. Commandes utiles

```bash
npm install
copy .env.example .env.local
npm run dev
npm run lint
npm run build
npm run start
```

L'application est ensuite accessible sur `http://localhost:3000`.
