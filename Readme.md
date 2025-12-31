TikTok & Instagram Channel-Name Updater (Node.js)

Beschreibung:
Dieser Bot aktualisiert getrennte Channel-Namen:
- Ein Kanal für TikTok (CHANNEL_ID_TIKTOK) wird zu z.B. "tiktok-12.3K" umbenannt.
- Ein Kanal für Instagram (CHANNEL_ID_INSTAGRAM) wird zu z.B. "ig-4.5K" umbenannt.

Wichtig:
- Der Bot benötigt Manage Channels-Rechte in den entsprechenden Guilds.
- Scraping ist anfällig; für Produktionsbetrieb eine offizielle API empfehlen.

Dateien:
- package.json
- .env.example
- deploy-commands.js
- src/
  - index.js
  - commands/sync.js
  - services/
    - tiktok.js
    - instagram.js
  - utils/
    - format.js
    - channel.js

Umgebung (.env):
- DISCORD_TOKEN
- CLIENT_ID
- (optional) GUILD_ID
- CHANNEL_ID_TIKTOK
- CHANNEL_ID_INSTAGRAM
- TIKTOK_USERNAME
- INSTAGRAM_USERNAME
- CRON_SCHEDULE (optional, Standard: 0 */4 * * *)

Install / Start:
1. npm install
2. .env erstellen
3. npm run deploy-commands
4. npm start

Slash-Command:
- /sync social [platform] [username]
  - platform: tiktok | instagram | all (default all)
  - username: optional override (nur gültig, wenn platform != all)
  - Der Command aktualisiert nur die Channel-Namen, sendet keine Nachrichten in die Channels. Antwort ist ephemeral.

Beispiel:
- Nur TikTok: CHANNEL_ID_TIKTOK gesetzt, TIKTOK_USERNAME gesetzt -> Channel-Name "tiktok-12.3K"
- Nur Instagram: CHANNEL_ID_INSTAGRAM gesetzt, INSTAGRAM_USERNAME gesetzt -> Channel-Name "ig-4.5K"
- Beide: beide Channel einzeln updaten
