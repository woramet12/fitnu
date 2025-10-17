// pages/_app.js
import "../styles/globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../contexts/AuthContext";

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <Toaster position="top-center" />
    </AuthProvider>
  );
}
