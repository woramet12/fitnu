import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ParticipantsList from "../components/ParticipantsList";
import toast from "react-hot-toast";
import { safeGet, safeAppendList } from "../utils/storage";

export default function MyEvents() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const u = await safeGet("userProfile", null);
      if (!u) { toast.error("กรุณาเข้าสู่ระบบ"); router.push("/login"); return; }
      setUser(u);
      setEvents(await safeGet("events", []));
      setLoading(false);
    })();
  }, [router]);

  const persist = async (list) => {
    const ok = await safeAppendList("events", list, 0.5);
    if (!ok) return toast.error("บันทึกไม่สำเร็จ");
    setEvents(list);
  };

  const myJoined = useMemo(() => {
    if (!user) return [];
    return (events || []).filter(
      (e) =>
        String(e.creator?.id) === String(user.id) ||
        (e.participants || []).some((p) => String(p.id) === String(user.id))
    );
  }, [events, user]);

  const leaveEvent = async (eventId) => {
    const es = await safeGet("events", []);
    const idx = es.findIndex((e) => String(e.id) === String(eventId));
    if (idx === -1) return;
    if (String(es[idx].creator?.id) === String(user.id)) return toast.error("ผู้สร้างไม่สามารถยกเลิกได้");
    if (!confirm("ต้องการยกเลิกการเข้าร่วมกิจกรรมนี้หรือไม่?")) return;

    es[idx].participants = (es[idx].participants || []).filter((p) => String(p.id) !== String(user.id));
    await persist(es);
    toast.success("ยกเลิกกิจกรรมแล้ว");
  };

  const goToChat = (eventId) => {
    localStorage.setItem("currentChatEventId", String(eventId));
    router.push("/event-chat");
  };

  const myId = user?.id;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">กิจกรรมของฉัน</h1>
        {loading ? (
          <p className="text-gray-700 dark:text-gray-300">กำลังโหลดข้อมูล...</p>
        ) : myJoined.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">ยังไม่มีกิจกรรมที่เข้าร่วม</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {myJoined.map((e) => {
              const isCreator = String(e.creator?.id) === String(myId);
              const joined = (e.participants || []).some((p) => String(p.id) === String(myId));
              return (
                <div key={e.id} className="border rounded-xl p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
                  <h2 className="text-xl font-semibold text-green-700 dark:text-green-400">{e.title}</h2>
                  <p className="text-gray-700 dark:text-gray-200 mt-1 line-clamp-3">{e.description}</p>
                  <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                    <div>📅 {e.date} ⏰ {e.time}</div>
                    <div>📍 {e.location}</div>
                    <div>ผู้สร้าง: <span className="font-medium text-gray-900 dark:text-gray-100">{e.creator?.name || "ไม่ระบุ"}</span></div>
                    <div className="mt-1">ผู้เข้าร่วม: {(e.participants || []).length} คน<ParticipantsList participants={e.participants || []} /></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {!isCreator && joined && (
                      <button onClick={() => leaveEvent(e.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition">ยกเลิก</button>
                    )}
                    {(joined || isCreator) && (
                      <button onClick={() => goToChat(e.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition">💬 เข้าแชท</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
