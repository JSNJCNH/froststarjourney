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

  // State Hydration (Mencegah error render antara Server dan Client Next.js)
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

  // --- 1. INISIALISASI & LOAD PROGRESS (Hanya Berjalan Sekali Saat Mount) ---
  useEffect(() => {
    const savedProgress = localStorage.getItem("frostStarProgress");
    
    if (savedProgress) {
      // Jika ada progres, muat data tersebut
      const parsedData = JSON.parse(savedProgress);
      setQuestions(parsedData.questions);
      setTimeLeft(parsedData.timeLeft);
      setCurrentIndex(parsedData.currentIndex);
      setIsGameStarted(parsedData.isGameStarted);
      setCountdown(0); // Lewati hitung mundur jika melanjutkan game
    } else {
      // Jika tidak ada progres (baru mulai), acak gambar
      const randomImages = [1, 2, 3, 4, 5, 6].sort(() => 0.5 - Math.random()).slice(0, 3);
      setQuestions(prev => prev.map((q, i) => ({
        ...q,
        imageId: randomImages[i] 
      })));
    }
    setIsLoaded(true);
  }, []);

  // --- 2. AUTO-SAVE PROGRESS (Berjalan Setiap Ada Perubahan State) ---
  useEffect(() => {
    if (isLoaded && isGameStarted) {
      const progressData = {
        questions,
        timeLeft,
        currentIndex,
        isGameStarted
      };
      localStorage.setItem("frostStarProgress", JSON.stringify(progressData));
    }
  }, [questions, timeLeft, currentIndex, isGameStarted, isLoaded]);

  // --- TIMER & HITUNG MUNDUR ---
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

  // --- 3. WAKTU HABIS (Bersihkan Progress) ---
  useEffect(() => {
    if (timeLeft === 0 && isLoaded) {
      localStorage.removeItem("frostStarProgress"); // Hapus progress sementara
      localStorage.setItem("gameResults", JSON.stringify({ questions, timeLeft }));
      router.push("/result");
    }
  }, [timeLeft, questions, router, isLoaded]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
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
        
        // --- 4. GAME SELESAI (Bersihkan Progress) ---
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

  // Mencegah kedipan UI sebelum data selesai dimuat dari Local Storage
  if (!isLoaded) {
    return <main className="flex h-screen items-center justify-center bg-[#D9D9D9]"></main>;
  }

  const solvedCount = questions.filter(q => q.isSolved).length;
  const activeBoard = questions[currentIndex].boardState;
  const activeImageId = questions[currentIndex].imageId;

  return (
    <main className="flex h-screen flex-col items-center p-6 bg-[#D9D9D9] overflow-hidden">
      <div className="w-full flex justify-between items-center pb-4 border-b-2 border-[#8C8282] shrink-0 relative z-20 bg-[#D9D9D9]">
        <h1 className="font-mestizo font-bold text-xl text-black">TULISAN MOB FT</h1>
        <h1 className="font-mestizo font-bold text-xl text-black">FROST STAR JOURNEY</h1>
        <div className="px-4 py-2 bg-[#8C8282] text-black font-semibold rounded-md">
          {solvedCount}/3 Soal Terselesaikan
        </div>
      </div>

      {!isGameStarted ? (
        <div className="flex flex-col items-center justify-center flex-1">
          <p className="font-mestizo text-8xl font-bold text-gray-800 animate-pulse">{countdown}</p>
        </div>
      ) : (
        <div className="flex flex-col flex-1 w-full max-w-4xl relative z-10 py-4">

          <div className="absolute top-0 left-0 w-full flex justify-center z-10 pointer-events-none">
            {toastMessage && (
              <div 
                className={`bg-lime-400 text-black font-bold text-xl px-12 py-3 rounded-b-md shadow-md pointer-events-auto transform transition-all duration-300 ease-in-out ${
                  isToastVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
                }`}
              >
                {toastMessage}
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-start w-full shrink-0 relative z-10">
            <div className="px-6 py-3 bg-[#8C8282] text-black font-bold text-2xl rounded-md shadow-inner">
              {formatTime(timeLeft)}
            </div>
            
            <div 
              className="w-28 h-28 border-4 border-[#8C8282] shadow-lg rounded-sm"
              style={{
                backgroundImage: `url('/assets/soal${activeImageId}.png')`,
                backgroundSize: 'cover'
              }}
            ></div>
          </div>

          <div className="flex-1 flex justify-center items-center w-full relative z-10 min-h-0">
            <div className="w-[420px] h-[420px] bg-[#B0B0B0] grid grid-cols-3 gap-1 p-2 shadow-2xl rounded-sm">
              {activeBoard.map((tile, index) => (
                <div
                  key={index}
                  onClick={() => handleTileClick(index)}
                  className={`transition-transform duration-150 ${
                    tile === 8 
                      ? "bg-gray-300 shadow-inner" 
                      : "cursor-pointer hover:brightness-110 shadow-md"
                  }`}
                  style={
                    tile !== 8
                      ? {
                          backgroundImage: `url('/assets/soal${activeImageId}.png')`,
                          backgroundSize: '300% 300%',
                          backgroundPosition: `${(tile % 3) * 50}% ${Math.floor(tile / 3) * 50}%`,
                        }
                      : {}
                  }
                ></div>
              ))}
            </div>
          </div>

          <div className="flex justify-end w-full shrink-0 z-10">
            <button 
              onClick={() => handleNextOrSkip()}
              className="px-8 py-3 bg-[#8C8282] hover:bg-[#706868] text-black font-bold rounded-xl shadow-md transition-colors"
            >
              NEXT / SKIP
            </button>
          </div>
        </div>
      )}
    </main>
  );
}