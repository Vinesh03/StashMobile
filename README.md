# StashMobile

Client mobile Android (dark, veloce, zero telemetria) per server [Stash](https://github.com/stashapp/stash) self-hosted.

## Funzionalità principali
- **Dashboard & Esplorazione rapida**: statistiche libreria, *Continua a guardare*, *Aggiunte di recente* e scoperta casuale (*Mescola*).
- **Anteprime video immediate**: riproduzione anteprima muta direttamente sulle card (16:9 o lista compatta) e scrubbing nel player con anteprima sprite VTT.
- **Pull-to-refresh**: aggiorna qualsiasi schermata tirando giù dall'alto.
- **Player avanzato**: salvataggio automatico del punto di ripresa (`resume_time`), selettore velocità (`0.75x–2x`), loop automatico/manuale per clip brevi e cattura frame come copertina della scena.
- **Gestione & Editor**: modifica titoli, dettagli, studio, performer, tag, rating a stelle, contatore O e stato organizzazione direttamente dall'app.
- **Task del server**: avvia scansione libreria, generazione anteprime/sprite e pulizia dal menu Impostazioni.

## Installazione
Scarica l'ultimo file **`StashMobile-v1.0.0.apk`** dalla sezione [Releases](https://github.com/Vinesh03/StashMobile/releases), installalo sul tuo dispositivo Android e inserisci l'URL del tuo server Stash e l'API Key nella scheda **Impostazioni**.

## Sviluppo e Build
```bash
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```
