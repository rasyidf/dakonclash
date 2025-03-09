import { SupabaseClient } from '@supabase/supabase-js';
import { type NetworkAdapter } from '../services/OnlinePlayerService';
import { PlayerStatus, type PlayerData } from '../PlayerManager';
import { type Position } from '../types';

/**
 * Network adapter implementation using Supabase for online multiplayer
 */
export class SupabaseAdapter implements NetworkAdapter {
    private supabase: SupabaseClient;
    private roomId: string | null = null;
    private userId: string | null = null;
    private playerId: number | null = null;

    private moveCallback?: (playerId: number, position: Position) => void;
    private playerJoinedCallback?: (playerData: Partial<PlayerData>) => void;
    private playerLeftCallback?: (playerId: number) => void;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    /**
     * Send a player move to other players
     */
    public async sendMove(playerId: number, position: Position): Promise<boolean> {
        if (!this.roomId) {
            console.error('Cannot send move: not connected to a room');
            return false;
        }

        try {
            await this.supabase
                .from('game_moves')
                .insert({
                    room_id: this.roomId,
                    player_id: playerId,
                    position: position,
                    created_at: new Date().toISOString()
                });

            return true;
        } catch (error) {
            console.error('Failed to send move:', error);
            return false;
        }
    }

    /**
     * Broadcast game state to all players
     */
    public async broadcastGameState(state: any): Promise<void> {
        if (!this.roomId) return;

        try {
            await this.supabase
                .from('game_states')
                .insert({
                    room_id: this.roomId,
                    state: state,
                    created_at: new Date().toISOString()
                });
        } catch (error) {
            console.error('Failed to broadcast game state:', error);
        }
    }

    /**
     * Connect to a game room
     */
    public async connect(roomId: string, playerId: number): Promise<boolean> {
        this.roomId = roomId;
        this.playerId = playerId;

        // Get the authenticated user ID or generate a pseudonymous ID
        const { data } = await this.supabase.auth.getSession();
        this.userId = data.session?.user?.id || `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Join the room
        try {
            await this.supabase
                .from('game_players')
                .insert({
                    room_id: roomId,
                    user_id: this.userId,
                    player_id: playerId,
                    status: 'active',
                    connected_at: new Date().toISOString()
                });

            // Setup realtime subscriptions
            this.setupRealtimeSubscriptions();

            // Heartbeat to show this player is active
            this.startHeartbeat();

            return true;
        } catch (error) {
            console.error('Failed to join room:', error);
            return false;
        }
    }

    /**
     * Disconnect from a game room
     */
    public async disconnect(playerId: number): Promise<void> {
        if (!this.roomId || !this.userId) return;

        try {
            await this.supabase
                .from('game_players')
                .update({ status: 'disconnected' })
                .match({
                    room_id: this.roomId,
                    user_id: this.userId,
                    player_id: playerId
                });

            // Clean up subscriptions
            this.supabase.removeAllChannels();
        } catch (error) {
            console.error('Error during disconnect:', error);
        } finally {
            this.roomId = null;
            this.playerId = null;
        }
    }

    /**
     * Listen for moves from remote players
     */
    public onRemoteMove(callback: (playerId: number, position: Position) => void): void {
        this.moveCallback = callback;
    }

    /**
     * Listen for players joining the game
     */
    public onPlayerJoined(callback: (playerData: Partial<PlayerData>) => void): void {
        this.playerJoinedCallback = callback;
    }

    /**
     * Listen for players leaving the game
     */
    public onPlayerLeft(callback: (playerId: number) => void): void {
        this.playerLeftCallback = callback;
    }

    /**
     * Set up realtime subscriptions for game events
     */
    private setupRealtimeSubscriptions(): void {
        if (!this.roomId) return;

        // Subscribe to moves
        this.supabase
            .channel(`room-${this.roomId}-moves`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'game_moves',
                    filter: `room_id=eq.${this.roomId}`
                },
                (payload) => {
                    // Ignore own moves
                    if (payload.new.player_id !== this.playerId && this.moveCallback) {
                        this.moveCallback(
                            payload.new.player_id,
                            payload.new.position
                        );
                    }
                }
            )
            .subscribe();

        // Subscribe to player status changes
        this.supabase
            .channel(`room-${this.roomId}-players`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'game_players',
                    filter: `room_id=eq.${this.roomId}`
                },
                (payload) => {
                    // Notify when a new player joins
                    if (payload.new.user_id !== this.userId && this.playerJoinedCallback) {
                        this.fetchPlayerData(payload.new.player_id)
                            .then(playerData => {
                                if (playerData && this.playerJoinedCallback) {
                                    this.playerJoinedCallback(playerData);
                                }
                            });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'game_players',
                    filter: `room_id=eq.${this.roomId}`
                },
                (payload) => {
                    // Notify when a player's status changes to disconnected
                    if (
                        payload.new.user_id !== this.userId &&
                        payload.new.status === 'disconnected' &&
                        this.playerLeftCallback
                    ) {
                        this.playerLeftCallback(payload.new.player_id);
                    }
                }
            )
            .subscribe();
    }

    /**
     * Fetch detailed player data from the server
     */
    private async fetchPlayerData(playerId: number): Promise<Partial<PlayerData> | null> {
        if (!this.roomId) return null;

        try {
            const { data } = await this.supabase
                .from('game_players')
                .select('player_id, name, color, status')
                .match({ room_id: this.roomId, player_id: playerId })
                .single();

            if (data) {
                return {
                    id: data.player_id,
                    name: data.name || `Player ${data.player_id}`,
                    color: data.color,
                    status: data.status,
                };
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch player data:', error);
            return null;
        }
    }

    /**
     * Start periodic heartbeat to show player is still connected
     */
    private startHeartbeat(): void {
        setInterval(() => {
            if (this.roomId && this.userId && this.playerId) {
                this.supabase
                    .from('game_players')
                    .update({
                        last_active: new Date().toISOString()
                    })
                    .match({
                        room_id: this.roomId,
                        user_id: this.userId,
                        player_id: this.playerId
                    })
                    .then(() => { })
            }
        }, 15000); // Every 15 seconds
    }
}