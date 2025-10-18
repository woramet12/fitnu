// pages/events-list.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ParticipantsList from "../components/ParticipantsList";
import toast from "react-hot-toast";
import { db } from "../lib/firebase";
import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

// แปลงคีย์เวิร์ดเป็น tokens (ต้องตรงกับที่เราสร้างไว้ตอนบันทึก)
function normalizeTokens(input) {
  const s = String(input || "").toLowerCase();
  const arr = s.replace(/[^\p{L}\p{N}\s]+/gu, " ").split(/\s+/).filter(Boolean);
  const stripTone = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const withVariant = arr.flatMap((w) =>
    w === stripTone(w) ? [w] : [w, stripTone(w)]
  );
  // unique + limit 10 (ข้อจำกัด array-contains-any)
  return Array.from(new Set(withVariant)).slice(0, 10);
}

export default function EventsList() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kw, setKw] = useState("");
  const [user, setUser] = useState(null);

  const unsubRef = useRef(null);

  // guard login แบบเบาๆ
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("userProfile") || "null");
    if (!u) {
      toast.error("กรุณาเข้าสู่ระบบ");
      router.push("/login");
      return;
    }
    setUser(u);
  }, [router]);

  // subscribe รายการกิจกรรมตามคีย์เวิร์ด
  useEffect(() => {
    if (!user) return;

    // debounce 300ms
    const t = setTimeout(() => {
      // ยกเลิกของเก่า
      if (unsubRef.current) {
        try { unsubRef.current(); } catch {}
        unsubRef.current = null;
      }

      const trimmed = kw.trim();
      let qRef;

      if (trimmed) {
        const tokens = normalizeTokens(trimmed);
        if (tokens.length === 0) {
          setEvents([]);
          setLoading(false);
          return;
        }
        // 🔍 ค้นหาด้วย tokens (แมตช์อย่างน้อย 1 token)
        qRef = query(
          collection(db, "events"),
          where("tokens", "array-contains-any", tokens),
          limit(200)
        );
      } else {
        // รายการล่าสุด (ไม่มี orderBy เพื่อเลี่ยง composite-index; จะ sort ฝั่ง client)
        qRef = query(collection(db, "events"), limit(200));
      }

      setLoading(true);
      unsubRef.current = onSnapshot(
        qRef,
        (snap) => {
          const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setEvents(rows);
          setLoading(false);
        },
        (err) => {
          console.error("events-list onSnapshot error:", err);
          toast.error("โหลดข้อมูลไม่สำเร็จ");
          setEvents([]);
          setLoading(false);
        }
      );
    }, 300);

    return () => clearTimeout(t);
  }, [kw, user]);

  const persistSort = useMemo(() => {
    const toMillis = (v) =>
      v && typeof v.toDate === "function"
        ? v.toDate().getTime()
        : v
        ? new Date(String(v)).getTime()
        : 0;
    // เรียงใหม่ฝั่ง client
    return [...events].sort((a, b) => toMillis(b.created_at) - toMillis(a.created_at));
  }, [events]);

  const myId = user?.id;

  const goToChat = (eventId) => {
    localStorage.setItem("currentChatEventId", String(eventId));
    router.push("/event-chat");
  };

  const joinEvent = async (e) => {
    // ตรงนี้ถ้าคุณมีปุ่ม join ฝั่ง Firestore แล้วใช้อยู่เดิมก็ใช้โค้ดเดิมได้
    toast("ใช้ปุ่มเข้าร่วมตามเดิมได้เลย");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          รายการกิจกรรมทั้งหมด
        </h1>

        {/* กล่องค้นหา */}
        <div className="flex items-center gap-2 mb-6">
          <input
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            placeholder="ค้นหาชื่อกิจกรรม/รายละเอียด/สถานที่"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {kw && (
            <button
              onClick={() => setKw("")}
              className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            >
              ล้าง
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-gray-700 dark:text-gray-300 text-center">
            กำลังโหลดข้อมูล...
          </div>
        ) : persistSort.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">ไม่พบบางอย่างที่ค้นหา</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {persistSort.map((e) => {
              const joined = (e.participants || []).some(
                (p) => String(p.id) === String(myId)
              );
              const isCreator = String(e?.creator?.id) === String(myId);

              return (
                <div
                  key={e.id}
                  className="border rounded-xl p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition"
                >
                  <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-400">
                    {e.title}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-200 mt-1 line-clamp-3">
                    {e.description}
                  </p>

                  <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                    <div>📅 {e.date} ⏰ {e.time}</div>
                    <div>📍 {e.location}</div>
                    <div>
                      ผู้สร้าง:{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {e?.creator?.name || "ไม่ระบุ"}
                      </span>
                    </div>
                    <div className="mt-1">
                      ผู้เข้าร่วม: {(e.participants || []).length} คน
                      <div className="mt-1">
                        <ParticipantsList participants={e.participants || []} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {(joined || isCreator) ? (
                      <button
                        onClick={() => goToChat(e.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
                      >
                        💬 แชท
                      </button>
                    ) : (
                      <button
                        onClick={() => joinEvent(e)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition"
                      >
                        เข้าร่วม
                      </button>
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
