import { useState, useEffect } from 'react';
import { CreateSession } from './components/host/CreateSession';
import { HostLobby } from './components/host/HostLobby';
import { JoinSession } from './components/player/JoinSession';
import { PlayerLobby } from './components/player/PlayerLobby';
import { OnboardingTour } from './components/shared/OnboardingTour';
import { GameSelector } from './components/games/GameSelector';
import { NameGame } from './components/games/NameGame';
import { supabase } from './lib/supabase';
import type { Session } from './lib/types';

type ViewMode = 'home' | 'host-lobby' | 'player-join' | 'player-lobby' | 'tutorial' | 'game-select' | 'playing';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    const joinMatch = path.match(/^\/join\/([A-Z0-9]{6})$/i);

    if (joinMatch) {
      const code = joinMatch[1];
      setRoomCode(code);
      setViewMode('player-join');
      return;
    }

    const storedHostId = localStorage.getItem('host_id');
    const storedSessionId = localStorage.getItem('session_id');
    const storedPlayerId = localStorage.getItem('player_db_id');

    if (storedHostId && storedSessionId) {
      loadHostSession(storedSessionId);
    } else if (storedPlayerId && storedSessionId) {
      setPlayerId(storedPlayerId);
      setSessionId(storedSessionId);
      setViewMode('player-lobby');
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId}`,
      }, (payload) => {
        const updated = payload.new as Session;
        setSession(updated);

        if (updated.status === 'tutorial') {
          setShowTutorial(true);
        } else if (updated.status === 'playing' && !updated.current_game) {
          setViewMode('game-select');
        } else if (updated.status === 'playing' && updated.current_game) {
          setViewMode('playing');
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId]);

  const loadHostSession = async (id: string) => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      setSession(data);
      setSessionId(data.id);
      setRoomCode(data.room_code);

      if (data.status === 'lobby') {
        setViewMode('host-lobby');
      } else if (data.status === 'tutorial') {
        setShowTutorial(true);
      } else if (data.status === 'playing' && !data.current_game) {
        setViewMode('game-select');
      } else if (data.status === 'playing' && data.current_game) {
        setViewMode('playing');
      }
    } else {
      setViewMode('home');
    }
  };

  const handleSessionCreated = (id: string, code: string) => {
    setSessionId(id);
    setRoomCode(code);
    setViewMode('host-lobby');
  };

  const handlePlayerJoined = (pId: string, sId: string) => {
    setPlayerId(pId);
    setSessionId(sId);
    setViewMode('player-lobby');
  };

  const handleTutorialComplete = async () => {
    setShowTutorial(false);

    if (localStorage.getItem('host_id') && sessionId) {
      await supabase
        .from('sessions')
        .update({ status: 'playing' })
        .eq('id', sessionId);
      setViewMode('game-select');
    }
  };

  const handleTutorialSkip = async () => {
    setShowTutorial(false);

    if (localStorage.getItem('host_id') && sessionId) {
      await supabase
        .from('sessions')
        .update({ status: 'playing' })
        .eq('id', sessionId);
      setViewMode('game-select');
    }
  };

  const isHost = !!localStorage.getItem('host_id');

  if (showTutorial) {
    return (
      <OnboardingTour
        language={session?.language || 'fa'}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      />
    );
  }

  if (viewMode === 'game-select' && isHost && sessionId) {
    return <GameSelector sessionId={sessionId} language={session?.language || 'fa'} />;
  }

  if (viewMode === 'playing' && sessionId && session?.current_game === 'name_game') {
    return (
      <NameGame
        sessionId={sessionId}
        language={session.language}
        isHost={isHost}
      />
    );
  }

  if (viewMode === 'home') {
    return <CreateSession onSessionCreated={handleSessionCreated} />;
  }

  if (viewMode === 'host-lobby' && sessionId && roomCode) {
    return <HostLobby sessionId={sessionId} roomCode={roomCode} />;
  }

  if (viewMode === 'player-join' && roomCode) {
    return <JoinSession roomCode={roomCode} onJoined={handlePlayerJoined} />;
  }

  if (viewMode === 'player-lobby' && playerId && sessionId) {
    return <PlayerLobby playerId={playerId} sessionId={sessionId} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-2xl text-gray-600">Loading...</p>
    </div>
  );
}

export default App;
