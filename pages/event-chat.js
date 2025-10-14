import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useRouter } from "next/router";

export default function EventChat() {
  const [userProfile, setUserProfile] = useState(null);
  const [event, setEvent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("userProfile"));
    setUserProfile(savedUser);

    const currentEvent = JSON.parse(localStorage.getItem("currentChatEvent"));
    if (!currentEvent) {
      alert("ไม่มีข้อมูลกิจกรรม");
      router.push("/events-list");
      return;
    }
    setEvent(currentEvent);

    const chatMessages = JSON.parse(localStorage.getItem(`chat_${currentEvent.id}`)) || [];
    setMessages(chatMessages);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const messageObj = {
      sender: userProfile,
      text: newMessage,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, messageObj];
    setMessages(updatedMessages);
    localStorage.setItem(`chat_${event.id}`, JSON.stringify(updatedMessages));
    setNewMessage("");
  };

  if (!userProfile || !event) return <p className="text-center mt-20">กำลังโหลด...</p>;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      <main className="flex-1 flex flex-col px-6 sm:px-20 py-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">
          💬 แชทกิจกรรม: {event.title}
        </h1>

        <div className="flex-1 bg-white rounded-2xl shadow-lg p-4 flex flex-col overflow-y-auto mb-4">
          {messages.length === 0 && <p className="text-gray-400 text-center mt-4">ยังไม่มีข้อความ</p>}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2 mb-2 ${msg.sender.id === userProfile.id ? "justify-end" : "justify-start"}`}
            >
              {msg.sender.id !== userProfile.id && (
                <img
                  src={msg.sender.avatar || "/default-avatar.png"}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div
                className={`px-3 py-2 rounded-xl max-w-xs break-words ${
                  msg.sender.id === userProfile.id ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                <p>{msg.text}</p>
                <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              {msg.sender.id === userProfile.id && (
                <img
                  src={msg.sender.avatar || "/default-avatar.png"}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="พิมพ์ข้อความ..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-400 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            ส่ง
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
