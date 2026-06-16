// app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Memanggil API backend Next.js
    const res = await fetch("/api/verify-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      // Jika token benar, arahkan ke halaman game
      router.push("/game");
    } else {
      // Jika salah, tampilkan pesan error
      setError(data.message);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-200">
      <div className="absolute top-0 w-full flex justify-between p-4 border-b border-gray-400 bg-gray-300">
        <h1 className="font-bold text-xl text-black">TULISAN MOB FT</h1>
        <h1 className="font-bold text-xl text-black">FROST STAR JOURNEY</h1>
      </div>

      <div className="flex flex-col items-center mt-10">
        <h2 className="text-2xl font-bold text-black mb-6 text-center">
          MASUKKAN TOKEN<br />UNTUK BERMAIN
        </h2>
        
        <form onSubmit={handleLogin} className="flex flex-col items-center">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="px-4 py-2 text-black border rounded-md w-64 mb-4 text-center focus:outline-none"
            placeholder="Masukkan Token"
            required
          />
          {error && <p className="text-red-500 mb-4 font-semibold">{error}</p>}
          <button 
            type="submit" 
            className="px-8 py-2 bg-gray-400 hover:bg-gray-500 text-black font-bold rounded-xl"
          >
            NEXT
          </button>
        </form>
      </div>
    </main>
  );
}