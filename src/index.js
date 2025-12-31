import 'dotenv/config';
import { Client, GatewayIntentBits, Events, ActivityType } from 'discord.js';
import cron from 'node-cron';
import syncCommand from './commands/sync.js';
import { fetchFollowerCount } from './services/tiktok.js';
import { fetchInstagramFollowerCount } from './services/instagram.js';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME;
const INSTAGRAM_USERNAME = process.env.INSTAGRAM_USERNAME;
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 */4 * * *';

if (!DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN fehlt in .env');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
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
      CHANNEL_ID,
      TIKTOK_USERNAME,
      INSTAGRAM_USERNAME
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
  const parts = [];

  if (TIKTOK_USERNAME) {
    try {
      const tFollowers = await fetchFollowerCount(TIKTOK_USERNAME);
      parts.push(`TikTok: ${tFollowers.toLocaleString()}`);
      if (CHANNEL_ID) {
        try {
          const channel = await client.channels.fetch(CHANNEL_ID);
          if (channel && channel.isTextBased()) {
            await channel.send(`TikTok: @${TIKTOK_USERNAME} — Follower: ${tFollowers.toLocaleString()}`);
          }
        } catch (e) {
          console.warn('Fehler beim Senden in TikTok-Kanal:', e);
        }
      }
    } catch (err) {
      console.error('TikTok update failed:', err);
      if (CHANNEL_ID) {
        try {
          const channel = await client.channels.fetch(CHANNEL_ID);
          if (channel && channel.isTextBased()) {
            await channel.send(`Fehler beim Abrufen der TikTok-Follower: ${err.message || err}`);
          }
        } catch (e) {}
      }
    }
  }

  if (INSTAGRAM_USERNAME) {
    try {
      const iFollowers = await fetchInstagramFollowerCount(INSTAGRAM_USERNAME);
      parts.push(`IG: ${iFollowers.toLocaleString()}`);
      if (CHANNEL_ID) {
        try {
          const channel = await client.channels.fetch(CHANNEL_ID);
          if (channel && channel.isTextBased()) {
            await channel.send(`Instagram: @${INSTAGRAM_USERNAME} — Follower: ${iFollowers.toLocaleString()}`);
          }
        } catch (e) {
          console.warn('Fehler beim Senden in Instagram-Kanal:', e);
        }
      }
    } catch (err) {
      console.error('Instagram update failed:', err);
      if (CHANNEL_ID) {
        try {
          const channel = await client.channels.fetch(CHANNEL_ID);
          if (channel && channel.isTextBased()) {
            await channel.send(`Fehler beim Abrufen der Instagram-Follower: ${err.message || err}`);
          }
        } catch (e) {}
      }
    }
  }

  if (parts.length > 0) {
    try {
      const activityText = parts.join(' | ');
      await client.user.setPresence({
        activities: [{ name: activityText, type: ActivityType.Watching }],
        status: 'online'
      });
      console.log('Presence gesetzt:', activityText);
    } catch (err) {
      console.warn('Could not set presence:', err);
    }
  } else {
    console.log('Keine Plattformen konfiguriert; überspringe Presence/Post.');
  }
}

client.login(DISCORD_TOKEN).catch(err => {
  console.error('Login fehlgeschlagen:', err);
  process.exit(1);
});