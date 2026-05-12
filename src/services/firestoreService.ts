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
import { db } from '../config/firebase.config';
import { Item, Rental, CreateItemData, CreateRentalData, Categorie, StatutDemande } from '../types';

/**
 * GESTION DES OBJETS (ITEMS)
 */

/**
 * Publier un nouvel objet
 */
export const createItem = async (
  data: CreateItemData,
  ownerId: string
): Promise<string> => {
  try {
    const newItem = {
      titre: data.titre,
      description: data.description,
      categorie: data.categorie,
      prixParJour: data.prixParJour,
      ville: data.ville,
      photoUrl: data.photo, // On gérera l'upload d'image plus tard
      ownerId: ownerId,
      actif: true,
      datePublication: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'items'), newItem);
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