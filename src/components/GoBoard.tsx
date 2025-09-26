import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { useShallow } from 'zustand/react/shallow';
const BOARD_SIZE = 19;
export function GoBoard() {
  const {
    board,
    currentPlayer,
    hoveredCell,
    placeStone,
    setHoveredCell,
    clearHoveredCell,
    myPlayerId,
    players,
    gameStatus
  } = useGameStore(
    useShallow((s) => ({
      board: s.board,
      currentPlayer: s.currentPlayer,
      hoveredCell: s.hoveredCell,
      placeStone: s.placeStone,
      setHoveredCell: s.setHoveredCell,
      clearHoveredCell: s.clearHoveredCell,
      myPlayerId: s.myPlayerId,
      players: s.players,
      gameStatus: s.gameStatus,
    }))
  );
  const myColor = players.find(p => p.id === myPlayerId)?.color;
  const isMyTurn = myColor === currentPlayer && gameStatus === 'playing';
  const starPoints = [
    { r: 3, c: 3 }, { r: 3, c: 9 }, { r: 3, c: 15 },
    { r: 9, c: 3 }, { r: 9, c: 9 }, { r: 9, c: 15 },
    { r: 15, c: 3 }, { r: 15, c: 9 }, { r: 15, c: 15 },
  ];
  const handleCellClick = (row: number, col: number) => {
    if (isMyTurn && board[row][col] === null) {
      placeStone(row, col);
    }
  };
  return (
    <div
      className="relative aspect-square w-full max-w-[80vh] bg-[#1a1a1a] p-4 rounded-md shadow-lg"
      style={{
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8), 0 0 10px rgba(0, 255, 255, 0.1)',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: 'calc(100% / 18) calc(100% / 18)',
      }}
      onMouseLeave={clearHoveredCell}
    >
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE - 1}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE - 1}, 1fr)`,
          border: '1px solid #00ffff44',
        }}
      >
        {Array.from({ length: (BOARD_SIZE - 1) * (BOARD_SIZE - 1) }).map((_, i) => (
          <div
            key={i}
            className="border-r border-b border-neon-cyan/20"
            style={{
              boxShadow: '0 0 1px #00ffff20',
            }}
          />
        ))}
      </div>
      <div
        className="absolute inset-4 grid"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
        }}
      >
        {board.flat().map((_, i) => {
          const row = Math.floor(i / BOARD_SIZE);
          const col = i % BOARD_SIZE;
          const stone = board[row][col];
          const isHovered = hoveredCell?.row === row && hoveredCell?.col === col;
          const isStarPoint = starPoints.some(p => p.r === row && p.c === col);
          return (
            <div
              key={`${row}-${col}`}
              className={cn(
                "relative flex items-center justify-center",
                isMyTurn && !stone ? "cursor-pointer" : ""
              )}
              onMouseEnter={() => setHoveredCell(row, col)}
              onClick={() => handleCellClick(row, col)}
            >
              {isStarPoint && !stone && (
                <div className="absolute h-1.5 w-1.5 rounded-full bg-neon-cyan/30" />
              )}
              {stone && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'absolute h-[90%] w-[90%] rounded-full',
                    stone === 'black' ? 'bg-black' : 'bg-white',
                  )}
                  style={{
                    boxShadow: stone === 'black'
                      ? 'inset 2px 2px 5px rgba(255,255,255,0.3), inset -2px -2px 5px rgba(0,0,0,0.8)'
                      : 'inset 2px 2px 5px rgba(255,255,255,1), inset -2px -2px 5px rgba(0,0,0,0.4)',
                  }}
                />
              )}
              {isHovered && !stone && isMyTurn && (
                <div
                  className={cn(
                    'absolute h-[90%] w-[90%] rounded-full transition-opacity duration-100',
                    currentPlayer === 'black' ? 'bg-black/70' : 'bg-white/70',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}