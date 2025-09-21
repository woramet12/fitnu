import { useState } from "react";

export default function Events() {
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
    alert(`สร้างกิจกรรม: ${form.title} สำเร็จแล้ว! 🎉`);
    // ที่นี่สามารถส่งข้อมูลไป backend ได้ เช่น fetch("/api/events", {...})
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-orange-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center text-orange-600 mb-6">
          สร้างกิจกรรมใหม่
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ชื่อกิจกรรม */}
          <div>
            <label className="block text-gray-700 mb-2">ชื่อกิจกรรม</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="เช่น วิ่งรอบมหาวิทยาลัย"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
              required
            />
          </div>

          {/* รายละเอียด */}
          <div>
            <label className="block text-gray-700 mb-2">รายละเอียด</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="ใส่รายละเอียดของกิจกรรม..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
              rows="3"
              required
            ></textarea>
          </div>

          {/* วันที่และเวลา */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">วันที่</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">เวลา</label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* สถานที่ */}
          <div>
            <label className="block text-gray-700 mb-2">สถานที่</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="เช่น สนามกีฬา ม.นเรศวร"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
              required
            />
          </div>

          {/* ปุ่มบันทึก */}
          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            ✅ บันทึกกิจกรรม
          </button>
        </form>
      </div>
    </div>
  );
}
