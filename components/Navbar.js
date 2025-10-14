import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <Link href="/" className="text-2xl font-bold text-orange-600">
        FitNU
      </Link>
      <div className="flex gap-6">
        <Link href="/" className="hover:text-orange-500">หน้าแรก</Link>
        <Link href="/my-events" className="hover:text-orange-500">กิจกรรมที่เข้าร่วม</Link>
        <Link href="/my-created-events" className="hover:text-orange-500">กิจกรรมที่สร้าง</Link>
        <Link href="/profile" className="hover:text-orange-500">โปรไฟล์</Link>
        <Link href="/login" className="hover:text-orange-500">เข้าสู่ระบบ</Link>
        <Link href="/register" className="hover:text-orange-500">สมัครสมาชิก</Link>
      </div>
    </nav>
  );
}
