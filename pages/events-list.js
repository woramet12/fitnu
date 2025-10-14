import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  // สมมติผู้ใช้ปัจจุบัน (โหลดจาก localStorage ถ้ามี)
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("userProfile")) || {
      id: 101,
      name: "คุณสมชาย ใจดี",
      avatar: null,
    };
    setUserProfile(savedUser);
  }, []);

  // โหลดกิจกรรมจาก localStorage
  useEffect(() => {
    const savedEvents = JSON.parse(localStorage.getItem("events") || "[]");
    setEvents(savedEvents);
  }, []);

  const handleJoinToggle = (eventId) => {
    const updatedEvents = events.map((event) => {
      if (event.id === eventId) {
        let participants = event.participants || [];
        const isJoined = participants.find((u) => u.id === userProfile.id);

        if (isJoined) {
          participants = participants.filter((u) => u.id !== userProfile.id);
          alert(`คุณได้ยกเลิกเข้าร่วมกิจกรรม: ${event.title}`);
        } else {
          participants.push(userProfile);
          alert(`คุณได้เข้าร่วมกิจกรรม: ${event.title}`);
        }

        return { ...event, participants };
      }
      return event;
    });

    setEvents(updatedEvents);
    localStorage.setItem("events", JSON.stringify(updatedEvents));
  };

  const handleDelete = (eventId) => {
    const eventToDelete = events.find((e) => e.id === eventId);
    if (eventToDelete.creator?.id !== userProfile.id) {
      alert("คุณไม่มีสิทธิ์ลบกิจกรรมนี้");
      return;
    }

    const newEvents = events.filter((e) => e.id !== eventId);
    setEvents(newEvents);
    localStorage.setItem("events", JSON.stringify(newEvents));
    alert(`ลบกิจกรรม: ${eventToDelete.title} เรียบร้อยแล้ว`);
  };

  // ไปหน้าแชท
  const goToChat = (event) => {
    localStorage.setItem("currentChatEvent", JSON.stringify(event));
    window.location.href = "/event-chat"; // สมมติชื่อหน้า chat
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 sm:px-20 py-10">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">กิจกรรมทั้งหมด</h1>

        {events.length === 0 ? (
          <p className="text-gray-500">ยังไม่มีกิจกรรม</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl transition-shadow"
              >
                <h2 className="text-xl font-semibold text-orange-600 mb-2">{event.title}</h2>
                <p className="text-gray-600 mb-2">{event.description}</p>
                <p className="text-sm text-gray-500 mb-2">
                  📅 {event.date} ⏰ {event.time} | 📍 {event.location}
                </p>

                {/* ผู้สร้าง */}
                <div className="flex items-center gap-2 mb-2">
                  {event.creator?.avatar ? (
                    <img
                      src={event.creator.avatar}
                      alt="avatar"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                  )}
                  <span className="text-gray-600">👤 ผู้สร้าง: {event.creator?.name || "ไม่ระบุ"}</span>
                </div>

                {/* ผู้เข้าร่วม */}
                <p className="text-gray-600 mb-2">👥 จำนวนผู้เข้าร่วม: {event.participants?.length || 0} คน</p>
                {event.participants && event.participants.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {event.participants.map((u) => (
                      <div key={u.id} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-xl">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-300 text-xs">👤</div>
                        )}
                        <span className="text-gray-700 text-sm">{u.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleJoinToggle(event.id)}
                    className={`flex-1 py-2 rounded-xl text-white transition-colors ${
                      event.participants?.find((u) => u.id === userProfile.id)
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {event.participants?.find((u) => u.id === userProfile.id)
                      ? "ยกเลิกเข้าร่วม"
                      : "เข้าร่วมกิจกรรม"}
                  </button>

                  {event.creator?.id === userProfile.id && (
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="flex-1 py-2 rounded-xl bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                    >
                      ลบกิจกรรม
                    </button>
                  )}

                
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
