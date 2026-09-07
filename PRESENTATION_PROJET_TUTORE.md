# Présentation du projet tutoré — KivuPort

## Thème du projet

**Système de gestion portuaire intelligent : réservation en ligne, suivi des embarquements, génération de rapports, interface mobile**

## 1. Présentation générale du projet

KivuPort est une plateforme numérique conçue pour moderniser la gestion des activités portuaires et des traversées maritimes sur le lac Kivu. Le système permet aux voyageurs de consulter les voyages disponibles, de choisir un pavillon, d'effectuer une réservation en ligne et de suivre l'état de cette réservation jusqu'à l'embarquement.

Le projet répond à un besoin concret : remplacer les procédures manuelles, les files d'attente et le manque de visibilité par une solution centralisée, accessible et adaptée aux réalités des ports de la région. KivuPort facilite le travail des administrateurs et améliore l'expérience des passagers grâce à une interface moderne, des notifications, des paiements numériques et des rapports de gestion.

L'application a été pensée comme un système portuaire et non comme une plateforme de commerce électronique. Les éléments principaux sont donc les ports, les quais, les bateaux, les voyages, les pavillons, les réservations, les paiements et les opérations administratives.

## 2. Problématique

Dans une gestion portuaire traditionnelle, les informations sur les départs, les places disponibles, les tarifs et les réservations sont souvent enregistrées manuellement. Cette organisation peut provoquer des erreurs de saisie, des doublons, des pertes d'informations, des retards dans la confirmation des réservations et des difficultés pour produire des statistiques fiables.

Les responsables ont également besoin de connaître rapidement le nombre de réservations, les paiements reçus, les voyages planifiés, l'état de la flotte et les recettes par devise. Le projet KivuPort apporte une réponse à cette problématique en regroupant ces informations dans une seule application sécurisée et actualisée.

## 3. Objectifs du projet

L'objectif général est de développer un système intelligent de gestion portuaire capable de numériser les principales opérations liées aux traversées maritimes.

Les objectifs spécifiques sont les suivants :

- permettre la consultation des voyages disponibles ;
- permettre aux clients de réserver une traversée à distance ;
- gérer les passagers, les bateaux, les ports, les quais et les pavillons ;
- suivre les statuts des réservations et des paiements ;
- intégrer un paiement mobile avec MaishaPay ;
- générer automatiquement des reçus PDF avec code QR ;
- fournir des rapports administratifs avec graphiques ;
- distinguer les recettes en CDF et en USD ;
- proposer une interface responsive pour ordinateur et téléphone ;
- améliorer la traçabilité des actions administratives ;
- réduire les erreurs et accélérer le traitement des opérations.

## 4. Public cible et utilisateurs

La plateforme s'adresse principalement à deux catégories d'utilisateurs. Le premier groupe est constitué des clients ou voyageurs. Ils peuvent créer un compte, consulter les voyages, effectuer une réservation, suivre son statut, payer et récupérer leur reçu.

Le second groupe est constitué des administrateurs et des responsables portuaires. Ils disposent d'un espace de gestion leur permettant de superviser les réservations, les paiements, les clients, les bateaux, les voyages, les pavillons, les ports et les quais. L'administrateur peut ajouter, modifier, consulter et supprimer les données selon les permissions disponibles.

## 5. Fonctionnement général du système

Le client commence par accéder à la plateforme et consulter la liste des voyages prévus. Chaque voyage présente notamment un code, une date de départ, un bateau et les options de pavillon disponibles. Le client sélectionne le voyage qui lui convient, choisit le type de réservation, renseigne ses informations et valide la demande.

La réservation est enregistrée avec un statut initial. Elle peut ensuite être confirmée ou annulée par l'administration. Lorsqu'elle est confirmée, le client reçoit la possibilité de lancer le paiement. Le statut du paiement est contrôlé automatiquement et les pages concernées sont actualisées après validation.

Une fois le paiement confirmé, le système génère un reçu PDF. Ce reçu contient les informations essentielles de la réservation et un code QR lié à la référence du paiement. Le client peut télécharger et conserver ce document comme preuve de paiement.

## 6. Modules principaux de l'application

### 6.1. Page d'accueil

La page d'accueil présente l'identité de KivuPort, le principe du service et les accès principaux de l'application. Elle permet d'accéder rapidement aux voyages, aux réservations, aux services, à la page de contact et à l'espace personnel.

La barre de navigation a été conçue avec une identité portuaire moderne. Elle utilise des icônes visibles, des liens utiles et un effet lumineux flottant afin de renforcer l'aspect professionnel de l'interface. Elle s'adapte également au mode clair et au mode sombre.

### 6.2. Authentification

L'authentification permet aux utilisateurs de créer un compte et de se connecter de manière sécurisée. Le système prévoit également la récupération du mot de passe, la vérification de l'adresse email et l'accès par des fournisseurs externes lorsque ceux-ci sont configurés.

Les formulaires d'authentification valident les données saisies, affichent clairement les erreurs et nettoient les champs après une opération réussie. Les routes protégées redirigent les utilisateurs non connectés vers l'espace d'authentification approprié.

### 6.3. Gestion des voyages

La page des voyages affiche les traversées disponibles. L'utilisateur peut consulter les informations du départ, la date, le bateau associé et les pavillons proposés. Les cartes sont responsives et leur rendu reste cohérent en mode clair comme en mode sombre.

L'administrateur peut créer un voyage, modifier son code, sa description, sa date de départ et son statut. Il peut aussi supprimer un voyage lorsqu'il ne possède pas de réservations dépendantes.

### 6.4. Gestion des réservations

Le module de réservation permet de choisir un voyage, un pavillon et un type de service. Le client renseigne son nom et son numéro de téléphone, puis le système calcule le prix total selon les informations du pavillon et, si nécessaire, le poids de la cargaison.

Chaque réservation possède un identifiant, une référence, une date, un voyage, un pavillon, un montant et un statut. Les statuts permettent de suivre le cycle de vie de l'opération : en attente, confirmée, payée ou annulée.

Après une réservation réussie, les champs du formulaire sont vidés afin d'éviter une modification accidentelle ou une nouvelle soumission avec les anciennes données.

### 6.5. Paiements mobiles

Le système intègre le paiement mobile par MaishaPay. Le numéro marchand configuré pour le projet est **+243 992720042**. En République démocratique du Congo, le préfixe international +243 peut être utilisé avec le format national commençant par 0.

Lorsqu'un paiement est lancé, le client confirme la transaction avec son code PIN sur son téléphone. L'application vérifie automatiquement l'état de la transaction et affiche un message explicite lorsque le paiement est validé ou lorsqu'une erreur survient.

Le rafraîchissement automatique permet de mettre à jour les réservations, les paiements et les écrans ouverts après une validation. Cette actualisation fonctionne également entre plusieurs onglets grâce au mécanisme de notification prévu dans l'application.

### 6.6. Reçu PDF et code QR

Après la validation du paiement, un reçu PDF est généré automatiquement. Le document reprend la référence de la réservation, le montant, les informations du client, la destination et les informations du paiement.

Un code QR est associé à la référence afin de faciliter l'identification et la vérification du reçu. Le texte destiné au PDF est normalisé pour éviter les erreurs d'encodage liées aux espaces insécables et aux caractères non pris en charge par les polices PDF standards.

### 6.7. Tableau de bord client

Le tableau de bord client regroupe les informations personnelles, les réservations récentes, les statuts des opérations et les accès aux actions importantes. Le client peut y retrouver ses réservations, consulter les paiements et accéder aux documents générés.

Le tableau de bord est conçu pour être lisible sur grand écran comme sur mobile. Les cartes, boutons, formulaires et notifications sont adaptés au mode sombre afin de conserver un bon contraste.

### 6.8. Tableau de bord administrateur

Le tableau de bord administrateur offre une vue globale de l'activité portuaire. Il présente les réservations du jour, les recettes, les clients actifs, les voyages planifiés et les paiements en attente.

L'administrateur dispose de filtres par statut, période, type et montant. Il peut rechercher une réservation, consulter ses détails, la confirmer, l'annuler, la modifier ou la supprimer. Les listes sont paginées et les actions importantes demandent une confirmation.

### 6.9. Gestion de la flotte et des infrastructures

Le système permet de gérer les bateaux, leurs caractéristiques et leur statut. Il permet aussi d'administrer les ports et les quais, avec leurs noms, localisations, capacités et statuts opérationnels.

Des contrôles empêchent la suppression d'un élément encore utilisé par une autre donnée. Par exemple, un bateau associé à un voyage ou un port possédant encore des quais doit d'abord être libéré ou traité correctement avant sa suppression.

### 6.10. Gestion des clients

L'administrateur peut consulter les clients enregistrés, modifier leurs informations et supprimer un profil lorsque celui-ci ne possède pas de réservation dépendante. Les informations gérées comprennent notamment le nom, le prénom, l'email, le téléphone, l'adresse, la nationalité, le genre et le statut.

Les opérations de modification et de suppression sont persistées directement dans la base de données. Après une action réussie, les données affichées sont rechargées afin que l'interface corresponde à l'état réel du système.

## 7. Rapports et statistiques

Le module de rapports permet à l'administrateur de visualiser et d'exporter les données de l'activité portuaire. Les rapports peuvent être filtrés pour afficher la journée, la semaine, le mois ou l'ensemble de la période.

Le rapport PDF contient une présentation professionnelle avec des cartes de synthèse, le nombre de réservations, les réservations confirmées, les réservations en attente et les montants encaissés. Il distingue clairement les recettes en **CDF** et en **USD**, selon la devise enregistrée dans les paiements.

Le document comprend également plusieurs graphiques destinés à faciliter l'interprétation des données : une courbe d'évolution des réservations, un graphique circulaire en anneau pour la répartition des statuts et un histogramme comparant les recettes par devise. Un tableau détaillé complète la partie visuelle.

Cette fonctionnalité aide la direction à prendre des décisions, à suivre les performances et à disposer d'un document exploitable lors d'une réunion ou d'une présentation académique.

## 8. Interface mobile

L'interface mobile permet d'utiliser les fonctions essentielles depuis un téléphone : consulter les voyages, réserver, suivre une opération et consulter les informations du compte. Les dimensions, espacements, boutons et cartes sont adaptés aux petits écrans.

Le projet prévoit également une route d'accès aux données mobiles afin de permettre une évolution vers une application mobile native ou hybride. Cette séparation facilite la réutilisation des informations de voyages par plusieurs types de clients.

## 9. Architecture technique

Le projet est développé avec les technologies suivantes :

- **Next.js 16** avec l'App Router pour les pages et les routes serveur ;
- **React 19** pour construire les interfaces interactives ;
- **TypeScript** pour renforcer la sécurité et la fiabilité du code ;
- **Tailwind CSS** pour la mise en forme responsive ;
- **Framer Motion** pour les animations et les transitions ;
- **Supabase** pour l'authentification, la base de données et les échanges sécurisés ;
- **Chart.js** et `react-chartjs-2` pour les graphiques du tableau de bord ;
- **pdf-lib** pour générer les rapports et les reçus PDF ;
- **Lucide React** pour les icônes de l'interface.

L'application sépare les pages publiques, les pages d'authentification, les pages client, les pages administratives et les routes API. Les composants réutilisables réduisent la duplication et assurent une expérience cohérente.

## 10. Organisation des données

Les principales entités du système sont les suivantes :

- les utilisateurs et les profils clients ;
- les bateaux ;
- les ports ;
- les quais ;
- les voyages ;
- les pavillons et leurs tarifs ;
- les réservations ;
- les paiements ;
- les journaux d'activité ;
- les notifications et les documents générés.

Les relations entre ces entités permettent de suivre le parcours complet d'une opération, depuis la programmation d'un voyage jusqu'à la réservation, au paiement et à la génération du reçu.

## 11. Sécurité et fiabilité

L'accès aux fonctions administratives est contrôlé par l'authentification et la vérification du rôle administrateur. Les opérations sensibles sont protégées par les règles d'accès de la base de données et par des vérifications côté serveur.

Les actions de modification et de suppression vérifient maintenant qu'une ligne a réellement été affectée. Ainsi, l'application n'affiche pas un faux message de succès lorsqu'un enregistrement est introuvable, lorsqu'une permission bloque l'action ou lorsqu'une contrainte relationnelle empêche la suppression.

Les opérations multiples sur les réservations demandent une confirmation, traitent chaque élément, indiquent le nombre de réussites et d'échecs, puis rechargent la liste. Cela améliore la traçabilité et évite les suppressions involontaires.

## 12. Expérience utilisateur et design

Le design utilise une identité visuelle inspirée du monde maritime : couleurs bleues, cyan et indigo, icônes de bateau et d'ancre, surfaces arrondies et effets lumineux. La navigation a été simplifiée pour conserver uniquement les liens utiles à une plateforme portuaire.

Le mode sombre est appliqué à l'ensemble des pages principales, notamment les voyages, les réservations, les détails d'un voyage, le tableau de bord, les pages administratives, les formulaires et les modales. Les contrastes ont été renforcés afin de garder une bonne lisibilité.

Les formulaires vident leurs champs après une validation réussie. En cas d'erreur, les valeurs sont conservées afin que l'utilisateur puisse corriger sans recommencer toute sa saisie.

## 13. Scénario conseillé pour la vidéo Bandicam

### Introduction

Commencer par annoncer le thème : « Système de gestion portuaire intelligent : réservation en ligne, suivi des embarquements, génération de rapports, interface mobile ». Présenter ensuite le problème de la gestion manuelle des traversées et l'objectif de KivuPort.

### Démonstration côté client

Ouvrir la page d'accueil, présenter la navigation et le mode sombre. Aller ensuite sur la page des voyages, sélectionner une traversée et montrer les informations disponibles. Ouvrir la page de réservation, choisir un pavillon, saisir les informations du client et valider.

Présenter ensuite la réservation créée, son statut et le bouton de paiement. Expliquer le fonctionnement du paiement mobile, le suivi automatique de la transaction et la génération du reçu PDF avec son code QR.

### Démonstration côté administrateur

Ouvrir le tableau de bord administrateur et présenter les indicateurs principaux. Montrer les graphiques, les filtres et les statistiques. Aller dans la liste des réservations, ouvrir une fiche, confirmer ou modifier une réservation, puis montrer que la mise à jour apparaît après le rechargement.

Présenter ensuite les modules de gestion des bateaux, voyages, pavillons, ports, quais et clients. Ajouter un élément, le modifier, puis expliquer la suppression avec confirmation et vérification des dépendances. Montrer enfin la sélection multiple et la suppression groupée des réservations.

### Démonstration du rapport

Choisir une période, vérifier les données en CDF et en USD, puis lancer l'export PDF. Présenter la page de couverture, les cartes de synthèse, la courbe, l'anneau des statuts, l'histogramme des devises et le tableau détaillé.

### Conclusion

Terminer en rappelant que KivuPort centralise les opérations portuaires, réduit les erreurs, accélère les réservations et fournit une meilleure visibilité aux responsables. Mentionner les perspectives : application mobile complète, notifications SMS, intégration de plusieurs opérateurs de paiement et extension à d'autres ports de la région.

## 14. Résultats obtenus

Le projet aboutit à une plateforme fonctionnelle permettant de gérer le cycle principal d'une traversée maritime. Les clients disposent d'un parcours numérique complet, tandis que les administrateurs bénéficient d'outils de supervision, de statistiques, d'exports et de gestion CRUD.

L'application est responsive, compatible avec le mode sombre, capable de générer des documents PDF et conçue pour actualiser les données après les opérations importantes. La compilation de production est validée, ce qui confirme la cohérence technique de l'ensemble du projet.

## 15. Limites et perspectives

Comme tout projet évolutif, KivuPort peut encore être enrichi. Les prochaines améliorations possibles sont l'ajout d'une application mobile native, l'envoi de notifications SMS, la connexion à d'autres services de paiement, la signature numérique des reçus, la gestion avancée des rôles du personnel et l'ajout de cartes géographiques des ports et des trajets.

Il serait également possible d'ajouter un système de prévision des périodes de forte demande, un suivi GPS des bateaux et des tableaux de bord spécialisés pour les comptables, les caissiers, les superviseurs et les agents portuaires.

## Conclusion générale

KivuPort est une solution numérique complète destinée à moderniser la gestion portuaire. Elle associe réservation en ligne, suivi des embarquements, paiement mobile, génération de reçus, administration des infrastructures, rapports graphiques et accès mobile.

Le projet démontre comment les technologies web modernes peuvent répondre à un besoin régional concret. En centralisant les informations et en automatisant les opérations, KivuPort améliore la fiabilité des données, la rapidité du service et la qualité du suivi administratif.
