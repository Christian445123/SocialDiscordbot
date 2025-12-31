import fetch from 'node-fetch';
import cheerio from 'cheerio';

// Versucht mehrere Strategien, um Instagram-Follower zu bekommen.
// Hinweis: Instagram ändert regelmäßig APIs / blockiert Scraping.
// Diese Implementierung ist ein best-effort-Ansatz.

export async function fetchInstagramFollowerCount(username) {
  if (!username) throw new Error('Kein Instagram-Benutzername angegeben.');

  const url = `https://www.instagram.com/${username}/`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} von Instagram`);

  const html = await res.text();
  const $ = cheerio.load(html);

  // 1) Search for "edge_followed_by":{"count":12345}
  const edgeMatch = html.match(/"edge_followed_by":\s*{\s*"count":\s*([0-9]+)\s*}/i);
  if (edgeMatch && edgeMatch[1]) {
    return Number(edgeMatch[1]);
  }

  // 2) JSON-LD parsing (script[type="application/ld+json"])
  const ldJson = $('script[type="application/ld+json"]').html();
  if (ldJson) {
    try {
      const obj = JSON.parse(ldJson);
      // Try common locations for follower count
      if (obj && obj.mainEntityofPage && obj.mainEntityofPage.interactionStatistic) {
        const stat = obj.mainEntityofPage.interactionStatistic;
        if (stat.userInteractionCount) return Number(stat.userInteractionCount);
      }
      if (obj && obj.interactionStatistic && obj.interactionStatistic.userInteractionCount) {
        return Number(obj.interactionStatistic.userInteractionCount);
      }
    } catch (e) {
      // ignore JSON parse errors
    }
  }

  // 3) og:description or other meta tags
  const ogDesc = $('meta[property="og:description"]').attr('content') || '';
  const fromMeta = parseFollowersFromText(ogDesc);
  if (fromMeta != null) return fromMeta;

  // 4) Fallback: search body text
  const bodyText = $('body').text();
  const fromBody = parseFollowersFromText(bodyText);
  if (fromBody != null) return fromBody;

  throw new Error('Konnte Instagram-Follower-Anzahl nicht parsen (Scraping fehlgeschlagen).');
}

function parseFollowersFromText(text) {
  if (!text) return null;
  // Examples: "1,234 Followers", "123K followers"
  const re = /([\d.,]+)\s*(K|M)?\s*Followers?/i;
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