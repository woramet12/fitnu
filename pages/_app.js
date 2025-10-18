// pages/_app.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";
import { Toaster } from "react-hot-toast";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, reload } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

/** อนุญาตเฉพาะ 2 เพจนี้เมื่อ "ยังไม่ล็อกอิน" */
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

  const isPublic = useMemo(() => PUBLIC_PATHS.has(router.pathname || ""), [router.pathname]);

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
          skipVerify: !!profile?.skipVerify, // ถ้ามี true จะข้ามการบังคับยืนยันเมล
        };
        localStorage.setItem("userProfile", JSON.stringify(mergedProfile));

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

  // Guard
  useEffect(() => {
    if (!authReady) return;

    const u = session;
    const skipVerify = !!u?.profile?.skipVerify;

    // ยังไม่ล็อกอิน → ไปได้เฉพาะ /login และ /register
    if (!u.uid) {
      if (!isPublic) router.replace("/login");
      return;
    }

    // ล็อกอินแล้วแต่ยังไม่ยืนยัน (และไม่ได้ skip) → บังคับไป /verify-email
    if (!u.emailVerified && !skipVerify && router.pathname !== "/verify-email") {
      const query = u.email ? `?email=${encodeURIComponent(u.email)}` : "";
      router.replace("/verify-email" + query);
      return;
    }
    // verified หรือ skipVerify → ผ่าน
  }, [authReady, isPublic, router, session]);

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
