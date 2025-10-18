// pages/_app.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";

import { Toaster } from "react-hot-toast";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, reload } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

/** หน้า public เสมอ (เข้าได้แม้จะยังไม่ล็อกอิน/ยังไม่ verify) */
const ALWAYS_PUBLIC = new Set(["/login", "/register", "/verify-email"]);

/** หน้า public เมื่อ "ยังไม่ล็อกอิน" */
const PUBLIC_PATHS = new Set(["/login", "/register"]);

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const path = router.pathname || "";

  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState({
    uid: "",
    email: "",
    emailVerified: false,
    profile: null,
  });

  const isAlwaysPublic = useMemo(() => ALWAYS_PUBLIC.has(path), [path]);

  // ---------------------------
  // 1) โหลดสถานะผู้ใช้ + โปรไฟล์
  // ---------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        // ยังไม่ล็อกอิน
        if (!u) {
          try { localStorage.removeItem("userProfile"); } catch {}
          setSession({ uid: "", email: "", emailVerified: false, profile: null });
          return;
        }

        // รีโหลดสถานะ (กันค่า emailVerified ค้าง) + มี retry สั้นๆ
        await reload(u).catch(() => {});
        let verified = !!u.emailVerified;
        if (!verified) {
          await new Promise((r) => setTimeout(r, 1000));
          await reload(u).catch(() => {});
          verified = !!u.emailVerified;
        }

        // ดึงโปรไฟล์จาก Firestore (ถ้ามี)
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
          skipVerify: !!profile?.skipVerify, // true = ข้ามบังคับยืนยันอีเมล
        };

        try { localStorage.setItem("userProfile", JSON.stringify(mergedProfile)); } catch {}

        setSession({
          uid: u.uid,
          email: u.email || "",
          emailVerified: verified,
          profile: mergedProfile,
        });
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, []);

  // ---------------------------
  // 2) Guard เส้นทาง
  // ---------------------------
  useEffect(() => {
    if (!authReady) return;

    const u = session;
    const skipVerify = !!u?.profile?.skipVerify;

    // ยังไม่ล็อกอิน → อนุญาตเฉพาะ /login /register
    if (!u.uid) {
      if (!PUBLIC_PATHS.has(path)) router.replace("/login");
      return;
    }

    // ล็อกอินแล้วแต่ยังไม่ verify และไม่ได้ skip → อนุญาต /login /register /verify-email เท่านั้น
    if (!u.emailVerified && !skipVerify && !isAlwaysPublic) {
      const query = u.email ? `?email=${encodeURIComponent(u.email)}` : "";
      router.replace("/verify-email" + query);
      return;
    }

    // ผ่านทุกเงื่อนไข → ไม่ทำอะไร (อยู่หน้าที่ผู้ใช้ตั้งใจไป)
  }, [authReady, isAlwaysPublic, path, router, session]);

  // ---------------------------
  // Splash ระหว่างตรวจสอบสิทธิ์
  // ---------------------------
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
