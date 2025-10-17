import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { uploadImageToCloudinary } from "../lib/cloudinary";
import { db } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

/** คลาสกลางสำหรับฟิลด์ (เข้าใจ Dark mode) */
const fieldClass =
  "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400 " +
  "bg-white text-gray-900 placeholder-gray-400 border-gray-300 " +
  "dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:border-gray-700";

const labelClass = "block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200";

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

  // ====== Cropper state ======
  const [cropOpen, setCropOpen] = useState(false);
  const [rawUrl, setRawUrl] = useState(""); // URL ของรูปที่ยังไม่ครอป
  const imgRef = useRef(null);
  const frameSize = 300; // พื้นที่พรีวิว (px)
  const [scale, setScale] = useState(1.1); // ซูม
  const [pos, setPos] = useState({ x: 0, y: 0 }); // ตำแหน่งลาก
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startPos: { x: 0, y: 0 } });

  useEffect(() => {
    (async () => {
      const cached = JSON.parse(localStorage.getItem("userProfile") || "null");
      if (!cached) {
        alert("กรุณาเข้าสู่ระบบ");
        router.push("/login");
        return;
      }
      setUser(cached);
      try {
        const snap = await getDoc(doc(db, "users", String(cached.id)));
        const u = snap.exists() ? snap.data() : cached;
        setForm({
          name: u.name || "",
          year: u.year || "ปี 1",
          interest: u.interest || "",
          bio: u.bio || "",
          avatar: u.avatar || "",
        });
      } catch {
        setForm({
          name: cached.name || "",
          year: cached.year || "ปี 1",
          interest: cached.interest || "",
          bio: cached.bio || "",
          avatar: cached.avatar || "",
        });
      }
    })();
  }, [router]);

  // เปิด cropper จากไฟล์เลือก
  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("กรุณาเลือกรูปภาพเท่านั้น");
      return;
    }
    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`ไฟล์ใหญ่เกินไป (เกิน ${MAX_MB}MB)`);
      return;
    }
    const url = URL.createObjectURL(file);
    setRawUrl(url);
    setScale(1.1);
    setPos({ x: 0, y: 0 });
    setCropOpen(true);
  };

  // บันทึกรูป (ครอป + อัป Cloudinary)
  const confirmCropAndUpload = async () => {
    if (!imgRef.current) return;
    setUploading(true);
    try {
      // วาดลง canvas เป็นสี่เหลี่ยมจัตุรัส 512x512
      const canvas = document.createElement("canvas");
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      // คำนวณสเกลจากขนาดภาพจริงให้ครอบ frame
      const img = imgRef.current;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      // เราแสดงรูปในเฟรมขนาด frameSize ด้วย scale และ pos
      // ต้องคำนวณ mapping กลับไปยังสเกลจริงเพื่อ drawImage ให้พอดี
      const displayScale = scale; // ซูมที่ผู้ใช้ตั้ง
      // ขนาดภาพเมื่อวางในเฟรม (ก่อนลาก)
      const baseScale = Math.max(frameSize / iw, frameSize / ih);
      const finalScale = baseScale * displayScale;

      // พิกัดต้นทาง (บนภาพจริง) ที่จะถูกวาดลงแคนวาส
      // pos เป็นพิกัดเลื่อน (px) ในเฟรม => แปลงกลับเป็นพิกัดบนรูปจริง
      const srcW = size / finalScale;
      const srcH = size / finalScale;

      // จุดกึ่งกลางบนรูปจริงอิงจาก pos
      const centerX = iw / 2 - (pos.x / finalScale);
      const centerY = ih / 2 - (pos.y / finalScale);

      let sx = centerX - srcW / 2;
      let sy = centerY - srcH / 2;

      // กันขอบไม่ให้ออกนอกภาพจริง
      sx = Math.max(0, Math.min(sx, iw - srcW));
      sy = Math.max(0, Math.min(sy, ih - srcH));

      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, size, size);

      // ส่งขึ้น Cloudinary
      const blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
      );
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });

      const uploaded = await uploadImageToCloudinary(file);
      setForm((prev) => ({ ...prev, avatar: uploaded.secure_url }));
      setCropOpen(false);
    } catch (e) {
      console.error(e);
      alert("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (rawUrl) URL.revokeObjectURL(rawUrl);
      setRawUrl("");
    }
  };

  // drag handlers
  const onMouseDown = (e) => {
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...pos },
    };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos({
      x: dragRef.current.startPos.x + dx,
      y: dragRef.current.startPos.y + dy,
    });
  };
  const onMouseUp = () => {
    dragRef.current.dragging = false;
  };

  useEffect(() => {
    if (!cropOpen) return;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropOpen, pos]);

  const saveProfile = async () => {
    if (!user) return;
    const uid = String(user.id);
    try {
      await updateDoc(doc(db, "users", uid), {
        name: form.name.trim(),
        year: form.year,
        interest: form.interest.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar || "",
      });
      const merged = { ...user, ...form };
      localStorage.setItem("userProfile", JSON.stringify(merged));
      setUser(merged);
      alert("บันทึกโปรไฟล์แล้ว");
    } catch {
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

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-6 border border-gray-200 dark:border-gray-700">
          {/* Avatar + upload */}
          <div className="flex items-center gap-4">
            <img
              src={form.avatar || "/default-avatar.png"}
              alt="avatar"
              className="w-20 h-20 rounded-full object-cover border border-gray-300 dark:border-gray-600"
            />
            <div className="flex gap-2">
              <label className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer">
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
          </div>

          {/* Form */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>ชื่อที่แสดง</label>
              <input
                className={fieldClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ชื่อที่แสดง"
              />
            </div>
            <div>
              <label className={labelClass}>ชั้นปี</label>
              <select
                className={fieldClass}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              >
                <option>ปี 1</option>
                <option>ปี 2</option>
                <option>ปี 3</option>
                <option>ปี 4</option>
                <option>ปี อื่นๆ</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>ความสนใจ</label>
              <input
                className={fieldClass}
                value={form.interest}
                onChange={(e) =>
                  setForm({ ...form, interest: e.target.value })
                }
                placeholder="ความสนใจ"
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>แนะนำตัว</label>
              <textarea
                className={fieldClass}
                rows={4}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="บอกเกี่ยวกับตัวคุณ"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveProfile}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              บันทึก
            </button>
          </div>
        </div>
      </main>
      <Footer />

      {/* ====== Cropper Modal ====== */}
      {cropOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 w-full max-w-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              จัดรูปโปรไฟล์ (ลากเพื่อเลื่อน + ซูม)
            </h3>

            {/* พื้นที่พรีวิวเป็นวงกลม */}
            <div
              className="mx-auto rounded-full overflow-hidden border border-gray-300 dark:border-gray-700"
              style={{ width: frameSize, height: frameSize }}
              onMouseDown={onMouseDown}
            >
              {rawUrl && (
                <img
                  ref={imgRef}
                  src={rawUrl}
                  alt="raw"
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                    cursor: "grab",
                    userSelect: "none",
                  }}
                />
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                ซูม: {scale.toFixed(2)}x
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="mt-6 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setCropOpen(false);
                  if (rawUrl) URL.revokeObjectURL(rawUrl);
                  setRawUrl("");
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmCropAndUpload}
                disabled={uploading}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
              >
                {uploading ? "กำลังบันทึก..." : "บันทึกรูป"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
