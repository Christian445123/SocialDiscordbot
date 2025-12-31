import 'dotenv/config';
import { Client, GatewayIntentBits, Events, ActivityType } from 'discord.js';
import cron from 'node-cron';
import syncCommand from './commands/sync.js';
import { fetchFollowerCount } from './services/tiktok.js';
import { fetchInstagramFollowerCount } from './services/instagram.js';
import { formatFollowersCompact } from './utils/format.js';
import { setChannelNameSafe } from './utils/channel.js';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID_TIKTOK = process.env.CHANNEL_ID_TIKTOK;
const CHANNEL_ID_INSTAGRAM = process.env.CHANNEL_ID_INSTAGRAM;
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

  // Einmal beim Start ausführen
  try {
    await scheduledUpdate('Startup');
  } catch (err) {
    console.error('Fehler beim Startup-Update:', err);
  }

  // Cron: gemäß CRON_SCHEDULE
  cron.schedule(CRON_SCHEDULE, async () => {
    console.log('Geplanter Abruf gestartet...');
    try {
      await scheduledUpdate('Scheduled update');
    } catch (err) {
      console.error('Fehler beim geplanten Abruf:', err);
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
      TIKTOK_USERNAME,
      INSTAGRAM_USERNAME,
      formatFollowersCompact,
      setChannelNameSafe
    });
  } catch (err) {
    console.error('Command Fehler:', err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Fehler beim Ausführen.', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Fehler beim Ausführen.', ephemeral: true });
    }
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
    } catch (err) {
      console.error('TikTok update failed (channel):', err);
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
    } catch (err) {
      console.error('Instagram update failed (channel):', err);
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
  process.exit(1);
});