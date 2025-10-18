// pages/my-created-events.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ParticipantsList from "../components/ParticipantsList";
import toast from "react-hot-toast";

import { db, auth } from "../lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

export default function MyCreatedEvents() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // ป้องกัน unsubscribe null
  const unsubs = useRef([]);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("userProfile") || "null");
    if (!u) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      router.push("/login");
      return;
    }
    setUser(u);

    // ไม่ใส่ orderBy เพื่อเลี่ยง composite-index/SDK bug (ไป sort ที่ client)
    const q1 = query(
      collection(db, "events"),
      where("creator.id", "==", String(u.id))
    );

    const unsub = onSnapshot(
      q1,
      (snap) => {
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("onSnapshot error:", err);
        toast.error("โหลดข้อมูลไม่สำเร็จ");
        setEvents([]);
        setLoading(false);
      }
    );

    unsubs.current.push(unsub);
    return () => unsubs.current.forEach((fn) => { try { fn(); } catch {} });
  }, [router]);

  const sorted = useMemo(() => {
    const toMillis = (v) =>
      v && typeof v.toDate === "function"
        ? v.toDate().getTime()
        : v
        ? new Date(String(v)).getTime()
        : 0;
    return [...events].sort(
      (a, b) => toMillis(b.created_at) - toMillis(a.created_at)
    );
  }, [events]);

  const goToChat = (eventId) => {
    localStorage.setItem("currentChatEventId", String(eventId));
    router.push("/event-chat");
  };

  // ✅ ลบ subcollection messages ทั้งหมดก่อน แล้วค่อยลบ event
  const deleteEvent = async (ev) => {
    try {
      const au = auth.currentUser;
      if (!au) {
        toast.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
        router.push("/login");
        return;
      }
      await au.getIdToken(true);

      // เช็คสิทธิ์ฝั่ง client เบื้องต้น (กฎฝั่ง server จะเช็คอีกที)
      if (String(ev?.creator?.id) !== String(au.uid)) {
        toast.error("คุณไม่มีสิทธิ์ลบกิจกรรมนี้");
        return;
      }

      if (!confirm(`ต้องการลบกิจกรรม “${ev.title || "-"}” หรือไม่?`)) return;

      const msgsRef = collection(db, "events", ev.id, "messages");
      const msgsSnap = await getDocs(msgsRef);

      // ใช้ batch เพื่อลบให้เร็วและปลอดภัย
      const batch = writeBatch(db);
      msgsSnap.forEach((d) => batch.delete(doc(db, "events", ev.id, "messages", d.id)));
      await batch.commit();

      // ลบ document หลัก
      await deleteDoc(doc(db, "events", ev.id));

      toast.success("ลบกิจกรรมเรียบร้อย");
    } catch (err) {
      console.error("deleteEvent error:", err);
      if (err?.code === "permission-denied") {
        toast.error("ไม่มีสิทธิ์ลบกิจกรรม (ตรวจ Firestore Rules/สิทธิ์ผู้ใช้)");
      } else {
        toast.error("ลบกิจกรรมไม่สำเร็จ");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 text-green-700 dark:text-green-400">
          กิจกรรมที่ฉันสร้าง
        </h1>

        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">กำลังโหลดข้อมูล...</p>
        ) : !user ? (
          <p className="text-gray-600">กรุณาเข้าสู่ระบบ</p>
        ) : sorted.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">
            ยังไม่มีกิจกรรมที่คุณสร้าง
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {sorted.map((e) => (
              <div
                key={e.id}
                className="border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition"
              >
                <h2 className="text-xl font-semibold text-green-700 dark:text-green-400">
                  {e.title}
                </h2>
                <p className="text-gray-700 dark:text-gray-200 mt-1 line-clamp-3">
                  {e.description}
                </p>

                <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 space-y-1">
                  <div>📅 {e.date} ⏰ {e.time}</div>
                  <div>📍 {e.location}</div>
                  <div>
                    ผู้เข้าร่วม: {(e.participants || []).length} คน
                    <div className="mt-1">
                      <ParticipantsList participants={e.participants || []} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => goToChat(e.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition"
                  >
                    💬 เข้าแชทกิจกรรม
                  </button>
                  <button
                    onClick={() => deleteEvent(e)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition"
                  >
                    🗑️ ลบกิจกรรม
                  </button>
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
