"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type GameState = {
  id: number;
  imageId: number; 
  isSolved: boolean;
  timeSolved: number | null;
  boardState: number[];
};

export default function GamePage() {
  const router = useRouter();

  // State Hydration
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const [countdown, setCountdown] = useState<number>(3);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(420); 
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
  
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [questions, setQuestions] = useState<GameState[]>([
    { id: 1, imageId: 1, isSolved: false, timeSolved: null, boardState: [7, 6, 5, 4, 3, 2, 1, 0, 8] },
    { id: 2, imageId: 2, isSolved: false, timeSolved: null, boardState: [5, 4, 6, 3, 8, 7, 2, 1, 0] },
    { id: 3, imageId: 3, isSolved: false, timeSolved: null, boardState: [2, 7, 0, 5, 8, 3, 6, 1, 4] },
  ]);

  // 1. INISIALISASI & LOAD PROGRESS
  useEffect(() => {
    const savedProgress = localStorage.getItem("frostStarProgress");
    
    if (savedProgress) {
      const parsedData = JSON.parse(savedProgress);
      setQuestions(parsedData.questions);
      setTimeLeft(parsedData.timeLeft);
      setCurrentIndex(parsedData.currentIndex);
      setIsGameStarted(parsedData.isGameStarted);
      setCountdown(0); 
    } else {
      const randomImages = [1, 2, 3, 4, 5, 6].sort(() => 0.5 - Math.random()).slice(0, 3);
      setQuestions(prev => prev.map((q, i) => ({
        ...q,
        imageId: randomImages[i] 
      })));
    }
    setIsLoaded(true); // <--- INI YANG SEBELUMNYA HILANG
  }, []);

  // 2. AUTO-SAVE PROGRESS
  useEffect(() => {
    if (isLoaded && isGameStarted) {
      const progressData = { questions, timeLeft, currentIndex, isGameStarted };
      localStorage.setItem("frostStarProgress", JSON.stringify(progressData));
    }
  }, [questions, timeLeft, currentIndex, isGameStarted, isLoaded]);

  // TIMER & HITUNG MUNDUR
  useEffect(() => {
    if (countdown > 0 && isLoaded) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isGameStarted && isLoaded) {
      setIsGameStarted(true);
    }
  }, [countdown, isGameStarted, isLoaded]);

  useEffect(() => {
    if (isGameStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isGameStarted, timeLeft]); 

  // WAKTU HABIS
  useEffect(() => {
    if (timeLeft === 0 && isLoaded) {
      localStorage.removeItem("frostStarProgress");
      localStorage.setItem("gameResults", JSON.stringify({ questions, timeLeft }));
      router.push("/result");
    }
  }, [timeLeft, questions, router, isLoaded]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // --- FUNGSI ADMIN RESET ---
  const handleEmergencyReset = () => {
    const isConfirmed = window.confirm("Panitia: Apakah Anda yakin ingin mereset permainan dan kembali ke halaman awal?");
    
    if (isConfirmed) {
      // 1. Matikan indikator game agar useEffect auto-save langsung lumpuh
      setIsGameStarted(false);
      setIsLoaded(false); 

      // 2. Beri jeda 100 milidetik agar React selesai menghentikan proses latar belakangnya
      setTimeout(() => {
        // Hapus paksa seluruh storage yang berhubungan dengan game ini
        localStorage.removeItem("frostStarProgress"); 
        localStorage.removeItem("gameResults"); // Jaga-jaga bersihkan result juga
        
        // 3. Paksa navigasi hard-refresh ke halaman utama
        window.location.href = "/"; 
      }, 100);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => { setIsToastVisible(true); }, 10);
    setTimeout(() => {
      setIsToastVisible(false);
      setTimeout(() => { setToastMessage(null); }, 300);
    }, 2000);
  };

  const handleTileClick = (tileIndex: number) => {
    if (!isGameStarted || questions[currentIndex].isSolved) return;

    const currentBoard = [...questions[currentIndex].boardState];
    const emptyIndex = currentBoard.indexOf(8);
    
    const rowTile = Math.floor(tileIndex / 3);
    const colTile = tileIndex % 3;
    const rowEmpty = Math.floor(emptyIndex / 3);
    const colEmpty = emptyIndex % 3;

    const isAdjacent = Math.abs(rowTile - rowEmpty) + Math.abs(colTile - colEmpty) === 1;

    if (isAdjacent) {
      [currentBoard[tileIndex], currentBoard[emptyIndex]] = [currentBoard[emptyIndex], currentBoard[tileIndex]];
      
      const newQuestions = [...questions];
      newQuestions[currentIndex].boardState = currentBoard;
      setQuestions(newQuestions);
      
      checkWinCondition(currentBoard, newQuestions);
    }
  };

  const checkWinCondition = (currentBoard: number[], currentQuestions: GameState[]) => {
    const isWin = currentBoard.every((val, i) => val === i);
    
    if (isWin) {
      currentQuestions[currentIndex].isSolved = true;
      currentQuestions[currentIndex].timeSolved = 420 - timeLeft; 
      setQuestions(currentQuestions);
      
      const totalSolved = currentQuestions.filter(q => q.isSolved).length;
      
      if (totalSolved === 3) {
        showToast("Luar Biasa! Semua Map Selesai!");
        localStorage.removeItem("frostStarProgress"); 
        localStorage.setItem("gameResults", JSON.stringify({ questions: currentQuestions, timeLeft }));
        
        setTimeout(() => {
          router.push("/result");
        }, 2000); 
      } else {
        showToast("Map Berhasil Diselesaikan!");
        handleNextOrSkip(currentQuestions);
      }
    }
  };

  const handleNextOrSkip = (latestQuestions = questions) => {
    let nextIdx = (currentIndex + 1) % 3;
    while (latestQuestions[nextIdx].isSolved && nextIdx !== currentIndex) {
      nextIdx = (nextIdx + 1) % 3;
    }
    setCurrentIndex(nextIdx);
  };

  // Mencegah kedipan UI
  if (!isLoaded) {
    return <main className="flex h-screen items-center justify-center bg-[#8ab6d6]"></main>;
  }

  const solvedCount = questions.filter(q => q.isSolved).length;
  const activeBoard = questions[currentIndex]?.boardState || [];
  const activeImageId = questions[currentIndex]?.imageId || 1;

  return (
    <main 
      className="flex h-screen w-full items-center justify-center bg-cover bg-center p-6 overflow-hidden"
      style={{ backgroundImage: "url('/assets/bg-awan.png')" }}
    >
      
      {/* Toast Notification di atas */}
      <div className="fixed top-0 left-0 w-full flex justify-center z-50 pointer-events-none mt-4">
        {toastMessage && (
          <div className={`bg-lime-400 border-[3px] border-[#382A1D] text-black font-bold text-xl px-12 py-3 rounded-full shadow-lg pointer-events-auto transform transition-all duration-300 ${isToastVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
            {toastMessage}
          </div>
        )}
      </div>

      {/* Glass Card Container */}
        <div className="relative flex h-[90vh] w-full max-w-6xl flex-col items-center rounded-[2rem] bg-white/30 p-8 shadow-2xl backdrop-blur-md border border-white/40">
          
          {/* Kiri Atas: Logo (Berfungsi sebagai tombol rahasia reset panitia) */}
          <div 
            className="absolute top-8 left-8 flex flex-col items-center leading-none cursor-pointer hover:scale-105 transition-transform"
            onDoubleClick={handleEmergencyReset}
            title="Double Click to Reset (Admin)"
          >
            <span className="font-mestizo text-4xl font-bold text-white drop-shadow-md [-webkit-text-stroke:1px_#8C8282]">MOBFT</span>
            <span className="font-mestizo text-xl font-bold text-white drop-shadow-md [-webkit-text-stroke:1px_#8C8282]">2026</span>
          </div>

          {/* Tengah Atas: Judul & Badge */}
          <div className="flex flex-col items-center mt-2">
            <h1 className="font-mestizo text-4xl md:text-5xl font-bold text-[#D3C1A1] [-webkit-text-stroke:0.1px_#382A1D] drop-shadow-lg tracking-widest mb-4">
              FROST STAR JOURNEY
            </h1>
            <div className="rounded-full border-[3px] border-[#382A1D] bg-[#F8F1E1] px-10 py-1.5 font-bold text-black shadow-sm text-sm">
              {solvedCount}/3 Soal Terselesaikan
            </div>
          </div>

        {!isGameStarted ? (
          <div className="flex flex-col items-center justify-center flex-1">
            <p className="font-mestizo text-9xl font-bold text-[#FFD12D] [-webkit-text-stroke:4px_#382A1D] drop-shadow-2xl animate-pulse">{countdown}</p>
          </div>
        ) : (
          <div className="flex flex-1 w-full relative justify-center items-center mt-8">
            
            {/* Kiri: Timer */}
            <div className="absolute left-8 top-12 rounded-xl border-[3px] border-[#382A1D] bg-[#FFD12D] px-8 py-3 text-3xl font-bold text-black shadow-[4px_4px_0px_#382A1D]">
              {formatTime(timeLeft)}
            </div>

            {/* Kanan Atas: Hint Image (SUDAH DIUBAH KE .PNG) */}
            <div 
              className="absolute right-8 top-0 w-32 h-32 border-[3px] border-[#382A1D] shadow-lg rounded-sm"
              style={{
                backgroundImage: `url('/assets/soal${activeImageId}.png')`,
                backgroundSize: 'cover'
              }}
            ></div>

            {/* Tengah: Puzzle Grid (SUDAH DIUBAH KE .PNG) */}
            <div className="w-[420px] h-[420px] bg-[#B0B0B0] grid grid-cols-3 gap-1 p-2 shadow-2xl rounded-sm">
              {activeBoard.map((tile, index) => (
                <div
                  key={index}
                  onClick={() => handleTileClick(index)}
                  className={`transition-transform duration-150 ${tile === 8 ? "bg-transparent" : "cursor-pointer hover:brightness-110 border border-black/20"}`}
                  style={
                    tile !== 8 ? {
                      backgroundImage: `url('/assets/soal${activeImageId}.png')`,
                      backgroundSize: '300% 300%',
                      backgroundPosition: `${(tile % 3) * 50}% ${Math.floor(tile / 3) * 50}%`,
                    } : {}
                  }
                ></div>
              ))}
            </div>

            {/* Kanan Bawah: NEXT Button */}
            <button 
              onClick={() => handleNextOrSkip()}
              className="absolute right-8 bottom-4 rounded-xl border-[3px] border-[#382A1D] bg-[#FFD12D] px-10 py-3 text-xl font-bold text-black shadow-[4px_4px_0px_#382A1D] hover:translate-y-1 hover:shadow-[2px_2px_0px_#382A1D] transition-all"
            >
              NEXT
            </button>
          </div>
        )}
      </div>
    </main>
  );
}