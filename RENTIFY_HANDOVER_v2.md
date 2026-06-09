# RENTIFY — HANDOVER v3 (COMPLET)

> Ce fichier contient TOUT ce qu'un nouveau Claude doit savoir pour reprendre le projet sans ambiguïté.

Date : 9 juin 2026
Phase actuelle : C2 Géoloc/Carte en cours (C2.1 done, C2.2 prochaine étape)
Deadline rapport PFE : 15 juin 2026

---

## 1. CONTEXTE PROJET

- Nom : Rentify — App mobile de location d'objets entre particuliers (Airbnb for objects)
- Étudiant : Ayoub Gouijane, PFE EFET Morocco
- Stack : React Native + TypeScript + Expo SDK 54 + Firebase 10.14.1
- Firebase Project ID : rentify-app-67083  (région europe-west1)
- Ville par défaut : Agadir (lat: 30.4278, lng: -9.5981)
- Devise : MAD

---

## 2. COMPTES DE TEST

PROPRIÉTAIRE : proprio@rentify.test / Rentify2026! / Karim Benali / Agadir
LOCATAIRE    : locataire@rentify.test / Rentify2026! / Sara El Fassi / Agadir

---

## 3. VERSIONS DÉPENDANCES

expo: ~54.0.33
react: 18.3.1
react-native: 0.76.x
typescript: ~5.3.3
firebase: 10.14.1  (IMPORTANT: PAS 11+, incompatible avec Metro Expo Go)
@react-navigation/native: ^6.x
@react-navigation/stack: ^6.x
@react-navigation/bottom-tabs: ^6.x
react-native-screens: ~4.16.0
react-native-safe-area-context: ~5.6.0
react-native-gesture-handler: ~2.20.2
react-native-reanimated: ~3.16.1
@react-native-async-storage/async-storage: 2.2.0
expo-image-picker: ~16.0.6
expo-image-manipulator: ~13.0.6
expo-location: ~18.0.10
react-native-maps: 1.18.0
@expo-google-fonts/poppins: latest
@expo-google-fonts/inter: latest
@expo/vector-icons: ^14.0.0

IMPORTANT : metro.config.js à la racine contient :
  config.resolver.unstable_enablePackageExports = false
  (FIX Firebase Auth crash avec Metro 0.83+)

---

## 4. SCHÉMAS TYPESCRIPT COMPLETS

### User.ts
interface User {
  uid: string;
  email: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  ville?: string;
  photoURL?: string;
  bio?: string;
  createdAt: Date | any;
  updatedAt?: Date | any;
}

### Item.ts
enum Categorie {
  OUTILS = 'outils', SPORT = 'sport', JARDINAGE = 'jardinage',
  EVENEMENT = 'evenement', MAISON = 'maison', INFORMATIQUE = 'informatique',
  PHOTO = 'photo', AUTRE = 'autre',
}

interface Item {
  id_item: string;
  titre: string;
  description: string;
  prix: number;            // prix par jour MAD
  prixParJour: number;     // alias de prix (legacy compat)
  categorie: Categorie;
  ville: string;
  proprietaireId: string;  // uid Firebase Auth
  ownerId: string;         // alias proprietaireId (legacy compat)
  proprietaire: { nom: string; photoURL?: string; }; // dénormalisé
  images: string[];        // URLs Firebase Storage
  photoUrl: string;        // première image (legacy compat)
  disponible: boolean;
  actif: boolean;          // false = soft deleted
  periodeMin?: number;     // jours minimum
  minDays?: number;        // alias periodeMin (legacy compat)
  averageRating?: number;  // dénormalisé
  reviewsCount?: number;   // dénormalisé
  latitude?: number;       // ajouté C2.1
  longitude?: number;      // ajouté C2.1
  datePublication?: Date | any;
  createdAt?: Date | any;
  updatedAt?: Date | any;
}

### Rental.ts
enum StatutDemande {
  PENDING = 'PENDING', ACCEPTED = 'ACCEPTED', REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED', IN_PROGRESS = 'IN_PROGRESS', COMPLETED = 'COMPLETED',
}

interface Rental {
  id: string;
  itemId: string;
  item?: Item;              // hydraté côté client
  locataireId: string;
  proprietaireId: string;
  dateDebut: Date | any;
  dateFin: Date | any;
  prixTotal: number;
  statut: StatutDemande;
  message?: string;
  remiseConfirmeeParProprietaire?: boolean;
  remiseConfirmeeParLocataire?: boolean;
  retourConfirmeParProprietaire?: boolean;
  retourConfirmeParLocataire?: boolean;
  createdAt: Date | any;
  updatedAt?: Date | any;
}

### Review.ts
interface Review {
  id: string;
  rentalId: string;
  itemId: string;
  locataireId: string;
  proprietaireId: string;
  rating: number;           // 1-5
  comment?: string;
  locataireNom?: string;    // dénormalisé
  locatairePhoto?: string;  // dénormalisé
  createdAt: Date | any;
}

### Favorite.ts
interface Favorite {
  id: string;               // clé composite : userId_itemId
  userId: string;
  itemId: string;
  createdAt: Date | any;
}

---

## 5. INVENTAIRE COMPLET firestoreService.ts

// ITEMS
createItem(data) => Promise<string>
updateItem(itemId, data) => Promise<void>
getItemById(itemId) => Promise<Item | null>
getAllItems() => Promise<Item[]>                          // actifs + disponibles
getAllItemsWithRatings() => Promise<Item[]>               // idem + ratings
getItemsByProprietaire(uid) => Promise<Item[]>           // y compris archivés
softDeleteItem(itemId) => Promise<void>                  // actif=false
countActiveRentalsForItem(itemId) => Promise<number>     // PENDING+ACCEPTED+IN_PROGRESS
countPendingRentalsForItem(itemId, proprietaireId) => Promise<number>
uploadItemImages(localUris) => Promise<string[]>         // compression + timeout 45s

// RENTALS
createRental(data) => Promise<string>
getRentalById(rentalId) => Promise<Rental | null>
getRentalsByLocataire(uid) => Promise<Rental[]>
getRentalsByProprietaire(uid) => Promise<Rental[]>
updateRentalStatus(rentalId, statut) => Promise<void>
accepterLocation(rentalId) => Promise<void>
rejeterLocation(rentalId) => Promise<void>
annulerLocation(rentalId) => Promise<void>
confirmerRemise(rentalId, role: 'proprietaire'|'locataire') => Promise<void>
confirmerRetour(rentalId, role: 'proprietaire'|'locataire') => Promise<void>
// confirmerRetour passe en COMPLETED si les 2 ont confirmé

// REVIEWS
createReview(data) => Promise<string>
getReviewByRental(rentalId) => Promise<Review | null>
getReviewsByItem(itemId) => Promise<Review[]>
getReviewsByProprietaire(uid) => Promise<Review[]>
getItemRatingStats(itemId) => Promise<{ average: number; count: number }>
getProprietaireRatingStats(uid) => Promise<{ average: number; count: number }>

// FAVORITES — clé doc : userId_itemId
addFavorite(userId, itemId) => Promise<void>
removeFavorite(userId, itemId) => Promise<void>
isFavorite(userId, itemId) => Promise<boolean>
getUserFavoriteIds(userId) => Promise<string[]>
getUserFavorites(userId) => Promise<Item[]>

// MESSAGING
getUserConversations(userId) => Promise<Conversation[]>
getOrCreateConversation(locataireId, proprietaireId, itemId, rentalId?) => Promise<string>
sendMessage(conversationId, senderId, text) => Promise<void>
subscribeToMessages(conversationId, callback) => Unsubscribe
markMessagesAsRead(conversationId, userId) => Promise<void>

// USERS
getUserById(uid) => Promise<User | null>
updateUserProfile(uid, data) => Promise<void>
uploadUserAvatar(uid, localUri) => Promise<string>

---

## 6. NAVIGATION — HIÉRARCHIE COMPLÈTE

AppNavigator
├── AuthNavigator (si non connecté)
│   ├── Login
│   └── Signup
│
└── MainTabNavigator (si connecté)
    ├── Tab Accueil → HomeStackNavigator
    │   ├── HomeScreen  [IMPORTANT: "HomeScreen" pas "Home" — évite conflit tab/stack]
    │   ├── ItemDetail
    │   ├── Reservation
    │   ├── RentalDetail
    │   └── Chat
    │
    ├── Tab Recherche → SearchStackNavigator
    │   ├── SearchScreen  [A un bouton "Carte" FLOATING existant à câbler]
    │   ├── ItemDetail
    │   ├── Reservation
    │   ├── Chat
    │   └── MapScreen  [À AJOUTER en C2.2]
    │
    ├── Tab Louer → LocationsStackNavigator
    │   ├── MesLocations
    │   └── RentalDetail
    │
    └── Tab Profil → ProfileStackNavigator
        ├── ProfileScreen
        ├── AddItem   [header: bouton poubelle en mode édition uniquement]
        ├── MesFavoris
        ├── MesAvis
        └── Messages

### Navigation types.ts (paramètres)
HomeStackParamList:
  HomeScreen: undefined
  ItemDetail: { itemId: string }
  Reservation: { itemId: string }
  RentalDetail: { rentalId: string }
  Chat: { conversationId: string; otherUserName: string }

SearchStackParamList:
  SearchScreen: undefined
  ItemDetail: { itemId: string }
  Reservation: { itemId: string }
  Chat: { conversationId: string; otherUserName: string }
  MapScreen: undefined  [À AJOUTER en C2.2]

LocationsStackParamList:
  MesLocations: undefined
  RentalDetail: { rentalId: string }

ProfileStackParamList:
  ProfileScreen: undefined
  AddItem: { itemId?: string }   // itemId présent = mode édition
  MesFavoris: undefined
  MesAvis: undefined
  Messages: undefined

---

## 7. FIRESTORE — SCHÉMA COLLECTIONS

users/{uid}
  uid, email, nom, prenom, telephone, ville, photoURL, bio, createdAt, updatedAt

items/{itemId}
  id_item, titre, description
  prix (= prixParJour), categorie, ville
  proprietaireId (= ownerId), proprietaire: { nom, photoURL }
  images: string[], photoUrl: string
  disponible: bool, actif: bool
  periodeMin (= minDays), averageRating, reviewsCount
  latitude?, longitude?
  datePublication, createdAt, updatedAt

rentals/{rentalId}
  id, itemId, locataireId, proprietaireId
  dateDebut, dateFin, prixTotal
  statut: PENDING|ACCEPTED|REJECTED|CANCELLED|IN_PROGRESS|COMPLETED
  message?
  remiseConfirmeeParProprietaire, remiseConfirmeeParLocataire
  retourConfirmeParProprietaire, retourConfirmeParLocataire
  createdAt, updatedAt

conversations/{convId}
  participants: [uid1, uid2], itemId, rentalId?, lastMessage, lastMessageAt, createdAt

conversations/{convId}/messages/{msgId}
  senderId, text, createdAt, read

reviews/{reviewId}
  rentalId, itemId, locataireId, proprietaireId
  rating (1-5), comment?, locataireNom, locatairePhoto, createdAt

favorites/{userId_itemId}
  userId, itemId, createdAt

---

## 8. SECURITY RULES (déployées via Firebase Console)

### Firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /items/{itemId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.resource.data.proprietaireId == request.auth.uid;
      allow update, delete: if request.auth != null
        && resource.data.proprietaireId == request.auth.uid;
    }
    match /rentals/{rentalId} {
      allow read: if request.auth != null
        && (resource.data.locataireId == request.auth.uid
          || resource.data.proprietaireId == request.auth.uid);
      allow create: if request.auth != null
        && request.resource.data.locataireId == request.auth.uid;
      allow update: if request.auth != null
        && (resource.data.locataireId == request.auth.uid
          || resource.data.proprietaireId == request.auth.uid);
    }
    match /conversations/{convId} {
      allow read, write: if request.auth != null
        && request.auth.uid in resource.data.participants;
      allow create: if request.auth != null
        && request.auth.uid in request.resource.data.participants;
      match /messages/{msgId} {
        allow read, write: if request.auth != null;
      }
    }
    match /reviews/{reviewId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.resource.data.locataireId == request.auth.uid;
      allow update, delete: if request.auth != null
        && resource.data.locataireId == request.auth.uid;
    }
    match /favorites/{favId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }
  }
}

### Storage Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /items/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024;
    }
    match /avatars/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 2 * 1024 * 1024;
    }
  }
}

---

## 9. DESIGN SYSTEM — theme.ts (tokens complets)

Import : import theme, { Colors, Spacing, Typography, Shadows, Radius, Layout } from '@/theme/theme'

COULEURS PRINCIPALES :
  primary: '#E85D26'         primaryLight: '#FF8C5A'
  primaryXLight: '#FFE8DC'   primaryDark: '#C44A18'
  secondary: '#1A9E75'       secondaryLight: '#4DC9A0'
  secondaryXLight: '#E1F5EE' secondaryDark: '#0D6E56'
  background: '#FAFAF8'      surface: '#FFFFFF'
  surfaceAlt: '#F5F4F0'
  textPrimary: '#1A1A2E'     textSecondary: '#6B6B7B'
  textTertiary: '#A0A0B0'    textInverse: '#FFFFFF'
  border: '#EBE9E4'          borderStrong: '#D4D1C8'
  overlay: 'rgba(26,26,46,0.5)'

COULEURS STATUTS :
  pending/pendingBg: '#F0A020' / '#FFF4E0'
  accepted/acceptedBg: '#1A9E75' / '#E1F5EE'
  rejected/rejectedBg: '#E83A26' / '#FFEDEB'
  cancelled/cancelledBg: '#A0A0B0' / '#F5F4F0'
  completed/completedBg: '#2980E8' / '#EBF4FF'

TYPOGRAPHIE :
  fontDisplay: 'Poppins_700Bold'       (H1, splash)
  fontHeading: 'Poppins_600SemiBold'   (H2, sections)
  fontSubheading: 'Poppins_500Medium'  (H3, cards)
  fontBody: 'Inter_400Regular'         (corps)
  fontBodyMedium: 'Inter_500Medium'    (emphase)
  sizes: xs=11 sm=13 md=15 lg=17 xl=20 2xl=24 3xl=28 4xl=34

SPACING : xs=4 sm=8 md=12 lg=16 xl=20 2xl=24 3xl=32 4xl=40 5xl=48 6xl=64

BORDER RADIUS : xs=4 sm=8 md=12 lg=16 xl=20 2xl=24 full=999

LAYOUT :
  tabBarHeight=60  headerHeight=56  screenPadding=16
  buttonHeight: sm=36 md=48 lg=56   inputHeight=52
  cardImageHeight=200  cardGap=12  sectionGap=24
  avatarSize: sm=32 md=44 lg=64 xl=96

CATÉGORIES (ids Firestore) :
  outils | sport | jardinage | evenement | maison | informatique | photo | autre

---

## 10. ÉTAT COMPLET FEATURES

### PHASE A — Foundation (100% ✅)
- Workflow PENDING→ACCEPTED→IN_PROGRESS→COMPLETED
- RentalProgressStepper component (4 étapes visuelles)
- Confirmation bilatérale remise + retour (les 2 parties confirment)
- RentalDetailScreen adaptatif role (propriétaire vs locataire)
- Historique MesLocations (onglet PASSÉES)
- Security Rules Firestore + Storage déployées

### PHASE B — UX (100% ✅)
- Cross-tab navigation: Profil → MessagesScreen (fix: "HomeScreen" pas "Home")
- Image obligatoire AddItem
- Soft delete sécurisé (bloqué si rentals actives)
  - Bouton poubelle header AddItem (mode édition)
  - Bandeau "n'est plus disponible" ItemDetail
  - Badge "Archivée" gris MesAnnonces
- Indication objet supprimé dans MessagesScreen + ChatScreen
- Min days validation côté locataire
- Favoris avec FavoritesContext global (Set<string> O(1), optimistic UI + rollback)
  MesFavorisScreen, compteur profil, cœur sur cards

### PHASE C1 — Avis (100% ✅)
- ReviewModal (étoiles interactives + commentaire)
- StarRating component (readonly + interactive)
- MesAvisScreen (stats moyenne + répartition par étoile + liste)
- averageRating sur cards Home + Search
- Section avis dans ItemDetail
- Bandeau "X filtres actifs" + badge count SearchScreen

### PHASE C2 — Géolocalisation (en cours 🟡)
- C2.1 ✅ : useLocation hook (permissions + reverse geocoding Expo)
- C2.1 ✅ : Capture lat/lng dans AddItemScreen
- C2.1 ✅ : geoUtils.ts (Haversine + formatDistance)
- C2.1 ✅ : app.json permissions location
- C2.2 ⏳ : MapScreen interactive — PROCHAINE ÉTAPE
- C2.3 ⏳ : Distance sur cards + filtre rayon

### PHASE C3 — Agent IA ⏳ (KEY differentiator)
### PHASE D — Polish ⏳ (D1 onboarding, D2 tests)
### PHASE E — Livrables ⏳ (APK, rapport, soutenance)

### Notifications Push — ABANDONNÉ
Décision finale: skip FCM, mentionner en "travaux futurs" rapport.

---

## 11. BUGS RÉSOLUS (pour le rapport)

1. Composite index Firestore : where() + orderBy() → erreur sans index.
   Fix : trier côté client JS.

2. Dual-field proprietaireId/ownerId : schema évolutif, dual-query pattern,
   les 2 champs coexistent pour compatibilité legacy.

3. Firebase Storage upload hang : uploadBytes sans timeout natif.
   Fix : Promise.race([uploadBytes(...), timeoutPromise(45000)]).

4. Compression images mobile : expo-image-manipulator resize 1280px + quality 0.6.
   Résultat : 4Mo → 200Ko (-95%).

5. Race condition upload parallèle : Promise.all sature réseau mobile.
   Fix : boucle for...of séquentielle.

6. Cache image après modification : ancienne image visible.
   Fix triple : useFocusEffect + getItemById refresh + key={item.photoUrl} + cache:'reload'.

7. Conflit nom Home/HomeScreen : tab "Home" + stack screen "Home" = ambiguïté.
   Fix : renommer screen en "HomeScreen" dans HomeStackNavigator.

8. Permission denied Firestore rule : query rentals avec seul filtre itemId.
   Firestore évalue rules statiquement = pas d'infos sur qui query.
   Fix : ajouter filtre proprietaireId explicite dans la query.

9. State leak AddItem : params.itemId persistent entre créations.
   Fix : useEffect reset explicite au mount sans params.

10. Intégrité soft delete : countActiveRentalsForItem() > 0 bloque suppression.

11. Loading infini MesAvisScreen : getReviewsByProprietaire retournait undefined.
    Fix : initialiser reviews:[] + null check avant .map().

12. SearchScreen previewCount stale : "Voir 3 résultats" non mis à jour.
    Fix : useMemo pour previewCount dépendant des filtres.

13. Filtre noteMin bloquant : initialisé à 1 cachait tous les items.
    Fix : valeur initiale 0, filter skippé si 0.

---

## 12. PROCHAINE ÉTAPE PRÉCISE — C2.2

CRITIQUE : Le bouton "Carte" EXISTE DÉJÀ dans SearchScreen (floating button
au-dessus de la nav bar, vient du prototype HTML). Ne pas le recréer.
Ne pas créer de toggle Carte/Liste dans HomeScreen. Juste câbler ce bouton.

PLAN :
1. Lire SearchScreen.tsx → trouver le bouton Carte existant
2. Créer src/screens/search/MapScreen.tsx
3. Ajouter MapScreen dans SearchStackNavigator + SearchStackParamList
4. Câbler le bouton → navigation.navigate('MapScreen')
5. MapScreen contient ItemsMapView :
   - MapView centré user (fallback Agadir 30.4278, -9.5981)
   - Markers prix pour items avec lat/lng
   - Tap marker → bottom sheet (photo + titre + prix + distance)
   - Bouton "Voir l'annonce" → navigation vers ItemDetail
   - Bouton recentrer (haut droite)
   - État vide si aucun item géolocalisé

Stack : react-native-maps + expo-location (DÉJÀ INSTALLÉS)

Simulateur iOS Agadir :
  xcrun simctl location booted set 30.4278,-9.5981

PROMPT CLAUDE CODE pour C2.2 :
---
Lis d'abord sans modifier :
- src/screens/search/SearchScreen.tsx (trouver le bouton Carte existant)
- src/navigation/SearchStackNavigator.tsx
- src/navigation/types.ts
- src/hooks/useLocation.ts
- src/utils/geoUtils.ts

Le bouton "Carte" existe déjà dans SearchScreen (floating au-dessus
de la nav bar). Je veux :
1. Ajouter MapScreen dans SearchStackParamList (types.ts)
2. Créer src/screens/search/MapScreen.tsx :
   - MapView centré sur position user (fallback Agadir 30.4278, -9.5981)
   - Markers pour items avec lat+lng, label prix (ex: "120 MAD")
   - Tap marker → bottom sheet : photo + titre + prix + bouton "Voir"
   - "Voir" → navigation.navigate('ItemDetail', { itemId })
   - Bouton recentrer coin haut droit
   - Message vide si aucun marker
3. Ajouter MapScreen dans SearchStackNavigator
4. Câbler le bouton Carte existant → navigate('MapScreen')
Respecte le design system (Colors, Shadows, Radius de theme.ts).
Présente d'abord le diagnostic SANS modifier de fichiers.
---

---

## 13. ROADMAP RESTANTE

C2.2 Carte interactive SearchScreen     [1h30]  ← MAINTENANT
C2.3 Distance sur cards + filtre rayon  [1h]
C3   Agent IA (Claude API)              [6-8h]  ← KEY differentiator
D1   Onboarding 3 slides                [2h]
D2   Tests unitaires                    [2h]
E1   EAS Build APK                      [1h]
E2   Rapport PFE (deadline 15 juin)     [3-4 jours]
E3   Soutenance prep

Stratégie : si manque de temps, sauter D1+D2, mentionner en "travaux futurs".

---

## 14. SCÉNARIO DÉMO SOUTENANCE (~8 minutes)

1. Inscription live ou comptes test
2. Publication objet avec photo + géoloc
3. Marketplace : Search + filtres + cards avec notes
4. Détail objet : galerie + avis + prix/jour
5. Réservation : sélection dates, envoi demande
6. Propriétaire accepte la demande
7. Stepper : ACCEPTED → IN_PROGRESS → COMPLETED (confirmation bilatérale)
8. Chat entre les 2 comptes
9. Laisser un avis après location terminée
10. Carte : bouton Carte dans Search → markers géolocalisés

---

## 15. QUESTIONS JURY

Q: Pourquoi Firebase et pas API REST custom ?
R: One-stop-shop : Auth + Firestore temps réel + Storage + Security Rules.
   Pour MVP mobile, éviter une couche serveur réduit la complexité. Les Rules
   remplacent le backend d'autorisation. Trade-off : vendor lock-in + coût à scale.

Q: Qu'est-ce que le soft delete ?
R: actif=false au lieu de supprimer. Préserve historique locations et conversations.
   Item archivé n'apparaît plus dans marketplace. Suppression bloquée si rentals
   PENDING/ACCEPTED/IN_PROGRESS actives → intégrité référentielle.

Q: Comment fonctionne votre workflow location ?
R: 6 statuts inspirés Airbnb. PENDING → ACCEPTED → IN_PROGRESS (remise bilatérale
   confirmée) → COMPLETED (retour bilatéral confirmé). REJECTED/CANCELLED pour refus.
   Confirmation bilatérale évite les litiges.

Q: Pourquoi TypeScript ?
R: Détection erreurs à compilation, autocomplétion, refactoring sûr. Interfaces pour
   User, Item, Rental, Review. Exemple : item.prixJour vs item.prix → TS signale l'erreur.

Q: Comment gérez-vous les images ?
R: expo-image-picker → compression expo-image-manipulator (1280px, quality 0.6 → -95%)
   → upload Firebase Storage avec Promise.race + timeout 45s → URL Firestore.
   Si upload échoue : recovery UI avec message d'erreur.

Q: Expliquez votre architecture ?
R: 3 couches : Présentation (screens/components) → Services (Firebase logic) → Types (TS interfaces).
   Changer de backend = modifier seulement les services, pas les screens.

Q: C'est quoi la formule de Haversine ?
R: Trigonométrie sphérique pour distance GPS tenant compte de la courbure terrestre.
   calculateDistance(lat1, lng1, lat2, lng2) dans geoUtils.ts → "à X km de vous" sur cards.

---

## 16. GIT WORKFLOW

Branche : feature/firebase-integration (~15 commits en avance sur origin)
Style : français, conventional commits (feat:, fix:, docs:)
Plan final :
  git checkout develop && git merge feature/firebase-integration
  git checkout main && git merge develop
  git tag v1.0.0
  git push origin main develop --tags

---

## 17. COMMANDES UTILES

npx expo start                                       # Démarrer
xcrun simctl location booted set 30.4278,-9.5981     # Simuler Agadir iOS
eas build -p android --profile preview               # Build APK
npx expo install --check                             # Vérifier dépendances

---

## 18. PROMPT DE DÉMARRAGE NOUVEAU CHAT

Copie-colle ceci au début du nouveau chat :

"Bonjour ! Je reprends mon PFE Rentify. Voici le handover v3 complet.
Lis-le attentivement — types TS, fonctions service, navigation, design tokens,
bugs résolus, prochaine étape précise.

[CONTENU DE CE FICHIER]

On reprend à C2.2 : câbler le bouton Carte existant dans SearchScreen vers un
MapScreen react-native-maps. Le bouton EXISTE DÉJÀ, ne pas le recréer.
Donne-moi le diagnostic SANS modifier de fichiers."

---

RENTIFY_HANDOVER_v3.md — 9 juin 2026
