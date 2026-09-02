```javascript
/*
    ============================================================
    CTL MANAGER
    utils.js

    Funzioni generali utilizzate in tutta l'applicazione.

    Contiene:
    - gestione date
    - gestione orari
    - formattazione testi
    - numeri di telefono
    - confronto date
    - ordinamento prenotazioni
    - saluto dinamico
    - funzioni DOM
    - utilità varie
    ============================================================
*/

"use strict";


/* ============================================================
   DOM
   ============================================================ */

/**
 * Recupera un elemento tramite ID.
 */
function getElement(id) {

    return document.getElementById(id);

}


/**
 * Crea un elemento HTML.
 */
function createElement(
    tagName,
    className = "",
    textContent = ""
) {

    const element =
        document.createElement(tagName);


    if (className) {

        element.className =
            className;

    }


    if (textContent) {

        element.textContent =
            textContent;

    }


    return element;

}


/**
 * Mostra un elemento.
 */
function showElement(element) {

    if (!element) {
        return;
    }


    element.hidden = false;

}


/**
 * Nasconde un elemento.
 */
function hideElement(element) {

    if (!element) {
        return;
    }


    element.hidden = true;

}


/* ============================================================
   STRINGHE
   ============================================================ */

/**
 * Rimuove spazi inutili.
 */
function cleanText(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/\s+/g, " ")
        .trim();

}


/**
 * Prima lettera maiuscola.
 */
function capitalize(value) {

    const text =
        cleanText(value);


    if (!text) {
        return "";
    }


    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );

}


/**
 * Converte un nome in formato leggibile.
 */
function formatName(value) {

    const text =
        cleanText(value);


    if (!text) {
        return "";
    }


    return text
        .toLowerCase()
        .split(" ")
        .filter(Boolean)
        .map(
            word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");

}


/**
 * Tronca un testo senza spezzare inutilmente le parole.
 */
function truncateText(
    value,
    maxLength = 100
) {

    const text =
        cleanText(value);


    if (text.length <= maxLength) {
        return text;
    }


    return (
        text
            .substring(0, maxLength)
            .trimEnd() +
        "..."
    );

}


/* ============================================================
   DATE
   ============================================================ */

/**
 * Restituisce la data odierna nel formato YYYY-MM-DD.
 */
function getTodayISO() {

    const now =
        new Date();


    return formatDateISO(now);

}


/**
 * Converte una Date nel formato YYYY-MM-DD.
 */
function formatDateISO(date) {

    if (!(date instanceof Date)) {

        date =
            new Date(date);

    }


    if (Number.isNaN(date.getTime())) {

        return "";

    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}


/**
 * Converte YYYY-MM-DD in Date locale.
 */
function parseDateISO(dateString) {

    if (!dateString) {
        return null;
    }


    const parts =
        String(dateString)
            .split("-");


    if (parts.length !== 3) {
        return null;
    }


    const year =
        Number(parts[0]);


    const month =
        Number(parts[1]) - 1;


    const day =
        Number(parts[2]);


    const date =
        new Date(
            year,
            month,
            day
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


/**
 * Formatta una data in italiano.
 *
 * Esempio:
 * 2026-09-02 -> mer 2 set
 */
function formatShortDate(dateString) {

    const date =
        parseDateISO(dateString);


    if (!date) {
        return "";
    }


    return new Intl.DateTimeFormat(
        "it-IT",
        {
            weekday: "short",
            day: "numeric",
            month: "short"
        }
    ).format(date);

}


/**
 * Formatta una data in modo esteso.
 *
 * Esempio:
 * 2 settembre 2026
 */
function formatLongDate(dateString) {

    const date =
        parseDateISO(dateString);


    if (!date) {
        return "";
    }


    return new Intl.DateTimeFormat(
        "it-IT",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(date);

}


/**
 * Restituisce il giorno della settimana.
 */
function getWeekdayName(
    dateString,
    short = false
) {

    const date =
        parseDateISO(dateString);


    if (!date) {
        return "";
    }


    return new Intl.DateTimeFormat(
        "it-IT",
        {
            weekday:
                short
                    ? "short"
                    : "long"
        }
    ).format(date);

}


/**
 * Verifica se una data è oggi.
 */
function isToday(dateString) {

    return (
        dateString ===
        getTodayISO()
    );

}


/**
 * Verifica se una data è nel passato.
 */
function isDateBeforeToday(
    dateString
) {

    const date =
        parseDateISO(dateString);


    if (!date) {
        return false;
    }


    const today =
        parseDateISO(
            getTodayISO()
        );


    return date < today;

}


/**
 * Verifica se una data è nel futuro.
 */
function isDateAfterToday(
    dateString
) {

    const date =
        parseDateISO(dateString);


    if (!date) {
        return false;
    }


    const today =
        parseDateISO(
            getTodayISO()
        );


    return date > today;

}


/**
 * Aggiunge o sottrae giorni a una data.
 */
function addDays(
    dateString,
    amount
) {

    const date =
        parseDateISO(dateString);


    if (!date) {
        return "";
    }


    date.setDate(
        date.getDate() + Number(amount)
    );


    return formatDateISO(date);

}


/* ============================================================
   ORARI
   ============================================================ */

/**
 * Normalizza un orario.
 *
 * Esempi:
 * "9"     -> "09:00"
 * "9:30"  -> "09:30"
 * "0930"  -> "09:30"
 * "18"    -> "18:00"
 */
function normalizeTime(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    let time =
        String(value)
            .trim()
            .toLowerCase();


    if (!time) {
        return "";
    }


    time =
        time.replace(/\s+/g, "");


    /*
        Formato HH:MM
    */
    let match =
        time.match(
            /^(\d{1,2})[:.](\d{1,2})$/
        );


    if (match) {

        let hours =
            Number(match[1]);

        let minutes =
            Number(match[2]);


        if (
            hours >= 0 &&
            hours <= 23 &&
            minutes >= 0 &&
            minutes <= 59
        ) {

            return (
                String(hours).padStart(2, "0") +
                ":" +
                String(minutes).padStart(2, "0")
            );

        }

    }


    /*
        Formato HHMM
    */
    match =
        time.match(
            /^(\d{2})(\d{2})$/
        );


    if (match) {

        const hours =
            Number(match[1]);


        const minutes =
            Number(match[2]);


        if (
            hours >= 0 &&
            hours <= 23 &&
            minutes >= 0 &&
            minutes <= 59
        ) {

            return (
                String(hours).padStart(2, "0") +
                ":" +
                String(minutes).padStart(2, "0")
            );

        }

    }


    /*
        Solo ore.
    */
    match =
        time.match(
            /^(\d{1,2})$/
        );


    if (match) {

        const hours =
            Number(match[1]);


        if (
            hours >= 0 &&
            hours <= 23
        ) {

            return (
                String(hours).padStart(2, "0") +
                ":00"
            );

        }

    }


    return "";

}


/**
 * Confronta due orari HH:MM.
 */
function compareTimes(
    timeA,
    timeB
) {

    const a =
        normalizeTime(timeA);


    const b =
        normalizeTime(timeB);


    if (!a && !b) {
        return 0;
    }


    if (!a) {
        return 1;
    }


    if (!b) {
        return -1;
    }


    return a.localeCompare(b);

}


/**
 * Converte un orario in minuti.
 */
function timeToMinutes(time) {

    const normalized =
        normalizeTime(time);


    if (!normalized) {
        return null;
    }


    const [
        hours,
        minutes
    ] =
        normalized
            .split(":")
            .map(Number);


    return (
        hours * 60 +
        minutes
    );

}


/* ============================================================
   PRENOTAZIONI
   ============================================================ */

/**
 * Confronta due prenotazioni per data e ora.
 */
function compareBookings(
    bookingA,
    bookingB
) {

    const dateA =
        bookingA.date || "";


    const dateB =
        bookingB.date || "";


    if (dateA !== dateB) {

        return dateA.localeCompare(
            dateB
        );

    }


    return compareTimes(
        bookingA.time,
        bookingB.time
    );

}


/**
 * Ordina le prenotazioni cronologicamente.
 */
function sortBookings(
    bookings,
    descending = false
) {

    const sorted =
        [...bookings].sort(
            compareBookings
        );


    if (descending) {

        sorted.reverse();

    }


    return sorted;

}


/**
 * Restituisce le prenotazioni di una determinata data.
 */
function getBookingsForDate(
    bookings,
    dateString
) {

    return bookings.filter(
        booking =>
            booking.date === dateString
    );

}


/**
 * Restituisce le prenotazioni di oggi.
 */
function getTodayBookings(
    bookings
) {

    return getBookingsForDate(
        bookings,
        getTodayISO()
    );

}


/**
 * Conta le prenotazioni di oggi.
 */
function countTodayBookings(
    bookings
) {

    return getTodayBookings(
        bookings
    ).length;

}


/* ============================================================
   NUMERI DI TELEFONO
   ============================================================ */

/**
 * Normalizza un numero italiano.
 *
 * Gestisce:
 * +39 333 1234567
 * 0039 333 1234567
 * 333 1234567
 */
function normalizePhone(
    phone
) {

    if (
        phone === null ||
        phone === undefined
    ) {

        return "";

    }


    let value =
        String(phone)
            .trim();


    if (!value) {
        return "";
    }


    /*
        Manteniamo soltanto numeri
        e il simbolo + iniziale.
    */
    value =
        value.replace(
            /[^\d+]/g,
            ""
        );


    /*
        0039 -> +39
    */
    if (
        value.startsWith("0039")
    ) {

        value =
            "+39" +
            value.substring(4);

    }


    /*
        Numero italiano senza prefisso.
    */
    if (
        !value.startsWith("+") &&
        value.startsWith("3") &&
        value.length >= 9 &&
        value.length <= 10
    ) {

        value =
            "+39" +
            value;

    }


    return value;

}


/**
 * Verifica se un numero di telefono
 * sembra valido.
 */
function isValidPhone(
    phone
) {

    const normalized =
        normalizePhone(phone);


    if (!normalized) {
        return false;
    }


    /*
        Per l'app accettiamo anche numeri
        internazionali, evitando controlli
        eccessivamente rigidi.
    */
    const digits =
        normalized.replace(
            /\D/g,
            ""
        );


    return (
        digits.length >= 8 &&
        digits.length <= 15
    );

}


/**
 * Formatta un numero per la visualizzazione.
 */
function formatPhone(
    phone
) {

    const normalized =
        normalizePhone(phone);


    if (!normalized) {
        return "";
    }


    return normalized;

}


/**
 * Confronta due numeri ignorando
 * spazi e prefissi italiani.
 */
function phonesMatch(
    phoneA,
    phoneB
) {

    const a =
        normalizePhone(phoneA);


    const b =
        normalizePhone(phoneB);


    if (!a || !b) {
        return false;
    }


    const digitsA =
        a.replace(/\D/g, "");


    const digitsB =
        b.replace(/\D/g, "");


    if (digitsA === digitsB) {
        return true;
    }


    /*
        Confronto aggiuntivo per numeri italiani
        nel caso uno abbia 39 e l'altro no.
    */
    const without39A =
        digitsA.startsWith("39")
            ? digitsA.substring(2)
            : digitsA;


    const without39B =
        digitsB.startsWith("39")
            ? digitsB.substring(2)
            : digitsB;


    return (
        without39A ===
        without39B
    );

}


/* ============================================================
   SALUTO DINAMICO
   ============================================================ */

/**
 * Restituisce il saluto in base all'orario.
 */
function getDynamicGreeting(
    date = new Date()
) {

    const hour =
        date.getHours();


    if (hour >= 5 && hour < 12) {

        return "Buongiorno";

    }


    if (hour >= 12 && hour < 18) {

        return "Buon pomeriggio";

    }


    if (hour >= 18 && hour < 23) {

        return "Buonasera";

    }


    return "Buonanotte";

}


/**
 * Crea il saluto completo.
 *
 * Esempio:
 * "Buongiorno Francesco"
 */
function getPersonalGreeting(
    name
) {

    const greeting =
        getDynamicGreeting();


    const formattedName =
        formatName(name);


    if (!formattedName) {

        return greeting;

    }


    return (
        greeting +
        " " +
        formattedName
    );

}


/* ============================================================
   BLACKLIST
   ============================================================ */

/**
 * Verifica se una prenotazione
 * appartiene a un numero presente
 * nella blacklist.
 */
function findBlacklistedCustomer(
    phone,
    blacklist
) {

    if (!phone || !Array.isArray(blacklist)) {

        return null;

    }


    return blacklist.find(
        entry =>
            phonesMatch(
                phone,
                entry.phone
            )
    ) || null;

}


/**
 * Verifica direttamente se il numero
 * è nella blacklist.
 */
function isPhoneBlacklisted(
    phone,
    blacklist
) {

    return Boolean(
        findBlacklistedCustomer(
            phone,
            blacklist
        )
    );

}


/* ============================================================
   GENERAZIONE ID
   ============================================================ */

/**
 * Crea un ID univoco generico.
 */
function generateId(
    prefix = "item"
) {

    return (
        prefix +
        "-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );

}


/* ============================================================
   SICUREZZA TESTO HTML
   ============================================================ */

/**
 * Evita che testo proveniente
 * dall'utente venga interpretato
 * come HTML.
 */
function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ============================================================
   DEBOUNCE
   ============================================================ */

/**
 * Evita di eseguire continuamente
 * una funzione durante la digitazione.
 */
function debounce(
    callback,
    delay = 300
) {

    let timeoutId;


    return function (...args) {

        clearTimeout(
            timeoutId
        );


        timeoutId =
            setTimeout(
                () => {

                    callback.apply(
                        this,
                        args
                    );

                },
                delay
            );

    };

}


/* ============================================================
   CLIPBOARD
   ============================================================ */

/**
 * Copia un testo negli appunti.
 */
async function copyToClipboard(
    text
) {

    try {

        await navigator.clipboard.writeText(
            String(text || "")
        );

        return true;

    } catch (error) {

        console.error(
            "Errore copia clipboard:",
            error
        );

        return false;

    }

}


/* ============================================================
   DOWNLOAD FILE
   ============================================================ */

/**
 * Crea un download locale.
 */
function downloadFile(
    content,
    filename,
    mimeType = "text/plain"
) {

    const blob =
        new Blob(
            [content],
            {
                type: mimeType
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement("a");


    link.href =
        url;


    link.download =
        filename;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}


/* ============================================================
   LETTURA FILE
   ============================================================ */

/**
 * Legge un file testuale.
 */
function readTextFile(
    file
) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                () => {

                    resolve(
                        reader.result
                    );

                };


            reader.onerror =
                () => {

                    reject(
                        reader.error
                    );

                };


            reader.readAsText(
                file
            );

        }
    );

}


/* ============================================================
   ARRAY
   ============================================================ */

/**
 * Rimuove duplicati da un array.
 */
function uniqueArray(
    array
) {

    if (!Array.isArray(array)) {

        return [];

    }


    return [
        ...new Set(array)
    ];

}


/**
 * Divide un array in gruppi.
 */
function groupBy(
    array,
    keyFunction
) {

    return array.reduce(
        (
            groups,
            item
        ) => {

            const key =
                keyFunction(item);


            if (!groups[key]) {

                groups[key] = [];

            }


            groups[key].push(
                item
            );


            return groups;

        },
        {}
    );

}


/* ============================================================
   NUMERI
   ============================================================ */

/**
 * Converte un valore in numero
 * senza restituire NaN.
 */
function safeNumber(
    value,
    fallback = 0
) {

    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : fallback;

}


/* ============================================================
   LOCAL STORAGE UTILITY
   ============================================================ */

/**
 * Verifica se localStorage è disponibile.
 */
function isLocalStorageAvailable() {

    try {

        const testKey =
            "__ctl_manager_test__";


        localStorage.setItem(
            testKey,
            "1"
        );


        localStorage.removeItem(
            testKey
        );


        return true;

    } catch (error) {

        return false;

    }

}


/* ============================================================
   DEVICE
   ============================================================ */

/**
 * Determina se il dispositivo sembra mobile.
 */
function isMobileDevice() {

    return (
        window.innerWidth <= 768
    );

}


/* ============================================================
   SCROLL
   ============================================================ */

/**
 * Porta un elemento in vista.
 */
function scrollToElement(
    element,
    behavior = "smooth"
) {

    if (!element) {
        return;
    }


    element.scrollIntoView({
        behavior,
        block: "center"
    });

}


/* ============================================================
   EVENTI
   ============================================================ */

/**
 * Aggiunge un listener in modo sicuro.
 */
function on(
    element,
    eventName,
    callback,
    options
) {

    if (!element) {
        return;
    }


    element.addEventListener(
        eventName,
        callback,
        options
    );

}


/* ============================================================
   ESPORTAZIONE FUNZIONI
   ============================================================ */

/*
    I file JS del progetto vengono caricati
    direttamente tramite <script>.

    Le funzioni rimangono quindi disponibili
    globalmente e possono essere utilizzate
    da app.js, parser.js e dagli altri moduli.
*/
```
