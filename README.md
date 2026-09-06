# KivuPort

Application Next.js 16 pour les voyages, réservations, confirmations et paiements MaishaPay de KivuPort.

## Démarrage

```bash
npm install
copy .env.example .env.local
npm run lint
npm run build
npm run dev
```

Ouvrir ensuite `http://localhost:3000`.

## Configuration

Renseigner dans `.env.local` :

- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` ;
- `BREVO_API_KEY`, `MAIL_FROM_ADDRESS` et `MAIL_FROM_NAME` ;
- `NEXT_PUBLIC_APP_URL` pour les liens contenus dans les emails.
- `MAISHA_PUBLIC_API_KEY`, `MAISHA_API_SECRET_KEY` et `MAISHA_API_URL` pour l'API officielle MaishaPay.
- `MAISHA_GATEWAY_MODE=1` pour le mode live (`0` pour sandbox).
- `MAISHA_PUBLIC_API_KEY` et `MAISHA_API_SECRET_KEY` doivent être les identifiants délivrés par MaishaPay pour le compte marchand. Le bouton envoyé dans l'e-mail ouvre `/paiement/<référence>` ; le serveur déclenche alors la demande Mobile Money sur le numéro du client. Le PIN est saisi uniquement sur le téléphone du client et n'est jamais transmis à KivuPort. `walletID` reste toujours le téléphone du client qui confirme par PIN ; le compte destinataire est associé aux identifiants MaishaPay, pas à un champ `merchantWalletID` arbitraire.
- `MAISHA_MERCHANT_PHONE=0992720042` documente le compte marchand configuré dans l'espace MaishaPay. `walletID` reste toujours le téléphone du client qui confirme par PIN.
- `MAISHA_CALLBACK_URL` doit être une URL HTTPS publique vers `/api/payments/webhook` afin que MaishaPay puisse notifier le résultat du paiement.

Activer Google dans Supabase Authentication > Providers et déclarer l’URL de redirection de l’application. Le flux demande le choix explicite du compte avec `select_account`.

Exécuter dans Supabase SQL Editor `supabase/admin-policies.sql`, puis `supabase/operations.sql`, `supabase/features.sql`, `supabase/security-hardening.sql` et enfin `supabase/activity-logging.sql`. La migration `security-hardening.sql` garantit qu'un client authentifié ne lit que son profil, ses réservations, ses paiements et son historique. Les liens publics de paiement sont des liens bearer à ne pas partager.

Les voyages sont consultables avec filtres port, dates, code et bateau, triés par date ou prix, puis paginés par dix. Seul MaishaPay est accepté pour les paiements. Aucun paiement n'est simulé ; l'URL API officielle MaishaPay doit être configurée avant l'activation du flux.

Les secrets ne doivent jamais être commités. Après toute modification de `.env.local`, redémarrer le serveur Next.js.
