import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ParticipantsList from "../components/ParticipantsList";
import toast from "react-hot-toast";

// Firestore
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export default function MyEvents() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mineCreated, setMineCreated] = useState([]);      // events ที่เราสร้าง
  const [mineJoined, setMineJoined] = useState([]);        // events ที่เราร่วม
  const [loading, setLoading] = useState(true);

  // โหลด session user + subscribe ข้อมูล
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("userProfile") || "null");
    if (!u) {
      toast.error("กรุณาเข้าสู่ระบบ");
      router.push("/login");
      return;
    }
    setUser(u);

    // query 1: เจ้าของกิจกรรม
    const q1 = query(
      collection(db, "events"),
      where("creator.id", "==", String(u.id))
    );

    // query 2: ผู้เข้าร่วม (ต้องมี field participantIds: string[])
    const q2 = query(
      collection(db, "events"),
      where("participantIds", "array-contains", String(u.id))
    );

    const unsub1 = onSnapshot(
      q1,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMineCreated(rows);
      },
      () => toast.error("โหลดข้อมูลไม่สำเร็จ")
    );

    const unsub2 = onSnapshot(
      q2,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMineJoined(rows);
      },
      () => toast.error("โหลดข้อมูลไม่สำเร็จ")
    );

    setLoading(false);

    // ✅ แก้รูปแบบ cleanup ให้ผ่าน ESLint
    return () => {
      if (typeof unsub1 === "function") unsub1();
      if (typeof unsub2 === "function") unsub2();
    };
  }, [router]);

  // รวม “กิจกรรมของฉัน” = ที่สร้างเอง + ที่เข้าร่วม (dedupe ตาม id)
  const allMine = useMemo(() => {
    const map = new Map();
    for (const e of mineCreated) map.set(String(e.id), e);
    for (const e of mineJoined) map.set(String(e.id), e);
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
  }, [mineCreated, mineJoined]);

  const myId = user?.id ? String(user.id) : null;

  // ออกจากกิจกรรม (เฉพาะกรณีที่เราไม่ใช่ creator)
  const leaveEvent = async (eventId) => {
    if (!myId) return;
    if (!confirm("ต้องการยกเลิกการเข้าร่วมกิจกรรมนี้หรือไม่?")) return;
    try {
      await updateDoc(doc(db, "events", String(eventId)), {
        participantIds: arrayRemove(myId),
      });
      toast.success("ยกเลิกกิจกรรมแล้ว");
    } catch (e) {
      toast.error("ยกเลิกไม่สำเร็จ");
    }
  };

  const goToChat = (eventId) => {
    try {
      localStorage.setItem("currentChatEventId", String(eventId));
    } catch {
      try {
        sessionStorage.setItem("currentChatEventId", String(eventId));
      } catch {
        toast.error("ไม่สามารถเปิดแชทได้");
        return;
      }
    }
    router.push("/event-chat");
  };

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
            ยังไม่มีกิจกรรมที่เกี่ยวข้องกับคุณ
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {allMine.map((e) => {
              const isCreator = String(e?.creator?.id) === myId;
              const joined = Array.isArray(e?.participantIds)
                ? e.participantIds.includes(myId)
                : (e?.participants || []).some((p) => String(p.id) === myId);

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
                        {e.creator?.name || "ไม่ระบุ"}
                      </span>
                    </div>
                    <div className="mt-1">
                      ผู้เข้าร่วม:{" "}
                      {Array.isArray(e?.participantIds)
                        ? e.participantIds.length
                        : (e.participants || []).length}{" "}
                      คน
                      <div className="mt-1">
                        <ParticipantsList
                          participants={
                            e.participants ||
                            (Array.isArray(e.participantIds)
                              ? e.participantIds.map((pid) => ({
                                  id: pid,
                                  name: "ผู้ใช้",
                                  avatar: "",
                                }))
                              : [])
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {!isCreator && joined && (
                      <button
                        onClick={() => leaveEvent(e.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition"
                      >
                        ยกเลิก
                      </button>
                    )}
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
