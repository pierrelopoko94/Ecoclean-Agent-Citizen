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
      // Attempt to get profile from EcoClean backend
      const userProfile = await apiService.getCurrentUser();
      setProfile(userProfile);
    } catch (err: any) {
      console.error('Failed to fetch backend profile:', err);
      
      // If server could not be reached, build a fallback profile for instant UI responsiveness
      // But keep the error so we can notify the user gently in a banner.
      const fallbackProfile: UserProfile = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Citoyen EcoClean',
        role: 'CITIZEN', // Default fallback
        points: 0,
        badge: 'Éco-Recrue',
        agentRequestStatus: 'NONE'
      };
      setProfile(fallbackProfile);
      setError(err.message || "Erreur de connexion avec le serveur.");
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
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
      // In iframes, signInWithPopup can fail or get blocked by browsers. 
      // We fall back or handle it nicely.
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (popupError: any) {
        if (popupError.code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, googleProvider);
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
      // Set display name in Firebase Auth
      await updateProfile(userCredential.user, { displayName: name });
      
      // Wait a moment for Firebase auth to propagate, then sync with backend
      try {
        await apiService.createProfile();
      } catch (backendErr) {
        console.error('Failed to create backend profile during registration:', backendErr);
      }
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
