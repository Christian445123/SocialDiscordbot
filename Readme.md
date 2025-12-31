TikTok & Instagram Follower Bot (Node.js)

Beschreibung:
Dieser Bot postet alle 4 Stunden die Follower-Anzahl eines konfigurierten TikTok- und/oder Instagram-Accounts in einen Discord-Kanal und bietet den Slash-Command "/sync social", um manuell zu synchronisieren. Der Command akzeptiert optional ein platform-Argument (tiktok, instagram, all) und optional ein username-Argument, um temporär einen anderen Benutzer abzufragen.

Ordnerstruktur (empfohlen):
package.json
.env.example
deploy-commands.js
src/
  index.js
  commands/
    sync.js
  services/
    tiktok.js
    instagram.js

Voraussetzungen:
- Node.js 16.9 oder neuer
- Ein Discord-Bot-Token (Anwendung in Discord Developer Portal)
- CLIENT_ID aus deiner Bot-Anwendung
- Optional: GUILD_ID für schnelle Command-Registrierung während der Entwicklung

Installation:
1. Projektordner anlegen und Dateien wie oben beschrieben erstellen oder dieses Repo klonen.
2. Abhängigkeiten installieren:
   npm install
3. .env aus .env.example erstellen und ausfüllen:
   - DISCORD_TOKEN
   - CLIENT_ID
   - (optional) GUILD_ID — während Entwicklung praktisch, damit Commands sofort sichtbar sind
   - CHANNEL_ID
   - TIKTOK_USERNAME (optional)
   - INSTAGRAM_USERNAME (optional)
   - CRON_SCHEDULE (optional, Standard: "0 */4 * * *" = alle 4 Stunden)
4. Slash-Commands registrieren:
   - Für Development (nur eine Guild): setze GUILD_ID in .env und dann:
     npm run deploy-commands
   - Für globale Registrierung (ohne GUILD_ID):
     npm run deploy-commands
     Hinweis: Globale Registrierung kann bis zu einer Stunde dauern.
5. Bot starten:
   npm start

Verhalten:
- Der Bot führt beim Start und dann automatisch gemäß CRON_SCHEDULE ein Update aus:
  - Follower für konfigurierte Plattformen abrufen (TikTok, Instagram)
  - Bot-Presence aktualisieren (z. B. "TikTok: 12.345 | IG: 6.789")
  - Nachricht(en) mit Follower-Anzahl in CHANNEL_ID posten
- Mit dem Slash-Command "/sync social" kannst du die Aktualisierung manuell anstoßen.
  Optionen:
  - platform: tiktok | instagram | all (optional, Standard: all)
  - username: optionaler Username, um temporär einen anderen Benutzer abzufragen

Wichtige Hinweise zu Scraping:
- TikTok und Instagram ändern häufig ihr Frontend und können Scraping blockieren. Die mitgelieferten Funktionen sind einfache, best-effort-Scraper; sie sind nicht 100% zuverlässig.
- Für Produktionsbetrieb empfiehlt sich die Nutzung einer offiziellen API oder eines stabilen Drittanbieter-Services.

Fehlerbehandlung:
- Falls das Abrufen der Follower fehlschlägt, versucht der Bot, eine Fehlermeldung in CHANNEL_ID zu posten (sofern konfiguriert) und schreibt Fehler in die Konsole.

Weitere Anpassungen:
- Du kannst CRON_SCHEDULE ändern, separate Channels für jede Plattform konfigurieren, oder den Command erweitern, um beliebige Plattformen/Benutzer abzurufen.
- Wenn du möchtest, kann ich alle Dateien als Pull Request in dein GitHub-Repo erstellen — gib mir Bescheid, wenn ich den PR öffnen soll.