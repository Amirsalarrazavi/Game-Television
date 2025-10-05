import { X } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { t } from '../../lib/translations';
import type { Session } from '../../lib/types';

interface SettingsPanelProps {
  session: Session;
  onClose: () => void;
  onUpdate: () => void;
}

export function SettingsPanel({ session, onClose, onUpdate }: SettingsPanelProps) {
  const [settings, setSettings] = useState(session.settings);
  const [maxPlayers, setMaxPlayers] = useState(session.max_players);

  const saveSettings = async () => {
    await supabase
      .from('sessions')
      .update({
        settings,
        max_players: maxPlayers,
        last_activity: new Date().toISOString()
      })
      .eq('id', session.id);

    onUpdate();
    onClose();
  };

  const lang = session.language;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-4xl font-bold">{t('settings', lang)}</h2>
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 p-3 rounded-xl transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-700 rounded-2xl p-6">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-2xl font-semibold">{t('bigText', lang)}</span>
              <input
                type="checkbox"
                checked={settings.bigText}
                onChange={(e) => setSettings({ ...settings, bigText: e.target.checked })}
                className="w-8 h-8 rounded"
              />
            </label>
          </div>

          <div className="bg-gray-700 rounded-2xl p-6">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-2xl font-semibold">{t('colorBlind', lang)}</span>
              <input
                type="checkbox"
                checked={settings.colorBlind}
                onChange={(e) => setSettings({ ...settings, colorBlind: e.target.checked })}
                className="w-8 h-8 rounded"
              />
            </label>
          </div>

          <div className="bg-gray-700 rounded-2xl p-6">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-2xl font-semibold">{t('kidsMode', lang)}</span>
              <input
                type="checkbox"
                checked={settings.kidsMode}
                onChange={(e) => setSettings({ ...settings, kidsMode: e.target.checked })}
                className="w-8 h-8 rounded"
              />
            </label>
          </div>

          <div className="bg-gray-700 rounded-2xl p-6">
            <label className="block">
              <span className="text-2xl font-semibold block mb-3">{t('maxPlayers', lang)}</span>
              <input
                type="number"
                min="2"
                max="12"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                className="w-full bg-gray-600 text-white text-xl p-4 rounded-xl"
              />
            </label>
          </div>

          <button
            onClick={saveSettings}
            className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white text-2xl font-bold py-4 rounded-2xl hover:shadow-xl transition"
          >
            {lang === 'fa' ? 'ذخیره' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
