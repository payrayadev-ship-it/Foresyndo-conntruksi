import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const databaseId = (firebaseConfig as any).firestoreDatabaseId || undefined;
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);
export const auth = getAuth();
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Validate Connection as per CRITICAL CONSTRAINT in firebase-skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Connection Active");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client is offline. Running with offline data synchronization fallback.");
    }
  }
}

testConnection();
