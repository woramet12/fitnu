import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="bg-gray-100 text-center py-4 text-gray-600">
        © 2025 FitNU - หาเพื่อนออกกำลังกายในมหาวิทยาลัย
      </footer>
    </div>
  );
}
