import fetch from 'node-fetch';
import cheerio from 'cheerio';

// Einfacher Scraper: versucht mehrere Strategien, um die Follower-Zahl zu parsen.
// Hinweis: TikTok ändert häufig sein Frontend / blockiert Scraping. Diese Methode
// ist eine Basis-Implementierung; für Produktionsbetrieb eine offizielle API empfehlen.

export async function fetchFollowerCount(username) {
  if (!username) throw new Error('Kein TikTok-Benutzername angegeben.');

  const url = `https://www.tiktok.com/@${username}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} von TikTok`);

  const html = await res.text();
  const $ = cheerio.load(html);

  // 1) Meta description versuchen
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const fromMeta = parseFollowersFromText(metaDesc);
  if (fromMeta != null) return fromMeta;

  // 2) JSON im HTML suchen (z. B. "followers":12345)
  const followersMatch = html.match(/"followers":\s*([0-9]+),/i);
  if (followersMatch && followersMatch[1]) {
    return Number(followersMatch[1]);
  }

  // 3) Suche nach "followers" im sichtbaren Body-Text
  const bodyText = $('body').text();
  const fromBody = parseFollowersFromText(bodyText);
  if (fromBody != null) return fromBody;

  // Wenn nichts gefunden wurde
  throw new Error('Konnte Follower-Anzahl nicht parsen (TikTok Scraping fehlgeschlagen).');
}

function parseFollowersFromText(text) {
  if (!text) return null;
  // Beispiele: "1,234 followers", "123.4K followers", "1.2M followers"
  const re = /([\d.,]+)\s*(K|M)?\s*followers?/i;
  const match = text.match(re);
  if (!match) return null;

  let numStr = match[1].replace(/,/g, '');
  let value = parseFloat(numStr);
  if (isNaN(value)) return null;

  const suffix = (match[2] || '').toUpperCase();
  if (suffix === 'K') value = Math.round(value * 1000);
  if (suffix === 'M') value = Math.round(value * 1000000);
  return Math.round(value);
}