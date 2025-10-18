// pages/verify-email.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth } from "../lib/firebase";
import { sendEmailVerification, reload } from "firebase/auth";

export default function VerifyEmail() {
  const router = useRouter();

  // เก็บอีเมลไว้ใน state (ค่าเริ่มต้นว่าง เพื่อให้ SSR/Client ตรงกัน)
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" }); // success | error | ""
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // ดึงอีเมลหลัง mount เท่านั้น (แก้ hydration mismatch)
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const qEmail = (p.get("email") || "").trim();
      if (qEmail) {
        setEmail(qEmail);
        return;
      }
      const cur = auth?.currentUser?.email || "";
      if (cur) setEmail(cur);
    } catch {
      // no-op
    }
  }, []);

  // เคาน์ดาวน์กดส่งซ้ำ
  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleResend = async () => {
    setStatus({ type: "", msg: "" });
    if (!auth.currentUser) {
      setStatus({
        type: "error",
        msg: "ยังไม่พบสถานะการเข้าสู่ระบบ โปรดเข้าสู่ระบบก่อนส่งอีเมลยืนยันอีกครั้ง",
      });
      return;
    }

    setBusy(true);
    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        setStatus({
          type: "success",
          msg: "อีเมลของคุณได้รับการยืนยันแล้ว! โปรดเข้าสู่ระบบ",
        });
        return;
      }

      await sendEmailVerification(auth.currentUser, {
        url:
          typeof window !== "undefined"
            ? `${window.location.origin}/login`
            : undefined,
        handleCodeInApp: false,
      });

      setStatus({
        type: "success",
        msg: "ส่งอีเมลยืนยันแล้ว โปรดตรวจสอบกล่องจดหมาย (รวมถึง Spam/Junk)",
      });
      setCooldown(30);
    } catch (err) {
      const code = err?.code || "";
      let msg = "ส่งอีเมลยืนยันไม่สำเร็จ";
      if (code === "auth/too-many-requests") msg = "ส่งคำขอถี่เกินไป โปรดลองใหม่ภายหลัง";
      setStatus({ type: "error", msg });
    } finally {
      setBusy(false);
    }
  };

  const goLogin = () => router.push("/login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="text-green-600 dark:text-green-400"
                fill="currentColor"
              >
                <path d="M20 4H4a2 2 0 0 0-2 2v.4l10 5.6 10-5.6V6a2 2 0 0 0-2-2Zm0 4.75-8.6 4.82a1 1 0 0 1-.98 0L2 8.75V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8.75Z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
            ต้องยืนยันอีเมลก่อนเข้าสู่ระบบ
          </h1>

          <p className="text-gray-700 dark:text-gray-300 text-center mt-2">
            เราได้ส่งลิงก์ยืนยันไปที่{" "}
            <span className="font-medium break-all text-gray-900 dark:text-gray-100">
              {email || "(อีเมลของคุณ)"} {/* ค่าเริ่มต้นจะเป็น placeholder เหมือน SSR */}
            </span>
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-center mt-1">
            หากไม่พบอีเมล โปรดตรวจโฟลเดอร์ <span className="font-medium">Spam/Junk</span>
          </p>

          {/* Status */}
          {status.msg && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                status.type === "success"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
              }`}
            >
              {status.msg}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleResend}
              disabled={busy || cooldown > 0}
              className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white transition"
            >
              {busy
                ? "กำลังส่ง..."
                : cooldown > 0
                ? `ส่งอีกครั้งได้ใน ${cooldown}s`
                : "ส่งอีเมลยืนยันอีกครั้ง"}
            </button>

            <button
              onClick={goLogin}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              ไปหน้าเข้าสู่ระบบ
            </button>
          </div>

          {/* Tips */}
          <div className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            <ul className="list-disc pl-5 space-y-1">
              <li>อีเมลจากระบบอาจใช้เวลาส่ง 1–2 นาที</li>
              <li>หากยืนยันแล้ว กลับมาที่หน้านี้แล้วกด “ไปหน้าเข้าสู่ระบบ”</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
