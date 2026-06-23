"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type GameState = {
  id: number;
  imageId: number; // Tambahan untuk menyimpan ID gambar yang terpilih
  isSolved: boolean;
  timeSolved: number | null;
  boardState: number[];
};

export default function GamePage() {
  const router = useRouter();

  const [countdown, setCountdown] = useState<number>(3);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(420); 
  
  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // imageId diset 1,2,3 sebagai default, akan diacak oleh useEffect saat mount
  const [questions, setQuestions] = useState<GameState[]>([
    { id: 1, imageId: 1, isSolved: false, timeSolved: null, boardState: [0, 4, 1, 8, 3, 2, 6, 7, 5] },
    { id: 2, imageId: 2, isSolved: false, timeSolved: null, boardState: [0, 1, 8, 6, 5, 2, 4, 3, 7] },
    { id: 3, imageId: 3, isSolved: false, timeSolved: null, boardState: [0, 4, 1, 6, 3, 2, 7, 8, 5] },
  ]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // --- EFEK: PENGACAKAN GAMBAR (HANYA SEKALI SAAT LOAD) ---
  useEffect(() => {
    // Membuat array 1-6, diacak, lalu diambil 3 angka pertama
    const randomImages = [1, 2, 3, 4, 5, 6].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    setQuestions(prev => prev.map((q, i) => ({
      ...q,
      imageId: randomImages[i] // Menyematkan ID gambar acak ke masing-masing soal
    })));
  }, []);

  // --- EFEK: HITUNG MUNDUR ---
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isGameStarted) {
      setIsGameStarted(true);
    }
  }, [countdown, isGameStarted]);

  // --- EFEK: TIMER WAKTU PERMAINAN ---
  useEffect(() => {
    if (isGameStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isGameStarted, timeLeft]); 

  // --- EFEK: WAKTU HABIS ---
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

  // Fungsi pemanggil Toast Notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500); // Toast menghilang dalam 2.5 detik
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
        
        // Beri jeda 2 detik agar Toast terbaca sebelum dilempar ke halaman result
        setTimeout(() => {
          router.push("/result");
        }, 2000); 
      } else {
        showToast("Map Berhasil Diselesaikan!");
        setTimeout(() => {
          handleNextOrSkip(currentQuestions);
        }, 1500); // Jeda sebelum otomatis pindah soal
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
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-200 relative overflow-hidden">
      
      {/* Toast Notification Element */}
      {toastMessage && (
        <div className="absolute top-10 right-10 z-50 bg-green-500 text-white px-6 py-4 rounded-md shadow-2xl font-bold transition-all animate-bounce">
          {toastMessage}
        </div>
      )}

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
            
            {/* Target Gambar Miniatur menggunakan ID Gambar yang sudah diacak */}
            <div 
              className="w-32 h-32 border-4 border-gray-400 shadow-lg rounded-sm"
              style={{
                backgroundImage: `url('/assets/soal${activeImageId}.jpeg')`,
                backgroundSize: 'cover'
              }}
            ></div>
          </div>

          <div className="flex justify-center mb-8">
            <div className="w-[450px] h-[450px] bg-gray-400 grid grid-cols-3 gap-1 p-2 shadow-2xl rounded-sm">
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
                          // Memanggil gambar menggunakan ID acak
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