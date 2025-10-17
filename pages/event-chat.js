import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import toast from "react-hot-toast";
import { safeGet } from "../utils/storage";
import { uploadImageToCloudinary } from "../lib/cloudinary";

import { db } from "../lib/firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

export default function EventChat() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [eventObj, setEventObj] = useState(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  // -------- helpers --------
  const fmtTime = (v) => {
    if (!v) return "";
    const d = typeof v?.toDate === "function" ? v.toDate() : new Date(String(v));
    return d.toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ทำความสะอาด user ให้ไม่มี undefined
  const sanitizeUser = (u) => {
    if (!u) return null;
    const id = String(u.id ?? "");
    const name =
      (typeof u.name === "string" && u.name.trim()) ||
      (typeof u.displayName === "string" && u.displayName.trim()) ||
      (typeof u.email === "string" && u.email.trim()) ||
      "ผู้ใช้";
    const avatar = typeof u.avatar === "string" ? u.avatar : "";
    return { id, name, avatar };
  };

  const isMember = (evt, u) => {
    if (!evt || !u) return false;
    const me = String(u.id);
    const byCreator = String(evt?.creator?.id) === me;
    const byJoin = (evt?.participants || []).some((p) => String(p?.id) === me);
    return byCreator || byJoin;
  };

  // โหลด session + event id + ตรวจสิทธิ์
  useEffect(() => {
    (async () => {
      try {
        const u = await safeGet("userProfile", null);
        if (!u) {
          toast.error("กรุณาเข้าสู่ระบบ");
          router.push("/login");
          return;
        }

        const idStr =
          (await safeGet("currentChatEventId")) ||
          (typeof window !== "undefined" ? sessionStorage.getItem("currentChatEventId") : null);
        const eventId = idStr ? String(idStr) : null;

        if (!eventId) {
          toast.error("ไม่พบกิจกรรมที่เลือก");
          router.push("/events-list");
          return;
        }

        const es = (await safeGet("events", [])) || [];
        const full = es.find((e) => String(e?.id) === eventId);
        if (!full) {
          toast.error("กิจกรรมนี้ถูกลบหรือไม่พบ");
          router.push("/events-list");
          return;
        }

        if (!isMember(full, u)) {
          toast.error("ต้องเข้าร่วมกิจกรรมก่อนจึงจะเข้าแชทได้");
          router.push("/events-list");
          return;
        }

        setUser(u);
        setEventObj(full);
      } catch (e) {
        console.error("load session/event error:", e);
        toast.error("เกิดข้อผิดพลาดในการโหลด");
        router.push("/events-list");
      }
    })();
  }, [router]);

  // subscribe ข้อความแบบ realtime จาก Firestore
  useEffect(() => {
    if (!eventObj?.id) return;
    const col = collection(db, "events", String(eventObj.id), "messages");
    const qy = query(col, orderBy("created_at", "asc"));

    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMessages(rows);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
      },
      (err) => {
        console.error("onSnapshot error:", err);
        toast.error("โหลดแชทไม่สำเร็จ");
      }
    );
    return () => unsub();
  }, [eventObj?.id]);

  const keyEventId = useMemo(
    () => (eventObj ? String(eventObj.id) : null),
    [eventObj]
  );

  // -------- send text --------
  const sendText = async () => {
    const body = (text || "").trim();
    if (!body) return;
    if (!user || !keyEventId) return;

    const cleanUser = sanitizeUser(user);
    if (!cleanUser?.id) {
      toast.error("ไม่พบข้อมูลผู้ใช้");
      return;
    }

    setSending(true);
    try {
      const col = collection(db, "events", keyEventId, "messages");
      await addDoc(col, {
        type: "text",
        text: body,                    // string แน่ๆ
        imageUrl: "",                  // string ว่าง ไม่ใช่ undefined
        user: cleanUser,               // {id,name,avatar} ครบและไม่ undefined
        uid: cleanUser.id,             // for rules
        created_at: serverTimestamp(), // Timestamp
      });
      setText("");
    } catch (e) {
      console.error("sendText error:", e);
      toast.error(e?.message || "ส่งข้อความไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  // -------- send image --------
  const pickImage = () => fileInputRef.current?.click();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกรูปภาพเท่านั้น");
      return;
    }
    const MAX_MB = 8;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`ไฟล์ใหญ่เกินไป (เกิน ${MAX_MB}MB)`);
      return;
    }
    if (!user || !keyEventId) return;

    const cleanUser = sanitizeUser(user);
    if (!cleanUser?.id) {
      toast.error("ไม่พบข้อมูลผู้ใช้");
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadImageToCloudinary(file);
      const imageUrl = uploaded?.secure_url || uploaded?.url || "";
      if (!imageUrl) {
        throw new Error("ไม่พบ URL ของรูปจาก Cloudinary");
      }

      const caption = (text || "").trim(); // ถ้ามีแคปชัน
      const col = collection(db, "events", keyEventId, "messages");
      await addDoc(col, {
        type: "image",
        text: caption,                 // string (อาจว่างได้)
        imageUrl,                      // string
        user: cleanUser,               // {id,name,avatar}
        uid: cleanUser.id,
        created_at: serverTimestamp(),
      });
      setText("");
    } catch (e) {
      console.error("sendImage error:", e);
      toast.error(e?.message || "ส่งรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  if (!user || !eventObj) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 max-w-3xl mx-auto w-full text-center text-gray-700 dark:text-gray-300">
          กำลังโหลด...
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      <main className="flex-1 p-0 md:p-6 max-w-3xl mx-auto w-full">
        <div className="bg-white dark:bg-gray-800 shadow-sm md:rounded-2xl md:border border-gray-200 dark:border-gray-700 flex flex-col min-h-[70vh]">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {eventObj.title}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              ผู้สร้าง: {eventObj.creator?.name || "-"} • ผู้เข้าร่วม{" "}
              {eventObj.participants?.length || 0} คน
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                ยังไม่มีข้อความ เริ่มแชทได้เลย!
              </div>
            ) : (
              messages.map((m) => {
                const mine = String(m?.user?.id) === String(user.id);
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 ${mine ? "flex-row-reverse" : ""}`}
                  >
                    <img
                      src={m?.user?.avatar || "/default-avatar.png"}
                      alt={m?.user?.name || "user"}
                      className="w-9 h-9 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                    />
                    <div className="max-w-[70%]">
                      <div
                        className={`rounded-2xl px-3 py-2 ${
                          mine
                            ? "bg-green-600 text-white"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className={`text-xs mb-1 ${mine ? "text-white/90" : "text-gray-600 dark:text-gray-300"}`}>
                          {m?.user?.name || "-"}
                        </div>

                        {m?.type === "image" ? (
                          <div className="space-y-2">
                            <a href={m?.imageUrl} target="_blank" rel="noreferrer" className="block">
                              <img
                                src={m?.imageUrl}
                                alt={m?.text || "image"}
                                className={`rounded-lg border ${mine ? "border-white/40" : "border-gray-200 dark:border-gray-700"} max-w-full`}
                              />
                            </a>
                            {m?.text ? <div className="text-sm break-words">{m.text}</div> : null}
                          </div>
                        ) : (
                          <div className="text-sm break-words">{m?.text}</div>
                        )}
                      </div>
                      <div className={`mt-1 text-[11px] ${mine ? "text-white/80 text-right" : "text-gray-500 dark:text-gray-400"}`}>
                        {fmtTime(m?.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendText();
            }}
            className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2"
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="พิมพ์ข้อความ... (Enter = ส่ง, Shift+Enter = เว้นบรรทัด)"
              className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="ส่งรูปภาพ"
              className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-60"
            >
              {uploading ? "อัปโหลด..." : "📷 รูป"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />

            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-60"
            >
              {sending ? "กำลังส่ง..." : "ส่ง"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
