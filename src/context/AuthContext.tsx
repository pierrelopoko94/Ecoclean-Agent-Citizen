import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  updateProfile,
  signInWithRedirect
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { UserProfile } from '../types';
import { apiService, APIError } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (firebaseUser: User) => {
    try {
      setError(null);
      await firebaseUser.getIdToken(true);

      let userProfile: UserProfile | null = null;
      let lastError: any = null;
      const maxRetries = 2;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          userProfile = await apiService.getCurrentUser();
          break;
        } catch (err: any) {
          lastError = err;
          // Si 403 (pas encore synchronisé), réessaie après 1.5s
          if (err instanceof APIError && err.status === 403 && attempt < maxRetries) {
            await new Promise(res => setTimeout(res, 1500));
            await firebaseUser.getIdToken(true);
            continue;
          }
          // Si 401, rafraîchir le token et réessayer
          if (err instanceof APIError && err.status === 401 && attempt === 1) {
            await firebaseUser.getIdToken(true);
            continue;
          }
          throw err;
        }
      }

      if (userProfile) {
        setProfile(userProfile);
      } else if (lastError) {
        throw lastError;
      }
    } catch (err: any) {
      console.warn('[AuthContext] Backend profile unavailable, using local profile fallback:', err?.message || err);

      if (err instanceof APIError && err.status === 404) {
        setError("Compte non trouvé, veuillez vous réinscrire");
        setProfile(null);
      } else {
        const fallbackProfile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'Citoyen EcoClean',
          role: 'CITIZEN',
          points: 0,
          badge: 'Éco-Recrue',
          agentRequestStatus: 'NONE'
        };
        setProfile(fallbackProfile);
        setError(null);
      }
    }
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await fetchProfile(auth.currentUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
        setError(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      setError(null);
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (popupError: any) {
        if (popupError.code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, googleProvider);
        } else if (popupError.code === 'auth/unauthorized-domain') {
          console.error("[Firebase Auth] Domaine non autorisé dans la console Firebase:", window.location.hostname);
          throw new Error(`Ce domaine (${window.location.hostname}) n'est pas autorisé pour Google Auth. Utilisez la connexion par e-mail ou ajoutez ce domaine dans la console Firebase.`);
        } else {
          throw popupError;
        }
      }
    } catch (err: any) {
      setError(err.message || 'La connexion avec Google a échoué.');
      setLoading(false);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'La connexion par e-mail a échoué.');
      setLoading(false);
      throw err;
    }
  };

  const registerWithEmail = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
    } catch (err: any) {
      setError(err.message || "L'inscription a échoué.");
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'La déconnexion a échoué.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      error,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
