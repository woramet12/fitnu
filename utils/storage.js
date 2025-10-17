// utils/storage.js
import { db } from "../lib/firebase";
import {
  collection, doc, getDocs, query, orderBy,
  setDoc, addDoc, deleteDoc, writeBatch
} from "firebase/firestore";

/** อ่าน events ทั้งหมด */
async function readAllEvents() {
  const q = query(collection(db, "events"), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** อ่านข้อความในอีเวนต์ */
async function readMessages(eventId) {
  const q = query(collection(db, "events", String(eventId), "messages"), orderBy("created_at", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** เพิ่มข้อความใหม่ (กันซ้ำด้วย local_id) */
async function appendMessages(eventId, msgs) {
  const existing = await readMessages(eventId);
  const existsIds = new Set(existing.map(m => String(m.local_id || m.id)));
  const colRef = collection(db, "events", String(eventId), "messages");
  const batch = writeBatch(db);
  (msgs || []).forEach((m) => {
    if (existsIds.has(String(m.id))) return;
    const ref = doc(colRef); // auto id
    batch.set(ref, {
      text: m.text,
      user: m.user,
      created_at: m.created_at || new Date().toISOString(),
      local_id: String(m.id),
    });
  });
  // ไม่มีข้อความใหม่ก็ไม่ต้อง commit
  if ((msgs || []).some(m => !existsIds.has(String(m.id)))) {
    await batch.commit();
  }
}

/** upsert เฉพาะรายการ events (ไม่ลบของเก่าแล้ว) */
async function upsertEvents(nextList) {
  const batch = writeBatch(db);
  (nextList || []).forEach((e) => {
    const id = String(e.id || "");
    if (!id) return;
    batch.set(doc(db, "events", id), { ...e, id }, { merge: true });
  });
  await batch.commit();
}

/** ลบกิจกรรมเดียว + ลบข้อความใต้กิจกรรม */
export async function safeDelete(key, id) {
  if (key !== "events" && key !== "event") {
    // key อื่น ๆ กลับไปใช้ localStorage ลบปกติ
    try { localStorage.removeItem(String(key)); return true; } catch { return false; }
  }
  const eventId = String(id);

  // 1) ลบ subcollection messages ทั้งหมด (batch)
  const msgsSnap = await getDocs(collection(db, "events", eventId, "messages"));
  if (!msgsSnap.empty) {
    const batch1 = writeBatch(db);
    msgsSnap.docs.forEach((d) => batch1.delete(d.ref));
    await batch1.commit();
  }
  // 2) ลบตัว event
  await deleteDoc(doc(db, "events", eventId));
  return true;
}

export async function safeGet(key, fallback) {
  if (key === "events") {
    try { return await readAllEvents(); } catch { return fallback ?? []; }
  }
  if (String(key).startsWith("messages_")) {
    const eventId = String(key).split("_")[1];
    try { return await readMessages(eventId); } catch { return fallback ?? []; }
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function safeSet(key, value) {
  if (key === "events" || String(key).startsWith("messages_")) {
    throw new Error("Use safeAppendList for events/messages");
  }
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

export async function safeAppendList(key, list, _maxMB = 0.5) {
  if (key === "events") {
    try { await upsertEvents(list || []); return true; } catch { return false; }
  }
  if (String(key).startsWith("messages_")) {
    const eventId = String(key).split("_")[1];
    try { await appendMessages(eventId, list || []); return true; } catch { return false; }
  }
  try { localStorage.setItem(key, JSON.stringify(list)); return true; } catch { return false; }
}
