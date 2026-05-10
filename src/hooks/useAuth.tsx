import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { ADMIN_UID, auth, db } from '../firebase/config';
import type { UserRole } from '../types';

interface Profile {
  uid: string;
  role: UserRole;
  displayName?: string;
  assignedDoctorId?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      if (unsubscribeProfile) unsubscribeProfile();
      setUser(nextUser);
      setLoading(true);

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      if (nextUser.uid === ADMIN_UID) {
        setProfile({ uid: nextUser.uid, role: 'admin', displayName: nextUser.email || 'Admin' });
        setLoading(false);
      }

      unsubscribeProfile = onSnapshot(doc(db, 'users', nextUser.uid), (snap) => {
        if (nextUser.uid === ADMIN_UID && !snap.exists()) {
          setProfile({ uid: nextUser.uid, role: 'admin', displayName: nextUser.email || 'Admin' });
          setLoading(false);
          return;
        }
        if (snap.exists()) {
          const data = snap.data() as Omit<Profile, 'uid'>;
          setProfile({ uid: nextUser.uid, ...data });
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
    });

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeAuth();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    loading,
    isAdmin: user?.uid === ADMIN_UID || profile?.role === 'admin',
    login: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    logout: async () => {
      await signOut(auth);
    }
  }), [user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
