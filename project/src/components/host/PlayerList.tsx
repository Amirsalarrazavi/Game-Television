import { UserX, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { t } from '../../lib/translations';
import type { Player, Language } from '../../lib/types';

interface PlayerListProps {
  players: Player[];
  sessionId: string;
  language: Language;
}

export function PlayerList({ players, sessionId, language }: PlayerListProps) {
  const kickPlayer = async (playerId: string) => {
    await supabase
      .from('players')
      .update({ status: 'kicked' })
      .eq('id', playerId);
  };

  const connectedPlayers = players.filter(p => p.status === 'connected');
  const disconnectedPlayers = players.filter(p => p.status === 'disconnected');

  return (
    <div className="space-y-4">
      {connectedPlayers.map((player, index) => (
        <div
          key={player.id}
          className="bg-gray-700 rounded-2xl p-6 flex items-center justify-between animate-slideIn"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl">{player.avatar_emoji}</span>
            <div>
              <p className="text-2xl font-bold">{player.nickname}</p>
              <div className="flex items-center gap-2 text-green-400">
                <Wifi className="w-4 h-4" />
                <span className="text-sm">{t('connected', language)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-yellow-400">
              {player.score}
            </span>
            <button
              onClick={() => kickPlayer(player.id)}
              className="bg-red-500 hover:bg-red-600 p-3 rounded-xl transition"
            >
              <UserX className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}

      {disconnectedPlayers.map((player) => (
        <div
          key={player.id}
          className="bg-gray-700 bg-opacity-50 rounded-2xl p-6 flex items-center justify-between opacity-50"
        >
          <div className="flex items-center gap-4">
            <span className="text-4xl grayscale">{player.avatar_emoji}</span>
            <div>
              <p className="text-2xl font-bold">{player.nickname}</p>
              <div className="flex items-center gap-2 text-gray-400">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">{t('disconnected', language)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {players.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-2xl">
            {language === 'fa'
              ? 'منتظر بازیکنان...'
              : 'Waiting for players...'}
          </p>
        </div>
      )}
    </div>
  );
}
