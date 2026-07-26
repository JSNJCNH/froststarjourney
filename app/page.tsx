"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Jika Anda memakai API backend:
    // const res = await fetch("/api/verify-token", { ... })
    // Tapi untuk contoh cepat, kita validasi langsung:
    if (token.toUpperCase() === "MOBFT26") {
      router.push("/game");
    } else {
      setError("Token tidak valid!");
    }
  };

  return (
    // Background awan full screen
    <main className="flex h-screen w-full items-center justify-center bg-cover bg-center p-6" style={{ backgroundImage: "url('/assets/bg-awan.png')" }}>
      
      {/* Glassmorphism Card */}
      <div className="relative flex h-[85vh] w-full max-w-5xl flex-col items-center justify-center rounded-[2rem] bg-white/30 p-8 shadow-2xl backdrop-blur-md border border-white/40">
        
        {/* Logo Pojok Kiri Atas */}
        <div className="absolute top-8 left-8 flex flex-col items-center leading-none">
          <span className="font-mestizo text-4xl font-bold text-white drop-shadow-md [-webkit-text-stroke:1px_#8C8282]">MOBFT</span>
          <span className="font-mestizo text-xl font-bold text-white drop-shadow-md [-webkit-text-stroke:1px_#8C8282]">2026</span>
        </div>

        {/* Judul Utama */}
        <h1 className="font-mestizo mb-12 text-5xl md:text-6xl font-bold text-[#D3C1A1] [-webkit-text-stroke:0.1px_#382A1D] drop-shadow-lg text-center tracking-widest">
          FROST STAR JOURNEY
        </h1>

        <h2 className="mb-6 text-2xl font-semibold text-black tracking-wide font-serif">
          Masukkan Token Untuk Bermain !!
        </h2>

        {/* Form Input */}
        <form onSubmit={handleLogin} className="flex flex-col items-center">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter the Code!!"
            className="mb-2 w-80 rounded-full border-[3px] border-[#382A1D] bg-[#F8F1E1] px-6 py-3 text-center text-black font-semibold focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-all shadow-md placeholder-gray-500"
            required
          />
          {error && <p className="mb-4 text-sm font-bold text-red-600 drop-shadow-sm">{error}</p>}
          
          <button
            type="submit"
            className="mt-6 rounded-xl border-[3px] border-[#382A1D] bg-[#FFD12D] px-12 py-2 text-xl font-bold text-black shadow-[4px_4px_0px_#382A1D] hover:translate-y-1 hover:shadow-[2px_2px_0px_#382A1D] transition-all"
          >
            NEXT
          </button>
        </form>

      </div>
    </main>
  );
}