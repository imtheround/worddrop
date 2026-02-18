"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { match } from 'assert';
const en = require('an-array-of-english-words');
const fr = require('an-array-of-french-words');



const getRandomWord = (lang = 'en') => {
  const list = lang === 'fr' ? fr : en;
  return list[Math.floor(Math.random() * list.length)];
};


interface FallingWord {
  id: number;
  text: string;
  x: number;
  y: number;
  speed: number;
}

export default function Home() {
  const [words, setWords] = useState<FallingWord[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [lives, setLives] = useState(5);
  const [typed, seTyped] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('word-drop-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const typeAudio = useRef<HTMLAudioElement | null>(null);
  const correctAudio = useRef<HTMLAudioElement | null>(null);
  const lifeLossAudio = useRef<HTMLAudioElement | null>(null);
  const gameOverAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    typeAudio.current = new Audio('/ressources/audio/type.mp3');
    correctAudio.current = new Audio('/ressources/audio/yipi.mp3');
    lifeLossAudio.current = new Audio('/ressources/audio/oof.mp3');
    gameOverAudio.current = new Audio('/ressources/audio/ded.mp3');
  }, []);

  const playSound = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => { });
    }
  };

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const searchParams = useSearchParams();
  const diff = searchParams.get("diff");
  const router = useRouter();
  if (!diff) {
    router.push("/menu");
  } else if (
    diff !== "easy" &&
    diff !== "medium" &&
    diff !== "hard"
  ) {
    router.push("/menu");
  }
  const [speede, setSpeede] = useState(0);
  const [intervall, setIntervall] = useState(2000);

  const updateDifficulty = useCallback(() => {
    let s = 0;
    let i = 2000;
    if (diff === "easy") {
      i = Math.max(1000, 2800 - (score * 1.3));
      s = 1 + Math.random() * 1.2;
    } else if (diff === "medium") {
      s = 1.2 + Math.random() * 1.5 + (score / 400);
      i = Math.max(800, 2300 - (score * 2));
    } else if (diff === "hard") {
      s = 1.5 + Math.random() * 1.8 + (score / 300);
      i = Math.max(600, 2000 - (score * 3));
    }
    setSpeede(s);
    setIntervall(i);
  }, [diff, score]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      updateDifficulty();
    }
  }, [gameStarted, gameOver, updateDifficulty]);

  const spawnWord = useCallback(() => {
    if (!gameAreaRef.current) return;
    const word = getRandomWord('en')
    const x = Math.random() * (gameAreaRef.current.clientWidth - 100);
    const newWord: FallingWord = {
      id: nextId.current++,
      text: word,
      x: x,
      y: -20,
      speed: speede,
    };
    setWords((prev) => [...prev, newWord]);
    updateDifficulty();
  }, [speede, updateDifficulty]);


  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnInterval = setInterval(spawnWord, intervall);
    return () => clearInterval(spawnInterval);
  }, [gameStarted, gameOver, spawnWord, intervall]);


  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveInterval = setInterval(() => {
      setWords((prev) => {
        const next = prev.map((w) => ({ ...w, y: w.y + w.speed }));

        if (gameAreaRef.current) {
          const bottom = gameAreaRef.current.clientHeight;
          const missedWords = next.filter((w) => w.y > bottom);

          if (missedWords.length > 0) {
            playSound(lifeLossAudio);
            setLives((l) => {
              const remaining = l - 1;
              if (remaining <= 0) {
                playSound(gameOverAudio);
                setGameOver(true);
                setEndTime(Date.now());
                return 0;
              }
              return remaining;
            });
            return next.filter((w) => w.y <= bottom);
          }
        }
        return next;
      });
    }, 20);

    return () => clearInterval(moveInterval);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (gameOver) {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('word-drop-highscore', score.toString());
        setIsNewBest(true);
      } else {
        setIsNewBest(false);
      }
    }
  }, [gameOver, score, highScore]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();

    if (val.length > inputValue.length) {
      playSound(typeAudio);
    }

    setInputValue(val);

    const matchedWord = words.find((w) => w.text.toLowerCase() === val);
    if (matchedWord) {
      playSound(correctAudio);

      // Dynamic scoring: word length * (1 + score/1000)
      const basePoints = matchedWord.text.length * 5;
      const progressBonus = 1 + (score / 500);
      const points = Math.floor(basePoints * progressBonus);

      setWords((prev) => prev.filter((w) => w.id !== matchedWord.id));
      setScore((s) => s + points);
      seTyped((t) => t + matchedWord.text.length);
      setInputValue("");
    }
  };

  const startGame = () => {
    setWords([]);
    setScore(0);
    setLives(5);
    seTyped(0);
    setGameOver(false);
    setGameStarted(true);
    setStartTime(Date.now());
    setEndTime(null);
    setInputValue("");
    setIsNewBest(false);
  };

  const calculateStats = () => {
    if (!startTime || !endTime) return { wpm: 0, cpm: 0 };
    const durationMinutes = (endTime - startTime) / 60000;
    if (durationMinutes === 0) return { wpm: 0, cpm: 0 };
    const cpm = Math.floor(typed / durationMinutes);
    const wpm = Math.floor(cpm / 5); // Average word length of 5
    return { wpm, cpm };
  };

  const stats = calculateStats();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-zinc-950 text-zinc-100 font-mono">
      <div className="z-10 w-full max-w-5xl items-center justify-between flex text-sm mb-4">
        <h1 className="text-2xl font-bold tracking-tighter uppercase">Word Drop</h1>
        <div className="flex gap-8 items-center text-xl">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < lives ? "text-red-500" : "text-zinc-800"}>
                ❤
              </span>
            ))}
          </div>
          <div>Score: {score}</div>
        </div>
      </div>

      <div
        ref={gameAreaRef}
        className="relative flex-grow w-full max-w-5xl border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50 backdrop-blur-sm"
      >
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <button
              onClick={startGame}
              className="px-8 py-4 border border-zinc-100 hover:bg-zinc-100 hover:text-zinc-950 transition-colors duration-300 text-xl uppercase tracking-widest"
            >
              Start Game
            </button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 z-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center p-12 max-w-4xl w-full">
              <h2 className="text-8xl font-black mb-12 uppercase tracking-tighter text-zinc-100">Game Over</h2>

              <div className="flex flex-col gap-6 mb-16 max-w-2xl mx-auto">
                <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                  <span className="text-zinc-500 uppercase tracking-widest text-sm">Final Score</span>
                  <span className="text-6xl font-bold">{score}</span>
                </div>

                <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
                  <span className="text-zinc-500 uppercase tracking-widest text-sm">Personal Best</span>
                  <span className="text-4xl font-bold">{highScore}</span>
                </div>

                <div className="grid grid-cols-2 gap-12 pt-6">
                  <div className="flex flex-col items-start border-l border-zinc-800 pl-6">
                    <span className="text-zinc-500 uppercase tracking-widest text-xs mb-1">Words / Min</span>
                    <span className="text-5xl font-bold">{stats.wpm}</span>
                  </div>
                  <div className="flex flex-col items-start border-l border-zinc-800 pl-6">
                    <span className="text-zinc-500 uppercase tracking-widest text-xs mb-1">Chars / Min</span>
                    <span className="text-5xl font-bold">{stats.cpm}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={startGame}
                className="px-16 py-6 border border-zinc-100 hover:bg-zinc-100 hover:text-zinc-950 transition-all duration-300 text-2xl uppercase tracking-[0.3em] font-light"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
        {words.map((word) => (
          <div
            key={word.id}
            className="absolute text-xl font-bold select-none"
            style={{
              left: `${word.x}px`,
              top: `${word.y}px`,
              transition: 'top 0.02s linear'
            }}
          >
            {word.text}
          </div>
        ))}
      </div>

      <div className="w-full max-w-5xl mt-8 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          disabled={!gameStarted || gameOver}
          placeholder={gameStarted ? "Type here..." : ""}
          className="w-full bg-transparent border-b-2 border-zinc-800 focus:border-zinc-100 outline-none py-2 text-3xl text-center transition-colors duration-300"
          autoFocus
        />
      </div>

      <div className="text-zinc-500 text-xs uppercase tracking-widest">
        Don't let the words touch the bottom
      </div>
    </main>
  );
}
