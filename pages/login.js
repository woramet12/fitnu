// pages/login.js
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

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

      // ถ้ายังไม่ยืนยันอีเมล → ส่งไปหน้าให้กดยืนยันก่อน
      if (!cred.user.emailVerified) {
        router.push(`/verify-required?email=${encodeURIComponent(cred.user.email || form.email)}`);
        return;
      }

      // โหลดโปรไฟล์จาก Firestore เก็บลง localStorage
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (snap.exists()) {
        const u = snap.data();
        localStorage.setItem("userProfile", JSON.stringify(u));
      } else {
        // เผื่อไม่มีเอกสาร ก็เก็บขั้นต่ำไว้ให้ใช้งานได้
        localStorage.setItem(
          "userProfile",
          JSON.stringify({
            id: cred.user.uid,
            email: cred.user.email,
            name: cred.user.displayName || "",
            avatar: cred.user.photoURL || "",
            year: "ปี 1",
            interest: "",
            bio: "",
          })
        );
      }

      router.push("/profile");
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else if (code === "auth/user-not-found") {
        setError("ไม่พบบัญชีนี้");
      } else {
        setError(`เข้าสู่ระบบไม่สำเร็จ (${code || "unknown"})`);
      }
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
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2 rounded-lg"
          >
            {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="mt-4 text-center text-gray-600 space-y-2">
          {/* เปลี่ยนเป็น Link แทน a */}
          <div>
            ลืมรหัสผ่าน?{" "}
            <Link href="/reset-password" className="text-blue-600 hover:underline">
              กดที่นี่
            </Link>
          </div>
          <div>
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
