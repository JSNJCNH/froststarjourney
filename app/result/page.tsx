"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Tipe data untuk mencocokkan format yang dikirim dari halaman game
type GameState = {
  id: number;
  isSolved: boolean;
  timeSolved: number | null;
};

// WAJIB: export default function agar dikenali oleh Next.js sebagai halaman
export default function ResultPage() {
  const router = useRouter();
  const [results, setResults] = useState<GameState[]>([]);
  const [solvedCount, setSolvedCount] = useState<number>(0);

  useEffect(() => {
    // Mengambil data skor dari Local Storage yang disimpan saat game selesai/waktu habis
    const storedData = localStorage.getItem("gameResults");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setResults(parsedData.questions);
      
      // Menghitung berapa soal yang statusnya isSolved = true
      const count = parsedData.questions.filter((q: GameState) => q.isSolved).length;
      setSolvedCount(count);
    }
  }, []);

  // Fungsi untuk memformat waktu dari detik ke MM.SS
  const formatSubmitTime = (seconds: number | null) => {
    if (seconds === null) return "-";
    
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}.${s}`; 
  };

  const handleBackToStart = () => {
    // Bersihkan sesi permainan agar kelompok selanjutnya bisa main dari awal
    localStorage.removeItem("gameResults");
    router.push("/");
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-200">
      {/* Header */}
      <div className="w-full flex justify-between items-center pb-4 border-b-2 border-gray-400 mb-12">
        <h1 className="font-bold text-xl text-black">TULISAN MOB FT</h1>
        <h1 className="font-bold text-xl text-black">FROST STAR JOURNEY</h1>
      </div>

      <div className="flex flex-col items-center w-full max-w-3xl flex-1">
        
        {/* Status Akhir */}
        <h2 className="text-3xl font-bold text-black mb-4">WAKTU TELAH HABIS / SELESAI</h2>
        <div className="px-6 py-2 bg-gray-400 text-black font-semibold rounded-md mb-12 shadow-sm">
          {solvedCount}/3 Soal Terselesaikan
        </div>

        {/* Tabel Waktu Submit */}
        <div className="bg-white rounded-xl w-full p-8 shadow-md flex flex-col items-center relative">
          <h3 className="text-2xl font-bold text-black mb-8">WAKTU SUBMIT SOAL</h3>
          
          <div className="flex justify-center gap-8 w-full mb-4">
            {/* Iterasi untuk menampilkan 3 Box Soal */}
            {[1, 2, 3].map((soalId) => {
              const soalData = results.find(r => r.id === soalId);
              return (
                <div key={soalId} className="flex flex-col items-center w-32 bg-gray-300 rounded-md py-4 shadow-inner">
                  <span className="text-gray-700 font-semibold mb-2 text-sm tracking-wide">
                    SOAL {soalId}
                  </span>
                  <span className="text-black font-bold text-xl">
                    {formatSubmitTime(soalData?.timeSolved ?? null)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tombol Back */}
        <div className="w-full flex justify-end mt-8 relative">
          <button 
            onClick={handleBackToStart}
            className="px-10 py-3 bg-gray-400 hover:bg-gray-500 text-black font-bold rounded-xl shadow-md transition-colors z-10"
          >
            BACK
          </button>
        </div>

      </div>
    </main>
  );
}