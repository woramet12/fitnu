import { useState } from "react";
import { useRouter } from "next/router";
import { signInWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);

    try {
      const email = form.email.trim();
      const cred = await signInWithEmailAndPassword(auth, email, form.password);

      // ถ้ายังไม่ยืนยันอีเมล -> ส่งลิงก์ให้ แล้วล็อกเอาท์ (ห้ามเข้าระบบ)
      if (!cred.user.emailVerified) {
        try {
          await sendEmailVerification(cred.user, {
            url: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
            handleCodeInApp: false,
          });
        } catch (e) {
          // ไม่เป็นไร ถ้าส่งไม่ได้ ผู้ใช้ยังใช้ลิงก์เดิมจากตอนสมัครได้
          console.warn("sendEmailVerification in login:", e?.code || e?.message);
        }
        await signOut(auth);
        router.push(`/verify-required?email=${encodeURIComponent(email)}`);
        return;
      }

      // ยืนยันแล้ว -> โหลดโปรไฟล์และเข้าแอป
      const uid = cred.user.uid;
      const snap = await getDoc(doc(db, "users", uid));
      const prof = snap.exists() ? snap.data() : {};
      localStorage.setItem("userProfile", JSON.stringify({ id: uid, email: cred.user.email, ...prof }));
      router.push("/profile");
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else if (code === "auth/user-not-found") {
        setError("ไม่พบบัญชีนี้ กรุณาสมัครสมาชิก");
      } else {
        setError("เข้าสู่ระบบไม่สำเร็จ");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">เข้าสู่ระบบ</h1>

        {error && <p className="text-red-600 text-center mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="อีเมล"
            className="w-full px-4 py-2 border rounded-lg"
            autoComplete="email"
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="รหัสผ่าน"
            className="w-full px-4 py-2 border rounded-lg"
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-60"
          >
            {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <a href="/reset-password" className="text-sm text-blue-600 hover:underline">
            ลืมรหัสผ่าน?
          </a>
        </div>

        <p className="mt-2 text-center text-gray-600">
          ยังไม่มีบัญชี?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            สมัครสมาชิก
          </a>
        </p>
      </div>
    </div>
  );
}
