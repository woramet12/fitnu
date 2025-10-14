import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MyCreatedEvents() {
  const [events, setEvents] = useState([]);

  // สมมติผู้ใช้ปัจจุบัน
  const currentUser = {
    id: 101,
    name: "คุณสมชาย ใจดี",
  };

  useEffect(() => {
    const savedEvents = JSON.parse(localStorage.getItem("events") || "[]");
    // กรองเฉพาะกิจกรรมที่ผู้ใช้สร้าง
    const myEvents = savedEvents.filter(
      (e) => e.creator?.id === currentUser.id
    );
    setEvents(myEvents);
  }, []);

  const handleDelete = (eventId) => {
    if (confirm("คุณแน่ใจว่าต้องการลบกิจกรรมนี้หรือไม่?")) {
      const savedEvents = JSON.parse(localStorage.getItem("events") || "[]");
      const updatedEvents = savedEvents.filter((e) => e.id !== eventId);
      localStorage.setItem("events", JSON.stringify(updatedEvents));

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      alert("ลบกิจกรรมเรียบร้อยแล้ว");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 sm:px-20 py-10">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">
          กิจกรรมที่ฉันสร้าง
        </h1>

        {events.length === 0 ? (
          <p className="text-gray-500">คุณยังไม่ได้สร้างกิจกรรมใด</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((event) => (
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
                <p className="text-gray-600 mb-2">
                  👥 จำนวนผู้เข้าร่วม: {event.participants?.length || 0} คน
                </p>
                {event.participants && event.participants.length > 0 && (
                  <p className="text-gray-500 mb-2">
                    รายชื่อผู้เข้าร่วม:{" "}
                    {event.participants.map((u) => u.name).join(", ")}
                  </p>
                )}

                <button
                  onClick={() => handleDelete(event.id)}
                  className="w-full py-2 rounded-xl text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  ลบกิจกรรม
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
