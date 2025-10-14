import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Friends() {
  const [search, setSearch] = useState("");
  const [students] = useState([
    { id: 1, name: "สมชาย ใจดี", year: "ปี 1", interest: "วิ่ง" },
    { id: 2, name: "สมหญิง แข็งแรง", year: "ปี 2", interest: "ฟิตเนส" },
    { id: 3, name: "อนุชา สายลุย", year: "ปี 3", interest: "ฟุตบอล" },
    { id: 4, name: "พรทิพย์ รักสุขภาพ", year: "ปี 1", interest: "โยคะ" },
  ]);

  const filteredStudents = students.filter(
    (student) =>
      student.name.includes(search) || student.interest.includes(search)
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      <main className="flex-1 px-6 sm:px-20 py-10">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">หาเพื่อนในชั้นปี</h1>

        {/* ช่องค้นหา */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="ค้นหาชื่อหรือความสนใจ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* รายชื่อเพื่อน */}
        <div className="grid gap-6 md:grid-cols-2">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <h2 className="text-xl font-semibold text-orange-600 mb-2">
                  {student.name}
                </h2>
                <p className="text-gray-600 mb-1">📘 {student.year}</p>
                <p className="text-gray-600 mb-3">⭐ สนใจ: {student.interest}</p>
                <button className="w-full bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600 transition-colors">
                  ดูโปรไฟล์
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">ไม่พบข้อมูลที่ค้นหา</p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
