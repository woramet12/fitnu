import React from "react";

export default function Footer() {
  return (
    <footer className="text-center py-6 bg-gray-100 text-gray-600 text-sm mt-10">
      &copy; {new Date().getFullYear()} FitNU – มหาวิทยาลัยนเรศวร
    </footer>
  );
}
