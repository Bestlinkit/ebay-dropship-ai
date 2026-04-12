import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

    const GLOBAL_AUTH_VERSION = 'ebay_ds_v1.0.4';

    useEffect(() => {
        const safetyTimeout = setTimeout(() => {
            if (loading) setLoading(false);
        }, 3500); 

        const storedVersion = localStorage.getItem('ebay_ds_auth_v');
        if (storedVersion !== GLOBAL_AUTH_VERSION) {
            signOut(auth).then(() => {
                localStorage.clear();
                localStorage.setItem('ebay_ds_auth_v', GLOBAL_AUTH_VERSION);
                window.location.reload();
            });
            return;
        }

        let unsubscribeDoc = null;
        const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
            setUser(authUser);
            
            if (authUser) {
                const docRef = doc(db, 'users', authUser.uid);
                
                // Self-Healing Identity Bridge: Sync .env token to Firestore if missing
                const envToken = import.meta.env.VITE_EBAY_USER_TOKEN;
                if (envToken && envToken !== 'YOUR_EBAY_USER_TOKEN') {
                    try {
                        const { updateDoc, getDoc } = await import('firebase/firestore');
                        const docSnap = await getDoc(docRef);
                        if (!docSnap.exists() || !docSnap.data().ebayToken) {
                            await updateDoc(docRef, { 
                                ebayToken: envToken,
                                ebay_linked_at: new Date().toISOString(),
                                system_bridge: true
                            });
                            console.log("[Identity Sync] Production Bridge Established.");
                        }
                    } catch (e) {
                        console.error("[Identity Sync] Bridge Failed:", e);
                    }
                }

                unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser(prev => ({ ...prev, ...docSnap.data() }));
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const value = {
    user: user ? {
        ...user,
        ebayToken: user?.ebayToken || import.meta.env.VITE_EBAY_USER_TOKEN
    } : null,
    signup,
    login,
    logout,
    loginWithGoogle,
    loading,
    isStoreConnected: !!import.meta.env.VITE_EBAY_USER_TOKEN || !!user?.ebayToken || !!user?.ebay_auth_token
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-slate-400 text-sm font-medium animate-pulse">Initializing Dropship AI...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
