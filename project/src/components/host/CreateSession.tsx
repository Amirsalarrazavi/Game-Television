import { useState } from 'react';
import { Tv, Laptop, Wifi } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generateRoomCode, generateHostId } from '../../lib/utils';
import { t } from '../../lib/translations';
import type { Language } from '../../lib/types';

interface CreateSessionProps {
  onSessionCreated: (sessionId: string, roomCode: string) => void;
}

export function CreateSession({ onSessionCreated }: CreateSessionProps) {
  const [language, setLanguage] = useState<Language>('fa');
  const [isCreating, setIsCreating] = useState(false);
  const [browserCheck, setBrowserCheck] = useState<'checking' | 'good' | 'warning'>('good');

  const checkBrowser = () => {
    const ua = navigator.userAgent;
    const isModern = 'WebSocket' in window && 'localStorage' in window;
    if (!isModern) {
      setBrowserCheck('warning');
    }
  };

  const createSession = async () => {
    setIsCreating(true);
    checkBrowser();

    try {
      const roomCode = generateRoomCode();
      const hostId = generateHostId();

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          room_code: roomCode,
          host_id: hostId,
          status: 'lobby',
          language,
          max_players: 12,
          current_game: null,
          settings: {
            bigText: false,
            colorBlind: false,
            kidsMode: true,
            allowAnonymous: true,
          },
          last_activity: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem('host_id', hostId);
      localStorage.setItem('session_id', data.id);

      onSessionCreated(data.id, roomCode);
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to create session. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center">
        <div className="flex justify-center gap-6 mb-8">
          <Tv className="w-16 h-16 text-blue-500" />
          <Laptop className="w-16 h-16 text-purple-500" />
        </div>

        <h1 className="text-6xl font-bold text-gray-800 mb-4">
          🎮 Party Game
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          {language === 'fa'
            ? 'مهمونی رو شروع کن!'
            : 'Start the Party!'}
        </p>

        <div className="mb-8 flex justify-center gap-4">
          <button
            onClick={() => setLanguage('fa')}
            className={`px-6 py-3 rounded-xl font-bold transition ${
              language === 'fa'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            فارسی
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-6 py-3 rounded-xl font-bold transition ${
              language === 'en'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            English
          </button>
        </div>

        {browserCheck === 'warning' && (
          <div className="mb-6 p-4 bg-yellow-100 border-2 border-yellow-400 rounded-xl">
            <p className="text-yellow-800 font-semibold">
              {language === 'fa'
                ? '⚠️ برای بهترین تجربه از لپتاپ + HDMI استفاده کنید'
                : '⚠️ For best experience, use laptop + HDMI'}
            </p>
          </div>
        )}

        <button
          onClick={createSession}
          disabled={isCreating}
          className="bg-gradient-to-r from-green-400 to-blue-500 text-white text-3xl font-bold py-6 px-12 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <span className="flex items-center gap-3 justify-center">
              <Wifi className="w-8 h-8 animate-pulse" />
              {language === 'fa' ? 'در حال ساخت...' : 'Creating...'}
            </span>
          ) : (
            t('createSession', language)
          )}
        </button>

        <p className="mt-6 text-sm text-gray-500">
          {language === 'fa'
            ? 'تا ۱۲ نفر می‌توانند با موبایل خود به بازی بپیوندند'
            : 'Up to 12 players can join using their mobile phones'}
        </p>
      </div>
    </div>
  );
}
