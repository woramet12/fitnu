// pages/_app.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";
import { Toaster } from "react-hot-toast";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, reload } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

/** หน้า public เสมอ (ให้เข้าได้แม้จะล็อกอิน/ยังไม่ verify) */
const ALWAYS_PUBLIC = new Set(["/login", "/register", "/verify-email"]);

/** หน้า public เฉพาะ “ยังไม่ล็อกอิน” (ไม่จำเป็นแล้ว แต่เก็บไว้เผื่อใช้) */
const PUBLIC_PATHS = new Set(["/login", "/register"]);

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState({
    uid: "",
    email: "",
    emailVerified: false,
    profile: null,
  });

  const path = router.pathname || "";
  const isAlwaysPublic = useMemo(() => ALWAYS_PUBLIC.has(path), [path]);

  // โหลดสถานะผู้ใช้ + โปรไฟล์
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          localStorage.removeItem("userProfile");
          setSession({ uid: "", email: "", emailVerified: false, profile: null });
          return;
        }

        await reload(u).catch(() => {});
        let profile = null;
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) profile = snap.data();
        } catch {}

        const mergedProfile = {
          id: u.uid,
          name: profile?.name || u.displayName || "",
          year: profile?.year || "ปี 1",
          interest: profile?.interest || "",
          bio: profile?.bio || "",
          avatar: profile?.avatar || u.photoURL || "",
          email: u.email || "",
          created_at: profile?.created_at || "",
          skipVerify: !!profile?.skipVerify,
        };
        try { localStorage.setItem("userProfile", JSON.stringify(mergedProfile)); } catch {}

        setSession({
          uid: u.uid,
          email: u.email || "",
          emailVerified: !!u.emailVerified,
          profile: mergedProfile,
        });
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  // Guard เส้นทาง
  useEffect(() => {
    if (!authReady) return;

    const u = session;
    const skipVerify = !!u?.profile?.skipVerify;

    // 1) ยังไม่ล็อกอิน → อนุญาตเฉพาะ /login /register
    if (!u.uid) {
      if (!PUBLIC_PATHS.has(path)) router.replace("/login");
      return;
    }

    // 2) ล็อกอินแล้วแต่ยังไม่ยืนยัน (และไม่ได้ skip) →
    //    อนุญาต /login /register /verify-email เสมอ
    //    ถ้าจะไปหน้าอื่น ให้บังคับไป /verify-email
    if (!u.emailVerified && !skipVerify && !ALWAYS_PUBLIC.has(path)) {
      const query = u.email ? `?email=${encodeURIComponent(u.email)}` : "";
      router.replace("/verify-email" + query);
      return;
    }

    // 3) verified หรือ skipVerify → ผ่าน
  }, [authReady, path, router, session]);

  if (!authReady) {
    return (
      <>
        <Toaster position="top-center" />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-gray-700 dark:text-gray-200">กำลังตรวจสอบสิทธิ์...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <Component {...pageProps} />
    </>
  );
}
