// pages/events.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import toast from "react-hot-toast";

import { db, auth } from "../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

// สร้างโทเคนไว้ใช้ค้นหา (ง่ายๆ: lower-case, split เว้นวรรค/สัญลักษณ์, ตัดซ้ำ, ตัดคำสั้นมาก)
function buildTokensFromEvent({ title, description, location }) {
  const src = [title, description, location]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase())
    .join(" ");

  const rough = src
    .replace(/[^\p{L}\p{N}\s]+/gu, " ") // เก็บตัวอักษรทุกภาษา + ตัวเลข + ช่องว่าง
    .split(/\s+/)
    .filter((w) => w.length >= 2); // ตัดคำสั้น 1 ตัว

  // เพิ่มเวอร์ชันไม่มีวรรณยุกต์แบบคร่าวๆ สำหรับภาษาไทย (best-effort)
  const stripTone = (t) =>
    t.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // สำหรับภาษาอื่น; ไทยส่วนใหญ่ไม่ใช่ tone marks แบบ combining แต่ไม่เป็นไร

  const withVariant = rough.flatMap((w) =>
    w === stripTone(w) ? [w] : [w, stripTone(w)]
  );

  // unique + limit
  return Array.from(new Set(withVariant)).slice(0, 30);
}

export default function Events() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });

  useEffect(() => {
    const cached = JSON.parse(localStorage.getItem("userProfile") || "null");
    if (!cached) {
      toast.error("กรุณาเข้าสู่ระบบก่อนสร้างกิจกรรม");
      router.push("/login");
      return;
    }
    setCurrentUser(cached);
  }, [router]);

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const title = (form.title || "").trim();
    const description = (form.description || "").trim();
    const date = (form.date || "").trim();
    const time = (form.time || "").trim();
    const location = (form.location || "").trim();

    if (!title || !description || !date || !time || !location) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setBusy(true);
    try {
      const au = auth.currentUser;
      if (!au) {
        toast.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
        router.push("/login");
        return;
      }
      await au.getIdToken(true);

      const publicUser = {
        id: String(au.uid),
        name:
          (currentUser?.name || au.displayName || au.email || "ผู้ใช้").toString(),
        avatar: (currentUser?.avatar || "").toString(),
      };

      // ✅ สร้าง tokens สำหรับค้นหา
      const tokens = buildTokensFromEvent({ title, description, location });

      await addDoc(collection(db, "events"), {
        title,
        description,
        date,
        time,
        location,
        tokens,               // <— เก็บไว้ค้นหา
        creator: publicUser,
        participants: [],
        participantsIds: [],
        created_at: serverTimestamp(),
      });

      toast.success(`สร้างกิจกรรม “${title}” สำเร็จ 🎉`);
      router.push("/events-list");
    } catch (err) {
      console.error("Create event failed:", err);
      if (err?.code === "permission-denied") {
        toast.error("สิทธิ์ไม่พอในการสร้างกิจกรรม (ตรวจ Firestore Rules/ล็อกอิน)");
      } else {
        toast.error("สร้างกิจกรรมไม่สำเร็จ");
      }
    } finally {
      setBusy(false);
    }
  };

  const inputBase =
    "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-400 " +
    "bg-white text-gray-900 placeholder-gray-400 border-gray-300 " +
    "dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:border-gray-700";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-orange-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-2xl border border-white/60 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-center text-orange-600 dark:text-orange-400 mb-6">
            สร้างกิจกรรมใหม่
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input name="title" value={form.title} onChange={handleChange} placeholder="ชื่อกิจกรรม" required className={inputBase} />
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="รายละเอียดกิจกรรม" rows={4} required className={inputBase} />
            <div className="grid grid-cols-2 gap-4">
              <input type="date" name="date" value={form.date} onChange={handleChange} required className={inputBase} />
              <input type="time" name="time" value={form.time} onChange={handleChange} required className={inputBase} />
            </div>
            <input name="location" value={form.location} onChange={handleChange} placeholder="สถานที่" required className={inputBase} />
            <button type="submit" disabled={busy} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl transition-colors disabled:opacity-60">
              {busy ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
