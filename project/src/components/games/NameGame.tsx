import { useState, useEffect } from 'react';
import { Clock, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { t } from '../../lib/translations';
import type { Language, Player } from '../../lib/types';

interface NameGameProps {
  sessionId: string;
  language: Language;
  isHost?: boolean;
}

export function NameGame({ sessionId, language, isHost = false }: NameGameProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    loadPlayers();

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionId]);

  const loadPlayers = async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'connected')
      .order('score', { ascending: false });

    if (data) setPlayers(data);
  };

  if (isHost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-blue-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-6xl font-bold">
              {t('gameCards.name_game.title', language)}
            </h1>
            <div className="flex items-center gap-6">
              <div className="bg-white text-gray-900 px-6 py-3 rounded-2xl">
                <span className="text-2xl font-bold">{t('round', language)} {round}</span>
              </div>
              <div className="bg-red-500 px-6 py-3 rounded-2xl flex items-center gap-3">
                <Clock className="w-8 h-8" />
                <span className="text-3xl font-mono font-bold">{timeLeft}s</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="bg-gray-800 rounded-2xl p-6 text-center"
              >
                <div className="text-5xl mb-3">{player.avatar_emoji}</div>
                <p className="text-2xl font-bold mb-2">{player.nickname}</p>
                <div className="bg-yellow-400 text-gray-900 rounded-xl py-2">
                  <span className="text-2xl font-bold">{player.score}</span>
                </div>
                {index === 0 && (
                  <div className="mt-2 text-3xl">👑</div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gray-800 rounded-3xl p-8 text-center">
            <p className="text-4xl font-bold mb-4">
              {language === 'fa' ? 'حرف: ک' : 'Letter: A'}
            </p>
            <p className="text-2xl text-gray-400">
              {language === 'fa'
                ? 'بازیکنان با این حرف کلمه پیدا می‌کنند'
                : 'Players find words starting with this letter'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-6">
          <div className="text-center mb-6">
            <div className="text-8xl mb-4">📝</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {t('gameCards.name_game.title', language)}
            </h2>
            <div className="flex justify-center gap-4">
              <div className="bg-blue-100 px-4 py-2 rounded-xl">
                <span className="text-lg font-bold text-blue-800">
                  {t('round', language)} {round}
                </span>
              </div>
              <div className="bg-red-100 px-4 py-2 rounded-xl flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-800" />
                <span className="text-lg font-bold text-red-800">{timeLeft}s</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-100 rounded-2xl p-8 mb-6 text-center">
            <p className="text-6xl font-bold text-gray-800">
              {language === 'fa' ? 'ک' : 'A'}
            </p>
          </div>

          <p className="text-center text-gray-600 mb-6">
            {language === 'fa'
              ? 'صفحه موبایل شما فقط برای نمایش است. از تلویزیون پیروی کنید!'
              : 'Your phone is for display only. Follow the TV!'}
          </p>
        </div>
      </div>
    </div>
  );
}
