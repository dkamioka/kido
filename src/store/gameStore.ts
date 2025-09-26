import { create } from 'zustand';
import { GameState, Stone, ApiResponse } from '@shared/types';
import { toast } from 'sonner';
const BOARD_SIZE = 19;
const createInitialBoard = (): Stone[][] => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
};
interface GameStoreState extends Partial<GameState> {
  myPlayerId: string | null;
  mySessionId: string | null;
  hoveredCell: { row: number; col: number } | null;
  error: string | null;
  isLoading: boolean;
  fetchGame: (gameId: string) => Promise<void>;
  placeStone: (row: number, col: number) => Promise<void>;
  setPlayerSession: (playerId: string, sessionId: string) => void;
  setHoveredCell: (row: number, col: number) => void;
  clearHoveredCell: () => void;
}
export const useGameStore = create<GameStoreState>((set, get) => ({
  // Initial empty state
  gameId: undefined,
  board: createInitialBoard(),
  players: [],
  currentPlayer: 'black',
  gameStatus: undefined,
  turn: 0,
  myPlayerId: null,
  mySessionId: null,
  hoveredCell: null,
  error: null,
  isLoading: false,
  // Actions
  setPlayerSession: (playerId: string, sessionId: string) => {
    set({ myPlayerId: playerId, mySessionId: sessionId });
  },
  fetchGame: async (gameId: string) => {
    try {
      const response = await fetch(`/api/games/${gameId}`);
      if (!response.ok) {
        throw new Error('Game not found or server error.');
      }
      const result: ApiResponse<GameState> = await response.json();
      if (result.success && result.data) {
        set({ ...result.data, error: null });
      } else {
        throw new Error(result.error || 'Failed to fetch game state.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      set({ error: errorMessage });
      console.error("Fetch game error:", errorMessage);
    }
  },
  placeStone: async (row: number, col: number) => {
    const { gameId, myPlayerId, mySessionId, gameStatus } = get();
    if (!gameId || !myPlayerId || !mySessionId || gameStatus !== 'playing') {
      toast.error("Cannot make a move right now.");
      return;
    }
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/games/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId, sessionId: mySessionId, row, col }),
      });
      const result: ApiResponse<GameState> = await response.json();
      if (result.success && result.data) {
        // The poller will update the state, but we can update it here for faster feedback
        set({ ...result.data, error: null });
      } else {
        toast.error(result.error || "Invalid move.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Error making move: ${errorMessage}`);
    } finally {
      set({ isLoading: false });
    }
  },
  setHoveredCell: (row, col) => set({ hoveredCell: { row, col } }),
  clearHoveredCell: () => set({ hoveredCell: null }),
}));