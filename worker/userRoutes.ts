import { Hono } from "hono";
import { Env } from './core-utils';
import type { GameState, ApiResponse, GameSummary, Player } from '@shared/types';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // List all available games
    app.get('/api/games', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.listGames();
        return c.json({ success: true, data } satisfies ApiResponse<GameSummary[]>);
    });
    // Create a new game
    app.post('/api/games', async (c) => {
        const { playerName } = await c.req.json<{ playerName: string }>();
        if (!playerName) {
            return c.json({ success: false, error: 'Player name is required' }, 400);
        }
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.createGame(playerName);
        return c.json({ success: true, data } satisfies ApiResponse<{ game: GameState; player: Player }>);
    });
    // Get a specific game's state
    app.get('/api/games/:gameId', async (c) => {
        const { gameId } = c.req.param();
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.getGame(gameId);
        if (!data) {
            return c.json({ success: false, error: 'Game not found' }, 404);
        }
        return c.json({ success: true, data } satisfies ApiResponse<GameState>);
    });
    // Join a game
    app.post('/api/games/:gameId/join', async (c) => {
        const { gameId } = c.req.param();
        const { playerName } = await c.req.json<{ playerName: string }>();
        if (!playerName) {
            return c.json({ success: false, error: 'Player name is required' }, 400);
        }
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.joinGame(gameId, playerName);
        if (!data) {
            return c.json({ success: false, error: 'Failed to join game. It might be full or does not exist.' }, 400);
        }
        return c.json({ success: true, data } satisfies ApiResponse<{ game: GameState; player: Player }>);
    });
    // Make a move
    app.post('/api/games/:gameId/move', async (c) => {
        const { gameId } = c.req.param();
        const { playerId, sessionId, row, col } = await c.req.json<{ playerId: string; sessionId: string; row: number; col: number }>();
        if (!playerId || !sessionId || row === undefined || col === undefined) {
            return c.json({ success: false, error: 'Missing required move parameters' }, 400);
        }
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const result = await durableObjectStub.makeMove(gameId, playerId, sessionId, row, col);
        if ('error' in result) {
            return c.json({ success: false, error: result.error }, 400);
        }
        return c.json({ success: true, data: result } satisfies ApiResponse<GameState>);
    });
}