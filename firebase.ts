
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// COLE SUAS CREDENCIAIS DO FIREBASE ABAIXO
const firebaseConfig = {
  apiKey: "AIzaSyAAsbbTGMHec-xmpy8IGhriYjzqrvJGKNw",
  authDomain: "ongcaovalente.firebaseapp.com",
  projectId: "ongcaovalente",
  storageBucket: "ongcaovalente.firebasestorage.app",
  messagingSenderId: "942700095098",
  appId: "1:942700095098:web:e818195e29259efe0c3dc3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
