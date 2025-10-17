import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ParticipantsList from "../../components/ParticipantsList";

export default function EventDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("userProfile") || "null");
    if (!u) {
      alert("กรุณาเข้าสู่ระบบ");
      router.push("/login");
      return;
    }
    setUser(u);

    const es = JSON.parse(localStorage.getItem("events") || "[]");
    const e = es.find((ev) => String(ev.id) === String(id));
    if (!e) {
      alert("ไม่พบกิจกรรมนี้");
      router.push("/events-list");
      return;
    }
    setEvent(e);
  }, [id, router]);

  const persist = (list) => {
    localStorage.setItem("events", JSON.stringify(list));
    setEvent(list.find((ev) => String(ev.id) === String(id)));
  };

  const joinEvent = () => {
    if (!user || !event) return;
    const es = JSON.parse(localStorage.getItem("events") || "[]");
    const idx = es.findIndex((ev) => ev.id === event.id);
    if (idx === -1) return;
    const already = (es[idx].participants || []).some((p) => p.id === user.id);
    if (already) return alert("คุณเข้าร่วมกิจกรรมนี้แล้ว");

    const publicUser = { id: user.id, name: user.name, avatar: user.avatar || "" };
    es[idx].participants = [...(es[idx].participants || []), publicUser];
    persist(es);
    alert("เข้าร่วมกิจกรรมสำเร็จ");
  };

  const leaveEvent = () => {
    if (!user || !event) return;
    const es = JSON.parse(localStorage.getItem("events") || "[]");
    const idx = es.findIndex((ev) => ev.id === event.id);
    if (idx === -1) return;
    if (es[idx].creator?.id === user.id)
      return alert("ผู้สร้างไม่สามารถยกเลิกการเข้าร่วมได้");
    es[idx].participants = (es[idx].participants || []).filter(
      (p) => p.id !== user.id
    );
    persist(es);
    alert("ยกเลิกการเข้าร่วมแล้ว");
  };

  const goToChat = () => {
    try {
      localStorage.setItem("currentChatEventId", String(event.id));
    } catch {
      sessionStorage.setItem("currentChatEventId", String(event.id));
    }
    router.push("/event-chat");
  };

  if (!event || !user)
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 max-w-3xl mx-auto w-full text-center text-gray-600">
          กำลังโหลด...
        </main>
        <Footer />
      </div>
    );

  const isCreator = event.creator?.id === user.id;
  const joined = (event.participants || []).some((p) => p.id === user.id);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-md border p-6">
          <h1 className="text-3xl font-bold text-green-700 mb-2">{event.title}</h1>
          <p className="text-gray-700 mb-4 whitespace-pre-line">
            {event.description}
          </p>

          <div className="space-y-1 text-gray-700 mb-4">
            <div>📅 วันที่: {event.date}</div>
            <div>⏰ เวลา: {event.time}</div>
            <div>📍 สถานที่: {event.location}</div>
          </div>

          <div className="border-t border-gray-200 my-4" />

          <div className="text-gray-800 mb-2">
            <strong>ผู้สร้าง:</strong> {event.creator?.name || "ไม่ระบุ"}
          </div>

          <div className="text-gray-800 mb-2">
            <strong>ผู้เข้าร่วม ({(event.participants || []).length} คน)</strong>
          </div>

          <ParticipantsList participants={event.participants || []} />

          <div className="flex flex-wrap gap-3 mt-6">
            {!joined && !isCreator && (
              <button
                onClick={joinEvent}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
              >
                เข้าร่วมกิจกรรม
              </button>
            )}

            {joined && !isCreator && (
              <button
                onClick={leaveEvent}
                className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700"
              >
                ยกเลิกการเข้าร่วม
              </button>
            )}

            {(joined || isCreator) && (
              <button
                onClick={goToChat}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
              >
                💬 เข้าแชท
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
