import React from "react";
import { useRouter } from "next/router";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function EventDetail() {
  const router = useRouter();
  const { id } = router.query;

  // ตัวอย่างกิจกรรม (ในอนาคตดึงจาก DB ได้)
  const events = {
    1: {
      title: "วิ่งรอบสนาม",
      description: "วิ่งออกกำลังกายรอบสนามฟุตบอล",
      date: "2025-09-20",
      location: "สนามกีฬา ม.นเรศวร",
    },
    2: {
      title: "เตะฟุตบอล",
      description: "รวมทีมเล่นฟุตบอลเย็นนี้",
      date: "2025-09-22",
      location: "สนามหญ้าใหญ่",
    },
  };

  const event = events[id];

  if (!event) {
    return <p className="text-center mt-20">ไม่พบกิจกรรม</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 sm:px-20 py-10 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-orange-600 mb-6">{event.title}</h1>
        <p className="text-gray-700 mb-4">{event.description}</p>
        <p className="text-gray-500 mb-2">📅 {event.date}</p>
        <p className="text-gray-500 mb-6">📍 {event.location}</p>

        {/* ปุ่มเข้าร่วมกิจกรรม */}
        <button className="w-full bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-colors">
          ✅ เข้าร่วมกิจกรรม
        </button>
      </main>
      <Footer />
    </div>
  );
}
