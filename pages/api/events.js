// pages/api/events.js

let events = []; // Mock database (จะหายไปถ้า restart server)

export default function handler(req, res) {
  if (req.method === "GET") {
    // ดึงข้อมูลกิจกรรมทั้งหมด
    res.status(200).json(events);
  } else if (req.method === "POST") {
    // เพิ่มกิจกรรมใหม่
    const newEvent = {
      id: Date.now(),
      ...req.body,
    };
    events.push(newEvent);
    res.status(201).json(newEvent);
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
