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

  const [countdown, setCountdown] = useState<number>(3);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(420); 
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
  
  const [questions, setQuestions] = useState<GameState[]>([
    { id: 1, imageId: 1, isSolved: false, timeSolved: null, boardState: [0, 4, 1, 8, 3, 2, 6, 7, 5] },
    { id: 2, imageId: 2, isSolved: false, timeSolved: null, boardState: [0, 1, 8, 6, 5, 2, 4, 3, 7] },
    { id: 3, imageId: 3, isSolved: false, timeSolved: null, boardState: [0, 4, 1, 6, 3, 2, 7, 8, 5] },
  ]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    const randomImages = [1, 2, 3, 4, 5, 6].sort(() => 0.5 - Math.random()).slice(0, 3);
    setQuestions(prev => prev.map((q, i) => ({
      ...q,
      imageId: randomImages[i] 
    })));
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isGameStarted) {
      setIsGameStarted(true);
    }
  }, [countdown, isGameStarted]);

  useEffect(() => {
    if (isGameStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isGameStarted, timeLeft]); 

  useEffect(() => {
    if (timeLeft === 0) {
      localStorage.setItem("gameResults", JSON.stringify({ questions, timeLeft }));
      router.push("/result");
    }
  }, [timeLeft, questions, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setIsToastVisible(true);
    }, 10);

    setTimeout(() => {
      setIsToastVisible(false);
      setTimeout(() => {
        setToastMessage(null);
      }, 300);
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

  const solvedCount = questions.filter(q => q.isSolved).length;
  const activeBoard = questions[currentIndex].boardState;
  const activeImageId = questions[currentIndex].imageId;

  return (
    // Mengunci tinggi ke h-screen agar tidak bisa di-scroll
    <main className="flex h-screen flex-col items-center p-6 bg-gray-200 overflow-hidden">
      
      <div className="w-full flex justify-between items-center pb-4 border-b-2 border-gray-400 shrink-0 relative z-20 bg-gray-200">
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
        // flex-1 mendorong kontainer ini mengisi ruang dari bawah header hingga dasar layar
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
          
          {/* ROW 1: TIMER DAN HINT (shrink-0 menahan elemen ini agar tidak gepeng) */}
          <div className="flex justify-between items-start w-full shrink-0 relative z-10">
            <div className="px-6 py-3 bg-gray-400 text-black font-bold text-2xl rounded-md shadow-inner">
              {formatTime(timeLeft)}
            </div>
            
            <div 
              className="w-28 h-28 border-4 border-gray-400 shadow-lg rounded-sm"
              style={{
                backgroundImage: `url('/assets/soal${activeImageId}.jpeg')`,
                backgroundSize: 'cover'
              }}
            ></div>
          </div>

          {/* ROW 2: PUZZLE (flex-1 meletakkan puzzle persis di tengah-tengah sisa layar) */}
          <div className="flex-1 flex justify-center items-center w-full relative z-10 min-h-0">
            <div className="w-[420px] h-[420px] bg-gray-400 grid grid-cols-3 gap-1 p-2 shadow-2xl rounded-sm">
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
                          backgroundImage: `url('/assets/soal${activeImageId}.jpeg')`,
                          backgroundSize: '300% 300%',
                          backgroundPosition: `${(tile % 3) * 50}% ${Math.floor(tile / 3) * 50}%`,
                        }
                      : {}
                  }
                ></div>
              ))}
            </div>
          </div>

          {/* ROW 3: TOMBOL NEXT / SKIP (Tidak lagi menggunakan absolute, secara natural terdorong ke bawah) */}
          <div className="flex justify-end w-full shrink-0 z-10">
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