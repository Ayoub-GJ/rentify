import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  QueryDocumentSnapshot as QDS,
  DocumentSnapshot as DS,
} from 'firebase/firestore';
import { db, storage } from '../config/firebase.config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Item, Rental, CreateRentalData, Categorie, StatutDemande, User, Message, Review } from '../types';

// ─── UserStats ────────────────────────────────────────────────
export interface UserStats {
  itemsCount: number;
  rentalsCount: number;
  earningsTotal: number;
  averageRating: number;
  reviewsCount: number;
}

// ─── RentalData ───────────────────────────────────────────────
// Format étendu stocké dans Firestore (champs dénormalisés)
export interface RentalData {
  id: string;
  itemId: string;
  itemTitre: string;
  itemImage: string;
  locataireId: string;
  proprietaireId: string;
  dateDebut: Date;
  dateFin: Date;
  jours: number;
  prixTotal: number;
  message: string;
  statut: StatutDemande;
  // Workflow remise
  remiseProprio?: boolean;
  remiseLocataire?: boolean;
  remiseAt?: Date;
  // Workflow retour
  retourLocataire?: boolean;
  retourProprio?: boolean;
  retourAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * GESTION DES OBJETS (ITEMS)
 */

/**
 * Publier un nouvel objet
 */
export const createItem = async (item: Omit<Item, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'items'), {
      titre: item.titre,
      description: item.description,
      categorie: item.categorie,
      prixParJour: item.prixParJour,
      ville: item.ville,
      photoUrl: item.photoUrl,
      ownerId: item.ownerId,
      proprietaireId: item.proprietaireId ?? item.ownerId,
      proprietaire: item.proprietaire ?? null,
      disponible: item.actif,
      datePublication: Timestamp.fromDate(item.datePublication),
      ...(item.periodeMin && item.periodeMin > 1 ? { periodeMin: item.periodeMin } : {}),
    });
    return docRef.id;
  } catch (error: any) {
    console.error('Erreur createItem:', error);
    throw new Error('Impossible de publier l\'objet');
  }
};

/**
 * Récupérer tous les objets disponibles
 */
export const getAvailableItems = async (): Promise<Item[]> => {
  try {
    const q = query(
      collection(db, 'items'),
      where('actif', '==', true),
      orderBy('datePublication', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        titre: data.titre,
        description: data.description,
        categorie: data.categorie as Categorie,
        prixParJour: data.prixParJour,
        ville: data.ville,
        photoUrl: data.photoUrl,
        ownerId: data.ownerId,
        actif: data.actif,
        datePublication: data.datePublication.toDate(),
      };
    });
  } catch (error: any) {
    console.error('Erreur getAvailableItems:', error);
    throw new Error('Impossible de récupérer les objets');
  }
};

/**
 * Récupérer les objets d'un propriétaire
 */
export const getMyItems = async (ownerId: string): Promise<Item[]> => {
  try {
    const q = query(
      collection(db, 'items'),
      where('ownerId', '==', ownerId),
      orderBy('datePublication', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        titre: data.titre,
        description: data.description,
        categorie: data.categorie as Categorie,
        prixParJour: data.prixParJour,
        ville: data.ville,
        photoUrl: data.photoUrl,
        ownerId: data.ownerId,
        actif: data.actif,
        datePublication: data.datePublication.toDate(),
      };
    });
  } catch (error: any) {
    console.error('Erreur getMyItems:', error);
    throw new Error('Impossible de récupérer vos objets');
  }
};

/**
 * GESTION DES LOCATIONS (RENTALS)
 */

/**
 * Créer une demande de location
 */
export const createRental = async (
  rentalData: Omit<RentalData, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'rentals'), {
      ...rentalData,
      dateDebut: Timestamp.fromDate(rentalData.dateDebut),
      dateFin: Timestamp.fromDate(rentalData.dateFin),
      statut: StatutDemande.PENDING,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error: any) {
    console.error('Erreur createRental:', error);
    throw new Error('Impossible de créer la demande');
  }
};

/**
 * Récupérer les demandes reçues (pour le propriétaire)
 */
export const getReceivedRentals = async (ownerId: string): Promise<RentalData[]> => {
  try {
    const q = query(
      collection(db, 'rentals'),
      where('ownerId', '==', ownerId),
      orderBy('dateCreation', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(mapRentalDoc);
  } catch (error: any) {
    console.error('Erreur getReceivedRentals:', error);
    throw new Error('Impossible de récupérer les demandes');
  }
};

/**
 * Accepter une demande de location
 */
export const acceptRental = async (rentalId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'rentals', rentalId), {
      statut: StatutDemande.ACCEPTED,
    });
  } catch (error: any) {
    console.error('Erreur acceptRental:', error);
    throw new Error('Impossible d\'accepter la demande');
  }
};

/**
 * Refuser une demande de location
 */
export const rejectRental = async (rentalId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'rentals', rentalId), {
      statut: StatutDemande.REJECTED,
    });
  } catch (error: any) {
    console.error('Erreur rejectRental:', error);
    throw new Error('Impossible de refuser la demande');
  }
};

// ─── Helpers de mapping ───────────────────────────────────────

function mapDocToItem(docSnap: import('firebase/firestore').QueryDocumentSnapshot | import('firebase/firestore').DocumentSnapshot): Item {
  const data = docSnap.data()!;
  // images[] prime sur photoUrl : les nouveaux items stockent images[] après upload
  const firstImage = Array.isArray(data.images) && data.images.length > 0 ? data.images[0] : '';
  return {
    id: docSnap.id,
    titre: data.titre,
    description: data.description ?? '',
    categorie: data.categorie as Categorie,
    prixParJour: data.prixParJour,
    ville: data.ville,
    photoUrl: firstImage || data.photoUrl || '',
    images: Array.isArray(data.images) ? data.images : (data.photoUrl ? [data.photoUrl] : []),
    ownerId: data.ownerId ?? data.proprietaireId ?? '',
    proprietaireId: data.proprietaireId ?? data.ownerId ?? '',
    proprietaire: data.proprietaire ?? { nom: 'Propriétaire', initiales: '?' },
    actif: data.actif ?? data.disponible ?? true,
    datePublication: data.datePublication instanceof Timestamp
      ? data.datePublication.toDate()
      : data.datePublication
        ? new Date(data.datePublication)
        : new Date(),
    periodeMin: data.periodeMin ? Number(data.periodeMin) : undefined,
    averageRating: data.averageRating ?? undefined,
    reviewsCount: data.reviewsCount ?? undefined,
  };
}

/**
 * Récupérer tous les objets disponibles (actif == true), triés par date de publication
 */
export const getAllItems = async (): Promise<Item[]> => {
  try {
    const q = query(
      collection(db, 'items'),
      where('disponible', '==', true)
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(mapDocToItem);
    items.sort((a, b) => b.datePublication.getTime() - a.datePublication.getTime());
    return items;
  } catch (error) {
    console.error('Erreur getAllItems:', error);
    return [];
  }
};

/**
 * Récupérer un objet par son id
 */
export const getItemById = async (id: string): Promise<Item | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'items', id));
    if (!docSnap.exists()) return null;
    return mapDocToItem(docSnap);
  } catch (error) {
    console.error('Erreur getItemById:', error);
    return null;
  }
};

/**
 * Récupérer les objets d'une catégorie donnée (actif == true)
 */
export const getItemsByCategory = async (categorie: string | Categorie): Promise<Item[]> => {
  try {
    const q = query(
      collection(db, 'items'),
      where('categorie', '==', categorie),
      where('disponible', '==', true)
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(mapDocToItem);
    items.sort((a, b) => b.datePublication.getTime() - a.datePublication.getTime());
    return items;
  } catch (error) {
    console.error('Erreur getItemsByCategory:', error);
    return [];
  }
};

/**
 * Récupérer les objets d'un propriétaire
 * Dual-query : couvre les anciens docs (ownerId) et les nouveaux (proprietaireId)
 */
export const getItemsByOwner = async (ownerId: string): Promise<Item[]> => {
  if (!ownerId) return [];
  try {
    const [s1, s2] = await Promise.all([
      getDocs(query(collection(db, 'items'), where('proprietaireId', '==', ownerId))),
      getDocs(query(collection(db, 'items'), where('ownerId', '==', ownerId))),
    ]);
    const map = new Map<string, Item>();
    s1.docs.forEach(d => map.set(d.id, mapDocToItem(d)));
    s2.docs.forEach(d => { if (!map.has(d.id)) map.set(d.id, mapDocToItem(d)); });
    return Array.from(map.values()).sort(
      (a, b) => b.datePublication.getTime() - a.datePublication.getTime(),
    );
  } catch (error) {
    console.error('Erreur getItemsByOwner:', error);
    return [];
  }
};

/**
 * Soft-delete : désactive l'annonce sans la supprimer.
 * Vérifie d'abord qu'il n'y a aucune location active (PENDING/ACCEPTED/IN_PROGRESS).
 * Throws 'ITEM_HAS_ACTIVE_RENTALS' si des locations actives existent.
 */
export const softDeleteItem = async (itemId: string, proprietaireId: string): Promise<void> => {
  const activeCount = await countActiveRentalsForItem(itemId, proprietaireId);
  if (activeCount > 0) {
    throw new Error('ITEM_HAS_ACTIVE_RENTALS');
  }
  try {
    await updateDoc(doc(db, 'items', itemId), {
      actif: false,
      disponible: false,
      deletedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur softDeleteItem:', error);
    throw new Error("Impossible de supprimer l'annonce");
  }
};

/**
 * Mettre à jour un objet existant
 */
export const updateItem = async (
  itemId: string,
  data: Partial<Item> & { images?: string[] }
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'items', itemId), data as Record<string, unknown>);
  } catch (error) {
    console.error('Erreur updateItem:', error);
    throw new Error('Impossible de mettre à jour l\'objet');
  }
};

// ─── Helpers rentals ─────────────────────────────────────────

function mapRentalDoc(docSnap: QDS | DS): RentalData {
  const data = docSnap.data()!;
  return {
    id: docSnap.id,
    itemId: data.itemId ?? '',
    itemTitre: data.itemTitre ?? '',
    itemImage: data.itemImage ?? '',
    locataireId: data.locataireId ?? '',
    proprietaireId: data.proprietaireId ?? '',
    dateDebut: data.dateDebut instanceof Timestamp ? data.dateDebut.toDate() : new Date(data.dateDebut),
    dateFin: data.dateFin instanceof Timestamp ? data.dateFin.toDate() : new Date(data.dateFin),
    jours: data.jours ?? 0,
    prixTotal: data.prixTotal ?? 0,
    message: data.message ?? '',
    statut: data.statut as StatutDemande,
    remiseProprio: data.remiseProprio ?? false,
    remiseLocataire: data.remiseLocataire ?? false,
    remiseAt: data.remiseAt instanceof Timestamp ? data.remiseAt.toDate() : undefined,
    retourLocataire: data.retourLocataire ?? false,
    retourProprio: data.retourProprio ?? false,
    retourAt: data.retourAt instanceof Timestamp ? data.retourAt.toDate() : undefined,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
  };
}

/**
 * Récupérer les locations où l'utilisateur est locataire
 */
export const getRentalsByLocataire = async (uid: string): Promise<RentalData[]> => {
  try {
    const q = query(collection(db, 'rentals'), where('locataireId', '==', uid));
    const snapshot = await getDocs(q);
    const rentals = snapshot.docs.map(mapRentalDoc);
    rentals.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    return rentals;
  } catch (error) {
    console.error('Erreur getRentalsByLocataire:', error);
    return [];
  }
};

/**
 * Récupérer les locations où l'utilisateur est propriétaire
 * Dual-query : couvre rentals stockés avec ownerId (legacy) ou proprietaireId
 */
export const getRentalsByProprietaire = async (uid: string): Promise<RentalData[]> => {
  if (!uid) return [];
  try {
    const [s1, s2] = await Promise.all([
      getDocs(query(collection(db, 'rentals'), where('proprietaireId', '==', uid))),
      getDocs(query(collection(db, 'rentals'), where('ownerId', '==', uid))),
    ]);
    const map = new Map<string, RentalData>();
    s1.docs.forEach(d => map.set(d.id, mapRentalDoc(d)));
    s2.docs.forEach(d => { if (!map.has(d.id)) map.set(d.id, mapRentalDoc(d)); });
    return Array.from(map.values()).sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    );
  } catch (error) {
    console.error('Erreur getRentalsByProprietaire:', error);
    return [];
  }
};

/**
 * Compter les locations actives sur un item (PENDING + ACCEPTED + IN_PROGRESS).
 * Bloque la suppression de l'annonce si > 0.
 * Filtre par proprietaireId requis par les Security Rules (query constraint).
 */
export const countActiveRentalsForItem = async (itemId: string, proprietaireId: string): Promise<number> => {
  if (!proprietaireId) return 0;
  try {
    const activeStatuts = [StatutDemande.PENDING, StatutDemande.ACCEPTED, StatutDemande.IN_PROGRESS];
    const [s1, s2] = await Promise.all([
      getDocs(query(
        collection(db, 'rentals'),
        where('itemId', '==', itemId),
        where('proprietaireId', '==', proprietaireId),
        where('statut', 'in', activeStatuts),
      )),
      getDocs(query(
        collection(db, 'rentals'),
        where('itemId', '==', itemId),
        where('ownerId', '==', proprietaireId),
        where('statut', 'in', activeStatuts),
      )),
    ]);
    const ids = new Set<string>();
    s1.docs.forEach(d => ids.add(d.id));
    s2.docs.forEach(d => ids.add(d.id));
    return ids.size;
  } catch (error) {
    console.error('Erreur countActiveRentalsForItem:', error);
    return 0;
  }
};

/**
 * Compter les demandes PENDING reçues sur un item
 */
export const countPendingRentalsForItem = async (itemId: string, proprietaireId: string): Promise<number> => {
  if (!proprietaireId) return 0;
  try {
    // Dual-query : couvre docs avec proprietaireId (nouveau) et ownerId (legacy).
    // Filtrer sur le champ du propriétaire est requis par les Security Rules :
    // sans ce filtre Firestore rejette la collection-query (rule dépend de resource.data).
    const [s1, s2] = await Promise.all([
      getDocs(query(
        collection(db, 'rentals'),
        where('itemId', '==', itemId),
        where('proprietaireId', '==', proprietaireId),
        where('statut', '==', StatutDemande.PENDING),
      )),
      getDocs(query(
        collection(db, 'rentals'),
        where('itemId', '==', itemId),
        where('ownerId', '==', proprietaireId),
        where('statut', '==', StatutDemande.PENDING),
      )),
    ]);
    const ids = new Set<string>();
    s1.docs.forEach(d => ids.add(d.id));
    s2.docs.forEach(d => ids.add(d.id));
    return ids.size;
  } catch (error) {
    console.error('Erreur countPendingRentalsForItem:', error);
    return 0;
  }
};

/**
 * Récupérer la rental la plus récente d'un locataire sur un item donné
 */
export const getMyRentalForItem = async (
  uid: string,
  itemId: string,
): Promise<RentalData | null> => {
  if (!uid || !itemId) return null;
  try {
    const q = query(
      collection(db, 'rentals'),
      where('locataireId', '==', uid),
      where('itemId', '==', itemId),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const rentals = snap.docs.map(mapRentalDoc);
    rentals.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    return rentals[0];
  } catch (error) {
    console.error('Erreur getMyRentalForItem:', error);
    return null;
  }
};

/**
 * Mettre à jour le statut d'une location
 */
export const updateRentalStatus = async (
  rentalId: string,
  statut: StatutDemande
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'rentals', rentalId), {
      statut,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur updateRentalStatus:', error);
    throw new Error('Impossible de mettre à jour le statut');
  }
};

/**
 * Récupérer une location par son id
 */
export const getRentalById = async (rentalId: string): Promise<RentalData | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'rentals', rentalId));
    if (!docSnap.exists()) return null;
    return mapRentalDoc(docSnap);
  } catch (error) {
    console.error('Erreur getRentalById:', error);
    return null;
  }
};

/**
 * Confirmer la remise de l'objet (double confirmation proprio + locataire)
 * Quand les deux ont confirmé → statut passe à IN_PROGRESS
 */
export const confirmerRemise = async (
  rentalId: string,
  role: 'proprietaire' | 'locataire',
): Promise<void> => {
  const ref = doc(db, 'rentals', rentalId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();

  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (role === 'proprietaire') updates.remiseProprio = true;
  else updates.remiseLocataire = true;

  const newRemiseProprio = (updates.remiseProprio as boolean | undefined) ?? data.remiseProprio ?? false;
  const newRemiseLocataire = (updates.remiseLocataire as boolean | undefined) ?? data.remiseLocataire ?? false;

  if (newRemiseProprio && newRemiseLocataire) {
    updates.statut = StatutDemande.IN_PROGRESS;
    updates.remiseAt = serverTimestamp();
  }

  await updateDoc(ref, updates);
};

/**
 * Confirmer le retour de l'objet (double confirmation proprio + locataire)
 * Quand les deux ont confirmé → statut passe à COMPLETED
 */
export const confirmerRetour = async (
  rentalId: string,
  role: 'proprietaire' | 'locataire',
): Promise<void> => {
  const ref = doc(db, 'rentals', rentalId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();

  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (role === 'locataire') updates.retourLocataire = true;
  else updates.retourProprio = true;

  const newRetourLocataire = (updates.retourLocataire as boolean | undefined) ?? data.retourLocataire ?? false;
  const newRetourProprio = (updates.retourProprio as boolean | undefined) ?? data.retourProprio ?? false;

  if (newRetourLocataire && newRetourProprio) {
    updates.statut = StatutDemande.COMPLETED;
    updates.retourAt = serverTimestamp();
  }

  await updateDoc(ref, updates);
};

/**
 * Annuler une location (locataire, avant remise)
 */
export const annulerLocation = async (rentalId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'rentals', rentalId), {
      statut: StatutDemande.CANCELLED,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur annulerLocation:', error);
    throw new Error('Impossible d\'annuler la location');
  }
};

/**
 * Récupérer un utilisateur par son uid
 */
export const getUserById = async (uid: string): Promise<User | null> => {
  if (!uid || typeof uid !== 'string' || uid.trim().length === 0) return null;
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      uid: docSnap.id,
      email: data.email ?? '',
      nom: data.nom ?? '',
      prenom: data.prenom ?? '',
      telephone: data.telephone,
      ville: data.ville,
      photoURL: data.photoURL ?? data.photoUrl,
      createdAt: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : data.dateInscription
          ? new Date(data.dateInscription)
          : new Date(),
    };
  } catch (error) {
    console.error('Erreur getUserById:', error);
    return null;
  }
};

/**
 * Uploader les images d'un objet dans Firebase Storage
 * Retourne le tableau de download URLs
 */
export const uploadItemImages = async (
  localUris: string[],
  itemId: string
): Promise<string[]> => {
  try {
    const downloadURLs: string[] = [];
    for (let i = 0; i < localUris.length; i++) {
      const blob = await fetch(localUris[i]).then(r => r.blob());
      const storageRef = ref(storage, `items/${itemId}/image_${i}.jpg`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      downloadURLs.push(url);
    }
    return downloadURLs;
  } catch (error) {
    console.error('Erreur uploadItemImages:', error);
    throw new Error('Impossible d\'uploader les images');
  }
};

// ─── Chat / Conversations ─────────────────────────────────────

/**
 * Récupère la conversation existante entre deux users pour un item,
 * ou en crée une nouvelle si elle n'existe pas.
 */
export const getOrCreateConversation = async (
  user1Id: string,
  user2Id: string,
  itemId: string,
  itemTitre: string
): Promise<string> => {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user1Id),
      where('itemId', '==', itemId)
    );
    const snapshot = await getDocs(q);
    const existing = snapshot.docs.find((d) => {
      const participants = d.data().participants as string[];
      return participants.includes(user2Id);
    });
    if (existing) return existing.id;

    const docRef = await addDoc(collection(db, 'conversations'), {
      participants: [user1Id, user2Id].sort(),
      itemId,
      itemTitre,
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erreur getOrCreateConversation:', error);
    throw error;
  }
};

/**
 * Souscrit aux messages d'une conversation en temps réel.
 * Retourne la fonction unsubscribe pour le cleanup useEffect.
 */
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        conversationId,
        senderId: data.senderId ?? '',
        texte: data.texte ?? '',
        imageUrl: data.imageUrl ?? undefined,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        lu: data.lu ?? false,
      };
    });
    callback(messages);
  });
};

/**
 * Mettre à jour le profil d'un utilisateur
 */
export const updateUserProfile = async (uid: string, updates: Partial<User>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), updates as Record<string, unknown>);
  } catch (error) {
    console.error('Erreur updateUserProfile:', error);
    throw new Error('Impossible de mettre à jour le profil');
  }
};

/**
 * Uploader un avatar utilisateur (écrase avatars/{uid}.jpg)
 */
export const uploadUserAvatar = async (localUri: string, uid: string): Promise<string> => {
  try {
    const blob = await fetch(localUri).then(r => r.blob());
    const storageRef = ref(storage, `avatars/${uid}.jpg`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Erreur uploadUserAvatar:', error);
    throw new Error("Impossible d'uploader l'avatar");
  }
};

/**
 * Statistiques d'un utilisateur (annonces, locations, gains, note)
 * itemsCount : dual-query via getItemsByOwner (couvre ownerId + proprietaireId)
 * earningsTotal : dual-query sur rentals COMPLETED (idem)
 */
export const getUserStats = async (uid: string): Promise<UserStats> => {
  try {
    const [items, rentalsLocSnap, earningsS1, earningsS2] = await Promise.all([
      getItemsByOwner(uid),
      getDocs(query(
        collection(db, 'rentals'),
        where('locataireId', '==', uid),
        where('statut', '==', StatutDemande.COMPLETED),
      )),
      getDocs(query(
        collection(db, 'rentals'),
        where('proprietaireId', '==', uid),
        where('statut', '==', StatutDemande.COMPLETED),
      )),
      getDocs(query(
        collection(db, 'rentals'),
        where('ownerId', '==', uid),
        where('statut', '==', StatutDemande.COMPLETED),
      )),
    ]);

    const earningsMap = new Map<string, number>();
    earningsS1.docs.forEach(d => earningsMap.set(d.id, d.data().prixTotal ?? 0));
    earningsS2.docs.forEach(d => { if (!earningsMap.has(d.id)) earningsMap.set(d.id, d.data().prixTotal ?? 0); });
    const earningsTotal = Array.from(earningsMap.values()).reduce((sum, v) => sum + v, 0);

    const reviewsSnap = await getDocs(query(
      collection(db, 'reviews'),
      where('proprietaireId', '==', uid),
    ));
    const reviewsCount = reviewsSnap.size;
    const averageRating = reviewsCount > 0
      ? Math.round(
          reviewsSnap.docs.reduce((sum, d) => sum + (d.data().rating as number), 0) / reviewsCount * 10,
        ) / 10
      : 0;

    return {
      itemsCount: items.length,
      rentalsCount: rentalsLocSnap.size,
      earningsTotal,
      averageRating,
      reviewsCount,
    };
  } catch (error) {
    console.error('Erreur getUserStats:', error);
    return { itemsCount: 0, rentalsCount: 0, earningsTotal: 0, averageRating: 0, reviewsCount: 0 };
  }
};

/**
 * Envoie un message texte et/ou image dans une conversation.
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  texte: string,
  imageUrl?: string,
): Promise<void> => {
  if (!conversationId || !senderId) return;
  const trimmed = texte.trim();
  if (!trimmed && !imageUrl) return;
  try {
    const messageData: Record<string, unknown> = {
      senderId,
      texte: trimmed,
      createdAt: serverTimestamp(),
      lu: false,
    };
    if (imageUrl) messageData.imageUrl = imageUrl;

    await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: imageUrl ? '__IMAGE__' : trimmed,
      lastMessageAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur sendMessage:', error);
    throw error;
  }
};

/**
 * Uploade une image de chat dans Firebase Storage.
 * Path : conversations/{conversationId}/{timestamp}.jpg
 */
export const uploadChatImage = async (
  localUri: string,
  conversationId: string,
): Promise<string> => {
  if (!localUri || !conversationId) throw new Error('invalid params');
  const blob = await fetch(localUri).then(r => r.blob());
  const storageRef = ref(storage, `conversations/${conversationId}/${Date.now()}.jpg`);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
};

// ─── ConversationWithUser ─────────────────────────────────────

export interface ConversationWithUser {
  id: string;
  participants: string[];
  itemId: string;
  itemTitre: string;
  lastMessage: string;
  lastMessageAt: Date;
  otherUserId: string;
  otherUser: User | null;
  itemDeleted: boolean;
}

/**
 * Récupère toutes les conversations de l'utilisateur, hydratées avec le profil de l'autre participant.
 */
export const getUserConversations = async (uid: string): Promise<ConversationWithUser[]> => {
  if (!uid) return [];
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid),
    );
    const snap = await getDocs(q);

    const conversations = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        const otherUserId = ((data.participants ?? []) as string[]).find(p => p !== uid) ?? '';
        const itemId = data.itemId ?? '';
        const [otherUser, item] = await Promise.all([
          otherUserId ? getUserById(otherUserId) : Promise.resolve(null),
          itemId ? getItemById(itemId) : Promise.resolve(null),
        ]);
        const itemDeleted = item === null || item.actif === false;
        return {
          id: d.id,
          participants: data.participants ?? [],
          itemId,
          itemTitre: data.itemTitre ?? '',
          lastMessage: data.lastMessage ?? '',
          lastMessageAt: data.lastMessageAt instanceof Timestamp
            ? data.lastMessageAt.toDate()
            : new Date(0),
          otherUserId,
          otherUser,
          itemDeleted,
        } as ConversationWithUser;
      }),
    );

    return conversations.sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime(),
    );
  } catch (error) {
    console.error('Erreur getUserConversations:', error);
    return [];
  }
};

// ─── UserBadges ───────────────────────────────────────────────

export interface UserBadges {
  pendingRequestsCount: number;
  unreadMessagesCount: number;
}

/**
 * Compteurs pour les badges UI.
 * pendingRequestsCount : demandes PENDING reçues (dual-query ownerId + proprietaireId)
 * unreadMessagesCount  : 0 pour l'instant (système de lecture non implémenté)
 */
export const getUserBadges = async (uid: string): Promise<UserBadges> => {
  if (!uid) return { pendingRequestsCount: 0, unreadMessagesCount: 0 };
  try {
    const [s1, s2] = await Promise.all([
      getDocs(query(
        collection(db, 'rentals'),
        where('proprietaireId', '==', uid),
        where('statut', '==', StatutDemande.PENDING),
      )),
      getDocs(query(
        collection(db, 'rentals'),
        where('ownerId', '==', uid),
        where('statut', '==', StatutDemande.PENDING),
      )),
    ]);
    const ids = new Set<string>();
    s1.docs.forEach(d => ids.add(d.id));
    s2.docs.forEach(d => ids.add(d.id));
    return { pendingRequestsCount: ids.size, unreadMessagesCount: 0 };
  } catch (error) {
    console.error('Erreur getUserBadges:', error);
    return { pendingRequestsCount: 0, unreadMessagesCount: 0 };
  }
};

// ─── Favorites ────────────────────────────────────────────────

export const getUserFavoriteIds = async (userId: string): Promise<string[]> => {
  if (!userId) return [];
  const snap = await getDocs(query(
    collection(db, 'favorites'),
    where('userId', '==', userId),
  ));
  return snap.docs.map((d) => d.data().itemId as string);
};

export const addFavorite = async (userId: string, itemId: string): Promise<void> => {
  const id = `${userId}_${itemId}`;
  await setDoc(doc(db, 'favorites', id), {
    userId,
    itemId,
    createdAt: serverTimestamp(),
  }, { merge: true });
};

export const removeFavorite = async (userId: string, itemId: string): Promise<void> => {
  await deleteDoc(doc(db, 'favorites', `${userId}_${itemId}`));
};

export const isFavorite = async (userId: string, itemId: string): Promise<boolean> => {
  const snap = await getDoc(doc(db, 'favorites', `${userId}_${itemId}`));
  return snap.exists();
};

export const getUserFavorites = async (userId: string): Promise<Item[]> => {
  if (!userId) return [];
  try {
    const snap = await getDocs(query(
      collection(db, 'favorites'),
      where('userId', '==', userId),
    ));
    const items = await Promise.all(
      snap.docs.map(async (d) => {
        const { itemId } = d.data();
        const item = await getItemById(itemId as string);
        if (!item || item.actif === false) {
          // Auto-cleanup: remove stale favorites pointing to deleted items
          await deleteDoc(d.ref).catch(() => {});
          return null;
        }
        return item;
      }),
    );
    return items.filter((i): i is Item => i !== null);
  } catch (error) {
    console.error('Erreur getUserFavorites:', error);
    return [];
  }
};

export const getUserFavoritesCount = async (userId: string): Promise<number> => {
  if (!userId) return 0;
  try {
    const snap = await getDocs(query(
      collection(db, 'favorites'),
      where('userId', '==', userId),
    ));
    return snap.size;
  } catch {
    return 0;
  }
};

// ─── Reviews ──────────────────────────────────────────────────

function mapDocToReview(d: QDS | DS): Review {
  const data = d.data()!;
  return {
    id: d.id,
    rentalId: data.rentalId,
    itemId: data.itemId,
    itemTitre: data.itemTitre ?? '',
    proprietaireId: data.proprietaireId,
    locataireId: data.locataireId,
    locataireName: data.locataireName ?? '',
    rating: data.rating,
    commentaire: data.commentaire ?? '',
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
  };
}

export const createReview = async (params: {
  rentalId: string;
  itemId: string;
  itemTitre: string;
  proprietaireId: string;
  locataireId: string;
  locataireName: string;
  rating: number;
  commentaire: string;
}): Promise<string> => {
  // Guard: one review per rental
  const existing = await getDocs(query(
    collection(db, 'reviews'),
    where('rentalId', '==', params.rentalId),
    limit(1),
  ));
  if (!existing.empty) throw new Error('REVIEW_ALREADY_EXISTS');

  const docRef = await addDoc(collection(db, 'reviews'), {
    ...params,
    createdAt: serverTimestamp(),
  });

  console.log('[createReview] Review created with ID:', docRef.id);
  return docRef.id;
};

export const getReviewByRental = async (rentalId: string): Promise<Review | null> => {
  const snap = await getDocs(query(
    collection(db, 'reviews'),
    where('rentalId', '==', rentalId),
    limit(1),
  ));
  if (snap.empty) return null;
  return mapDocToReview(snap.docs[0]);
};

export const getReviewsByProprietaire = async (proprietaireId: string): Promise<Review[]> => {
  const snap = await getDocs(query(
    collection(db, 'reviews'),
    where('proprietaireId', '==', proprietaireId),
  ));
  const reviews = snap.docs.map(mapDocToReview);
  return reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getReviewsByItem = async (itemId: string): Promise<Review[]> => {
  const snap = await getDocs(query(
    collection(db, 'reviews'),
    where('itemId', '==', itemId),
  ));
  return snap.docs.map(mapDocToReview);
};

export const getProprietaireRatingStats = async (
  proprietaireId: string,
): Promise<{ average: number; count: number }> => {
  const reviews = await getReviewsByProprietaire(proprietaireId);
  const count = reviews.length;
  if (count === 0) return { average: 0, count: 0 };
  const average = Math.round(reviews.reduce((s, r) => s + r.rating, 0) / count * 10) / 10;
  console.log(`[getProprietaireRatingStats] uid=${proprietaireId} average=${average} count=${count}`);
  return { average, count };
};

export const getReviewsByLocataire = async (locataireId: string): Promise<Review[]> => {
  const snap = await getDocs(query(
    collection(db, 'reviews'),
    where('locataireId', '==', locataireId),
  ));
  const reviews = snap.docs.map(mapDocToReview);
  return reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getItemRatingStats = async (
  itemId: string,
): Promise<{ average: number; count: number }> => {
  const reviews = await getReviewsByItem(itemId);
  const count = reviews.length;
  if (count === 0) return { average: 0, count: 0 };
  const average = Math.round(reviews.reduce((s, r) => s + r.rating, 0) / count * 10) / 10;
  console.log(`[getItemRatingStats] item=${itemId} average=${average} count=${count}`);
  return { average, count };
};

export const getAllItemsWithRatings = async (): Promise<Item[]> => {
  const items = await getAllItems();
  const enriched = await Promise.all(
    items.map(async (item) => {
      try {
        const stats = await getItemRatingStats(item.id);
        return {
          ...item,
          averageRating: stats.count > 0 ? stats.average : undefined,
          reviewsCount: stats.count > 0 ? stats.count : undefined,
        };
      } catch {
        return item;
      }
    }),
  );
  console.log('[getAllItemsWithRatings] Items loaded with ratings:', enriched.length);
  return enriched;
};

export const getItemsByCategoryWithRatings = async (categorie: string | Categorie): Promise<Item[]> => {
  const items = await getItemsByCategory(categorie);
  const enriched = await Promise.all(
    items.map(async (item) => {
      try {
        const stats = await getItemRatingStats(item.id);
        return {
          ...item,
          averageRating: stats.count > 0 ? stats.average : undefined,
          reviewsCount: stats.count > 0 ? stats.count : undefined,
        };
      } catch {
        return item;
      }
    }),
  );
  return enriched;
};