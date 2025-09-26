import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, PlusCircle, Users, Hourglass } from 'lucide-react';
import { CreateGameDialog } from '@/components/CreateGameDialog';
import type { GameSummary, ApiResponse } from '@shared/types';
import { cn } from '@/lib/utils';
export function LobbyPage() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const navigate = useNavigate();
  const fetchGames = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/games');
      const result: ApiResponse<GameSummary[]> = await response.json();
      if (result.success && result.data) {
        setGames(result.data);
      } else {
        setError(result.error || 'Failed to fetch games.');
      }
    } catch (err) {
      setError('An error occurred while connecting to the server.');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 5000); // Poll for new games every 5 seconds
    return () => clearInterval(interval);
  }, []);
  const handleJoinClick = (gameId: string) => {
    setSelectedGameId(gameId);
    setJoinDialogOpen(true);
  };
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 font-pixel relative overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-50 z-0"></div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl text-center z-10"
      >
        <h1 className="text-7xl md:text-8xl text-neon-cyan text-glow-cyan mb-2">KIDO</h1>
        <p className="text-2xl text-neon-magenta animate-pulse mb-12">The Retro Go Arena</p>
        <div className="crt-monitor">
          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="text-3xl text-neon-green text-glow-green">OPEN GAMES</h2>
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="retro-btn flex items-center gap-2"
            >
              <PlusCircle size={20} /> Create Game
            </button>
          </div>
          <div className="h-[50vh] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#00ffff #0d0d0d' }}>
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-full text-neon-cyan"
                >
                  <Hourglass className="animate-spin mr-4" /> Loading games...
                </motion.div>
              )}
              {!isLoading && error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-red-500 text-center"
                >
                  {error}
                </motion.div>
              )}
              {!isLoading && !error && games.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-gray-400 py-10"
                >
                  <p className="text-2xl mb-4">No open games found.</p>
                  <p>Why not start a new one?</p>
                </motion.div>
              )}
              {!isLoading && !error && games.map((game, index) => (
                <motion.div
                  key={game.gameId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="grid grid-cols-3 md:grid-cols-4 items-center gap-4 p-4 mb-3 bg-black/30 border border-neon-cyan/20 hover:bg-neon-cyan/10 transition-colors duration-200"
                >
                  <div className="col-span-2 md:col-span-3 flex flex-col md:flex-row md:items-center md:gap-6 text-left">
                    <p className="text-neon-cyan truncate">
                      <span className="text-gray-500">ID:</span> {game.gameId.substring(0, 8)}...
                    </p>
                    <div className="flex items-center gap-2 text-neon-magenta">
                      <Users size={18} />
                      <span>{game.player1Name || '...'} vs {game.player2Name || '...'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {game.gameStatus === 'waiting' ? (
                      <button
                        onClick={() => handleJoinClick(game.gameId)}
                        className="retro-btn border-neon-green text-neon-green w-full"
                      >
                        Join
                      </button>
                    ) : (
                      <span className="text-gray-500 font-mono uppercase">Playing</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <footer className="mt-8 text-center text-gray-500 text-sm">
            <p>Built with ���️ at Cloudflare</p>
        </footer>
      </motion.div>
      <CreateGameDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onGameCreated={(game) => navigate(`/game/${game.gameId}`)}
        mode="create"
      />
      <CreateGameDialog
        isOpen={isJoinDialogOpen}
        onClose={() => setJoinDialogOpen(false)}
        onGameCreated={(game) => navigate(`/game/${game.gameId}`)}
        mode="join"
        gameId={selectedGameId}
      />
    </div>
  );
}