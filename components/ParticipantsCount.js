// components/ParticipantsCount.js
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * แสดงจำนวนผู้เข้าร่วมแบบ "สด" โดยตรวจเอกสาร users/{uid} จริงๆ
 * - participants: [{ id, name, avatar }, ...]
 */
export default function ParticipantsCount({ participants = [] }) {
  const [count, setCount] = useState(participants.length);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const ids = participants.map((p) => p?.id).filter(Boolean);
      if (ids.length === 0) {
        if (!cancelled) setCount(0);
        return;
      }
      try {
        const snaps = await Promise.all(
          ids.map((uid) => getDoc(doc(db, "users", String(uid))))
        );
        const valid = snaps.filter((s) => s.exists()).length;
        if (!cancelled) setCount(valid);
      } catch {
        // ถ้าเช็กพลาด ให้ใช้จำนวนเดิม เพื่อไม่ให้ UX สะดุด
        if (!cancelled) setCount(participants.length);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [participants]);

  return (
    <div className="text-sm text-gray-700 dark:text-gray-300">
      ผู้เข้าร่วม: {count} คน
    </div>
  );
}
