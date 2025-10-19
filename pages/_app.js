// pages/_app.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";
import { Toaster } from "react-hot-toast";
import { auth, db } from "../lib/firebase";
import { onIdTokenChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

/** หน้า public เสมอ */
const ALWAYS_PUBLIC = new Set(["/login", "/register", "/verify-email"]);
/** หน้า public เฉพาะ “ยังไม่ล็อกอิน” */
const PUBLIC_WHEN_SIGNED_OUT = new Set(["/login", "/register"]);

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const path = router.pathname || "";

  const [authReady, setAuthReady] = useState(false);
  const [optimisticAllow, setOptimisticAllow] = useState(false); // ให้ผ่านชั่วคราว 1 ช่วงหลังล็อกอิน
  const [session, setSession] = useState({
    uid: "",
    email: "",
    emailVerified: false,
    profile: null,
  });

  const isAlwaysPublic = useMemo(() => ALWAYS_PUBLIC.has(path), [path]);

  // เปิดโหมด optimistic ถ้าเจอธงที่ตั้งจากหน้า login
  useEffect(() => {
    const just = typeof window !== "undefined" && sessionStorage.getItem("justLoggedIn") === "1";
    if (just) setOptimisticAllow(true);
  }, []);

  // ฟังการเปลี่ยนแปลงของ token/auth (ครอบคลุม login/logout/verify)
  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (u) => {
      try {
        if (!u) {
          try { localStorage.removeItem("userProfile"); } catch {}
          setSession({ uid: "", email: "", emailVerified: false, profile: null });
          setAuthReady(true);
          setOptimisticAllow(false); // ไม่มีผู้ใช้แล้วไม่ต้อง optimistic
          return;
        }

        // ดึงโปรไฟล์ Firestore
        let profile = null;
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) profile = snap.data();
        } catch {}

        const merged = {
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
        try { localStorage.setItem("userProfile", JSON.stringify(merged)); } catch {}

        setSession({
          uid: u.uid,
          email: u.email || "",
          emailVerified: !!u.emailVerified,
          profile: merged,
        });
      } finally {
        setAuthReady(true);
        // ถ้าเราอยู่ในโหมด optimistic ให้ปิดหลังจาก auth พร้อมแล้ว 1 ครั้ง
        if (optimisticAllow) {
          setOptimisticAllow(false);
          try { sessionStorage.removeItem("justLoggedIn"); } catch {}
        }
      }
    });
    return () => unsub();
  }, [optimisticAllow]);

  // Guard เส้นทาง
  useEffect(() => {
    if (!authReady) return;

    // ช่วง optimistic: อนุญาตไปก่อน ไม่ redirect / ไม่โชว์สปลัช
    if (optimisticAllow) return;

    const u = session;
    const skipVerify = !!u?.profile?.skipVerify;

    // ยังไม่ล็อกอิน → เข้าหน้าอื่นไม่ได้
    if (!u.uid) {
      if (!PUBLIC_WHEN_SIGNED_OUT.has(path)) router.replace("/login");
      return;
    }

    // ล็อกอินแล้ว แต่ยังไม่ได้ verify และไม่ได้ skip → ห้ามเข้าเพจที่ไม่ public
    if (!u.emailVerified && !skipVerify && !isAlwaysPublic) {
      const q = u.email ? `?email=${encodeURIComponent(u.email)}` : "";
      router.replace("/verify-email" + q);
      return;
    }

    // อื่น ๆ ผ่าน
  }, [authReady, isAlwaysPublic, path, router, session, optimisticAllow]);

  // Splash เฉพาะตอนเริ่ม (ยกเว้นกำลังใช้โหมด optimistic)
  if (!authReady && !optimisticAllow) {
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
