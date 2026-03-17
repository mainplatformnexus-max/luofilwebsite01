import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, phone: string, email: string, password: string) => Promise<boolean>;
  googleLogin: () => Promise<{ ok: boolean; needsPhone: boolean }>;
  savePhone: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const ADMIN_EMAIL = "mainplatform.nexus@gmail.com";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const profileRef = doc(db, "users", fbUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setUser({
            id: fbUser.uid,
            name: data.name || fbUser.displayName || "",
            email: data.email || fbUser.email || "",
            phone: data.phone || "",
            avatar: data.avatar || fbUser.photoURL || undefined,
          });
        } else {
          setUser({
            id: fbUser.uid,
            name: fbUser.displayName || "",
            email: fbUser.email || "",
            phone: "",
            avatar: fbUser.photoURL || undefined,
          });
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (name: string, phone: string, email: string, password: string): Promise<boolean> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        email,
        phone,
        createdAt: new Date().toISOString(),
      });
      return true;
    } catch {
      return false;
    }
  };

  const googleLogin = async (): Promise<{ ok: boolean; needsPhone: boolean }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const profileRef = doc(db, "users", fbUser.uid);
      const profileSnap = await getDoc(profileRef);
      if (!profileSnap.exists()) {
        await setDoc(profileRef, {
          name: fbUser.displayName || "",
          email: fbUser.email || "",
          phone: "",
          avatar: fbUser.photoURL || "",
          createdAt: new Date().toISOString(),
        });
        return { ok: true, needsPhone: true };
      }
      const data = profileSnap.data();
      const needsPhone = !data.phone;
      return { ok: true, needsPhone };
    } catch {
      return { ok: false, needsPhone: false };
    }
  };

  const savePhone = async (phone: string): Promise<void> => {
    if (!firebaseUser) return;
    const profileRef = doc(db, "users", firebaseUser.uid);
    await updateDoc(profileRef, { phone });
    setUser((prev) => prev ? { ...prev, phone } : prev);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, signup, googleLogin, savePhone, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
