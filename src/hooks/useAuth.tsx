import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ADMIN_UID } from '../config';
import { auth, db } from '../firebase';
import type { AppUser, Role } from '../types';

interface AuthContextValue {
  firebaseUser: User | null;
  appUser: AppUser | null;
  role: Role | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setAppUser(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef).catch(() => null);
      if (user.uid === ADMIN_UID && !snap?.exists()) {
        const adminDoc = {
          uid: user.uid,
          id: user.uid,
          name: 'مدير النظام',
          email: user.email || '',
          role: 'admin' as Role,
          active: true,
          createdAt: serverTimestamp()
        };
        await setDoc(userRef, adminDoc, { merge: true }).catch(() => undefined);
        setAppUser(adminDoc as AppUser);
      } else if (snap?.exists()) {
        setAppUser({ id: snap.id, ...snap.data() } as AppUser);
      } else {
        setAppUser({ id: user.uid, uid: user.uid, name: user.email || 'مستخدم', email: user.email || '', role: 'doctor', active: false });
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    firebaseUser,
    appUser,
    role: appUser?.role || (firebaseUser?.uid === ADMIN_UID ? 'admin' : null),
    loading,
    login: async (email, password) => { await signInWithEmailAndPassword(auth, email, password); },
    logout: async () => { await signOut(auth); },
    isAdmin: firebaseUser?.uid === ADMIN_UID || appUser?.role === 'admin',
    isStaff: Boolean(firebaseUser && (firebaseUser.uid === ADMIN_UID || ['admin', 'reception', 'doctor'].includes(appUser?.role || '')))
  }), [firebaseUser, appUser, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
