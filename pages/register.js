import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const ALLOWED_EMAIL_DOMAINS = ["@nu.ac.th", "@students.nu.ac.th", "@student.nu.ac.th"];
const isAllowedEmailDomain = (email) =>
  ALLOWED_EMAIL_DOMAINS.some((d) => String(email || "").toLowerCase().trim().endsWith(d));
const isValidStudentId = (id) => /^\d{8,12}$/.test(String(id || "").trim());

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ studentId: "", name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const studentId = form.studentId.trim();
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!studentId || !name || !email || !password) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    if (!isValidStudentId(studentId)) {
      setError("เลขนิสิตต้องเป็นตัวเลข 8–12 หลัก");
      return;
    }
    if (!isAllowedEmailDomain(email)) {
      setError(`กรุณาใช้อีเมลมหาวิทยาลัย (${ALLOWED_EMAIL_DOMAINS.join(", ")})`);
      return;
    }

    setBusy(true);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods && methods.length > 0) {
        setError("อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ หรือกด “ลืมรหัสผ่าน”");
        setBusy(false);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      await setDoc(doc(db, "users", uid), {
        id: uid,
        studentId,
        name,
        email: cred.user.email,
        avatar: "",
        year: "ปี 1",
        interest: "",
        bio: "",
        created_at: new Date().toISOString(),
      });

      // ส่งลิงก์ยืนยันอีเมล
      await sendEmailVerification(cred.user, {
        url:
          typeof window !== "undefined"
            ? `${window.location.origin}/login`
            : undefined,
        handleCodeInApp: false,
      });

      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/weak-password") setError("รหัสผ่านสั้นเกินไป (อย่างน้อย 6 ตัวอักษร)");
      else if (code === "auth/invalid-email") setError("รูปแบบอีเมลไม่ถูกต้อง");
      else setError(`สมัครสมาชิกไม่สำเร็จ (${code || "ไม่ทราบสาเหตุ"})`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          สมัครสมาชิก
        </h1>

        {error && (
          <p className="text-red-600 text-center mb-3 whitespace-pre-line">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="studentId"
            value={form.studentId}
            onChange={handleChange}
            placeholder="เลขนิสิต (เช่น 65XXXXXXXX)"
            className="w-full px-4 py-2 border rounded-lg"
            inputMode="numeric"
            required
          />
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="ชื่อที่แสดง"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder={`อีเมลมหาวิทยาลัย (เช่น name${ALLOWED_EMAIL_DOMAINS[0]})`}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="รหัสผ่าน (≥ 6 ตัวอักษร)"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-green-600 text-white py-2 rounded-lg disabled:opacity-60"
          >
            {busy ? "กำลังสมัคร..." : "สมัคร"}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          มีบัญชีแล้ว?{" "}
          <Link href="/login" className="text-green-600 hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
