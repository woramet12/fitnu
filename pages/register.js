import { useState } from "react";
import { useRouter } from "next/router";

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("สมัครสมาชิกสำเร็จ!");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">สมัครสมาชิก</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="อีเมล"
            className="w-full px-4 py-2 border rounded-lg"
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="รหัสผ่าน"
            className="w-full px-4 py-2 border rounded-lg"
          />
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg">สมัคร</button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          มีบัญชีแล้ว? <a href="/login" className="text-green-600 hover:underline">เข้าสู่ระบบ</a>
        </p>
      </div>
    </div>
  );
}
