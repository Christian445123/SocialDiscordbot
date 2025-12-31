import { SlashCommandBuilder } from '@discordjs/builders';

const data = new SlashCommandBuilder()
  .setName('sync')
  .setDescription('Synchronisations- und Aktualisierungsbefehle')
  .addSubcommand(sub =>
    sub
      .setName('social')
      .setDescription('Aktualisiert Channel-Namen für Social-Plattformen')
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
          .setDescription('Optional: Override für den Benutzernamen (nur gültig, wenn platform nicht "all")')
          .setRequired(false)
      )
  );

async function execute(interaction, context) {
  await interaction.deferReply({ ephemeral: true });

  const chosen = interaction.options.getString('platform') || 'all';
  const overrideUsername = interaction.options.getString('username') || null;
  const results = [];

  try {
    // Wenn 'all' und overrideUsername gesetzt -> warnen und ignorieren, damit kein Missverständnis entsteht
    if (chosen === 'all' && overrideUsername) {
      await interaction.editReply({ content: 'Hinweis: username-Override wird bei "all" ignoriert. Verwende platform=tiktok oder platform=instagram mit username, um gezielt zu überschreiben.' });
    }

    // TikTok
    if (chosen === 'tiktok' || chosen === 'all') {
      const tUser = (chosen === 'tiktok' && overrideUsername) ? overrideUsername : (context.TIKTOK_USERNAME || process.env.TIKTOK_USERNAME);
      if (!tUser) {
        results.push({ platform: 'tiktok', error: 'TIKTOK_USERNAME nicht konfiguriert' });
      } else if (!context.CHANNEL_ID_TIKTOK) {
        results.push({ platform: 'tiktok', error: 'CHANNEL_ID_TIKTOK nicht konfiguriert' });
      } else {
        try {
          const followers = await context.fetchFollowerCount(tUser);
          const compact = context.formatFollowersCompact ? context.formatFollowersCompact(followers) : String(followers);
          const newName = `tiktok-${compact}`;
          await context.setChannelNameSafe(context.client, context.CHANNEL_ID_TIKTOK, newName, `Manual /sync social by ${interaction.user.tag}`);
          results.push({ platform: 'tiktok', username: tUser, followers, newName });
        } catch (err) {
          results.push({ platform: 'tiktok', error: err.message || String(err) });
        }
      }
    }

    // Instagram
    if (chosen === 'instagram' || chosen === 'all') {
      const iUser = (chosen === 'instagram' && overrideUsername) ? overrideUsername : (context.INSTAGRAM_USERNAME || process.env.INSTAGRAM_USERNAME);
      if (!iUser) {
        results.push({ platform: 'instagram', error: 'INSTAGRAM_USERNAME nicht konfiguriert' });
      } else if (!context.CHANNEL_ID_INSTAGRAM) {
        results.push({ platform: 'instagram', error: 'CHANNEL_ID_INSTAGRAM nicht konfiguriert' });
      } else {
        try {
          const followers = await context.fetchInstagramFollowerCount(iUser);
          const compact = context.formatFollowersCompact ? context.formatFollowersCompact(followers) : String(followers);
          const newName = `ig-${compact}`;
          await context.setChannelNameSafe(context.client, context.CHANNEL_ID_INSTAGRAM, newName, `Manual /sync social by ${interaction.user.tag}`);
          results.push({ platform: 'instagram', username: iUser, followers, newName });
        } catch (err) {
          results.push({ platform: 'instagram', error: err.message || String(err) });
        }
      }
    }

    // Build reply
    let reply = '';
    for (const r of results) {
      if (r.error) reply += `❌ ${r.platform}: ${r.error}\n`;
      else reply += `✅ ${r.platform}: @${r.username} — ${r.followers.toLocaleString()} Follower (Channel-Name: ${r.newName})\n`;
    }
    if (!reply) reply = 'Keine Aktionen durchgeführt.';
    await interaction.editReply({ content: reply });
  } catch (err) {
    console.error('Fehler bei /sync social:', err);
    await interaction.editReply({ content: `Fehler: ${err.message || String(err)}` });
  }
}

export default { data, execute };