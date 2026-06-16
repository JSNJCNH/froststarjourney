"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Tipe data untuk menyimpan status soal
type GameState = {
  id: number;
  isSolved: boolean;
  timeSolved: number | null;
  boardState: number[]; // Menyimpan posisi susunan per soal agar tidak reset saat di-skip
};

export default function GamePage() {
  const router = useRouter();

  // --- STATE MANAJEMEN ---
  const [countdown, setCountdown] = useState<number>(3);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(420); // 7 menit
  
  // Konfigurasi 3 soal dengan susunan awal yang sudah diacak secara valid
  // Angka 8 melambangkan petak kosong
  const [questions, setQuestions] = useState<GameState[]>([
    { id: 1, isSolved: false, timeSolved: null, boardState: [1, 0, 2, 3, 4, 5, 6, 8, 7] },
    { id: 2, isSolved: false, timeSolved: null, boardState: [3, 1, 2, 6, 4, 5, 8, 7, 0] },
    { id: 3, isSolved: false, timeSolved: null, boardState: [0, 4, 2, 3, 8, 5, 6, 1, 7] },
  ]);
  
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // --- EFEK: HITUNG MUNDUR & TIMER ---
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isGameStarted) {
      setIsGameStarted(true);
    }
  }, [countdown, isGameStarted]);

  // --- EFEK 1: MENGURANGI WAKTU SETIAP DETIK ---
  useEffect(() => {
    if (isGameStarted && timeLeft > 0) {
      // Gunakan functional state update (prev => prev - 1) agar lebih aman
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isGameStarted, timeLeft]); // Hanya bergantung pada isGameStarted dan timeLeft

  // --- EFEK 2: MENANGANI SKENARIO WAKTU HABIS ---
  useEffect(() => {
    if (timeLeft === 0) {
      localStorage.setItem("gameResults", JSON.stringify({ questions, timeLeft }));
      router.push("/result");
    }
  }, [timeLeft, questions, router]); // Terpisah dengan aman, hanya dieksekusi bila timeLeft = 0

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // --- LOGIKA SLIDING PUZZLE & CSS SPRITE ---
  const handleTileClick = (tileIndex: number) => {
    if (!isGameStarted || questions[currentIndex].isSolved) return;

    const currentBoard = [...questions[currentIndex].boardState];
    const emptyIndex = currentBoard.indexOf(8);
    
    const rowTile = Math.floor(tileIndex / 3);
    const colTile = tileIndex % 3;
    const rowEmpty = Math.floor(emptyIndex / 3);
    const colEmpty = emptyIndex % 3;

    // Cek apakah balok yang ditekan bersebelahan dengan petak kosong
    const isAdjacent = Math.abs(rowTile - rowEmpty) + Math.abs(colTile - colEmpty) === 1;

    if (isAdjacent) {
      // Lakukan pertukaran (Swap)
      [currentBoard[tileIndex], currentBoard[emptyIndex]] = [currentBoard[emptyIndex], currentBoard[tileIndex]];
      
      const newQuestions = [...questions];
      newQuestions[currentIndex].boardState = currentBoard;
      setQuestions(newQuestions);
      
      checkWinCondition(currentBoard, newQuestions);
    }
  };

    const checkWinCondition = (currentBoard: number[], currentQuestions: GameState[]) => {
    // Menang jika susunan berurutan persis [0,1,2,3,4,5,6,7,8]
    const isWin = currentBoard.every((val, i) => val === i);
    
    if (isWin) {
        currentQuestions[currentIndex].isSolved = true;
        currentQuestions[currentIndex].timeSolved = 420 - timeLeft; // Catat waktu submit
        setQuestions(currentQuestions);
        
        const totalSolved = currentQuestions.filter(q => q.isSolved).length;
        
        if (totalSolved === 3) {
        alert("Semua Map Selesai!");
        
        // -> LETAKKAN DI SINI UNTUK SKENARIO MENANG <-
        localStorage.setItem("gameResults", JSON.stringify({ questions: currentQuestions, timeLeft }));
        
        router.push("/result"); // Semua selesai, lempar ke result
        } else {
        handleNextOrSkip(currentQuestions);
        }
    }
    };

  // --- LOGIKA SKIP / NEXT ---
  // Mencari soal berikutnya yang belum di-solve, memutar kembali ke awal jika sudah di ujung array
  const handleNextOrSkip = (latestQuestions = questions) => {
    let nextIdx = (currentIndex + 1) % 3;
    while (latestQuestions[nextIdx].isSolved && nextIdx !== currentIndex) {
      nextIdx = (nextIdx + 1) % 3;
    }
    setCurrentIndex(nextIdx);
  };

  const solvedCount = questions.filter(q => q.isSolved).length;
  const activeBoard = questions[currentIndex].boardState;

  // --- RENDER UI ---
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-200">
      {/* Header */}
      <div className="w-full flex justify-between items-center pb-4 border-b-2 border-gray-400 mb-8">
        <h1 className="font-bold text-xl text-black">TULISAN MOB FT</h1>
        <h1 className="font-bold text-xl text-black">FROST STAR JOURNEY</h1>
        <div className="px-4 py-2 bg-gray-400 text-black font-semibold rounded-md">
          {solvedCount}/3 Soal Terselesaikan
        </div>
      </div>

      {!isGameStarted ? (
        <div className="flex flex-col items-center justify-center flex-1">
          <p className="text-8xl font-bold text-gray-800 animate-pulse">{countdown}</p>
        </div>
      ) : (
        <div className="flex flex-col w-full max-w-4xl relative">
          
          <div className="flex justify-between items-start mb-8">
            <div className="px-6 py-3 bg-gray-400 text-black font-bold text-2xl rounded-md shadow-inner">
              {formatTime(timeLeft)}
            </div>
            
            {/* Target Gambar Miniatur (Hint) */}
            <div 
              className="w-32 h-32 border-4 border-gray-400 shadow-lg rounded-sm"
              style={{
                backgroundImage: `url('/assets/soal${currentIndex + 1}.jpeg')`,
                backgroundSize: 'cover'
              }}
            ></div>
          </div>

          {/* Arena Puzzle 3x3 */}
          <div className="flex justify-center mb-8">
            <div className="w-[450px] h-[450px] bg-gray-400 grid grid-cols-3 gap-1 p-2 shadow-2xl rounded-sm">
              {activeBoard.map((tile, index) => (
                <div
                  key={index}
                  onClick={() => handleTileClick(index)}
                  className={`transition-transform duration-150 ${
                    tile === 8 
                      ? "bg-gray-300 shadow-inner" // Petak kosong
                      : "cursor-pointer hover:brightness-110 shadow-md"
                  }`}
                  style={
                    tile !== 8
                      ? {
                          // Memanggil gambar 1 utuh dari folder public/assets/
                          backgroundImage: `url('/assets/soal${currentIndex + 1}.jpeg')`,
                          // Memperbesar gambar menjadi 3x lipat agar pas dipotong grid 3x3
                          backgroundSize: '300% 300%',
                          // Kalkulasi letak X dan Y dari gambar utuh menggunakan persentase
                          backgroundPosition: `${(tile % 3) * 50}% ${Math.floor(tile / 3) * 50}%`,
                        }
                      : {}
                  }
                ></div>
              ))}
            </div>
          </div>

          {/* Tombol Skip */}
          <div className="absolute bottom-0 right-0">
            <button 
              onClick={() => handleNextOrSkip()}
              className="px-8 py-3 bg-gray-400 hover:bg-gray-500 text-black font-bold rounded-xl shadow-md transition-colors"
            >
              NEXT / SKIP
            </button>
          </div>

        </div>
      )}
    </main>
  );
}