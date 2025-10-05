import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

type NetworkQuality = 'good' | 'fair' | 'poor';

export function NetworkStatus() {
  const [quality, setQuality] = useState<NetworkQuality>('good');
  const [latency, setLatency] = useState<number>(0);

  useEffect(() => {
    const checkNetwork = async () => {
      const start = Date.now();
      try {
        await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
        const ms = Date.now() - start;
        setLatency(ms);

        if (ms < 100) setQuality('good');
        else if (ms < 300) setQuality('fair');
        else setQuality('poor');
      } catch {
        setQuality('poor');
        setLatency(999);
      }
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, 5000);
    return () => clearInterval(interval);
  }, []);

  const colors = {
    good: 'bg-green-500',
    fair: 'bg-yellow-500',
    poor: 'bg-red-500',
  };

  return (
    <div className={`${colors[quality]} p-4 rounded-xl flex items-center gap-3`}>
      {quality === 'poor' ? (
        <WifiOff className="w-6 h-6" />
      ) : (
        <Wifi className="w-6 h-6" />
      )}
      <span className="font-bold">{latency}ms</span>
    </div>
  );
}
