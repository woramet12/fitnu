// pages/_app.js
import "@/styles/globals.css";
import Link from "next/link";

export default function App({ Component, pageProps }) {
  return (
    <div>
      {/* Navbar */}
      <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center">
        <h1 className="font-bold text-lg">FitNu</h1>
        <div className="space-x-4">
          <Link href="/profile" className="hover:underline">โปรไฟล์</Link>
          <Link href="/events" className="hover:underline">กิจกรรม</Link>
          <Link href="/login" className="hover:underline">ออกจากระบบ</Link>
        </div>
      </nav>

      {/* Page Content */}
      <main className="p-6">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
