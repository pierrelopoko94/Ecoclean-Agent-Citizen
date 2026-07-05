import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBo5DcEwP8NWdh-lT2geo4SsV_ygIVsNrk",
  authDomain: "naturecollection-de6e29fe.firebaseapp.com",
  projectId: "naturecollection-de6e29fe",
  storageBucket: "naturecollection-de6e29fe.firebasestorage.app",
  messagingSenderId: "112438083090",
  appId: "1:112438083090:web:52cbea5b7e7b67accfe2cb"
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

  if (!currentUser) {
    return null;
  }

  try {
    const token = await currentUser.getIdToken(true);
    return token;
  } catch (error) {
    console.error('Error getting Firebase Token:', error);
    return null;
  }
}

