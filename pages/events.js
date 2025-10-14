import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Events() {
  const router = useRouter();

  // สมมติผู้ใช้ปัจจุบัน
  const currentUser = { id: 101, name: "คุณสมชาย ใจดี" };

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const savedEvents = JSON.parse(localStorage.getItem("events") || "[]");

    const newEvent = {
      id: Date.now(),
      ...form,
      creator: currentUser,
      participants: [],
    };

    localStorage.setItem("events", JSON.stringify([...savedEvents, newEvent]));
    alert(`สร้างกิจกรรม: ${form.title} สำเร็จแล้ว! 🎉`);

    router.push("/events-list");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-orange-100">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-2xl">
          <h2 className="text-3xl font-bold text-center text-orange-600 mb-6">
            สร้างกิจกรรมใหม่
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="title"
              placeholder="ชื่อกิจกรรม"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
            <textarea
              name="description"
              placeholder="รายละเอียดกิจกรรม"
              value={form.description}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className="px-4 py-2 border rounded-lg"
              />
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                required
                className="px-4 py-2 border rounded-lg"
              />
            </div>
            <input
              type="text"
              name="location"
              placeholder="สถานที่"
              value={form.location}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg"
            />
            <button
              type="submit"
              className="w-full bg-orange-500 text-white py-2 rounded-xl hover:bg-orange-600"
            >
              บันทึกกิจกรรม
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
