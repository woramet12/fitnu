import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../lib/firebase";
import toast from "react-hot-toast";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, form.email, form.password);

      if (!cred.user.emailVerified) {
        try {
          await sendEmailVerification(cred.user, {
            url: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
            handleCodeInApp: false,
          });
        } catch {}
        router.push(`/verify-required?email=${encodeURIComponent(form.email)}`);
        return;
      }

      localStorage.setItem(
        "userProfile",
        JSON.stringify({
          id: cred.user.uid,
          name: cred.user.displayName || "",
          email: cred.user.email || "",
          avatar: cred.user.photoURL || "",
        })
      );
      toast.success("เข้าสู่ระบบสำเร็จ");
      router.push("/events-list");
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        toast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else if (code === "auth/user-not-found") {
        toast.error("ไม่พบบัญชีผู้ใช้");
      } else {
        toast.error(`เข้าสู่ระบบไม่สำเร็จ (${code || "unknown"})`);
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
            className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-60"
          >
            {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="mt-4 text-center space-y-1">
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
