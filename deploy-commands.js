import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import syncCommand from './src/commands/sync.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // optional for guild registration (faster during dev)

if (!token || !clientId) {
  console.error('Bitte DISCORD_TOKEN und CLIENT_ID in .env setzen.');
  process.exit(1);
}

const commands = [
  syncCommand.data.toJSON()
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Registering slash commands...');
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log('Commands registered to guild:', guildId);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('Commands registered globally.');
    }
  } catch (err) {
    console.error('Fehler beim Registrieren der Commands:', err);
  }
})();