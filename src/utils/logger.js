// Einfacher Logger, der Nachrichten in einen konfigurierten Textkanal sendet.
// Wenn LOG_CHANNEL_ID nicht gesetzt ist, werden keine Nachrichten gesendet.
// Fehler beim Senden werden geloggt, aber nicht geworfen.

export async function sendLog(client, logChannelId, message) {
  if (!logChannelId) {
    // nothing configured
    return;
  }
  if (!client || !client.isReady()) {
    // client noch nicht bereit / nicht eingeloggt
    console.warn('sendLog: client nicht ready, log wird in Konsole ausgegeben.');
    console.log('[LOG]', message);
    return;
  }

  try {
    const channel = await client.channels.fetch(logChannelId);
    if (!channel) {
      console.warn('sendLog: Log-Kanal nicht gefunden:', logChannelId);
      console.log('[LOG]', message);
      return;
    }
    if (!channel.isTextBased()) {
      console.warn('sendLog: Log-Kanal ist kein Textkanal:', logChannelId);
      console.log('[LOG]', message);
      return;
    }
    await channel.send(message);
  } catch (err) {
    console.warn('sendLog: Fehler beim Senden der Log-Nachricht:', err);
    console.log('[LOG]', message);
  }
}