import { useState } from 'react';
import { Smartphone, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generatePlayerId, getRandomEmoji, filterBadWords } from '../../lib/utils';
import { t } from '../../lib/translations';
import type { Language } from '../../lib/types';

interface JoinSessionProps {
  roomCode: string;
  onJoined: (playerId: string, sessionId: string) => void;
}

export function JoinSession({ roomCode, onJoined }: JoinSessionProps) {
  const [nickname, setNickname] = useState('');
  const [language, setLanguage] = useState<Language>('fa');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const joinSession = async () => {
    if (!nickname.trim()) {
      setError(language === 'fa' ? 'لطفا نام خود را وارد کنید' : 'Please enter a nickname');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const { data: session } = await supabase
        .from('sessions')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .maybeSingle();

      if (!session) {
        setError(t('invalidCode', language));
        setIsJoining(false);
        return;
      }

      if (session.status !== 'lobby') {
        setError(language === 'fa' ? 'بازی شروع شده است' : 'Game already started');
        setIsJoining(false);
        return;
      }

      const { data: existingPlayers } = await supabase
        .from('players')
        .select('id')
        .eq('session_id', session.id)
        .eq('status', 'connected');

      if (existingPlayers && existingPlayers.length >= session.max_players) {
        setError(t('roomFull', language));
        setIsJoining(false);
        return;
      }

      const playerId = generatePlayerId();
      const filteredNickname = filterBadWords(nickname.trim());
      const emoji = getRandomEmoji();

      const { data: player, error: joinError } = await supabase
        .from('players')
        .insert({
          session_id: session.id,
          nickname: filteredNickname,
          avatar_emoji: emoji,
          player_id: playerId,
          status: 'connected',
          team: null,
          score: 0,
          last_seen: new Date().toISOString(),
          reconnect_token: null,
        })
        .select()
        .single();

      if (joinError) throw joinError;

      localStorage.setItem('player_id', playerId);
      localStorage.setItem('session_id', session.id);
      localStorage.setItem('player_db_id', player.id);

      onJoined(player.id, session.id);
    } catch (error) {
      console.error('Failed to join session:', error);
      setError(language === 'fa' ? 'خطا در اتصال' : 'Failed to join');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <Smartphone className="w-20 h-20 text-blue-500" />
        </div>

        <h1 className="text-5xl font-bold text-center text-gray-800 mb-6">
          🎮
        </h1>

        <div className="bg-gray-100 rounded-2xl p-6 mb-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            {language === 'fa' ? 'کد اتاق' : 'Room Code'}
          </p>
          <p className="text-4xl font-mono font-bold text-gray-900 tracking-widest">
            {roomCode.toUpperCase()}
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setLanguage('fa')}
            className={`flex-1 px-4 py-3 rounded-xl font-bold transition ${
              language === 'fa'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            فارسی
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`flex-1 px-4 py-3 rounded-xl font-bold transition ${
              language === 'en'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            English
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {t('nickname', language)}
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && joinSession()}
            placeholder={language === 'fa' ? 'نام خود را وارد کنید' : 'Enter your name'}
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
            maxLength={20}
            dir={language === 'fa' ? 'rtl' : 'ltr'}
          />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border-2 border-red-400 rounded-xl">
            <p className="text-red-800 text-center font-semibold">{error}</p>
          </div>
        )}

        <button
          onClick={joinSession}
          disabled={isJoining || !nickname.trim()}
          className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white text-2xl font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
        >
          {isJoining ? (
            <span>{language === 'fa' ? 'در حال اتصال...' : 'Joining...'}</span>
          ) : (
            <>
              {t('join', language)}
              <ArrowRight className="w-6 h-6" />
            </>
          )}
        </button>

        <p className="mt-6 text-xs text-center text-gray-500">
          {language === 'fa'
            ? 'موبایل شما دسته بازی است'
            : 'Your phone is the controller'}
        </p>
      </div>
    </div>
  );
}
