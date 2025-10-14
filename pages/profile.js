import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("userProfile");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser({
        id: 101,
        name: "คุณสมชาย ใจดี",
        year: "ปี 2",
        interest: "ฟิตเนส, ฟุตบอล",
        email: "somchai123@nu.ac.th",
        bio: "ผมชอบออกกำลังกายตอนเย็น ชอบเล่นบอลและฟิตเนส 🚴‍♂️",
        avatar: "", // เพิ่มช่องเก็บรูป
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  // ฟังก์ชันอัพโหลดรูป
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser({ ...user, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    localStorage.setItem("userProfile", JSON.stringify(user));
    setIsEditing(false);
    alert("บันทึกโปรไฟล์เรียบร้อย! 🎉");
  };

  if (!user) return <p className="text-center mt-20">กำลังโหลด...</p>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      <main className="flex-1 px-6 sm:px-20 py-10">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">โปรไฟล์ของฉัน</h1>

        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-xl mx-auto space-y-4 text-center">
          {/* รูปโปรไฟล์ */}
          <div className="flex flex-col items-center">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-orange-400 shadow-md"
              />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 text-4xl border-4 border-gray-300">
                👤
              </div>
            )}
            {isEditing && (
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-3"
              />
            )}
          </div>

          {isEditing ? (
            <>
              <div>
                <label className="block text-gray-700 mb-1">ชื่อ</label>
                <input
                  type="text"
                  name="name"
                  value={user.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ปี</label>
                <input
                  type="text"
                  name="year"
                  value={user.year}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">ความสนใจ</label>
                <input
                  type="text"
                  name="interest"
                  value={user.interest}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">อีเมล</label>
                <input
                  type="email"
                  name="email"
                  value={user.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={user.bio}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none"
                ></textarea>
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-orange-500 text-white py-2 rounded-xl hover:bg-orange-600 transition-colors"
              >
                💾 บันทึก
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-orange-600 mb-2">{user.name}</h2>
              <p className="text-gray-600 mb-2">📘 {user.year}</p>
              <p className="text-gray-600 mb-2">⭐ ความสนใจ: {user.interest}</p>
              <p className="text-gray-600 mb-2">📧 {user.email}</p>
              <p className="text-gray-700 mt-4">{user.bio}</p>

              <button
                onClick={() => setIsEditing(true)}
                className="mt-6 w-full bg-orange-500 text-white py-2 rounded-xl hover:bg-orange-600 transition-colors"
              >
                ✏️ แก้ไขโปรไฟล์
              </button>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
