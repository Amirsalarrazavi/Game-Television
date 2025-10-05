import { Music, Users, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { t } from '../../lib/translations';
import type { Language, GameType } from '../../lib/types';

interface GameSelectorProps {
  sessionId: string;
  language: Language;
}

export function GameSelector({ sessionId, language }: GameSelectorProps) {
  const selectGame = async (game: GameType) => {
    await supabase
      .from('sessions')
      .update({
        current_game: game,
        status: 'playing',
        last_activity: new Date().toISOString()
      })
      .eq('id', sessionId);

    await supabase
      .from('game_state')
      .insert({
        session_id: sessionId,
        round: 1,
        phase: 'waiting',
        data: {},
      });
  };

  const games = [
    {
      id: 'name_game' as GameType,
      icon: <Users className="w-16 h-16" />,
      color: 'from-blue-400 to-blue-600',
      emoji: '📝',
    },
    {
      id: 'song_guess' as GameType,
      icon: <Music className="w-16 h-16" />,
      color: 'from-purple-400 to-purple-600',
      emoji: '🎵',
    },
    {
      id: 'spy' as GameType,
      icon: <Eye className="w-16 h-16" />,
      color: 'from-red-400 to-red-600',
      emoji: '🕵️',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-6xl font-bold text-center mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          {language === 'fa' ? 'انتخاب بازی' : 'Choose a Game'}
        </h1>

        <p className="text-2xl text-center text-gray-400 mb-12">
          {language === 'fa'
            ? 'یک بازی را برای شروع انتخاب کنید'
            : 'Select a game to start playing'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => selectGame(game.id)}
              className={`bg-gradient-to-br ${game.color} rounded-3xl p-8 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300`}
            >
              <div className="text-center">
                <div className="text-7xl mb-4">{game.emoji}</div>
                <div className="flex justify-center mb-4">
                  {game.icon}
                </div>
                <h3 className="text-3xl font-bold mb-2">
                  {t(`gameCards.${game.id}.title`, language)}
                </h3>
                <p className="text-lg opacity-90">
                  {t(`gameCards.${game.id}.description`, language)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
