import { SlashCommandBuilder } from '@discordjs/builders';

const data = new SlashCommandBuilder()
  .setName('sync')
  .setDescription('Synchronisations- und Aktualisierungsbefehle')
  .addSubcommand(sub =>
    sub
      .setName('social')
      .setDescription('Aktualisiert den Social-Status und postet das Ergebnis')
      .addStringOption(option =>
        option
          .setName('platform')
          .setDescription('Welche Plattform aktualisieren?')
          .setRequired(false)
          .addChoices(
            { name: 'tiktok', value: 'tiktok' },
            { name: 'instagram', value: 'instagram' },
            { name: 'all', value: 'all' }
          )
      )
      .addStringOption(option =>
        option
          .setName('username')
          .setDescription('Optional: Override für den Benutzernamen (nutzt Plattform-spezifischen Namen)')
          .setRequired(false)
      )
  );

async function execute(interaction, context) {
  await interaction.deferReply({ ephemeral: true });

  const chosen = interaction.options.getString('platform') || 'all';
  const overrideUsername = interaction.options.getString('username') || null;
  const results = [];

  try {
    if (chosen === 'tiktok' || chosen === 'all') {
      const tUser = overrideUsername && chosen === 'tiktok' ? overrideUsername : (context.TIKTOK_USERNAME || process.env.TIKTOK_USERNAME);
      if (!tUser) {
        results.push({ platform: 'tiktok', error: 'TIKTOK_USERNAME nicht konfiguriert' });
      } else {
        try {
          const followers = await context.fetchFollowerCount(tUser);
          results.push({ platform: 'tiktok', username: tUser, followers });
          if (context.CHANNEL_ID) {
            try {
              const channel = await context.client.channels.fetch(context.CHANNEL_ID);
              if (channel && channel.isTextBased()) {
                await channel.send(`(manuell) TikTok: @${tUser} — Follower: ${followers.toLocaleString()}`);
              }
            } catch (e) {
              console.warn('Posten in Kanal fehlgeschlagen (TikTok):', e);
            }
          }
        } catch (err) {
          results.push({ platform: 'tiktok', error: err.message || String(err) });
        }
      }
    }

    if (chosen === 'instagram' || chosen === 'all') {
      const iUser = overrideUsername && chosen === 'instagram' ? overrideUsername : (context.INSTAGRAM_USERNAME || process.env.INSTAGRAM_USERNAME);
      if (!iUser) {
        results.push({ platform: 'instagram', error: 'INSTAGRAM_USERNAME nicht konfiguriert' });
      } else {
        try {
          const followers = await context.fetchInstagramFollowerCount(iUser);
          results.push({ platform: 'instagram', username: iUser, followers });
          if (context.CHANNEL_ID) {
            try {
              const channel = await context.client.channels.fetch(context.CHANNEL_ID);
              if (channel && channel.isTextBased()) {
                await channel.send(`(manuell) Instagram: @${iUser} — Follower: ${followers.toLocaleString()}`);
              }
            } catch (e) {
              console.warn('Posten in Kanal fehlgeschlagen (Instagram):', e);
            }
          }
        } catch (err) {
          results.push({ platform: 'instagram', error: err.message || String(err) });
        }
      }
    }

    // Set presence based on successful results
    try {
      const okT = results.find(r => r.platform === 'tiktok' && !r.error);
      const okI = results.find(r => r.platform === 'instagram' && !r.error);
      let activityText = '';
      if (okT && okI) activityText = `TikTok: ${okT.followers.toLocaleString()} | IG: ${okI.followers.toLocaleString()}`;
      else if (okT) activityText = `TikTok: ${okT.followers.toLocaleString()}`;
      else if (okI) activityText = `IG: ${okI.followers.toLocaleString()}`;
      if (activityText) {
        await context.client.user.setPresence({
          activities: [{ name: activityText, type: 3 }],
          status: 'online'
        });
      }
    } catch (e) {
      console.warn('Presence konnte nicht gesetzt werden:', e);
    }

    // Build reply message
    let reply = '';
    for (const r of results) {
      if (r.error) reply += `❌ ${r.platform}: ${r.error}\n`;
      else reply += `✅ ${r.platform}: @${r.username} — ${r.followers.toLocaleString()} Follower\n`;
    }

    await interaction.editReply({ content: reply || 'Keine Ergebnisse.' });
  } catch (err) {
    console.error('Fehler bei /sync social:', err);
    await interaction.editReply({ content: `Fehler: ${err.message || String(err)}` });
  }
}

export default { data, execute };