"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type GameState = { id: number; isSolved: boolean; timeSolved: number | null; };

export default function ResultPage() {
  const router = useRouter();
  const [results, setResults] = useState<GameState[]>([]);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedData = localStorage.getItem("gameResults");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setResults(parsedData.questions);
      const count = parsedData.questions.filter((q: GameState) => q.isSolved).length;
      setSolvedCount(count);
    }
  }, []);

  const formatSubmitTime = (seconds: number | null) => {
    if (seconds === null) return "-";
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`; 
  };

  const handleBackToStart = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (token.toUpperCase() === "GOODJOB") {
      localStorage.removeItem("gameResults");
      router.push("/");
    } else {
      setError("Token Keluar Salah!");
    }
  };

  return (
    <main className="flex h-screen w-full items-center justify-center bg-cover bg-center p-6" style={{ backgroundImage: "url('/assets/bg-awan.png')" }}>
      
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col items-center rounded-[2rem] bg-white/30 p-8 shadow-2xl backdrop-blur-md border border-white/40">
        
        {/* Kiri Atas: Logo */}
        <div className="absolute top-8 left-8 flex flex-col items-center leading-none">
          <span className="font-mestizo text-4xl font-bold text-white drop-shadow-md [-webkit-text-stroke:1px_#8C8282]">MOBFT</span>
          <span className="font-mestizo text-xl font-bold text-white drop-shadow-md [-webkit-text-stroke:1px_#8C8282]">2026</span>
        </div>

        {/* Tengah Atas: Judul */}
        <h1 className="font-mestizo mt-2 text-4xl md:text-5xl font-bold text-[#D3C1A1] [-webkit-text-stroke:2px_#382A1D] drop-shadow-lg tracking-widest mb-8">
          FROST STAR JOURNEY
        </h1>

        <h2 className="text-4xl font-semibold text-black tracking-wide font-serif mb-4">
          Waktu Telah Habis
        </h2>
        
        <div className="rounded-full border-[3px] border-[#382A1D] bg-[#F8F1E1] px-12 py-2 font-bold text-black shadow-sm mb-8">
          {solvedCount}/3 Soal Terselesaikan
        </div>

        {/* Kotak Rekap Waktu (Cream Box) */}
        <div className="flex w-full max-w-3xl flex-col items-center rounded-3xl border-[4px] border-[#382A1D] bg-[#FDF8EE] p-8 shadow-xl mb-12">
          <h3 className="text-3xl font-semibold text-black font-serif mb-8">Waktu Submit Soal</h3>
          
          <div className="flex justify-center gap-8 w-full">
            {[1, 2, 3].map((soalId) => {
              const soalData = results.find(r => r.id === soalId);
              return (
                <div key={soalId} className="flex flex-col items-center justify-center w-36 h-36 rounded-2xl border-[3px] border-[#382A1D] bg-[#FFD12D] shadow-[4px_4px_0px_#382A1D]">
                  <span className="text-black font-serif text-lg mb-2">Soal {soalId}</span>
                  <span className="text-black font-bold text-3xl">
                    {formatSubmitTime(soalData?.timeSolved ?? null)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Input Exit & Button (Berdampingan) */}
        <form onSubmit={handleBackToStart} className="flex items-center gap-4 absolute bottom-12">
          <div className="flex flex-col">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-64 rounded-full border-[3px] border-[#382A1D] bg-[#F8F1E1] px-6 py-3 text-center text-black font-semibold focus:outline-none focus:ring-4 focus:ring-yellow-300"
              placeholder=""
              required
            />
            {error && <p className="text-red-600 font-bold text-sm absolute -bottom-6 left-6">{error}</p>}
          </div>
          
          <button 
            type="submit"
            className="rounded-xl border-[3px] border-[#382A1D] bg-[#FFD12D] px-8 py-3 text-lg font-bold text-black shadow-[4px_4px_0px_#382A1D] hover:translate-y-1 hover:shadow-[2px_2px_0px_#382A1D] transition-all"
          >
            BACK
          </button>
        </form>

      </div>
    </main>
  );
}