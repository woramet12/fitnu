import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ParticipantsList from "../components/ParticipantsList";
import toast from "react-hot-toast";
import { safeGet, safeDelete, safeSet } from "../utils/storage";

export default function MyCreatedEvents() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const u = await safeGet("userProfile", null);
      if (!u) { toast.error("กรุณาเข้าสู่ระบบก่อน"); router.push("/login"); return; }
      setUser(u);
      const es = await safeGet("events", []);
      setEvents(es);
      setLoading(false);
    })();
  }, [router]);

  const myCreated = useMemo(() => {
    if (!user) return [];
    const uid = String(user.id);
    return (events || []).filter((e) => String(e.creator?.id) === uid);
  }, [events, user]);

  const deleteEvent = async (eventId) => {
    if (!user) return;
    if (!confirm("คุณต้องการลบกิจกรรมนี้จริงหรือไม่?")) return;

    try {
      await safeDelete("events", eventId);        // ⬅️ ลบจาก Firestore จริง
      // ลบทิ้งจาก state ฝั่งหน้าให้ทันที
      setEvents((prev) => prev.filter((e) => String(e.id) !== String(eventId)));
      toast.success("ลบกิจกรรมเรียบร้อย");
    } catch (e) {
      console.error(e);
      toast.error("ลบกิจกรรมไม่สำเร็จ");
    }
  };


  const goToChat = async (eventId) => {
    try { safeSet("currentChatEventId", String(eventId)); }
    catch { toast.error("ไม่สามารถเปิดแชทได้"); return; }
    router.push("/event-chat");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 text-green-700 dark:text-green-400">กิจกรรมที่ฉันสร้าง</h1>
        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">กำลังโหลดข้อมูล...</p>
        ) : myCreated.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">ยังไม่มีกิจกรรมที่คุณสร้าง</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {myCreated.map((e) => (
              <div key={e.id} className="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md">
                <h2 className="text-xl font-semibold text-green-700 dark:text-green-400">{e.title}</h2>
                <p className="text-gray-700 dark:text-gray-200 mt-1 line-clamp-3">{e.description}</p>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 space-y-1">
                  <div>📅 {e.date} ⏰ {e.time}</div>
                  <div>📍 {e.location}</div>
                  <div>ผู้เข้าร่วม: {(e.participants || []).length} คน
                    <div className="mt-1"><ParticipantsList participants={e.participants || []} /></div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => goToChat(e.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">💬 เข้าแชทกิจกรรม</button>
                  <button onClick={() => deleteEvent(e.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg">🗑️ ลบกิจกรรม</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
