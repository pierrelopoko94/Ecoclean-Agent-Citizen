import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

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
  if (auth.authStateReady) {
    try {
      await auth.authStateReady();
    } catch {
      // Ignore authStateReady error if any
    }
  }

  const currentUser = auth.currentUser;
  console.log("USER:", currentUser);

  if (!currentUser) {
    console.warn("USER: null - aucun utilisateur Firebase connecté");
    return null;
  }

  try {
    const token = await currentUser.getIdToken(true);
    console.log("TOKEN FIREBASE OBTENU:", token ? "OK" : "ABSENT");
    return token;
  } catch (error) {
    console.error('Error getting Firebase Token:', error);
    return null;
  }
}

