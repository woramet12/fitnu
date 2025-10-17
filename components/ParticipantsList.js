// components/ParticipantsList.js
import { useEffect, useMemo, useState } from "react";
import AvatarStack from "./AvatarStack";
import { db } from "../lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";

/**
 * บางโปรเจกต์ใช้ doc id = uid (แนะนำ) แต่บางทีอาจเคยสร้างเอกสารแบบมี field id ภายใน
 * ฟังก์ชันนี้จะเช็กให้ครบทั้งสองแบบ: (1) ตาม doc id ตรงๆ (2) ตาม field id == uid
 */
async function userExists(uid) {
  const ref = doc(db, "users", String(uid));
  const snap = await getDoc(ref);
  if (snap.exists()) return true;

  // เผื่อเคยบันทึกแบบ docId สุ่ม แต่มี field id = uid
  const q = query(collection(db, "users"), where("id", "==", String(uid)), limit(1));
  const byField = await getDocs(q);
  return !byField.empty;
}

export default function ParticipantsList({ participants = [], limitNames = 4 }) {
  const [valid, setValid] = useState(participants);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const ids = participants.map((p) => p?.id).filter(Boolean);
      if (ids.length === 0) {
        if (!cancelled) setValid([]);
        return;
      }

      try {
        // เช็กว่าผู้ใช้แต่ละคนยังมีเอกสารใน Firestore อยู่จริงไหม
        const existPairs = await Promise.all(
          ids.map(async (uid) => [uid, await userExists(uid)])
        );
        const existsSet = new Set(existPairs.filter(([, ok]) => ok).map(([uid]) => String(uid)));
        const filtered = participants.filter((p) => existsSet.has(String(p.id)));

        if (!cancelled) setValid(filtered);
      } catch (e) {
        console.warn("participants filter error:", e);
        if (!cancelled) setValid(participants); // fallback แสดงตามเดิม
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [participants]);

  // UI แสดงรายชื่อหลังกรอง
  const names = useMemo(() => valid.map((p) => p?.name || "ไม่ระบุ"), [valid]);
  const hasExtra = names.length > limitNames;
  const shown = names.slice(0, limitNames).join(", ");

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm leading-snug text-gray-800 dark:text-gray-200">
        {valid.length === 0 ? (
          <span className="text-gray-600 dark:text-gray-400">-</span>
        ) : hasExtra ? (
          <>
            {shown}{" "}
            <span className="text-gray-600 dark:text-gray-400">
              และอีก {names.length - limitNames} คน
            </span>
          </>
        ) : (
          names.join(", ")
        )}
      </div>
      <AvatarStack users={valid} />
    </div>
  );
}
