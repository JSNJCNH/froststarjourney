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
  // STATE BARU: Timer Ganti Pemain & Status Popup
  const [swapTimer, setSwapTimer] = useState<number>(10);
  const [isSwapPopupOpen, setIsSwapPopupOpen] = useState<boolean>(false);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
  
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [questions, setQuestions] = useState<GameState[]>([
    // Soal Sedang
    { id: 2, imageId: 2, isSolved: false, timeSolved: null, boardState: [0, 1, 8, 6, 5, 2, 4, 3, 7] },
    // Sisanya Soal Susah
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
      setSwapTimer(parsedData.swapTimer ?? 10); // Load memori timer 10 detik
      setCountdown(0); 
    } else {
      const randomImages = [1, 2, 3, 4, 5, 6].sort(() => 0.5 - Math.random()).slice(0, 3);
      setQuestions(prev => prev.map((q, i) => ({
        ...q,
        imageId: randomImages[i] 
      })));
    }
    setIsLoaded(true);
  }, []);

  // 2. AUTO-SAVE PROGRESS (Update dengan swapTimer)
  useEffect(() => {
    if (isLoaded && isGameStarted) {
      const progressData = { questions, timeLeft, currentIndex, isGameStarted, swapTimer };
      localStorage.setItem("frostStarProgress", JSON.stringify(progressData));
    }
  }, [questions, timeLeft, currentIndex, isGameStarted, swapTimer, isLoaded]);

  // TIMER HITUNG MUNDUR AWAL (3, 2, 1)
  useEffect(() => {
    if (countdown > 0 && isLoaded) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isGameStarted && isLoaded) {
      setIsGameStarted(true);
    }
  }, [countdown, isGameStarted, isLoaded]);

  // LOKASI PERUBAHAN: TIMER UTAMA (Waktu tetap berjalan meskipun popup terbuka)
  useEffect(() => {
    // Syarat !isSwapPopupOpen dihapus dari sini
    if (isGameStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isGameStarted, timeLeft]); // isSwapPopupOpen juga dihapus dari array dependency

  // LOGIKA BARU: TIMER 10 DETIK (GANTI PEMAIN)
  useEffect(() => {
    if (isGameStarted && swapTimer > 0 && !isSwapPopupOpen && timeLeft > 0) {
      const timer = setTimeout(() => setSwapTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (swapTimer === 0 && !isSwapPopupOpen && isGameStarted && timeLeft > 0) {
      setIsSwapPopupOpen(true); // Tampilkan popup saat waktu habis
    }
  }, [isGameStarted, swapTimer, isSwapPopupOpen, timeLeft]);

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

  const formatSwapTime = (seconds: number) => {
    return seconds.toString().padStart(2, "0");
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
    // Mencegah klik saat permainan belum mulai, sudah selesai, atau saat Pop-up terbuka
    if (!isGameStarted || questions[currentIndex].isSolved || isSwapPopupOpen) return;

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
        // Reset timer 10 detik saat lanjut ke soal berikutnya
        setSwapTimer(10);
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

  const handleEmergencyReset = () => {
    const isConfirmed = window.confirm("Panitia: Apakah Anda yakin ingin mereset permainan dan kembali ke halaman awal?");
    
    if (isConfirmed) {
      setIsGameStarted(false);
      setIsLoaded(false); 
      setTimeout(() => {
        localStorage.removeItem("frostStarProgress"); 
        localStorage.removeItem("gameResults"); 
        window.location.href = "/"; 
      }, 100);
    }
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
      className="flex h-screen w-full items-center justify-center bg-cover bg-center p-6 overflow-hidden relative"
      style={{ backgroundImage: "url('/assets/bg-awan.png')" }}
    >
      
      <div className="fixed top-0 left-0 w-full flex justify-center z-50 pointer-events-none mt-4">
        {toastMessage && (
          <div className={`bg-lime-400 border-[3px] border-[#382A1D] text-black font-bold text-xl px-12 py-3 rounded-full shadow-lg pointer-events-auto transform transition-all duration-300 ${isToastVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
            {toastMessage}
          </div>
        )}
      </div>

      <div className="relative flex h-[90vh] w-full max-w-6xl flex-col items-center rounded-[2rem] bg-white/30 p-8 shadow-2xl backdrop-blur-md border border-white/40 overflow-hidden">
        
        {/* LOKASI BARU: POP UP GANTI PEMAIN */}
        {isSwapPopupOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center rounded-[2rem] border-[4px] border-[#382A1D] bg-[#FDF8EE] p-10 shadow-2xl text-center transform transition-all scale-100 animate-fade-in-up">
              <h2 className="font-mestizo text-4xl md:text-5xl font-bold text-[#D3C1A1] [-webkit-text-stroke:1.5px_#382A1D] mb-4">
                WAKTU GANTI PEMAIN!
              </h2>
              <p className="text-xl font-semibold text-red-600 mb-10 font-serif drop-shadow-sm">
                Silakan bertukar posisi pemain sekarang. Waktu utama TERUS BERJALAN!
              </p>
              <button 
                onClick={() => {
                  setSwapTimer(10);
                  setIsSwapPopupOpen(false);
                }}
                className="rounded-xl border-[3px] border-[#382A1D] bg-[#FFD12D] px-12 py-4 text-2xl font-bold text-black shadow-[4px_4px_0px_#382A1D] hover:translate-y-1 hover:shadow-[2px_2px_0px_#382A1D] transition-all"
              >
                LANJUTKAN BERMAIN
              </button>
            </div>
          </div>
        )}

        {/* Kiri Atas: Logo (Reset) */}
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
          <h1 className="font-mestizo text-4xl md:text-5xl font-bold text-[#D3C1A1] [-webkit-text-stroke:2px_#382A1D] drop-shadow-lg tracking-widest mb-4">
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
            
            {/* Kiri: Timer Utama */}
            <div className="absolute left-8 top-12 rounded-xl border-[3px] border-[#382A1D] bg-[#FFD12D] px-8 py-3 text-3xl font-bold text-black shadow-[4px_4px_0px_#382A1D]">
              {formatTime(timeLeft)}
            </div>

            {/* LOKASI BARU: Timer 10 Detik di Kiri Bawah (Di area merah yang dilampirkan) */}
            <div className="absolute left-8 bottom-4 flex flex-col items-center rounded-xl border-[3px] border-[#382A1D] bg-[#F8F1E1] px-6 py-2 shadow-[4px_4px_0px_#382A1D]">
              <span className="text-sm font-bold text-[#382A1D] mb-1 tracking-wider uppercase">Ganti Pemain</span>
              <span className="text-3xl font-bold text-[#e14f4f]">
                00:{formatSwapTime(swapTimer)}
              </span>
            </div>

            {/* Kanan Atas: Hint Image */}
            <div 
              className="absolute right-8 top-0 w-32 h-32 border-[3px] border-[#382A1D] shadow-lg rounded-sm"
              style={{
                backgroundImage: `url('/assets/soal${activeImageId}.png')`,
                backgroundSize: 'cover'
              }}
            ></div>

            {/* Tengah: Puzzle Grid */}
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