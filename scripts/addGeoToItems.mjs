/**
 * One-shot migration : ajoute lat/lng (autour d'Agadir) aux items qui n'en ont pas.
 *
 * Usage :
 *   RENTIFY_EMAIL=xxx@xxx.com RENTIFY_PASSWORD=xxx node scripts/addGeoToItems.mjs
 *
 * Le script s'authentifie avec un compte Firebase existant, lit la collection
 * `items`, et met à jour uniquement les documents sans champs latitude/longitude.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';

// ── Config (identique à firebase.config.ts) ──────────────────────────────────

const firebaseConfig = {
  apiKey: 'AIzaSyCCl7kfaCpuj4hdrR1Uh9kq7lM4nn__J5U',
  authDomain: 'rentify-app-67083.firebaseapp.com',
  projectId: 'rentify-app-67083',
  storageBucket: 'rentify-app-67083.firebasestorage.app',
  messagingSenderId: '1072638859123',
  appId: '1:1072638859123:web:a84c170960d172993bd706',
};

// ── Coordonnées Agadir ────────────────────────────────────────────────────────

const AGADIR_LAT = 30.42;
const AGADIR_LNG = -9.59;

function randomAgadirCoords() {
  return {
    latitude:  AGADIR_LAT + Math.random() * 0.02,
    longitude: AGADIR_LNG + Math.random() * 0.02,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

const email    = process.env.RENTIFY_EMAIL;
const password = process.env.RENTIFY_PASSWORD;

if (!email || !password) {
  console.error(
    'Erreur : variables manquantes.\n' +
    'Usage : RENTIFY_EMAIL=... RENTIFY_PASSWORD=... node scripts/addGeoToItems.mjs',
  );
  process.exit(1);
}

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

console.log(`Connexion avec ${email}…`);
await signInWithEmailAndPassword(auth, email, password);
console.log('Authentifié ✓\n');

const snapshot = await getDocs(collection(db, 'items'));
console.log(`${snapshot.size} items trouvés dans Firestore.`);

let updated = 0;
let skipped = 0;

for (const snap of snapshot.docs) {
  const data = snap.data();

  if (data.latitude != null && data.longitude != null) {
    skipped++;
    continue;
  }

  const coords = randomAgadirCoords();
  await updateDoc(doc(db, 'items', snap.id), coords);
  console.log(`  ✓ ${snap.id.slice(0, 8)}… "${data.titre}" → lat ${coords.latitude.toFixed(5)}, lng ${coords.longitude.toFixed(5)}`);
  updated++;
}

console.log(`\nTerminé : ${updated} mis à jour, ${skipped} ignorés (déjà géolocalisés).`);
process.exit(0);
