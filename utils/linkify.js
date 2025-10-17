// utils/linkify.js
import React from "react";

export function linkify(str = "") {
  if (!str) return null;
  const urlRe = /(https?:\/\/[^\s]+)/g;
  const parts = str.split(urlRe);

  return parts.map((p, i) =>
    urlRe.test(p) ? (
      <a
        key={i}
        href={p}
        target="_blank"
        rel="noreferrer"
        className="underline text-blue-600 dark:text-blue-400 break-words"
      >
        {p}
      </a>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}
