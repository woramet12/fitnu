import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import toast from "react-hot-toast";
import { safeGet, safeAppendList } from "../utils/storage";

export default function Events() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({ title:"", description:"", date:"", time:"", location:"" });

  useEffect(() => {
    (async () => {
      const u = await safeGet("userProfile", null);
      if (!u) { toast.error("กรุณาเข้าสู่ระบบก่อนสร้างกิจกรรม"); router.push("/login"); return; }
      setCurrentUser(u);
    })();
  }, [router]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const savedEvents = await safeGet("events", []);
    const publicUser = {
      id: String(currentUser.id),        // ← ให้เป็น string เสมอ
      name: currentUser.name || "",
      avatar: currentUser.avatar || "",
    };

    const newEvent = {
      id: String(Date.now()),
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      creator: publicUser,
      participants: [],
      created_at: new Date().toISOString(),
    };

    const nextEvents = [newEvent, ...(savedEvents || [])].slice(0, 100);
    const ok = await safeAppendList("events", nextEvents, 0.5);
    if (!ok) { toast.error("บันทึกกิจกรรมไม่สำเร็จ"); return; }

    toast.success(`สร้างกิจกรรม “${form.title}” สำเร็จ 🎉`);
    router.push("/my-created-events"); // ไปดูหน้าที่ฉันสร้างทันที
  };

  const inputBase = "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900 placeholder-gray-400 border-gray-300 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:border-gray-700";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-2xl">
          <h2 className="text-3xl font-bold text-center text-orange-600 dark:text-orange-400 mb-6">สร้างกิจกรรมใหม่</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input name="title" value={form.title} onChange={handleChange} placeholder="ชื่อกิจกรรม" required className={inputBase}/>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="รายละเอียดกิจกรรม" rows={4} required className={inputBase}/>
            <div className="grid grid-cols-2 gap-4">
              <input type="date" name="date" value={form.date} onChange={handleChange} required className={inputBase}/>
              <input type="time" name="time" value={form.time} onChange={handleChange} required className={inputBase}/>
            </div>
            <input name="location" value={form.location} onChange={handleChange} placeholder="สถานที่" required className={inputBase}/>
            <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl">บันทึกกิจกรรม</button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
