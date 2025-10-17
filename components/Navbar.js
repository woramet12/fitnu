import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Sun, Moon, Menu, X } from "lucide-react";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

export default function Navbar() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") { document.documentElement.classList.add("dark"); setDarkMode(true); }
    const u = JSON.parse(localStorage.getItem("userProfile") || "null");
    if (u) setUser(u);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const next = !darkMode;
    setDarkMode(next);
    if (next) { html.classList.add("dark"); localStorage.setItem("theme", "dark"); }
    else { html.classList.remove("dark"); localStorage.setItem("theme", "light"); }
  };

  const logout = async () => {
    try { await signOut(auth); } catch {}
    localStorage.removeItem("userProfile");
    router.push("/login");
  };

  const NavLink = ({ href, label }) => (
    <button onClick={() => { setMenuOpen(false); router.push(href); }}
      className={`block px-4 py-2 rounded-lg text-sm font-medium transition ${router.pathname === href ? "text-green-600 dark:text-green-400" : "text-gray-700 dark:text-gray-200 hover:text-green-600"}`}>
      {label}
    </button>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
          <img src="/logo-fitnu.svg" alt="FitNU" className="w-8 h-8 rounded-md border border-green-600" />
          <span className="font-bold text-lg text-green-700 dark:text-green-400">FitNU</span>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <NavLink href="/events-list" label="กิจกรรมทั้งหมด" />
          <NavLink href="/my-events" label="กิจกรรมที่เข้าร่วม" />
          <NavLink href="/my-created-events" label="กิจกรรมที่สร้าง" />
          <NavLink href="/profile" label="โปรไฟล์" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
            {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-700 dark:text-gray-200" />}
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <img src={user.avatar || "/default-avatar.png"} alt={user.name} className="w-8 h-8 rounded-full border object-cover" />
              <button onClick={logout} className="hidden md:block text-sm text-gray-600 dark:text-gray-300 hover:underline">ออกจากระบบ</button>
            </div>
          ) : (
            <button onClick={() => router.push("/login")} className="bg-green-600 text-white text-sm px-3 py-1 rounded-lg">เข้าสู่ระบบ</button>
          )}
          <button onClick={() => setMenuOpen((s) => !s)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 space-y-1">
          <NavLink href="/events-list" label="กิจกรรมทั้งหมด" />
          <NavLink href="/my-events" label="ของฉัน" />
          <NavLink href="/my-created-events" label="ที่ฉันสร้าง" />
          <NavLink href="/profile" label="โปรไฟล์" />
          <button onClick={logout} className="w-full text-left px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">ออกจากระบบ</button>
        </div>
      )}
    </nav>
  );
}
