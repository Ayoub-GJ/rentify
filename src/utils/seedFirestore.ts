import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { MOCK_ITEMS } from '../data/mockItems';

export async function seedItems(): Promise<void> {
  const itemsRef = collection(db, 'items');

  for (const mock of MOCK_ITEMS.slice(0, 8)) {
    await setDoc(doc(itemsRef, mock.id), {
      titre: mock.titre,
      description: mock.description ?? '',
      categorie: mock.categorie,
      prixParJour: mock.prixParJour,
      ville: mock.ville,
      disponible: mock.disponible,
      images: mock.images,
      note: mock.note,
      avis: mock.avis,
      proprietaire: mock.proprietaire,
      datePublication: serverTimestamp(),
    });
    console.log(`[seed] ✓ ${mock.titre}`);
  }

  console.log('[seed] 8 items ajoutés dans Firestore.');
}
