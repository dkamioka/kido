import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { User, Shield, Swords, Hourglass } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Player } from '@/store/gameStore';

interface PlayerInfoProps {
  player: Player;
  isCurrent: boolean;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ player, isCurrent }) => (
  <motion.div
    className={cn(
      'border-2 p-4 rounded-lg transition-all duration-300 relative overflow-hidden',
      isCurrent ? 'border-neon-cyan bg-neon-cyan/10' : 'border-gray-700 bg-gray-900/50'
    )}
    animate={{
      boxShadow: isCurrent ? ['none', '0 0 15px #00ffff', 'none'] : 'none'
    }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
  >
    <div className="flex items-center space-x-4">
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center',
        player.color === 'black' ? 'bg-black border-2 border-gray-500' : 'bg-white border-2 border-gray-300'
      )}>
        <User className={cn(player.color === 'black' ? 'text-white' : 'text-black')} size={20} />
      </div>
      <div>
        <h3 className="font-pixel text-2xl text-glow-cyan">{player.name}</h3>
        <p className="text-sm text-gray-400 uppercase tracking-wider">
          {player.color} player
        </p>
      </div>
    </div>
    <div className="mt-4 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Shield size={18} className="text-neon-magenta" />
        <span className="text-lg font-mono text-glow-magenta">{player.captures}</span>
        <span className="text-sm text-gray-400">Captures</span>
      </div>
    </div>
  </motion.div>
);
export function GamePanel() {
  const { players, currentPlayer, turn, gameStatus, passTurn, resignGame } = useGameStore(
    useShallow((s) => ({
      players: s.players,
      currentPlayer: s.currentPlayer,
      turn: s.turn,
      gameStatus: s.gameStatus,
      passTurn: s.passTurn,
      resignGame: s.resignGame,
    }))
  );
  return (
    <div className="w-full max-w-sm space-y-8 p-4">
      <div className="text-center">
        <h2 className="font-pixel text-5xl text-glow-cyan">KIDO</h2>
        <p className="text-neon-magenta animate-pulse">The Retro Go Arena</p>
      </div>
      {gameStatus === 'playing' ? (
        <div className="flex items-center justify-center space-x-4">
          <Swords className="text-neon-green" />
          <p className="font-pixel text-3xl text-glow-green">TURN: {turn}</p>
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-4 p-4 bg-black/50 border border-dashed border-neon-magenta">
          <Hourglass className="text-neon-magenta animate-spin" />
          <p className="font-pixel text-2xl text-glow-magenta">WAITING FOR OPPONENT</p>
        </div>
      )}
      <div className="space-y-6">
        {players.map(p => (
          <PlayerInfo key={p.id} player={p} isCurrent={p.color === currentPlayer && gameStatus === 'playing'} />
        ))}
        {players.length < 2 && (
          <div className="border-2 border-dashed border-gray-700 p-4 rounded-lg text-center text-gray-500">
            <p>Awaiting Player 2...</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4">
        <button 
          onClick={passTurn} 
          className="retro-btn border-neon-magenta text-neon-magenta" 
          disabled={gameStatus !== 'playing'}
        >
          Pass
        </button>
        <button 
          onClick={resignGame} 
          className="retro-btn border-red-500 text-red-500" 
          disabled={gameStatus !== 'playing'}
        >
          Resign
        </button>
      </div>
    </div>
  );
}