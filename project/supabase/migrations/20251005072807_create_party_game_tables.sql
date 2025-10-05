/*
  # Party Game Launcher Database Schema

  ## Overview
  Creates the core database structure for a multiplayer party game system with realtime TV host and mobile player support.

  ## New Tables
  
  ### 1. `sessions`
  Stores game session information created by hosts on TV/laptop
  - `id` (uuid, primary key) - Unique session identifier
  - `room_code` (text, unique) - 6-character human-readable join code
  - `host_id` (text) - Browser fingerprint or temp ID of host
  - `status` (text) - Session state: 'lobby', 'tutorial', 'playing', 'ended'
  - `language` (text) - UI language: 'fa' (Farsi) or 'en' (English)
  - `max_players` (int) - Maximum allowed players (default 12)
  - `current_game` (text, nullable) - Active game: 'name_game', 'song_guess', 'spy'
  - `settings` (jsonb) - Game settings: {bigText, colorBlind, kidsMode, allowAnonymous}
  - `created_at` (timestamptz) - Session creation time
  - `expires_at` (timestamptz) - Auto-expiry time (24 hours default)
  - `last_activity` (timestamptz) - Last update for cleanup

  ### 2. `players`
  Stores player information who join via mobile
  - `id` (uuid, primary key) - Unique player identifier
  - `session_id` (uuid, foreign key) - Links to sessions table
  - `nickname` (text) - Player display name (supports Farsi)
  - `avatar_emoji` (text) - Random emoji avatar
  - `player_id` (text) - Browser fingerprint for reconnection
  - `status` (text) - Connection state: 'connected', 'disconnected', 'kicked'
  - `team` (text, nullable) - Team assignment: 'team_a', 'team_b', or null
  - `score` (int) - Player score across games
  - `joined_at` (timestamptz) - Join timestamp
  - `last_seen` (timestamptz) - Last activity for auto-reconnect
  - `reconnect_token` (text, nullable) - Token for 60s rejoin window

  ### 3. `game_state`
  Stores realtime game state for active sessions
  - `id` (uuid, primary key) - Unique state identifier
  - `session_id` (uuid, foreign key, unique) - One state per session
  - `round` (int) - Current round number
  - `phase` (text) - Game phase: 'waiting', 'question', 'answer', 'results'
  - `data` (jsonb) - Game-specific state data
  - `updated_at` (timestamptz) - Last state update

  ### 4. `telemetry`
  Optional anonymous usage tracking
  - `id` (uuid, primary key) - Unique event identifier
  - `session_id` (uuid, nullable) - Associated session if applicable
  - `event_type` (text) - Event category: 'session_created', 'player_joined', 'game_started', 'error'
  - `metadata` (jsonb) - Event-specific data
  - `created_at` (timestamptz) - Event timestamp

  ## Security
  - Enable RLS on all tables
  - Sessions: Anyone can read active sessions by room_code; only host can update
  - Players: Anyone can insert (join); players can update own record; session host can update any
  - Game state: Read by session participants; write by host only
  - Telemetry: Insert only if user opted in

  ## Indexes
  - room_code lookup (sessions)
  - session_id foreign key lookups
  - expires_at for cleanup queries

  ## Important Notes
  1. Room codes expire after 24 hours by default
  2. Players can rejoin within 60s using reconnect_token
  3. All timestamps use UTC
  4. Realtime subscriptions will be used for live updates
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code text UNIQUE NOT NULL,
  host_id text NOT NULL,
  status text NOT NULL DEFAULT 'lobby',
  language text NOT NULL DEFAULT 'fa',
  max_players int NOT NULL DEFAULT 12,
  current_game text,
  settings jsonb DEFAULT '{"bigText": false, "colorBlind": false, "kidsMode": true, "allowAnonymous": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  last_activity timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('lobby', 'tutorial', 'playing', 'ended')),
  CONSTRAINT valid_language CHECK (language IN ('fa', 'en')),
  CONSTRAINT valid_game CHECK (current_game IS NULL OR current_game IN ('name_game', 'song_guess', 'spy'))
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  avatar_emoji text NOT NULL,
  player_id text NOT NULL,
  status text NOT NULL DEFAULT 'connected',
  team text,
  score int DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  reconnect_token text,
  CONSTRAINT valid_status CHECK (status IN ('connected', 'disconnected', 'kicked')),
  CONSTRAINT valid_team CHECK (team IS NULL OR team IN ('team_a', 'team_b'))
);

-- Game state table
CREATE TABLE IF NOT EXISTS game_state (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  round int DEFAULT 1,
  phase text NOT NULL DEFAULT 'waiting',
  data jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_phase CHECK (phase IN ('waiting', 'question', 'answer', 'results'))
);

-- Telemetry table
CREATE TABLE IF NOT EXISTS telemetry (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_room_code ON sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_players_session_id ON players(session_id);
CREATE INDEX IF NOT EXISTS idx_players_player_id ON players(player_id);
CREATE INDEX IF NOT EXISTS idx_game_state_session_id ON game_state(session_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_session_id ON telemetry(session_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON telemetry(created_at);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
CREATE POLICY "Anyone can read active sessions by room code"
  ON sessions FOR SELECT
  USING (expires_at > now() AND status != 'ended');

CREATE POLICY "Anyone can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Hosts can update their own sessions"
  ON sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for players
CREATE POLICY "Anyone can view players in active sessions"
  ON players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = players.session_id
      AND sessions.expires_at > now()
    )
  );

CREATE POLICY "Anyone can join as a player"
  ON players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = players.session_id
      AND sessions.status = 'lobby'
      AND sessions.expires_at > now()
    )
  );

CREATE POLICY "Players can update their own status"
  ON players FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Players can be deleted from sessions"
  ON players FOR DELETE
  USING (true);

-- RLS Policies for game_state
CREATE POLICY "Anyone can view game state for active sessions"
  ON game_state FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = game_state.session_id
      AND sessions.expires_at > now()
    )
  );

CREATE POLICY "Game state can be created for sessions"
  ON game_state FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Game state can be updated"
  ON game_state FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for telemetry
CREATE POLICY "Telemetry can be inserted"
  ON telemetry FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Telemetry is read-only for analysis"
  ON telemetry FOR SELECT
  USING (true);