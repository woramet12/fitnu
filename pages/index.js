import React from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar"; // ✅ import Navbar

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-200 to-blue-100 flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Header */}
      <header className="text-center py-12">
        <h1 className="text-5xl font-bold text-orange-600 mb-4">FitNU</h1>
        <p className="text-lg text-gray-700 max-w-xl mx-auto">
          หาเพื่อนออกกำลังกายในชั้นปีของคุณ ที่มหาวิทยาลัยนเรศวร
        </p>
      </header>

      {/* Main content */}
      <main className="flex-1 grid gap-6 md:grid-cols-2 lg:grid-cols-3 px-6 sm:px-20">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:scale-105 transition-transform">
          <h2 className="text-xl font-semibold mb-4">สร้างกิจกรรม</h2>
          <p className="text-gray-600 mb-4">
            จัดตั้งกิจกรรมออกกำลังกายและชวนเพื่อนในชั้นปีของคุณ
          </p>
          <Link href="/events">
            <button className="w-full bg-orange-500 text-white py-2 rounded-xl hover:bg-orange-600 transition-colors">
              + สร้างกิจกรรม
            </button>
          </Link>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:scale-105 transition-transform">
          <h2 className="text-xl font-semibold mb-4">หาเพื่อนในชั้นปี</h2>
          <input
            type="text"
            placeholder="ค้นหาชื่อหรือความสนใจ"
            className="mb-4 px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <Link href="/friends">
            <button className="w-full bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600 transition-colors">
              ค้นหา
            </button>
          </Link>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:scale-105 transition-transform">
          <h2 className="text-xl font-semibold mb-4">กิจกรรมที่กำลังมา</h2>
          <p className="text-gray-600 mb-4">
            ดูและเข้าร่วมกิจกรรมที่เพื่อนในชั้นปีจัดขึ้น
          </p>
          <Link href="/events-list">
            <button className="w-full bg-green-500 text-white py-2 rounded-xl hover:bg-green-600 transition-colors">
              ดูกิจกรรม
            </button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
