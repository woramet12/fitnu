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

  // โหลดผู้ใช้จาก Firebase Auth + Firestore (อ้างอิง uid เท่านั้น)
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        alert("กรุณาเข้าสู่ระบบ");
        router.push("/login");
        return;
      }
      setUser(u); // เก็บตัว auth user

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
          // ยังไม่มีเอกสาร สร้างค่าเริ่มต้นจาก auth
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
    }
  };

  const saveProfile = async () => {
    if (!auth.currentUser) {
      alert("กรุณาเข้าสู่ระบบ");
      return;
    }
    const uid = auth.currentUser.uid;

    try {
      // ใช้ setDoc + merge เพื่อให้สร้างเอกสารใหม่ได้ถ้ายังไม่มี
      await setDoc(
        doc(db, "users", uid),
        {
          id: uid,                // เก็บ id = uid เสมอ
          name: form.name,
          year: form.year,
          interest: form.interest,
          bio: form.bio,
          avatar: form.avatar,
          email: auth.currentUser.email || "",
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );

      // sync localStorage (ถ้าคุณยังใช้อยู่)
      localStorage.setItem(
        "userProfile",
        JSON.stringify({
          id: uid,
          name: form.name,
          year: form.year,
          interest: form.interest,
          bio: form.bio,
          avatar: form.avatar,
          email: auth.currentUser.email || "",
        })
      );

      alert("บันทึกโปรไฟล์แล้ว");
    } catch (e) {
      console.error("save profile error:", e);
      alert("บันทึกไม่สำเร็จ");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 text-green-700 dark:text-green-400">
          โปรไฟล์ของฉัน
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={form.avatar || "/default-avatar.png"}
              alt="avatar"
              className="w-20 h-20 rounded-full object-cover border"
            />
            <label className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer">
              {uploading ? "กำลังอัปโหลด..." : "เปลี่ยนรูปโปรไฟล์"}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarFile}
                disabled={uploading}
              />
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">
                ชื่อที่แสดง
              </label>
              <input
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-900"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">
                ชั้นปี
              </label>
              <select
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-900"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              >
                <option>ปี 1</option>
                <option>ปี 2</option>
                <option>ปี 3</option>
                <option>ปี 4</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 dark:text-gray-300">
                ความสนใจ
              </label>
              <input
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-900"
                value={form.interest}
                onChange={(e) => setForm({ ...form, interest: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 dark:text-gray-300">
                แนะนำตัว
              </label>
              <textarea
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-900"
                rows={4}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveProfile}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              บันทึก
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
