// pages/my-events.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ParticipantsList from "../components/ParticipantsList";
import toast from "react-hot-toast";
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

export default function MyEvents() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [created, setCreated] = useState([]);
  const [joined, setJoined] = useState([]);
  const [loading, setLoading] = useState(true);

  // cache สถานะ user ที่ยังอยู่/ถูกลบแล้ว
  const userAliveCache = useRef(new Map()); // id -> boolean
  const [activeMap, setActiveMap] = useState({}); // eventId -> filtered participants

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("userProfile") || "null");
    if (!u) {
      toast.error("กรุณาเข้าสู่ระบบ");
      router.push("/login");
      return;
    }
    setUser(u);

    // NOTE: เลี่ยง orderBy ใน query ที่มี where(...) เพื่อตัดปัญหา composite index / SDK bug
    let unsub1 = () => {};
    let unsub2 = () => {};

    try {
      // events ที่เราเป็น creator
      const q1 = query(
        collection(db, "events"),
        where("creator.id", "==", String(u.id))
        // (ไม่ใส่ orderBy ที่นี่)
      );
      unsub1 = onSnapshot(
        q1,
        (snap) => setCreated(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => {
          console.error("creator onSnapshot error:", err);
          setCreated([]);
        }
      );

      // events ที่เราเข้าร่วม (ดูจาก participantsIds)
      const q2 = query(
        collection(db, "events"),
        where("participantsIds", "array-contains", String(u.id))
        // (ไม่ใส่ orderBy ที่นี่)
      );
      unsub2 = onSnapshot(
        q2,
        (snap) => setJoined(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => {
          console.error("joined onSnapshot error:", err);
          setJoined([]);
        }
      );
    } catch (e) {
      console.error("subscribe error:", e);
    } finally {
      setLoading(false);
    }

    return () => {
      try { unsub1 && unsub1(); } catch {}
      try { unsub2 && unsub2(); } catch {}
    };
  }, [router]);

  // รวม 2 กลุ่มเข้าด้วยกัน (unique) แล้ว sort โดย created_at desc ฝั่ง client
  const allMine = useMemo(() => {
    const map = new Map();
    [...created, ...joined].forEach((e) => map.set(e.id, e));
    const arr = Array.from(map.values());
    const toMillis = (v) =>
      v && typeof v.toDate === "function"
        ? v.toDate().getTime()
        : v
        ? new Date(String(v)).getTime()
        : 0;
    return arr.sort((a, b) => toMillis(b.created_at) - toMillis(a.created_at));
  }, [created, joined]);

  // helper เช็คว่าผู้ใช้ยังอยู่ใน DB
  const checkUserAlive = async (id) => {
    const key = String(id);
    if (userAliveCache.current.has(key)) return userAliveCache.current.get(key);
    const snap = await getDoc(doc(db, "users", key));
    const alive = snap.exists();
    userAliveCache.current.set(key, alive);
    return alive;
  };

  // คำนวณ participants ที่ยัง active สำหรับแต่ละ event
  useEffect(() => {
    (async () => {
      const out = {};
      for (const ev of allMine) {
        const ps = Array.isArray(ev.participants) ? ev.participants : [];
        const filtered = [];
        for (const p of ps) {
          if (!p?.id) continue;
          const alive = await checkUserAlive(p.id);
          if (alive) filtered.push(p);
        }
        out[ev.id] = filtered;
      }
      setActiveMap(out);
    })();
  }, [allMine]);

  const goToChat = (eventId) => {
    localStorage.setItem("currentChatEventId", String(eventId));
    router.push("/event-chat");
  };

  const myId = user?.id;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          กิจกรรมของฉัน
        </h1>

        {loading ? (
          <p className="text-gray-700 dark:text-gray-300">กำลังโหลดข้อมูล...</p>
        ) : allMine.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">
            ยังไม่มีกิจกรรมที่เข้าร่วม
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {allMine.map((e) => {
              const isCreator = String(e?.creator?.id) === String(myId);
              const active = activeMap[e.id] || [];
              const joined = active.some((p) => String(p.id) === String(myId));
              return (
                <div
                  key={e.id}
                  className="border rounded-xl p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition"
                >
                  <h2 className="text-xl font-semibold text-green-700 dark:text-green-400">
                    {e.title}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-200 mt-1 line-clamp-3">
                    {e.description}
                  </p>
                  <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                    <div>
                      📅 {e.date} ⏰ {e.time}
                    </div>
                    <div>📍 {e.location}</div>
                    <div>
                      ผู้สร้าง:{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {e?.creator?.name || "ไม่ระบุ"}
                      </span>
                    </div>
                    <div className="mt-1">
                      ผู้เข้าร่วม: {active.length} คน
                      <ParticipantsList participants={active} />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {(joined || isCreator) && (
                      <button
                        onClick={() => goToChat(e.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition"
                      >
                        💬 เข้าแชท
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
