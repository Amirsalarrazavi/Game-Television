import { useEffect, useState } from 'react';
import { Copy, Lock, Settings, Users, Wifi, WifiOff, Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getQRCodeUrl } from '../../lib/utils';
import { t } from '../../lib/translations';
import type { Session, Player, Language } from '../../lib/types';
import { PlayerList } from './PlayerList';
import { SettingsPanel } from './SettingsPanel';
import { NetworkStatus } from './NetworkStatus';

interface HostLobbyProps {
  sessionId: string;
  roomCode: string;
}

export function HostLobby({ sessionId, roomCode }: HostLobbyProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    loadSession();
    loadPlayers();

    const sessionChannel = supabase
      .channel(`session:${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId}`,
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setSession(payload.new as Session);
        }
      })
      .subscribe();

    const playersChannel = supabase
      .channel(`players:${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `session_id=eq.${sessionId}`,
      }, () => {
        loadPlayers();
      })
      .subscribe();

    return () => {
      sessionChannel.unsubscribe();
      playersChannel.unsubscribe();
    };
  }, [sessionId]);

  const loadSession = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (data) setSession(data);
  };

  const loadPlayers = async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true });

    if (data) setPlayers(data);
  };

  const copyLink = () => {
    const joinUrl = `${window.location.origin}/join/${roomCode}`;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = async () => {
    if (players.length < 2) {
      alert(session?.language === 'fa'
        ? 'حداقل ۲ بازیکن لازم است'
        : 'At least 2 players required');
      return;
    }

    await supabase
      .from('sessions')
      .update({ status: 'tutorial', last_activity: new Date().toISOString() })
      .eq('id', sessionId);
  };

  const lang = session?.language || 'fa';
  const qrUrl = getQRCodeUrl(roomCode);

  if (!session) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <Wifi className="w-16 h-16 text-blue-400 animate-pulse" />
    </div>;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 ${
      session.settings.bigText ? 'text-2xl' : 'text-base'
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-7xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {t('lobby', lang)}
            </h1>
            <div className="flex items-center gap-4">
              <div className="bg-white text-gray-900 px-8 py-4 rounded-2xl text-5xl font-mono font-bold tracking-widest">
                {roomCode}
              </div>
              <button
                onClick={copyLink}
                className="bg-blue-500 hover:bg-blue-600 p-4 rounded-xl transition"
              >
                {copied ? '✓' : <Copy className="w-6 h-6" />}
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <NetworkStatus />
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-gray-700 hover:bg-gray-600 p-4 rounded-xl transition"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-4xl font-bold flex items-center gap-3">
                <Users className="w-10 h-10" />
                {t('players', lang)} ({players.filter(p => p.status === 'connected').length}/{session.max_players})
              </h2>
            </div>

            <PlayerList
              players={players}
              sessionId={sessionId}
              language={lang}
            />
          </div>

          <div className="bg-gray-800 rounded-3xl p-8 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold mb-6 text-center">
              {t('scanQR', lang)}
            </p>
            <img
              src={qrUrl}
              alt="QR Code"
              className="w-80 h-80 bg-white p-4 rounded-2xl shadow-2xl"
            />
            <p className="mt-6 text-xl text-gray-400 text-center">
              {window.location.origin}/join/{roomCode}
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={startGame}
            disabled={players.filter(p => p.status === 'connected').length < 2}
            className="bg-gradient-to-r from-green-400 to-blue-500 text-white text-4xl font-bold py-6 px-16 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="flex items-center gap-4">
              <Play className="w-10 h-10" />
              {t('startGame', lang)}
            </span>
          </button>
        </div>

        {players.filter(p => p.status === 'connected').length < 2 && (
          <p className="text-center text-2xl text-gray-400 mt-4">
            {lang === 'fa'
              ? 'منتظر بازیکنان بیشتر...'
              : 'Waiting for more players...'}
          </p>
        )}
      </div>

      {showSettings && (
        <SettingsPanel
          session={session}
          onClose={() => setShowSettings(false)}
          onUpdate={loadSession}
        />
      )}
    </div>
  );
}
