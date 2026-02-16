"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  const spawnWord = useCallback(() => {
    if (!gameAreaRef.current) return;
    const word = getRandomWord('en')
    const x = Math.random() * (gameAreaRef.current.clientWidth - 100);
    const newWord: FallingWord = {
      id: nextId.current++,
      text: word,
      x: x,
      y: -20,
      speed: 1 + Math.random() * 2 + (score / 100),
    };
    setWords((prev) => [...prev, newWord]);
  }, [score]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnInterval = setInterval(spawnWord, Math.max(500, 2000 - (score * 10)));
    return () => clearInterval(spawnInterval);
  }, [gameStarted, gameOver, spawnWord, score]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveInterval = setInterval(() => {
      setWords((prev) => {
        const next = prev.map((w) => ({ ...w, y: w.y + w.speed }));
        
        if (gameAreaRef.current) {
          const bottom = gameAreaRef.current.clientHeight;
          if (next.some((w) => w.y > bottom)) {
            setGameOver(true);
          }
        }
        return next;
      });
    }, 20);

    return () => clearInterval(moveInterval);
  }, [gameStarted, gameOver]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();
    setInputValue(val);

    const matchedWord = words.find((w) => w.text.toLowerCase() === val);
    if (matchedWord) {
      setWords((prev) => prev.filter((w) => w.id !== matchedWord.id));
      setScore((s) => s + 10);
      setInputValue("");
    }
  };

  const startGame = () => {
    setWords([]);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setInputValue("");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-zinc-950 text-zinc-100 font-mono">
      <div className="z-10 w-full max-w-5xl items-center justify-between flex text-sm mb-4">
        <h1 className="text-2xl font-bold tracking-tighter uppercase">Word Drop</h1>
        <div className="text-xl">Score: {score}</div>
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 z-20">
            <h2 className="text-4xl font-bold mb-2 uppercase tracking-tighter text-red-500">Game Over</h2>
            <p className="text-xl mb-6">Final Score: {score}</p>
            <button 
              onClick={startGame}
              className="px-8 py-4 border border-zinc-100 hover:bg-zinc-100 hover:text-zinc-950 transition-colors duration-300 text-xl uppercase tracking-widest"
            >
              Play Again
            </button>
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
