import { DurableObject } from "cloudflare:workers";
import type { GameState, Player, Stone, GameSummary, PlayerColor } from '@shared/types';
const BOARD_SIZE = 19;
const createInitialBoard = (): Stone[][] => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
};
export class GlobalDurableObject extends DurableObject {
    private games: Map<string, GameState> = new Map();
    constructor(state: DurableObjectState, env: any) {
        super(state, env);
        this.ctx.blockConcurrencyWhile(async () => {
            const storedGames = await this.ctx.storage.get<Map<string, GameState>>("games");
            if (storedGames) {
                this.games = storedGames;
            }
        });
    }
    private async saveState() {
        await this.ctx.storage.put("games", this.games);
    }
    async createGame(playerName: string): Promise<{ game: GameState; player: Player }> {
        const gameId = crypto.randomUUID();
        const player1: Player = {
            id: crypto.randomUUID(),
            sessionId: crypto.randomUUID(),
            name: playerName,
            color: 'black',
            captures: 0,
        };
        const newGame: GameState = {
            gameId,
            board: createInitialBoard(),
            players: [player1],
            currentPlayer: 'black',
            gameStatus: 'waiting',
            turn: 1,
            winner: null,
            lastMove: null,
            history: [],
        };
        this.games.set(gameId, newGame);
        await this.saveState();
        return { game: newGame, player: player1 };
    }
    async joinGame(gameId: string, playerName: string): Promise<{ game: GameState; player: Player } | null> {
        const game = this.games.get(gameId);
        if (!game || game.players.length >= 2) {
            return null;
        }
        const player2: Player = {
            id: crypto.randomUUID(),
            sessionId: crypto.randomUUID(),
            name: playerName,
            color: 'white',
            captures: 0,
        };
        game.players.push(player2);
        game.gameStatus = 'playing';
        this.games.set(gameId, game);
        await this.saveState();
        return { game, player: player2 };
    }
    async getGame(gameId: string): Promise<GameState | null> {
        return this.games.get(gameId) || null;
    }
    async listGames(): Promise<GameSummary[]> {
        const summaries: GameSummary[] = [];
        for (const [gameId, game] of this.games.entries()) {
            summaries.push({
                gameId,
                player1Name: game.players[0]?.name,
                player2Name: game.players[1]?.name,
                gameStatus: game.gameStatus,
                turn: game.turn,
            });
        }
        return summaries;
    }
    async makeMove(gameId: string, playerId: string, sessionId: string, row: number, col: number): Promise<GameState | { error: string }> {
        const game = this.games.get(gameId);
        if (!game) return { error: "Game not found." };
        if (game.gameStatus !== 'playing') return { error: "Game is not active." };
        const player = game.players.find(p => p.id === playerId);
        if (!player) return { error: "Player not found in this game." };
        if (player.sessionId !== sessionId) return { error: "Authentication failed." };
        if (player.color !== game.currentPlayer) return { error: "Not your turn." };
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return { error: "Invalid coordinates." };
        if (game.board[row][col]) return { error: "Intersection is already occupied." };

        // Ko rule check: prevent repeating the immediately previous board state
        if (game.history.length > 0) {
            const previousBoardState = JSON.stringify(game.history[game.history.length - 1].board);
            const tempBoardForKo = game.board.map(r => [...r]);
            tempBoardForKo[row][col] = player.color;
            // Simplified capture logic for Ko check
            const opponentColorForKo = player.color === 'black' ? 'white' : 'black';
            const neighborsForKo = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of neighborsForKo) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && tempBoardForKo[nr][nc] === opponentColorForKo) {
                    const { group, liberties } = this.findGroup(nr, nc, tempBoardForKo);
                    if (liberties === 0) {
                        for (const { r, c } of group) {
                            tempBoardForKo[r][c] = null;
                        }
                    }
                }
            }
            if (JSON.stringify(tempBoardForKo) === previousBoardState) {
                return { error: "Illegal Ko move. Cannot repeat the previous board state." };
            }
        }
        const tempBoard = game.board.map(r => [...r]);
        tempBoard[row][col] = player.color;
        const opponentColor = player.color === 'black' ? 'white' : 'black';
        let capturedStones = 0;
        const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of neighbors) {
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && tempBoard[nr][nc] === opponentColor) {
                const { group, liberties } = this.findGroup(nr, nc, tempBoard);
                if (liberties === 0) {
                    capturedStones += group.length;
                    for (const { r, c } of group) {
                        tempBoard[r][c] = null;
                    }
                }
            }
        }
        if (capturedStones > 0) {
            player.captures += capturedStones;
        } else {
            // Suicide rule check
            const { liberties } = this.findGroup(row, col, tempBoard);
            if (liberties === 0) {
                return { error: "Illegal suicide move." };
            }
        }
        game.board = tempBoard;
        game.currentPlayer = opponentColor;
        game.turn += 1;
        game.lastMove = { row, col };
        game.history.push({ row, col, color: player.color, board: game.board });
        this.games.set(gameId, game);
        await this.saveState();
        return game;
    }
    private findGroup(row: number, col: number, board: Stone[][]): { group: { r: number, c: number }[], liberties: number } {
        const color = board[row][col];
        if (!color) return { group: [], liberties: 0 };
        const q: { r: number, c: number }[] = [{ r: row, c: col }];
        const visitedGroup = new Set<string>([`${row},${col}`]);
        const group = [{ r: row, c: col }];
        const libertySet = new Set<string>();
        const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        while (q.length > 0) {
            const { r, c } = q.shift()!;
            for (const [dr, dc] of neighbors) {
                const nr = r + dr;
                const nc = c + dc;
                const key = `${nr},${nc}`;
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                    if (visitedGroup.has(key)) continue;

                    if (board[nr][nc] === color) {
                        visitedGroup.add(key);
                        q.push({ r: nr, c: nc });
                        group.push({ r: nr, c: nc });
                    } else if (board[nr][nc] === null) {
                        libertySet.add(key);
                    }
                }
            }
        }
        return { group, liberties: libertySet.size };
    }
}