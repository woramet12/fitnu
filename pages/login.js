import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.email === "test@email.com" && form.password === "123456") {
      router.push("/profile");
    } else {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">เข้าสู่ระบบ</h1>
        {error && <p className="text-red-600 text-center">{error}</p>}
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
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg">เข้าสู่ระบบ</button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          ยังไม่มีบัญชี? <a href="/register" className="text-blue-600 hover:underline">สมัครสมาชิก</a>
        </p>
      </div>
    </div>
  );
}
