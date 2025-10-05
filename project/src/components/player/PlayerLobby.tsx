import { useEffect, useState } from 'react';
import { Users, Wifi, WifiOff, HelpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { t } from '../../lib/translations';
import type { Session, Player, Language } from '../../lib/types';

interface PlayerLobbyProps {
  playerId: string;
  sessionId: string;
}

export function PlayerLobby({ playerId, sessionId }: PlayerLobbyProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    loadSessionAndPlayer();

    const heartbeat = setInterval(async () => {
      await supabase
        .from('players')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', playerId);
    }, 5000);

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
        loadPlayerCount();
      })
      .subscribe();

    return () => {
      clearInterval(heartbeat);
      sessionChannel.unsubscribe();
      playersChannel.unsubscribe();
    };
  }, [playerId, sessionId]);

  const loadSessionAndPlayer = async () => {
    const [sessionResult, playerResult] = await Promise.all([
      supabase.from('sessions').select('*').eq('id', sessionId).single(),
      supabase.from('players').select('*').eq('id', playerId).single(),
    ]);

    if (sessionResult.data) setSession(sessionResult.data);
    if (playerResult.data) setPlayer(playerResult.data);

    loadPlayerCount();
  };

  const loadPlayerCount = async () => {
    const { data } = await supabase
      .from('players')
      .select('id')
      .eq('session_id', sessionId)
      .eq('status', 'connected');

    if (data) setPlayerCount(data.length);
  };

  const handleTapTest = () => {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    const button = document.getElementById('tap-test');
    if (button) {
      button.classList.add('scale-150');
      setTimeout(() => button.classList.remove('scale-150'), 200);
    }
  };

  const lang = session?.language || 'fa';

  if (!session || !player) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Wifi className="w-16 h-16 text-blue-400 animate-pulse" />
      </div>
    );
  }

  if (player.status === 'kicked') {
    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 text-center max-w-md">
          <p className="text-4xl mb-4">😔</p>
          <p className="text-2xl font-bold text-gray-800">
            {lang === 'fa' ? 'از بازی اخراج شدید' : 'You were removed from the game'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-blue-500 to-green-400 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{player.avatar_emoji}</span>
              <div>
                <p className="text-2xl font-bold text-gray-800">{player.nickname}</p>
                <div className="flex items-center gap-2 text-green-600">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm">{t('connected', lang)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(true)}
              className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-yellow-100 rounded-2xl p-4 mb-4">
            <p className="text-xl font-bold text-gray-800 text-center">
              {t('score', lang)}: {player.score}
            </p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4">
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <Users className="w-5 h-5" />
              <span className="text-lg font-semibold">
                {playerCount} {t('players', lang)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <p className="text-2xl font-bold text-center text-gray-800 mb-6">
            {lang === 'fa' ? 'منتظر شروع بازی...' : 'Waiting for game to start...'}
          </p>

          <div className="mb-6">
            <p className="text-center text-gray-600 mb-4">
              {t('tutorial.tap', lang)}
            </p>
            <button
              id="tap-test"
              onClick={handleTapTest}
              className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white text-xl font-bold py-8 rounded-2xl shadow-lg active:shadow-xl transform transition-transform active:scale-95"
            >
              {t('tutorial.tapHere', lang)}
            </button>
          </div>

          <div className="flex justify-center animate-bounce">
            <div className="w-4 h-4 bg-blue-500 rounded-full mx-1"></div>
            <div className="w-4 h-4 bg-purple-500 rounded-full mx-1"></div>
            <div className="w-4 h-4 bg-pink-500 rounded-full mx-1"></div>
          </div>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">
              {t('help', lang)}
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>{t('onboarding.step1', lang)}</p>
              <p>{t('onboarding.step2', lang)}</p>
              <p>{t('onboarding.step3', lang)}</p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-6 bg-blue-500 text-white font-bold py-3 rounded-xl"
            >
              {lang === 'fa' ? 'بستن' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
