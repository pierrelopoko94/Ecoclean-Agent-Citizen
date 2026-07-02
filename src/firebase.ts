import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';

const firebaseConfig = {
  projectId: "inspiring-rex-ls7sz",
  appId: "1:36628423235:web:55d428a9f96d7464de6af6",
  apiKey: "AIzaSyD_0hyZ8t4vtNWVM4-Scv14ZZoUg3BZc-0",
  authDomain: "inspiring-rex-ls7sz.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-35c964f2-e198-46eb-8850-3a218edec2cf",
  storageBucket: "inspiring-rex-ls7sz.firebasestorage.app",
  messagingSenderId: "36628423235"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function getFirebaseToken(): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  try {
    return await currentUser.getIdToken(true);
  } catch (error) {
    console.error('Error getting Firebase Token:', error);
    return null;
  }
}
