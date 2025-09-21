import React, { useState } from "react";
import Navbar from "../components/Navbar";   // ✅ import Navbar
import Footer from "../components/Footer";   // ✅ import Footer

export default function EventsList() {
  // กิจกรรมตัวอย่าง
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "วิ่งรอบสนาม",
      description: "วิ่งออกกำลังกายรอบสนามฟุตบอล",
      date: "2025-09-20",
      location: "สนามกีฬา ม.นเรศวร",
    },
    {
      id: 2,
      title: "เตะฟุตบอล",
      description: "รวมทีมเล่นฟุตบอลเย็นนี้",
      date: "2025-09-22",
      location: "สนามหญ้าใหญ่",
    },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 sm:px-20 py-10">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">กิจกรรมทั้งหมด</h1>

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
              <p className="text-sm text-gray-500">
                📅 {event.date} | 📍 {event.location}
              </p>
              <button className="mt-4 w-full bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600 transition-colors">
                ดูรายละเอียด
              </button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
