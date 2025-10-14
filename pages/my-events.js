import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MyEvents() {
  const router = useRouter();
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  // โหลดผู้ใช้ปัจจุบัน
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("userProfile")) || {
      id: 101,
      name: "คุณสมชาย ใจดี",
      avatar: null,
    };
    setUserProfile(savedUser);
  }, []);

  // โหลดกิจกรรมที่เข้าร่วม
  useEffect(() => {
    if (!userProfile) return;
    const savedEvents = JSON.parse(localStorage.getItem("events") || "[]");
    const joined = savedEvents.filter((event) =>
      event.participants?.find((u) => u.id === userProfile.id)
    );
    setJoinedEvents(joined);
  }, [userProfile]);

  // ยกเลิกเข้าร่วมกิจกรรม
  const handleCancel = (eventId) => {
    const updatedEvents = joinedEvents.map((event) => {
      if (event.id === eventId) {
        event.participants = event.participants.filter(
          (u) => u.id !== userProfile.id
        );
      }
      return event;
    });

    // อัปเดตกิจกรรมทั้งหมดใน localStorage
    const allEvents = JSON.parse(localStorage.getItem("events") || "[]");
    const newAllEvents = allEvents.map((event) => {
      const updated = updatedEvents.find((e) => e.id === event.id);
      return updated || event;
    });
    localStorage.setItem("events", JSON.stringify(newAllEvents));

    // อัปเดตหน้า
    const newJoined = updatedEvents.filter((e) =>
      e.participants?.find((u) => u.id === userProfile.id)
    );
    setJoinedEvents(newJoined);
    alert("คุณได้ยกเลิกเข้าร่วมกิจกรรมแล้ว");
  };

  // ไปหน้าแชท
  const handleChat = (eventId) => {
    router.push(`/event-chat/${eventId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      <main className="flex-1 px-6 sm:px-20 py-10">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">
          กิจกรรมที่ฉันเข้าร่วม
        </h1>

        {joinedEvents.length === 0 ? (
          <p className="text-gray-500">คุณยังไม่ได้เข้าร่วมกิจกรรมใด</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {joinedEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl transition-shadow"
              >
                <h2 className="text-xl font-semibold text-orange-600 mb-2">
                  {event.title}
                </h2>
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
                  <span className="text-gray-600">
                    👤 ผู้สร้าง: {event.creator?.name || "ไม่ระบุ"}
                  </span>
                </div>

                <p className="text-gray-600 mb-2">
                  👥 จำนวนผู้เข้าร่วม: {event.participants?.length || 0} คน
                </p>
                {event.participants && event.participants.length > 0 && (
                  <p className="text-gray-500 mb-2">
                    รายชื่อผู้เข้าร่วม:{" "}
                    {event.participants.map((u) => u.name).join(", ")}
                  </p>
                )}

                <div className="flex gap-2 flex-col">
                  <button
                    onClick={() => handleCancel(event.id)}
                    className="w-full bg-red-500 text-white py-2 rounded-xl hover:bg-red-600 transition-colors"
                  >
                    ยกเลิกเข้าร่วมกิจกรรม
                  </button>

                  <button
                    onClick={() => handleChat(event.id)}
                    className="w-full bg-green-500 text-white py-2 rounded-xl hover:bg-green-600 transition-colors"
                  >
                    💬 เข้าแชทกิจกรรม
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
