# CTL Manager

App PWA locale per la gestione delle corse di un autista.

## Caratteristiche
- Dati salvati esclusivamente nel browser tramite localStorage.
- Nessun server, database remoto o API.
- Login iniziale con nome autista.
- Home con prossima corsa, corse del giorno e saluto.
- Prenotazioni con filtri e calendario.
- Inserimento manuale, dettatura vocale e parsing di messaggi WhatsApp incollati.
- Riconoscimento robusto di telefono, data, ora, passeggeri, note, partenza e destinazione.
- Controllo blacklist normalizzando i numeri italiani con/senza +39.
- Import/export JSON.
- Tema chiaro/scuro/di sistema.
- Statistiche giorno/mese/anno.
- Layout responsive, ottimizzato anche per smartphone.

## Avvio
```bash
npm install
npm run dev
```

## Build per GitHub Pages
```bash
npm run build
```

La cartella `dist` può essere pubblicata con GitHub Pages.

## Nota su WhatsApp
Senza API o server, una pagina web non può leggere automaticamente le chat WhatsApp.
CTL Manager implementa quindi l'importazione locale del testo: copia il messaggio da WhatsApp e incollalo nella funzione "Da WhatsApp". Il parser usa più pattern e un sistema di priorità per ridurre al minimo l'inserimento nel campo sbagliato.

## Nota sulla voce
La dettatura usa la Web Speech API quando disponibile nel browser. La trascrizione resta locale all'app/browser e viene poi interpretata dallo stesso parser. È disponibile anche l'inserimento manuale come fallback.

## Sicurezza
L'app non invia i dati a servizi esterni. Per sicurezza, usa export JSON periodici come backup e non condividere i file di backup con persone non autorizzate.
