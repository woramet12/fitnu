import { useRouter } from "next/router";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const students = [
  { id: 1, name: "สมชาย ใจดี", year: "ปี 1", interest: "วิ่ง", bio: "ชอบวิ่งรอบสนามทุกเช้าเพื่อสุขภาพที่แข็งแรง" },
  { id: 2, name: "สมหญิง แข็งแรง", year: "ปี 2", interest: "ฟิตเนส", bio: "ไปฟิตเนสทุกเย็น อยากหาเพื่อนมาออกกำลังกายด้วยกัน" },
  { id: 3, name: "อนุชา สายลุย", year: "ปี 3", interest: "ฟุตบอล", bio: "รักการเล่นฟุตบอล ชอบรวมทีมแข่งกับคณะอื่น" },
  { id: 4, name: "พรทิพย์ รักสุขภาพ", year: "ปี 1", interest: "โยคะ", bio: "ชอบทำโยคะและการฝึกสมาธิในตอนเช้า" },
];

export default function ProfileDetail() {
  const router = useRouter();
  const { id } = router.query;

  const student = students.find((s) => s.id === parseInt(id));

  if (!student) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-100 to-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">ไม่พบข้อมูลผู้ใช้</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      <main className="flex-1 px-6 sm:px-20 py-10">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-orange-600 mb-4">{student.name}</h1>
          <p className="text-gray-700 mb-2">📘 ชั้นปี: {student.year}</p>
          <p className="text-gray-700 mb-2">⭐ ความสนใจ: {student.interest}</p>
          <p className="text-gray-600 mb-6">{student.bio}</p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => alert(`คุณส่งคำขอเป็นเพื่อนกับ ${student.name} แล้ว ✅`)}
              className="w-full bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600 transition-colors"
            >
              ➕ เพิ่มเป็นเพื่อน
            </button>

            <button
              onClick={() => router.push(`/profile/${student.id}/edit`)}
              className="w-full bg-orange-500 text-white py-2 rounded-xl hover:bg-orange-600 transition-colors"
            >
              ✏️ แก้ไขโปรไฟล์
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
