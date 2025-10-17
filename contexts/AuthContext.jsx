// contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const Ctx = createContext({ user: null, profile: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          const p = snap.exists() ? snap.data() : null;
          setProfile(p);
          localStorage.setItem("userProfile", JSON.stringify({ id: u.uid, email: u.email, ...(p || {}) }));
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
        localStorage.removeItem("userProfile");
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = useMemo(() => ({
    user, profile, loading,
    signOut: async () => { try { await signOut(auth); } catch(e) {} }
  }), [user, profile, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() { return useContext(Ctx); }
