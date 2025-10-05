export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at'>;
        Update: Partial<Omit<Session, 'id' | 'created_at'>>;
      };
      players: {
        Row: Player;
        Insert: Omit<Player, 'id' | 'joined_at'>;
        Update: Partial<Omit<Player, 'id' | 'joined_at'>>;
      };
      game_state: {
        Row: GameState;
        Insert: Omit<GameState, 'id' | 'updated_at'>;
        Update: Partial<Omit<GameState, 'id' | 'updated_at'>>;
      };
      telemetry: {
        Row: Telemetry;
        Insert: Omit<Telemetry, 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
}

export type SessionStatus = 'lobby' | 'tutorial' | 'playing' | 'ended';
export type Language = 'fa' | 'en';
export type GameType = 'name_game' | 'song_guess' | 'spy';
export type PlayerStatus = 'connected' | 'disconnected' | 'kicked';
export type Team = 'team_a' | 'team_b' | null;
export type GamePhase = 'waiting' | 'question' | 'answer' | 'results';

export interface Session {
  id: string;
  room_code: string;
  host_id: string;
  status: SessionStatus;
  language: Language;
  max_players: number;
  current_game: GameType | null;
  settings: SessionSettings;
  created_at: string;
  expires_at: string;
  last_activity: string;
}

export interface SessionSettings {
  bigText: boolean;
  colorBlind: boolean;
  kidsMode: boolean;
  allowAnonymous: boolean;
}

export interface Player {
  id: string;
  session_id: string;
  nickname: string;
  avatar_emoji: string;
  player_id: string;
  status: PlayerStatus;
  team: Team;
  score: number;
  joined_at: string;
  last_seen: string;
  reconnect_token: string | null;
}

export interface GameState {
  id: string;
  session_id: string;
  round: number;
  phase: GamePhase;
  data: Record<string, any>;
  updated_at: string;
}

export interface Telemetry {
  id: string;
  session_id: string | null;
  event_type: string;
  metadata: Record<string, any>;
  created_at: string;
}
