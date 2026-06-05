# Rentify — Security Rules

## 1. Déploiement

### Option A — Console Firebase (sans CLI)

**Firestore Rules**
1. Ouvrir [console.firebase.google.com](https://console.firebase.google.com) → projet `rentify-app-67083`
2. Firestore Database → onglet **Rules**
3. Copier-coller le contenu de `firestore.rules`
4. Cliquer **Publish**

**Storage Rules**
1. Storage → onglet **Rules**
2. Copier-coller le contenu de `storage.rules`
3. Cliquer **Publish**

---

### Option B — Firebase CLI

```bash
# Installation (une seule fois)
npm install -g firebase-tools

# Login
firebase login

# Initialiser dans le projet (si pas encore fait)
firebase init firestore
firebase init storage
# → pointer vers firestore.rules et storage.rules quand demandé

# Déployer uniquement les rules
firebase deploy --only firestore:rules,storage:rules
```

---

## 2. Matrice d'accès

| Collection       | Read                  | Create                       | Update                    | Delete   |
|------------------|-----------------------|------------------------------|---------------------------|----------|
| `users`          | tout user auth        | self uniquement              | self uniquement           | jamais   |
| `items`          | tout user auth        | self (ownerId ou proprietaireId == uid) | proprio de l'item | proprio  |
| `rentals`        | participants (locataire ou proprio) | locataire (locataireId == uid) | participants + champs immuables protégés | jamais   |
| `conversations`  | participants          | self in participants         | participants              | jamais   |
| `messages`       | participants (via get conv) | self == senderId + participant | participants         | jamais   |

---

## 3. Workflow de location et sécurité

### Champs modifiables par rôle

| Champ | Propriétaire | Locataire | Personne |
|-------|:---:|:---:|:---:|
| `statut` (PENDING → ACCEPTED/REJECTED) | ✅ | — | — |
| `statut` (PENDING → CANCELLED) | — | ✅ | — |
| `statut` (→ IN_PROGRESS, auto via double confirmation) | ✅* | ✅* | — |
| `statut` (→ COMPLETED, auto via double confirmation) | ✅* | ✅* | — |
| `remiseProprio` | ✅ | — | — |
| `remiseLocataire` | — | ✅ | — |
| `retourProprio` | ✅ | — | — |
| `retourLocataire` | — | ✅ | — |
| `remiseAt`, `retourAt`, `updatedAt` | ✅* | ✅* | — |
| `itemId`, `locataireId`, `proprietaireId` | — | — | ✅ immuable |
| `dateDebut`, `dateFin`, `jours`, `prixTotal` | — | — | ✅ immuable |
| `message`, `createdAt` | — | — | ✅ immuable |

> \* Champ écrit automatiquement par le code (`serverTimestamp()`, logique `confirmerRemise`/`confirmerRetour`) — les rules protègent seulement la liste des champs immuables, pas les transitions d'état ligne par ligne (voir justification ci-dessous).

### Diagramme de transitions autorisées

```
PENDING ──[proprio]──► ACCEPTED ──[remise double]──► IN_PROGRESS ──[retour double]──► COMPLETED
   │
   ├──[proprio]──► REJECTED
   └──[locataire]──► CANCELLED
```

---

## 4. Justifications


**Pourquoi tout user authentifié peut lire les profils (`users`) ?**
Le marketplace doit afficher les noms et avatars des propriétaires sur chaque annonce, et l'autre participant dans le chat. Aucune donnée sensible n'est stockée dans Firestore (pas de mot de passe — c'est dans Firebase Auth), seulement `prenom`, `nom`, `ville`, `photoURL`.

**Pourquoi tolérer `ownerId` ET `proprietaireId` dans items et rentals ?**
Migration progressive : les premiers documents créés utilisaient le champ `ownerId` (convention anglophone), les nouveaux utilisent `proprietaireId`. Le code TypeScript fait déjà des dual-queries (`getItemsByOwner`, `getRentalsByProprietaire`). Les rules doivent refléter ce même dualisme pour éviter des `permission-denied` sur les anciens documents.

**Pourquoi protéger les champs immuables du rental côté rules plutôt que côté app ?**
Une règle applicative (validation JS avant `updateDoc`) peut être contournée par un appel direct à l'API Firestore depuis un client modifié. Ancrer les invariants dans les Security Rules garantit qu'aucune requête — légitime ou malveillante — ne peut réécrire `itemId`, `locataireId`, `dateDebut`, `prixTotal` ou `createdAt` après la création. C'est la défense en profondeur : l'app valide pour l'UX, les rules valident pour l'intégrité.

**Pourquoi ne pas faire valider les transitions d'état (PENDING → ACCEPTED uniquement par le proprio) dans les rules ?**
Firestore Rules permettent de comparer `request.resource.data.statut` avec `resource.data.statut`, mais la logique complète nécessiterait de vérifier qui est le proprio ET quelle transition est demandée ET si c'est cohérent avec l'état précédent — soit 4–6 conditions imbriquées. Les rules deviendraient illisibles et très difficiles à maintenir. Le choix pragmatique : les rules garantissent l'identité (seul un participant peut écrire) et l'intégrité structurelle (champs immuables), tandis que la logique de transition est dans `firestoreService.ts` qui est du code testé et auditable.

**Pourquoi pas de `delete` sur les rentals ?**
Traçabilité obligatoire : une demande annulée ou refusée doit rester dans l'historique pour les deux parties. Le code utilise le champ `statut` avec la valeur `CANCELLED` plutôt qu'une suppression. Supprimer un rental via le client n'est donc jamais légitime.

**Pourquoi le `get()` cross-document dans les rules messages ?**
Un utilisateur ne doit pouvoir lire/écrire des messages que s'il est participant de la conversation parente. Storage Rules ne supportent pas les lookups cross-collection, mais Firestore Rules le permettent via `get(/databases/$(database)/documents/conversations/$(conversationId))`. Chaque accès à un message coûte donc 1 read supplémentaire côté rules — coût négligeable vs. la sécurité apportée.

**Pourquoi Storage est plus permissif que Firestore ?**
Firebase Storage Rules ne permettent pas de faire un `get()` sur Firestore pour vérifier l'ownership d'un item avant d'autoriser l'upload d'une image. La sécurité métier est donc déléguée aux Firestore Rules : si un utilisateur ne peut pas créer/modifier un item (vérifié par Firestore), il n'a aucune raison fonctionnelle d'uploader une image dans ce dossier — même si Storage le permettrait techniquement.

---

## 5. Tests manuels post-déploiement

Tester avec deux comptes Firebase différents (A et B) via l'app Expo.

| # | Action                                                                 | Compte | Résultat attendu            |
|---|------------------------------------------------------------------------|--------|-----------------------------|
| 1 | Créer un item                                                          | A      | ✅ Succès                   |
| 2 | Modifier la description de l'item créé par A                          | B      | ❌ `permission-denied`      |
| 3 | Supprimer l'item de A                                                  | B      | ❌ `permission-denied`      |
| 4 | Créer une demande de location sur l'item de A                         | B      | ✅ Succès (B = locataire)   |
| 5 | Lire les rentals de A (via `getRentalsByProprietaire`)                | B      | ❌ `permission-denied`      |
| 6 | Ouvrir une conversation A↔B pour l'item                               | B      | ✅ Succès                   |
| 7 | Envoyer un message dans la conversation A↔B                           | B      | ✅ Succès                   |
| 8 | Créer un message dans une conversation dont B ne fait pas partie      | B      | ❌ `permission-denied`      |
| 9 | Modifier son propre profil                                             | A      | ✅ Succès                   |
| 10| Modifier le profil de A                                               | B      | ❌ `permission-denied`      |

> **Astuce** : activer les logs Firestore dans la console Firebase (Firestore → Usage → Rules Playground) pour rejouer ces scénarios sans toucher l'app.

