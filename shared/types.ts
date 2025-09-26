// This file is for shared types between the worker and the client
// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
// Kido Go Game Types
export type Stone = 'black' | 'white' | null;
export type PlayerColor = 'black' | 'white';
export interface Player {
  id: string; // Unique player ID
  sessionId: string; // Unique session ID for authentication
  name: string;
  color: PlayerColor;
  captures: number;
}
export type GameStatus = 'waiting' | 'playing' | 'finished';
export interface GameState {
  gameId: string;
  board: Stone[][];
  players: Player[];
  currentPlayer: PlayerColor;
  gameStatus: GameStatus;
  winner?: PlayerColor | null;
  turn: number;
  lastMove: { row: number; col: number } | null;
  history: { row: number; col: number; color: PlayerColor }[];
}
// A summarized version of the game state for lobby listings
export interface GameSummary {
  gameId: string;
  player1Name?: string;
  player2Name?: string;
  gameStatus: GameStatus;
  turn: number;
}