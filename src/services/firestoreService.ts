import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  QueryDocumentSnapshot as QDS,
  DocumentSnapshot as DS,
} from 'firebase/firestore';
import { db, storage } from '../config/firebase.config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Item, Rental, CreateRentalData, Categorie, StatutDemande, User, Message } from '../types';

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
  createdAt?: Date;
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
export const getReceivedRentals = async (ownerId: string): Promise<Rental[]> => {
  try {
    const q = query(
      collection(db, 'rentals'),
      where('ownerId', '==', ownerId),
      orderBy('dateCreation', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        itemId: data.itemId,
        renterId: data.renterId,
        ownerId: data.ownerId,
        dateDebut: data.dateDebut.toDate(),
        dateFin: data.dateFin.toDate(),
        prixTotal: data.prixTotal,
        statut: data.statut as StatutDemande,
        dateCreation: data.dateCreation.toDate(),
      };
    });
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
 * Soft-delete : désactive l'annonce sans la supprimer (actif + disponible = false)
 */
export const softDeleteItem = async (itemId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'items', itemId), { actif: false, disponible: false });
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
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
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
 * Compter les demandes PENDING reçues sur un item
 */
export const countPendingRentalsForItem = async (itemId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'rentals'),
      where('itemId', '==', itemId),
      where('statut', '==', StatutDemande.PENDING),
    );
    const snap = await getDocs(q);
    return snap.size;
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

    return {
      itemsCount: items.length,
      rentalsCount: rentalsLocSnap.size,
      earningsTotal,
      averageRating: 0,
      reviewsCount: 0,
    };
  } catch (error) {
    console.error('Erreur getUserStats:', error);
    return { itemsCount: 0, rentalsCount: 0, earningsTotal: 0, averageRating: 0, reviewsCount: 0 };
  }
};

/**
 * Envoie un message dans une conversation et met à jour le lastMessage.
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  texte: string
): Promise<void> => {
  try {
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      senderId,
      texte,
      createdAt: serverTimestamp(),
      lu: false,
    });
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: texte,
      lastMessageAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur sendMessage:', error);
    throw error;
  }
};