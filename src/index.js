import 'dotenv/config';
import { Client, GatewayIntentBits, Events, ActivityType } from 'discord.js';
import cron from 'node-cron';
import syncCommand from './commands/sync.js';
import { fetchFollowerCount } from './services/tiktok.js';
import { fetchInstagramFollowerCount } from './services/instagram.js';
import { formatFollowersCompact } from './utils/format.js';
import { setChannelNameSafe } from './utils/channel.js';
import { sendLog } from './utils/logger.js';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID_TIKTOK = process.env.CHANNEL_ID_TIKTOK;
const CHANNEL_ID_INSTAGRAM = process.env.CHANNEL_ID_INSTAGRAM;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME;
const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME;
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 */4 * * *';

if (!DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN fehlt in .env');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Map();
client.commands.set(syncCommand.data.name, syncCommand);

client.once(Events.ClientReady, async () => {
  console.log(`Eingeloggt als ${client.user.tag}`);

  // Send "online" log message
  try {
    const configured = [];
    if (TIKTOK_USERNAME) configured.push(`TikTok: @${TIKTOK_USERNAME}`);
    if (INSTAGRAM_USERNAME) configured.push(`Instagram: @${INSTAGRAM_USERNAME}`);
    const cfgText = configured.length > 0 ? configured.join(' | ') : 'keine Plattformen konfiguriert';
    await sendLog(client, LOG_CHANNEL_ID, `✅ Bot ist online — ${new Date().toISOString()}\nKonfiguration: ${cfgText}`);
  } catch (err) {
    console.warn('Konnte Online-Log nicht senden:', err);
  }

  // Einmal beim Start ausführen
  try {
    await scheduledUpdate('Startup');
  } catch (err) {
    console.error('Fehler beim Startup-Update:', err);
    await sendLog(client, LOG_CHANNEL_ID, `⚠️ Fehler beim Startup-Update: ${err.message || err}`);
  }

  // Cron: gemäß CRON_SCHEDULE
  cron.schedule(CRON_SCHEDULE, async () => {
    console.log('Geplanter Abruf gestartet...');
    try {
      await scheduledUpdate('Scheduled update');
    } catch (err) {
      console.error('Fehler beim geplanten Abruf:', err);
      await sendLog(client, LOG_CHANNEL_ID, `⚠️ Fehler beim geplanten Abruf: ${err.message || err}`);
    }
  });
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, {
      fetchFollowerCount,
      fetchInstagramFollowerCount,
      client,
      CHANNEL_ID_TIKTOK,
      CHANNEL_ID_INSTAGRAM,
      LOG_CHANNEL_ID,
      TIKTOK_USERNAME,
      INSTAGRAM_USERNAME,
      formatFollowersCompact,
      setChannelNameSafe,
      sendLog
    });
  } catch (err) {
    console.error('Command Fehler:', err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Fehler beim Ausführen.', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Fehler beim Ausführen.', ephemeral: true });
    }
    await sendLog(client, LOG_CHANNEL_ID, `⚠️ Fehler beim Ausführen eines Commands: ${err.message || err}`);
  }
});

async function scheduledUpdate(reason = '') {
  // TikTok-Channel updaten
  if (TIKTOK_USERNAME && CHANNEL_ID_TIKTOK) {
    try {
      const tFollowers = await fetchFollowerCount(TIKTOK_USERNAME);
      const name = `tiktok-${formatFollowersCompact(tFollowers)}`;
      await setChannelNameSafe(client, CHANNEL_ID_TIKTOK, name, `Automated update (${reason})`);
      console.log('TikTok-Channel-Name aktualisiert zu:', name);
      await sendLog(client, LOG_CHANNEL_ID, `🔄 TikTok aktualisiert: @${TIKTOK_USERNAME} — ${tFollowers.toLocaleString()} Follower\nNeuer Channel-Name: ${name}`);
    } catch (err) {
      console.error('TikTok update failed (channel):', err);
      await sendLog(client, LOG_CHANNEL_ID, `⚠️ TikTok-Update fehlgeschlagen für @${TIKTOK_USERNAME}: ${err.message || err}`);
    }
  } else {
    console.log('TikTok: Username oder CHANNEL_ID_TIKTOK nicht konfiguriert; übersprungen.');
  }

  // Instagram-Channel updaten
  if (INSTAGRAM_USERNAME && CHANNEL_ID_INSTAGRAM) {
    try {
      const iFollowers = await fetchInstagramFollowerCount(INSTAGRAM_USERNAME);
      const name = `ig-${formatFollowersCompact(iFollowers)}`;
      await setChannelNameSafe(client, CHANNEL_ID_INSTAGRAM, name, `Automated update (${reason})`);
      console.log('Instagram-Channel-Name aktualisiert zu:', name);
      await sendLog(client, LOG_CHANNEL_ID, `🔄 Instagram aktualisiert: @${INSTAGRAM_USERNAME} — ${iFollowers.toLocaleString()} Follower\nNeuer Channel-Name: ${name}`);
    } catch (err) {
      console.error('Instagram update failed (channel):', err);
      await sendLog(client, LOG_CHANNEL_ID, `⚠️ Instagram-Update fehlgeschlagen für @${INSTAGRAM_USERNAME}: ${err.message || err}`);
    }
  } else {
    console.log('Instagram: Username oder CHANNEL_ID_INSTAGRAM nicht konfiguriert; übersprungen.');
  }

  // Optional: kombiniertes Presence (informativ)
  try {
    const presenceParts = [];
    if (TIKTOK_USERNAME) {
      try {
        const tFollowers = await fetchFollowerCount(TIKTOK_USERNAME);
        presenceParts.push(`TikTok: ${formatFollowersCompact(tFollowers)}`);
      } catch {}
    }
    if (INSTAGRAM_USERNAME) {
      try {
        const iFollowers = await fetchInstagramFollowerCount(INSTAGRAM_USERNAME);
        presenceParts.push(`IG: ${formatFollowersCompact(iFollowers)}`);
      } catch {}
    }
    if (presenceParts.length > 0) {
      await client.user.setPresence({
        activities: [{ name: presenceParts.join(' | '), type: ActivityType.Watching }],
        status: 'online'
      });
    }
  } catch (err) {
    // non-critical
    console.warn('Presence konnte nicht gesetzt werden:', err);
  }
}

client.login(DISCORD_TOKEN).catch(err => {
  console.error('Login fehlgeschlagen:', err);
  // try to log into LOG_CHANNEL_ID if possible? client not logged => cannot
  process.exit(1);
});