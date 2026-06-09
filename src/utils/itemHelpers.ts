import { Item } from '../types';
import { MockItem } from '../data/mockItems';

export function toMockItem(item: Item): MockItem {
  return {
    id: item.id,
    titre: item.titre,
    categorie: item.categorie.toLowerCase(),
    ville: item.ville,
    prixParJour: item.prixParJour,
    disponible: item.actif,
    distance: 0,
    images: (item.images && item.images.length > 0) ? item.images : (item.photoUrl ? [item.photoUrl] : []),
    note: 0,
    avis: 0,
    proprietaire: item.proprietaire ?? { nom: 'Propriétaire', initiales: '?' },
    proprietaireId: item.proprietaireId ?? item.ownerId,
    description: item.description,
    periodeMin: item.periodeMin,
  };
}
