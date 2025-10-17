import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function HomePage() {
  const router = useRouter();
  const [kw, setKw] = useState("");

  const ensureLoginThen = (go) => {
    const u = JSON.parse(localStorage.getItem("userProfile") || "null");
    if (!u) {
      alert("กรุณาเข้าสู่ระบบก่อนทำรายการนี้");
      router.push("/login");
      return;
    }
    go();
  };

  const goCreateEvent = () =>
    ensureLoginThen(() => router.push("/events"));

  const goFindFriends = () => {
    const q = kw.trim();
    // ไปหน้า friends พร้อม query ค้นหา (มีไฟล์ friends.js อยู่แล้ว)
    router.push(q ? `/friends?search=${encodeURIComponent(q)}` : "/friends");
  };

  const goUpcoming = () => router.push("/events-list");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar />

      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold text-orange-600 dark:text-orange-400">
            FitNU
          </h1>
          <p className="mt-2 text-gray-700 dark:text-gray-300">
            หาเพื่อนออกกำลังกายในชั้นปีของคุณ ที่มหาวิทยาลัยนเรศวร
          </p>
        </div>

        {/* 3 Cards */}
        <div className="max-w-6xl mx-auto mt-10 grid gap-6 md:grid-cols-3">
          {/* Card 1: สร้างกิจกรรม */}
          <div className="bg-white dark:bg-gray-900/70 rounded-2xl shadow-lg border border-white/60 dark:border-gray-700 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                สร้างกิจกรรม
              </h2>
              <p className="mt-6 text-gray-600 dark:text-gray-300">
                จัดตั้งกิจกรรมออกกำลังกายและชวนเพื่อนในชั้นปีของคุณ
              </p>
            </div>
            <button
              onClick={goCreateEvent}
              className="mt-8 w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl shadow transition"
            >
              + สร้างกิจกรรม
            </button>
          </div>

          {/* Card 2: หาเพื่อนในชั้นปี */}
          <div className="bg-white dark:bg-gray-900/70 rounded-2xl shadow-lg border border-white/60 dark:border-gray-700 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                หาเพื่อนในชั้นปี
              </h2>
              <div className="mt-6">
                <input
                  value={kw}
                  onChange={(e) => setKw(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goFindFriends()}
                  placeholder="ค้นหาชื่อหรือความสนใจ"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <button
              onClick={goFindFriends}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl shadow transition"
            >
              ค้นหา
            </button>
          </div>

          {/* Card 3: กิจกรรมที่กำลังมา */}
          <div className="bg-white dark:bg-gray-900/70 rounded-2xl shadow-lg border border-white/60 dark:border-gray-700 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                กิจกรรมที่กำลังมา
              </h2>
              <p className="mt-6 text-gray-600 dark:text-gray-300">
                ดูและเข้าร่วมกิจกรรมที่เพื่อนในชั้นปีจัดขึ้น
              </p>
            </div>
            <button
              onClick={goUpcoming}
              className="mt-8 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl shadow transition"
            >
              ดูกิจกรรม
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
