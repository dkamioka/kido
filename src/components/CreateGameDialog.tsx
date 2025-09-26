import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { GameState, ApiResponse, Player } from '@shared/types';
interface CreateGameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGameCreated: (game: GameState) => void;
  mode: 'create' | 'join';
  gameId?: string | null;
}
export function CreateGameDialog({ isOpen, onClose, onGameCreated, mode, gameId }: CreateGameDialogProps) {
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const url = mode === 'create' ? '/api/games' : `/api/games/${gameId}/join`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName }),
      });
      const result: ApiResponse<{ game: GameState; player: Player }> = await response.json();
      if (response.ok && result.success && result.data) {
        const { game, player } = result.data;
        const sessionKey = `kido-session-${game.gameId}`;
        localStorage.setItem(sessionKey, JSON.stringify({ playerId: player.id, sessionId: player.sessionId }));
        onGameCreated(game);
        onClose();
        setPlayerName('');
      } else {
        setError(result.error || `Failed to ${mode} game.`);
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-neon-cyan text-white font-pixel">
        <DialogHeader>
          <DialogTitle className="text-3xl text-glow-cyan">{mode === 'create' ? 'Create New Game' : 'Join Game'}</DialogTitle>
          <DialogDescription className="text-gray-400 font-mono">
            Enter your callsign to {mode === 'create' ? 'start a new session' : 'enter the arena'}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Input
              id="playerName"
              placeholder="PLAYER_NAME"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-gray-900/50 border-neon-magenta text-neon-magenta focus:ring-neon-magenta focus:ring-2"
              maxLength={12}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <DialogFooter>
            <button type="submit" className="retro-btn w-full" disabled={isLoading}>
              {isLoading ? 'Connecting...' : (mode === 'create' ? 'Launch' : 'Join')}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}