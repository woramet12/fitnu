import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMsg("ส่งอีเมลสำหรับรีเซ็ตรหัสผ่านแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ");
    } catch (error) {
      const code = error?.code || "";
      if (code === "auth/user-not-found") setErr("ไม่พบบัญชีอีเมลนี้ในระบบ");
      else if (code === "auth/invalid-email") setErr("รูปแบบอีเมลไม่ถูกต้อง");
      else setErr(`ไม่สามารถส่งอีเมลได้ (${code || "ไม่ทราบสาเหตุ"})`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">ลืมรหัสผ่าน</h1>
        {msg && <p className="text-green-700 text-center mb-3">{msg}</p>}
        {err && <p className="text-red-600 text-center mb-3">{err}</p>}
        <form onSubmit={submit} className="space-y-4">
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="กรอกอีเมลที่ใช้สมัคร" className="w-full px-4 py-2 border rounded-lg" />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg">ส่งลิงก์รีเซ็ต</button>
        </form>
        <p className="mt-4 text-center">
          <a href="/login" className="text-blue-600 hover:underline">กลับไปหน้าเข้าสู่ระบบ</a>
        </p>
      </div>
    </div>
  );
}
