TikTok & Instagram Channel-Name Updater (Node.js)

Beschreibung:
Dieser Bot aktualisiert getrennte Channel-Namen:
- Ein Kanal für TikTok (CHANNEL_ID_TIKTOK) wird zu z.B. "tiktok-12.3K" umbenannt.
- Ein Kanal für Instagram (CHANNEL_ID_INSTAGRAM) wird zu z.B. "ig-4.5K" umbenannt.
Zusätzlich sendet der Bot beim Start eine "Bot ist online" Nachricht in einen konfigurierbaren Log-Channel (LOG_CHANNEL_ID) und protokolliert dort auch jedes Update (Erfolg oder Fehler).

Wichtig:
- Der Bot benötigt Manage Channels-Rechte in den entsprechenden Guilds für Umbenennungen.
- Der Bot benötigt Send Messages-Recht im LOG_CHANNEL_ID.
- Scraping ist anfällig; für Produktionsbetrieb ist eine offizielle API empfohlen.

Dateien:
- package.json
- .env.example
- deploy-commands.js
- src/
  - index.js
  - commands/
    - sync.js
  - services/
    - tiktok.js
    - instagram.js
  - utils/
    - format.js
    - channel.js
    - logger.js

Umgebung (.env):
- DISCORD_TOKEN
- CLIENT_ID
- (optional) GUILD_ID
- CHANNEL_ID_TIKTOK
- CHANNEL_ID_INSTAGRAM
- LOG_CHANNEL_ID
- TIKTOK_USERNAME
- INSTAGRAM_USERNAME
- CRON_SCHEDULE (optional, Standard: 0 */4 * * *)

Install / Start:
1. npm install
2. .env erstellen basierend auf .env.example und ausfüllen
3. npm run deploy-commands
4. npm start

Verhalten:
- Beim Start sendet der Bot eine Statusmeldung in LOG_CHANNEL_ID: "Bot ist online" + Konfiguration.
- Beim Start und danach gemäß CRON_SCHEDULE wird:
  - Follower für konfigurierte Plattformen abgerufen,
  - Channel-Namen (CHANNEL_ID_TIKTOK / CHANNEL_ID_INSTAGRAM) entsprechend gesetzt,
  - Ergebnis (Erfolg oder Fehler) in LOG_CHANNEL_ID protokolliert.
- /sync social: manuelle Ausführung. Optionen:
  - platform: tiktok | instagram | all (Standard: all)
  - username: optionaler Username (überschreibt die in .env konfigurierten Namen für die Abfrage; nur gültig, wenn platform != all)
  - Der Command aktualisiert die Channel-Namen und protokolliert das Ergebnis in LOG_CHANNEL_ID. Antwort an den Benutzer ist ephemeral.

Beispiele:
- Nur TikTok: CHANNEL_ID_TIKTOK gesetzt, TIKTOK_USERNAME gesetzt -> Channel-Name "tiktok-12.3K"
- Nur Instagram: CHANNEL_ID_INSTAGRAM gesetzt, INSTAGRAM_USERNAME gesetzt -> Channel-Name "ig-4.5K"

Fehler & Logs:
- Alle wichtigen Ereignisse werden in LOG_CHANNEL_ID gepostet; zusätzliche Fehlermeldungen erscheinen in der Konsole.
- Prüfe die Bot-Berechtigungen (Manage Channels für Umbenennungen, Send Messages für Logging).

Anpassungen:
- Wenn du stattdessen willst, dass Logs in beiden Plattform-Channels geschrieben werden (anstelle eines separaten Log-Channels), oder zusätzlich eine Datei-Logdatei möchtest, sage kurz Bescheid — ich passe das an.