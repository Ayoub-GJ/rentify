export interface MockItem {
  id: string;
  titre: string;
  categorie: string;
  ville: string;
  prixParJour: number;
  disponible: boolean;
  images: string[];
  note: number;
  avis: number;
  description?: string;
}

export const MOCK_ITEMS: MockItem[] = [
  {
    id: '1',
    titre: 'Perceuse Bosch GSB 18V',
    categorie: 'outils',
    ville: 'Agadir',
    prixParJour: 25,
    disponible: true,
    images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400'],
    note: 4.9,
    avis: 32,
    description: 'Perceuse sans fil Bosch GSB 18V, livrée avec 2 batteries et chargeur. Mandrin auto-serrant 13mm, couple maximal 75 Nm. Idéale pour perçage bois, métal et béton léger. État impeccable, entretenue après chaque utilisation.',
  },
  {
    id: '2',
    titre: 'Appareil Photo Sony A7 III',
    categorie: 'photo',
    ville: 'Agadir',
    prixParJour: 80,
    disponible: true,
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400'],
    note: 4.8,
    avis: 18,
    description: 'Sony Alpha A7 III full-frame 24 MP avec objectif 28-70mm. Autofocus rapide, stabilisation 5 axes, vidéo 4K. Parfait pour mariages, portraits et paysages. Livré avec batterie supplémentaire et carte SD 64 Go.',
  },
  {
    id: '3',
    titre: 'Vélo VTT Trek Marlin',
    categorie: 'sport',
    ville: 'Agadir',
    prixParJour: 35,
    disponible: true,
    images: ['https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400'],
    note: 4.7,
    avis: 24,
    description: 'Trek Marlin 7, cadre aluminium taille M, fourche suspendue 100mm. Freins hydrauliques Shimano, 24 vitesses. Idéal pour les pistes autour d\'Agadir et Imourane. Casque inclus sur demande.',
  },
  {
    id: '4',
    titre: 'Tondeuse Bosch Rotak',
    categorie: 'jardinage',
    ville: 'Agadir',
    prixParJour: 20,
    disponible: true,
    images: ['https://images.unsplash.com/photo-1589923158776-cb4485d99fd6?w=400'],
    note: 4.6,
    avis: 11,
    description: 'Tondeuse électrique Bosch Rotak 43, largeur de coupe 43 cm, bac collecteur 50 L. Hauteur de coupe réglable 6 positions de 20 à 70 mm. Moteur 1800W silencieux. Parfaite pour jardins jusqu\'à 500 m².',
  },
  {
    id: '5',
    titre: 'MacBook Pro 14" M3',
    categorie: 'informatique',
    ville: 'Agadir',
    prixParJour: 120,
    disponible: true,
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'],
    note: 5.0,
    avis: 7,
    description: 'MacBook Pro 14" puce M3, 16 Go RAM, 512 Go SSD. Écran Liquid Retina XDR 3024x1964, autonomie 18h. Idéal pour montage vidéo, développement et design. Livré avec chargeur MagSafe et câble USB-C.',
  },
  {
    id: '6',
    titre: 'Tente Camping Quechua',
    categorie: 'sport',
    ville: 'Agadir',
    prixParJour: 30,
    disponible: true,
    images: ['https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=400'],
    note: 4.5,
    avis: 15,
    description: 'Tente Quechua 4 places, montage 2 secondes, imperméabilité 2000mm. Double toit, sas d\'entrée, 2 portes. Poids 6.2 kg, sac de transport inclus. Testée dans les conditions du Souss. Idéale pour familles.',
  },
  {
    id: '7',
    titre: 'Sono JBL Xtreme 3',
    categorie: 'evenement',
    ville: 'Agadir',
    prixParJour: 45,
    disponible: true,
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400'],
    note: 4.8,
    avis: 29,
    description: 'JBL Xtreme 3, puissance 100W, autonomie 15h. Waterproof IPX7, Bluetooth 5.1, prise de charge USB-C. Idéale pour fêtes, pique-niques et événements en plein air. Son puissant avec basses profondes.',
  },
  {
    id: '8',
    titre: 'Karcher Nettoyeur HP',
    categorie: 'maison',
    ville: 'Agadir',
    prixParJour: 40,
    disponible: true,
    images: ['https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400'],
    note: 4.4,
    avis: 8,
    description: 'Karcher K5 Full Control, pression 145 bars, débit 500 L/h. Lance vario et turbo incluses. Parfait pour terrasses, voitures, façades et clôtures. Câble 8m et tuyau haute pression 8m pour une grande liberté de mouvement.',
  },
];
