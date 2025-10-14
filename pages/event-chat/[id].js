import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function EventChat() {
  const router = useRouter();
  const { id } = router.query; // eventId
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [event, setEvent] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const messagesEndRef = useRef(null);

  // โหลด user profile
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("userProfile")) || {
      id: 101,
      name: "คุณสมชาย ใจดี",
      avatar: null,
    };
    setUserProfile(savedUser);
  }, []);

  // โหลดกิจกรรมและข้อความ
  useEffect(() => {
    if (!id || !userProfile) return;

    const savedEvents = JSON.parse(localStorage.getItem("events") || "[]");
    const currentEvent = savedEvents.find((e) => e.id === parseInt(id));
    setEvent(currentEvent);

    const chatKey = `eventChat_${id}`;
    const savedMessages = JSON.parse(localStorage.getItem(chatKey) || "[]");
    setMessages(savedMessages);

    // realtime update ทุก 1 วินาที
    const interval = setInterval(() => {
      const latestMessages = JSON.parse(localStorage.getItem(chatKey) || "[]");
      setMessages(latestMessages);
    }, 1000);

    return () => clearInterval(interval);
  }, [id, userProfile]);

  // เลื่อนลงอัตโนมัติ
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      userId: userProfile.id,
      name: userProfile.name,
      avatar: userProfile.avatar,
      text: input.trim(),
      time: new Date().toLocaleTimeString(),
    };

    const chatKey = `eventChat_${id}`;
    const savedMessages = JSON.parse(localStorage.getItem(chatKey) || "[]");
    const updatedMessages = [...savedMessages, newMessage];
    localStorage.setItem(chatKey, JSON.stringify(updatedMessages));

    setMessages(updatedMessages);
    setInput("");
  };

  if (!event || !userProfile) return <p className="text-center mt-20">กำลังโหลด...</p>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      <main className="flex-1 px-6 sm:px-20 py-10 flex flex-col">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">
          💬 แชทกิจกรรม: {event.title}
        </h1>

        <div className="flex-1 bg-white rounded-2xl shadow-lg p-4 overflow-y-auto mb-4 flex flex-col">
          {messages.length === 0 && (
            <p className="text-gray-400 text-center mt-4">ยังไม่มีข้อความ</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex mb-3 ${msg.userId === userProfile.id ? "justify-end" : "justify-start"}`}>
              {msg.userId !== userProfile.id && (
                <img
                  src={msg.avatar || "/default-avatar.png"}
                  alt="avatar"
                  className="w-8 h-8 rounded-full mr-2"
                />
              )}
              <div
                className={`max-w-xs px-3 py-2 rounded-xl ${
                  msg.userId === userProfile.id ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                {msg.userId !== userProfile.id && <p className="text-sm font-semibold">{msg.name}</p>}
                <p>{msg.text}</p>
                <p className="text-xs text-gray-500 mt-1 text-right">{msg.time}</p>
              </div>
              {msg.userId === userProfile.id && (
                <img
                  src={msg.avatar || "/default-avatar.png"}
                  alt="avatar"
                  className="w-8 h-8 rounded-full ml-2"
                />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
          >
            ส่ง
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
