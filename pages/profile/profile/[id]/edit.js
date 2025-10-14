import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

const mockData = [
  { id: 1, name: "สมชาย ใจดี", year: "ปี 1", interest: "วิ่ง", bio: "ชอบวิ่งรอบสนามทุกเช้าเพื่อสุขภาพที่แข็งแรง" },
  { id: 2, name: "สมหญิง แข็งแรง", year: "ปี 2", interest: "ฟิตเนส", bio: "ไปฟิตเนสทุกเย็น อยากหาเพื่อนมาออกกำลังกายด้วยกัน" },
  { id: 3, name: "อนุชา สายลุย", year: "ปี 3", interest: "ฟุตบอล", bio: "รักการเล่นฟุตบอล ชอบรวมทีมแข่งกับคณะอื่น" },
  { id: 4, name: "พรทิพย์ รักสุขภาพ", year: "ปี 1", interest: "โยคะ", bio: "ชอบทำโยคะและการฝึกสมาธิในตอนเช้า" },
];

export default function EditProfile() {
  const router = useRouter();
  const { id } = router.query;
  const student = mockData.find((s) => s.id === parseInt(id));

  const [form, setForm] = useState({
    name: "",
    year: "",
    interest: "",
    bio: "",
  });

  useEffect(() => {
    if (student) setForm(student);
  }, [student]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`อัปเดตโปรไฟล์ของ ${form.name} สำเร็จแล้ว ✅`);
    router.push(`/profile/${id}`);
  };

  if (!student) {
    return <p className="text-center mt-10">ไม่พบข้อมูลผู้ใช้</p>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-yellow-50 to-white">
      <Navbar />

      <main className="flex-1 px-6 sm:px-20 py-10">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-orange-600 mb-6">แก้ไขโปรไฟล์</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">ชื่อ-นามสกุล</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded-lg"
              />
            </div>

            <div>
              <label className="block mb-2">ชั้นปี</label>
              <input
                type="text"
                name="year"
                value={form.year}
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded-lg"
              />
            </div>

            <div>
              <label className="block mb-2">ความสนใจ</label>
              <input
                type="text"
                name="interest"
                value={form.interest}
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded-lg"
              />
            </div>

            <div>
              <label className="block mb-2">เกี่ยวกับฉัน</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded-lg"
                rows="3"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded-xl hover:bg-green-600 transition-colors"
            >
              💾 บันทึกการเปลี่ยนแปลง
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
