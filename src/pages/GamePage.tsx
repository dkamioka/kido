import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { GoBoard } from '@/components/GoBoard';
import { GamePanel } from '@/components/GamePanel';
import { ArrowLeft, Loader } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { useShallow } from 'zustand/react/shallow';
export function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { fetchGame, gameStatus, error, setPlayerSession } = useGameStore(
    useShallow((state) => ({
      fetchGame: state.fetchGame,
      gameStatus: state.gameStatus,
      error: state.error,
      setPlayerSession: state.setPlayerSession,
    }))
  );
  useEffect(() => {
    const sessionKey = `kido-session-${gameId}`;
    const storedSession = localStorage.getItem(sessionKey);
    if (storedSession) {
      const { playerId, sessionId } = JSON.parse(storedSession);
      setPlayerSession(playerId, sessionId);
    }
  }, [gameId, setPlayerSession]);
  useEffect(() => {
    if (gameId) {
      fetchGame(gameId);
      const interval = setInterval(() => fetchGame(gameId), 2000); // Poll every 2 seconds
      return () => clearInterval(interval);
    }
  }, [gameId, fetchGame]);
  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 font-pixel text-red-500">
        <h2 className="text-3xl mb-4">Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="retro-btn mt-8">
          Back to Lobby
        </button>
      </div>
    );
  }
  if (!gameStatus) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 font-pixel text-neon-cyan">
        <Loader className="animate-spin h-12 w-12 mb-4" />
        <p className="text-2xl">Loading Game...</p>
      </div>
    );
  }
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 font-pixel relative overflow-hidden">
      <Toaster richColors theme="dark" />
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 retro-btn flex items-center gap-2 z-20"
      >
        <ArrowLeft size={20} /> Lobby
      </button>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="crt-monitor">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex items-center justify-center">
              <GoBoard />
            </div>
            <div className="flex items-center justify-center">
              <GamePanel />
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}