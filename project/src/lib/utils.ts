export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateHostId(): string {
  return `host_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getRandomEmoji(): string {
  const emojis = ['😀', '😎', '🤩', '😊', '🥳', '🤓', '😇', '🦄', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🦋', '🌟', '⭐', '✨', '🎨', '🎭', '🎪', '🎯'];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

export function filterBadWords(text: string): string {
  const badWords = ['placeholder'];
  let filtered = text;
  badWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
}

export function getQRCodeUrl(roomCode: string): string {
  const joinUrl = `${window.location.origin}/join/${roomCode}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function canReconnect(lastSeen: string): boolean {
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff < 60000;
}
