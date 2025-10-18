// pages/profile.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { uploadImageToCloudinary } from "../lib/cloudinary";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    year: "ปี 1",
    interest: "",
    bio: "",
    avatar: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // โหลดผู้ใช้จาก Firebase Auth + Firestore (อ้างอิง uid เท่านั้น)
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        alert("กรุณาเข้าสู่ระบบ");
        router.push("/login");
        return;
      }
      setUser(u);

      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          setForm({
            name: data.name || "",
            year: data.year || "ปี 1",
            interest: data.interest || "",
            bio: data.bio || "",
            avatar: data.avatar || "",
          });
        } else {
          // ยังไม่มีเอกสาร: set ค่าเริ่มต้นจาก auth
          setForm((prev) => ({
            ...prev,
            name: u.displayName || prev.name,
            avatar: u.photoURL || prev.avatar,
          }));
        }
      } catch (e) {
        console.error("load profile error:", e);
      }
    });

    return () => unsub();
  }, [router]);

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("กรุณาเลือกรูปภาพเท่านั้น");
      return;
    }
    const MAX_MB = 2;
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`ไฟล์ใหญ่เกินไป (เกิน ${MAX_MB}MB)`);
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadImageToCloudinary(file);
      setForm((prev) => ({ ...prev, avatar: uploaded.secure_url }));
    } catch (e) {
      console.error(e);
      alert("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      // เคลียร์ค่า input เพื่อให้เลือกไฟล์เดิมได้อีกหากต้องการ
      e.target.value = "";
    }
  };

  const saveProfile = async () => {
    if (!auth.currentUser) {
      alert("กรุณาเข้าสู่ระบบ");
      return;
    }
    const uid = auth.currentUser.uid;

    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", uid),
        {
          id: uid,
          name: form.name.trim(),
          year: form.year,
          interest: form.interest.trim(),
          bio: form.bio.trim(),
          avatar: form.avatar,
          email: auth.currentUser.email || "",
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );

      // sync localStorage (ถ้าโปรเจกต์คุณยังใช้อยู่)
      localStorage.setItem(
        "userProfile",
        JSON.stringify({
          id: uid,
          name: form.name.trim(),
          year: form.year,
          interest: form.interest.trim(),
          bio: form.bio.trim(),
          avatar: form.avatar,
          email: auth.currentUser.email || "",
        })
      );

      alert("บันทึกโปรไฟล์แล้ว");
    } catch (e) {
      console.error("save profile error:", e);
      alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />

      <main className="flex-1 w-full">
        {/* เฮดดิ้ง + คอนเทนต์ให้อยู่กึ่งกลางเหมือนเดิม */}
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6 text-green-700 dark:text-green-400">
            โปรไฟล์ของฉัน
          </h1>

          {/* การ์ด */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-6 md:p-7 space-y-6">
            {/* Avatar + ปุ่มเปลี่ยน */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <img
                  src={form.avatar || "/default-avatar.png"}
                  alt="avatar"
                  className="w-24 h-24 rounded-full object-cover ring-2 ring-green-500/20 dark:ring-green-400/30 shadow-sm border border-gray-200 dark:border-gray-700 bg-white"
                />
                {uploading && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white text-xs">
                    อัปโหลด..
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer disabled:opacity-60">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    disabled={uploading}
                  />
                  {uploading ? "กำลังอัปโหลด..." : "เปลี่ยนรูปโปรไฟล์"}
                </label>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  แนะนำขนาดสี่เหลี่ยมจัตุรัส (เช่น 400×400px) ไฟล์ไม่เกิน 2MB
                </p>
              </div>
            </div>

            {/* ฟอร์ม */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  ชื่อที่แสดง
                </label>
                <input
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ชื่อ-นามสกุล หรือชื่อเล่น"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  ชั้นปี
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                >
                  <option>ปี 1</option>
                  <option>ปี 2</option>
                  <option>ปี 3</option>
                  <option>ปี 4</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  ความสนใจ
                </label>
                <input
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.interest}
                  onChange={(e) =>
                    setForm({ ...form, interest: e.target.value })
                  }
                  placeholder="เช่น วิ่ง, บาส, ฟิตเนส"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  แนะนำตัว
                </label>
                <textarea
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="บอกเกี่ยวกับตัวคุณ แบบสั้นๆ"
                />
              </div>
            </div>

            {/* ปุ่มบันทึก */}
            <div className="flex justify-end">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
