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
} from 'firebase/firestore';
import { db, storage } from '../config/firebase.config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Item, Rental, CreateRentalData, Categorie, StatutDemande } from '../types';

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
  data: CreateRentalData,
  renterId: string,
  ownerId: string
): Promise<string> => {
  try {
    // Calculer le nombre de jours
    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.ceil(
      (data.dateFin.getTime() - data.dateDebut.getTime()) / msPerDay
    );

    // Récupérer le prix de l'objet
    const itemDoc = await getDoc(doc(db, 'items', data.itemId));
    if (!itemDoc.exists()) {
      throw new Error('Objet introuvable');
    }

    const itemData = itemDoc.data();
    const prixTotal = itemData.prixParJour * days;

    const newRental = {
      itemId: data.itemId,
      renterId: renterId,
      ownerId: ownerId,
      dateDebut: Timestamp.fromDate(data.dateDebut),
      dateFin: Timestamp.fromDate(data.dateFin),
      prixTotal: prixTotal,
      statut: StatutDemande.PENDING,
      dateCreation: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'rentals'), newRental);
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
  return {
    id: docSnap.id,
    titre: data.titre,
    description: data.description ?? '',
    categorie: data.categorie as Categorie,
    prixParJour: data.prixParJour,
    ville: data.ville,
    // seed stocke images[] ; les futurs items stockeront photoUrl
    photoUrl: data.photoUrl ?? data.images?.[0] ?? '',
    // seed stocke ownerId absent ; les futurs items l'auront
    ownerId: data.ownerId ?? '',
    // seed stocke "disponible" ; les futurs items stockeront "actif"
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