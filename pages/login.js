// pages/login.js
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );

      // ดึงโปรไฟล์ผู้ใช้ (ถ้ามี) ไปเก็บ localStorage เพื่อใช้ใน UI
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const userProfile = snap.exists()
        ? snap.data()
        : {
            id: cred.user.uid,
            email: cred.user.email,
            name: cred.user.email?.split("@")[0] || "User",
            avatar: "",
            year: "ปี 1",
            interest: "",
            bio: "",
          };

      localStorage.setItem("userProfile", JSON.stringify(userProfile));

      // ถ้ายังไม่ verify email ให้เด้งไปหน้าบอกให้ยืนยัน
      if (!cred.user.emailVerified) {
        router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
        return;
      }

      router.push("/profile");
    } catch (err) {
      const msg =
        err?.code === "auth/invalid-credential"
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : err?.message || "เข้าสู่ระบบไม่สำเร็จ";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          เข้าสู่ระบบ
        </h1>

        {error && <p className="text-red-600 text-center mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="อีเมล"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="รหัสผ่าน"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-60"
          >
            {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          {/* ใช้ Link แทน a และตัด slash ท้ายพาธออก */}
          <Link href="/reset-password" className="text-blue-600 hover:underline">
            ลืมรหัสผ่าน?
          </Link>
          <div className="text-gray-600">
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
//ff