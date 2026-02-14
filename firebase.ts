
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// O Firebase é GRATUITO no plano Spark. 
// Se você não quiser usar, o app continuará funcionando salvando tudo no seu navegador (LocalStorage).
const firebaseConfig = {
  apiKey: "AIzaSyAAsbbTGMHec-xmpy8IGhriYjzqrvJGKNw",
  authDomain: "ongcaovalente.firebaseapp.com",
  projectId: "ongcaovalente",
  storageBucket: "ongcaovalente.firebasestorage.app",
  messagingSenderId: "942700095098",
  appId: "1:942700095098:web:e818195e29259efe0c3dc3"
};

let db: any = null;

try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  console.log("☁️ Firebase pronto para sincronização (Plano Gratuito Spark)");
} catch (e) {
  console.warn("⚠️ Firebase não configurado ou offline. Usando banco de dados local do navegador.");
}

export { db };
