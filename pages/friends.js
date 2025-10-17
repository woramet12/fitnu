import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { db } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit
} from "firebase/firestore";

export default function Friends() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Guard + ตั้งค่าเริ่มจาก query
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("userProfile") || "null");
    if (!u) {
      alert("กรุณาเข้าสู่ระบบ");
      router.replace("/login");
      return;
    }
    setUser(u);

    // read initial search from ?search=
    const initQ = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("search") || ""
      : "";
    setSearch(initQ);
  }, [router]);

  // โหลด users แบบ realtime
  useEffect(() => {
    if (!user) return;
    const qRef = query(
      collection(db, "users"),
      orderBy("created_at", "desc"),
      limit(500)
    );
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const rows = snap.docs
          .map((d) => d.data())
          .filter((s) => String(s.id) !== String(user.id));
        setStudents(rows);
        setLoading(false);
      },
      () => {
        setStudents([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  // sync คำค้นลง URL (debounce 300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      const q = new URLSearchParams(window.location.search);
      if (search) q.set("search", search);
      else q.delete("search");
      const href = `${router.pathname}${q.toString() ? "?" + q.toString() : ""}`;
      router.replace(href, undefined, { shallow: true });
    }, 300);
    return () => clearTimeout(t);
  }, [search, router]);

  // filter ฝั่ง client
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const interest = (s.interest || "").toLowerCase();
      const year = (s.year || "").toLowerCase();
      return (
        name.includes(q) ||
        interest.includes(q) ||
        year.includes(q)
      );
    });
  }, [students, search]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Navbar />
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              เพื่อน/ผู้ใช้ทั้งหมด
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              แสดงผลแบบเรียลไทม์จากระบบ
              {loading ? "" : ` • ${filtered.length} คน`}
            </p>
          </div>
          <div className="w-full md:w-80">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ / ความสนใจ / ชั้นปี"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-gray-600 dark:text-gray-300">กำลังโหลดข้อมูล...</div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">ไม่พบผลลัพธ์</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="border rounded-xl p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={s.avatar || "/default-avatar.png"}
                    className="w-12 h-12 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                    alt={s.name || "user"}
                  />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {s.name || "-"}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {s.year || ""}
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-gray-700 dark:text-gray-200">
                  {s.interest || "-"}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
