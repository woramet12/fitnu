// utils/dates.js
export const sameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return da.toDateString() === db.toDateString();
};

export const formatDay = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const formatTime = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
