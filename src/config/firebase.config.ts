import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "AIzaSyCCl7kfaCpuj4hdrR1Uh9kq7lM4nn__J5U",
  authDomain: "rentify-app-67083.firebaseapp.com",
  projectId: "rentify-app-67083",
  storageBucket: "rentify-app-67083.firebasestorage.app",
  messagingSenderId: "1072638859123",
  appId: "1:1072638859123:web:a84c170960d172993bd706"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exporter les services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);