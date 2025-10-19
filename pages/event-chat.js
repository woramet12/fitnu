// pages/event-chat.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import toast from "react-hot-toast";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { uploadImageToCloudinary } from "../lib/cloudinary";

export default function EventChat() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [eventObj, setEventObj] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const fileRef = useRef(null);
  const endRef = useRef(null);

  // รับ eventId จาก query ?id= หรือจาก localStorage
  const eventId = useMemo(() => {
    if (typeof window === "undefined") return "";
    const fromQuery = new URLSearchParams(window.location.search).get("id");
    if (fromQuery) return String(fromQuery);
    const fromStorage = localStorage.getItem("currentChatEventId");
    return fromStorage ? String(fromStorage) : "";
  }, []);

  // โหลด session user
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("userProfile") || "null");
    if (!u) {
      toast.error("กรุณาเข้าสู่ระบบ");
      router.push("/login");
      return;
    }
    setUser(u);
  }, [router]);

  // โหลดกิจกรรม + ตรวจสิทธิ์เข้าแชท
  useEffect(() => {
    (async () => {
      if (!user || !eventId) return;

      try {
        const eventRef = doc(db, "events", eventId);
        const snap = await getDoc(eventRef);
        if (!snap.exists()) {
          toast.error("กิจกรรมนี้ถูกลบหรือไม่พบ");
          router.push("/events-list");
          return;
        }
        const data = { id: snap.id, ...snap.data() };

        const myId = String(user.id);
        const isCreator = String(data?.creator?.id || "") === myId;

        const inParticipants =
          (Array.isArray(data?.participants) &&
            data.participants.some((p) => String(p?.id) === myId)) ||
          (Array.isArray(data?.participantIds) &&
            data.participantIds.map(String).includes(myId));

        if (!isCreator && !inParticipants) {
          toast.error("ต้องเข้าร่วมกิจกรรมก่อนจึงจะเข้าแชทได้");
          router.push("/events-list");
          return;
        }

        setEventObj(data);
      } catch (e) {
        console.error(e);
        toast.error("โหลดข้อมูลกิจกรรมไม่สำเร็จ");
        router.push("/events-list");
      }
    })();
  }, [user, eventId, router]);

  // subscribe ข้อความ
  useEffect(() => {
    if (!eventObj) return;

    const qRef = query(
      collection(db, "events", eventObj.id, "messages"),
      orderBy("created_at", "asc")
    );

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMessages(rows);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      },
      (err) => {
        console.error(err);
        toast.error("โหลดข้อความไม่สำเร็จ");
      }
    );

    return () => unsub();
  }, [eventObj]);

  // ส่งข้อความตัวอักษร
  const sendText = async (e) => {
    e.preventDefault();
    if (!user || !eventObj) return;
    const content = text.trim();
    if (!content) return;

    try {
      await addDoc(collection(db, "events", eventObj.id, "messages"), {
        type: "text",
        text: content,
        created_at: serverTimestamp(),
        user: {
          id: String(user.id),
          name: user.name || "ผู้ใช้",
          avatar: user.avatar || "",
        },
      });
      setText("");
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      console.error(err);
      toast.error("ส่งข้อความไม่สำเร็จ");
    }
  };

  // เลือกรูป
  const pickImage = () => {
    if (uploading) return;
    fileRef.current?.click();
  };

  // อัปโหลดรูป + ส่งข้อความรูป
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกรูปภาพเท่านั้น");
      e.target.value = "";
      return;
    }
    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`ไฟล์ใหญ่เกินไป (เกิน ${MAX_MB}MB)`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    setUploadName(file.name);
    try {
      // upload ไป Cloudinary (util เดิมของโปรเจกต์)
      const uploaded = await uploadImageToCloudinary(file);
      const imageUrl = uploaded?.secure_url;
      if (!imageUrl) throw new Error("no url");

      // บันทึกข้อความเป็นรูป
      await addDoc(collection(db, "events", eventObj.id, "messages"), {
        type: "image",
        imageUrl,
        created_at: serverTimestamp(),
        user: {
          id: String(user.id),
          name: user.name || "ผู้ใช้",
          avatar: user.avatar || "",
        },
      });

      toast.success("ส่งรูปแล้ว");
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      console.error(err);
      toast.error("อัปโหลด/ส่งรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      setUploadName("");
      e.target.value = "";
    }
  };

  // ===== Utilities: format timestamp =====
  const fmtTime = (ts) => {
    if (!ts) return "";
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    if (Number.isNaN(d.getTime())) return "";
    const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    const date = d.toLocaleDateString("th-TH", { year: "numeric", month: "2-digit", day: "2-digit" });
    return `${time} • ${date}`;
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

  const myId = String(user.id);

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
              ผู้สร้าง: {eventObj.creator?.name || "-"}
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
                const mine = String(m?.user?.id) === myId;
                const bubbleBase = "max-w-[75%] rounded-2xl px-3 py-2 break-words";
                const bubbleClass = mine
                  ? "bg-green-600 text-white"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700";

                const tsText = m?.created_at ? fmtTime(m.created_at) : "กำลังส่ง…";

                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 ${mine ? "flex-row-reverse" : ""}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.user?.avatar || "/default-avatar.png"}
                      alt={m.user?.name || ""}
                      className="w-9 h-9 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                    />
                    <div className={`${bubbleBase} ${bubbleClass}`}>
                      <div
                        className={`text-xs mb-1 ${
                          mine ? "text-white/90" : "text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {m.user?.name}
                      </div>

                      {m.type === "image" ? (
                        <a href={m.imageUrl} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.imageUrl}
                            alt="uploaded"
                            className="rounded-lg max-h-80 object-contain"
                          />
                        </a>
                      ) : (
                        <div className="text-sm">{m.text}</div>
                      )}

                      {/* เวลา/วันที่ส่ง */}
                      <div
                        className={`mt-1 text-[10px] ${
                          mine ? "text-white/80 text-right" : "text-gray-500 dark:text-gray-400 text-right"
                        }`}
                      >
                        {tsText}
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
            onSubmit={sendText}
            className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="พิมพ์ข้อความ..."
              className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={uploading}
            />

            <input
              ref={fileRef}
              onChange={handleFile}
              type="file"
              accept="image/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={pickImage}
              disabled={uploading}
              className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              title="ส่งรูปภาพ"
            >
              {uploading ? "กำลังอัปโหลด..." : "📷"}
            </button>

            <button
              type="submit"
              disabled={uploading || !text.trim()}
              className="px-5 py-2 rounded-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white transition"
            >
              ส่ง
            </button>
          </form>

          {uploading && (
            <div className="px-4 pb-3 text-xs text-gray-600 dark:text-gray-300">
              กำลังอัปโหลดรูป: {uploadName}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
