// Sicherheits-Wrapper zum Setzen des Channel-Namens
// Stellt sicher, dass der Name bereinigt ist und dass das Channel-Objekt editierbar ist.

function sanitizeChannelName(name) {
  if (!name) return 'social';
  // klein, spaces -> -, nur a-z0-9-_ erlauben
  let s = String(name).toLowerCase();
  s = s.replace(/\s+/g, '-');
  s = s.replace(/[^a-z0-9\-_]/g, '');
  s = s.replace(/-+/g, '-');
  s = s.replace(/^-+|-+$/g, '');
  if (s.length === 0) s = 'social';
  if (s.length > 100) s = s.slice(0, 100);
  return s;
}

export async function setChannelNameSafe(client, channelId, desiredName, reason = 'update') {
  if (!client) throw new Error('client missing');
  if (!channelId) throw new Error('channelId missing');
  const sanitized = sanitizeChannelName(desiredName);

  const channel = await client.channels.fetch(channelId).catch(err => {
    throw new Error(`Konnte Kanal nicht finden: ${err.message || err}`);
  });

  if (!channel) throw new Error('Kanal nicht gefunden.');
  if (!('guild' in channel) || !channel.guild) {
    throw new Error('Kanal ist kein Guild-Channel und kann nicht umbenannt werden.');
  }

  try {
    if (typeof channel.setName === 'function') {
      await channel.setName(sanitized, reason);
    } else if (typeof channel.edit === 'function') {
      await channel.edit({ name: sanitized }, reason);
    } else {
      throw new Error('Channel-Objekt unterstützt kein Edit/SetName.');
    }
  } catch (err) {
    throw new Error(`Fehler beim Umbenennen des Kanals: ${err.message || err}`);
  }

  return sanitized;
}