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
  Timestamp,
  serverTimestamp,
  QueryDocumentSnapshot as QDS,
  DocumentSnapshot as DS,
} from 'firebase/firestore';
import { db, storage } from '../config/firebase.config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Item, Rental, CreateRentalData, Categorie, StatutDemande, User } from '../types';

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
 */
export const getItemsByOwner = async (ownerId: string): Promise<Item[]> => {
  try {
    const q = query(
      collection(db, 'items'),
      where('ownerId', '==', ownerId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDocToItem);
  } catch (error) {
    console.error('Erreur getItemsByOwner:', error);
    return [];
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
 */
export const getRentalsByProprietaire = async (uid: string): Promise<RentalData[]> => {
  try {
    const q = query(collection(db, 'rentals'), where('proprietaireId', '==', uid));
    const snapshot = await getDocs(q);
    const rentals = snapshot.docs.map(mapRentalDoc);
    rentals.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    return rentals;
  } catch (error) {
    console.error('Erreur getRentalsByProprietaire:', error);
    return [];
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
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      email: data.email ?? '',
      nom: data.nom ?? '',
      prenom: data.prenom ?? '',
      telephone: data.telephone ?? '',
      ville: data.ville ?? '',
      photoUrl: data.photoUrl,
      dateInscription: data.dateInscription instanceof Timestamp
        ? data.dateInscription.toDate()
        : new Date(data.dateInscription ?? Date.now()),
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