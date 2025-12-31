// Helfer: formatiert Follower-Zahlen kompakt für Channel-Namen
export function formatFollowersCompact(num) {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  const abs = Math.abs(num);
  if (abs >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (abs >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `${num}`;
}