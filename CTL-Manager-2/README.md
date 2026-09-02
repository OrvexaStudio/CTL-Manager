# CTL Manager

Web app locale per la gestione delle corse NCC/taxi.

## Tecnologie

Solo:

- HTML
- CSS
- JavaScript

Non sono necessari:

- Node.js
- npm
- React
- Vite
- database
- API
- server

## Avvio

È possibile aprire `index.html` direttamente nel browser.

Per l'esperienza migliore, pubblicare la cartella su GitHub Pages.

## Struttura

- `pages/login.html` — primo accesso
- `pages/welcome.html` — presentazione
- `pages/home.html` — dashboard
- `pages/prenotazioni.html` — elenco corse
- `pages/calendario.html` — calendario
- `pages/aggiungi-prenotazione.html` — inserimento
- `pages/profilo.html` — profilo, statistiche, backup e blacklist
- `css/style.css` — stile
- `js/storage.js` — dati locali
- `js/utils.js` — utilità
- `js/parser.js` — parser voce/WhatsApp
- `js/app.js` — funzioni comuni

## Dati

I dati vengono salvati esclusivamente nel `localStorage` del browser.

L'esportazione genera un file JSON. L'importazione sostituisce i dati presenti dopo una conferma.

## Voce

La funzione vocale utilizza la Web Speech API del browser, quando disponibile.

Il testo riconosciuto viene interpretato dal parser locale e mostrato in anteprima prima del salvataggio.

## WhatsApp

Senza API o server non è possibile leggere automaticamente le chat WhatsApp.

Il flusso locale è:

1. aprire WhatsApp;
2. copiare il messaggio;
3. incollarlo in CTL Manager;
4. premere "Analizza messaggio";
5. controllare i dati riconosciuti;
6. salvare.

## Blacklist

Il numero viene normalizzato:

- `3331234567`
- `+39 333 1234567`
- `0039 333 1234567`

vengono confrontati come lo stesso numero italiano.

Prima di salvare una prenotazione appartenente a un numero in blacklist appare una richiesta di conferma.

## Nota importante

La parte voce/browser dipende dal supporto del browser e dai permessi del microfono.

Il parser è progettato per evitare assegnazioni casuali dei dati: quando l'informazione non è riconoscibile con sufficiente sicurezza viene lasciata vuota invece di essere inserita in un campo arbitrario.
