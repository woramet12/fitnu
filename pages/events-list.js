// pages/events-list.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ParticipantsList from "../components/ParticipantsList";
import toast from "react-hot-toast";

import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

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

// กันซ้ำใน participants ตาม id
const uniqById = (arr = []) => {
  const m = new Map();
  for (const x of arr || []) {
    if (!x || !x.id) continue;
    const k = String(x.id);
    if (!m.has(k))
      m.set(k, { id: k, name: x.name || "ผู้ใช้", avatar: x.avatar || "" });
  }
  return Array.from(m.values());
};

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
        try {
          unsubRef.current();
        } catch {}
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
        // ไม่มี orderBy เพื่อเลี่ยง composite-index; sort ฝั่ง client
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

  // sort ฝั่ง client ตามเวลาสร้าง
  const persistSort = useMemo(() => {
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

  const myId = user?.id ? String(user.id) : null;

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

  // ✅ เข้าร่วมกิจกรรม: อ่านเอกสารล่าสุด → คำนวณอาร์เรย์ใหม่ → updateDoc (ไม่ใช้ arrayUnion)
  const joinEvent = async (ev) => {
    try {
      if (!myId) {
        toast.error("กรุณาเข้าสู่ระบบ");
        router.push("/login");
        return;
      }

      const ref = doc(db, "events", String(ev.id));
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        toast.error("ไม่พบบันทึกกิจกรรม");
        return;
      }
      const cur = snap.data();

      const already =
        (cur.participantIds || []).map(String).includes(String(myId)) ||
        (cur.participants || []).some((p) => String(p.id) === String(myId));
      if (already) {
        toast("คุณเข้าร่วมแล้ว");
        return;
      }

      const me = {
        id: String(myId),
        name: user?.name || "ผู้ใช้",
        avatar: user?.avatar || "",
      };

      const nextIds = Array.from(
        new Set([...(cur.participantIds || []).map(String), String(myId)])
      );
      const nextParticipants = uniqById([...(cur.participants || []), me]);

      await updateDoc(ref, {
        participantIds: nextIds,
        participants: nextParticipants,
      });

      toast.success("เข้าร่วมกิจกรรมแล้ว");
    } catch (e) {
      console.error(e);
      toast.error("เข้าร่วมไม่สำเร็จ");
    }
  };

  // ✅ ยกเลิกเข้าร่วม: อ่านเอกสารล่าสุด → กรองออก → updateDoc (ไม่ใช้ arrayRemove)
  const cancelJoin = async (ev) => {
    try {
      if (!myId) return;
      const ok = confirm("ต้องการยกเลิกการเข้าร่วมกิจกรรมนี้หรือไม่?");
      if (!ok) return;

      const ref = doc(db, "events", String(ev.id));
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        toast.error("ไม่พบบันทึกกิจกรรม");
        return;
      }
      const cur = snap.data();

      const nextIds = (cur.participantIds || [])
        .map(String)
        .filter((id) => id !== String(myId));
      const nextParticipants = (cur.participants || []).filter(
        (p) => String(p.id) !== String(myId)
      );

      await updateDoc(ref, {
        participantIds: nextIds,
        participants: nextParticipants,
      });

      toast.success("ยกเลิกเข้าร่วมแล้ว");
    } catch (e) {
      console.error(e);
      toast.error("ยกเลิกไม่สำเร็จ");
    }
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
          <p className="text-gray-700 dark:text-gray-300">
            ไม่พบบางอย่างที่ค้นหา
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {persistSort.map((e) => {
              const isCreator = String(e?.creator?.id || "") === String(myId);
              const joined = Array.isArray(e?.participantIds)
                ? e.participantIds.includes(String(myId))
                : (e?.participants || []).some(
                    (p) => String(p.id) === String(myId)
                  );

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
                      ผู้เข้าร่วม:{" "}
                      {Array.isArray(e?.participantIds)
                        ? e.participantIds.length
                        : (e?.participants || []).length}{" "}
                      คน
                      <div className="mt-1">
                        <ParticipantsList
                          participants={
                            e?.participants ||
                            (Array.isArray(e?.participantIds)
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

                  <div className="flex flex-wrap gap-2 mt-4">
                    {isCreator || joined ? (
                      <>
                        {!isCreator && (
                          <button
                            onClick={() => cancelJoin(e)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition"
                          >
                            ยกเลิก
                          </button>
                        )}
                        <button
                          onClick={() => goToChat(e.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
                        >
                          💬 แชท
                        </button>
                      </>
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
