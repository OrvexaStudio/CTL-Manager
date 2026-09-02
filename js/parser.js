```javascript
/*
    ============================================================
    CTL MANAGER
    parser.js

    Parser intelligente per:

    - messaggi WhatsApp copiati
    - testo libero
    - trascrizioni vocali
    - informazioni scritte in ordine casuale

    Obiettivo:
    estrarre solamente le informazioni che possono essere
    riconosciute con sufficiente sicurezza.

    Il parser NON salva direttamente la prenotazione.

    Restituisce invece un risultato che deve essere mostrato
    all'utente per la verifica prima della conferma.
    ============================================================
*/

"use strict";


/* ============================================================
   COSTANTI
   ============================================================ */

const PARSER_MONTHS = {

    gennaio: 0,
    febbraio: 1,
    marzo: 2,
    aprile: 3,
    maggio: 4,
    giugno: 5,
    luglio: 6,
    agosto: 7,
    settembre: 8,
    ottobre: 9,
    novembre: 10,
    dicembre: 11

};


const PARSER_MONTH_ALIASES = {

    gen: "gennaio",
    feb: "febbraio",
    mar: "marzo",
    apr: "aprile",
    mag: "maggio",
    giu: "giugno",
    lug: "luglio",
    ago: "agosto",
    set: "settembre",
    ott: "ottobre",
    nov: "novembre",
    dic: "dicembre"

};


/* ============================================================
   NORMALIZZAZIONE TESTO
   ============================================================ */

function parserNormalizeText(text) {

    if (
        text === null ||
        text === undefined
    ) {

        return "";

    }


    return String(text)
        .replace(/\r/g, "\n")
        .replace(/[“”«»]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/\u00A0/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

}


/**
 * Versione del testo utile per confrontare parole
 * senza preoccuparsi di maiuscole/minuscole.
 */
function parserSimplify(text) {

    return parserNormalizeText(text)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}


/* ============================================================
   RISULTATO BASE
   ============================================================ */

function createEmptyParseResult() {

    return {

        firstName: "",
        lastName: "",

        phone: "",

        departure: "",
        destination: "",

        date: "",
        time: "",

        passengers: "",

        notes: "",

        confidence: {

            firstName: 0,
            lastName: 0,
            phone: 0,
            departure: 0,
            destination: 0,
            date: 0,
            time: 0,
            passengers: 0,
            notes: 0

        },

        warnings: [],

        detectedFields: [],

        rawText: "",

        overallConfidence: 0

    };

}


/* ============================================================
   TELEFONO
   ============================================================ */

function parsePhone(text) {

    if (!text) {
        return null;
    }


    /*
        Cerchiamo numeri italiani e internazionali.
        Sono consentiti spazi, punti, parentesi e trattini.
    */

    const matches =
        text.match(
            /(?:\+|00)?\d[\d\s().-]{7,18}\d/g
        );


    if (!matches) {
        return null;
    }


    for (const match of matches) {

        const digits =
            match.replace(
                /\D/g,
                ""
            );


        /*
            Scartiamo numeri troppo corti o troppo lunghi.
        */
        if (
            digits.length < 8 ||
            digits.length > 15
        ) {

            continue;

        }


        /*
            Evitiamo di considerare date e orari come telefoni.
        */
        if (
            digits.length <= 6
        ) {

            continue;

        }


        const normalized =
            typeof normalizePhone === "function"
                ? normalizePhone(match)
                : match.trim();


        return {

            value: normalized,

            confidence:
                digits.length >= 9
                    ? 0.98
                    : 0.85

        };

    }


    return null;

}


/* ============================================================
   ORARIO
   ============================================================ */

function parseTime(text) {

    if (!text) {
        return null;
    }


    const simplified =
        parserSimplify(text);


    /*
        Formato:
        14:30
        14.30
        14 30
    */

    let match =
        simplified.match(
            /\b([01]?\d|2[0-3])\s*[:.]\s*([0-5]\d)\b/
        );


    if (match) {

        const hours =
            Number(match[1]);


        const minutes =
            Number(match[2]);


        return {

            value:
                String(hours).padStart(2, "0") +
                ":" +
                String(minutes).padStart(2, "0"),

            confidence: 0.99

        };

    }


    /*
        Formato:
        ore 14
        alle 14
        h14
        h 14
    */

    match =
        simplified.match(
            /\b(?:ore|ora|alle|h)\s*([01]?\d|2[0-3])\b/
        );


    if (match) {

        const hours =
            Number(match[1]);


        return {

            value:
                String(hours).padStart(2, "0") +
                ":00",

            confidence: 0.88

        };

    }


    /*
        Formato colloquiale:
        14
        solamente se vicino a parole che indicano l'orario.
    */

    match =
        simplified.match(
            /\b(?:alle|ore)\s+([01]?\d|2[0-3])\b/
        );


    if (match) {

        const hours =
            Number(match[1]);


        return {

            value:
                String(hours).padStart(2, "0") +
                ":00",

            confidence: 0.88

        };

    }


    return null;

}


/* ============================================================
   DATA
   ============================================================ */

function parseDate(text) {

    if (!text) {
        return null;
    }


    const original =
        parserNormalizeText(text);


    const simplified =
        parserSimplify(original);


    const today =
        new Date();


    /*
        Oggi
    */

    if (/\boggi\b/.test(simplified)) {

        return {

            value:
                formatDateISO(today),

            confidence: 0.99

        };

    }


    /*
        Domani
    */

    if (/\bdomani\b/.test(simplified)) {

        const date =
            new Date(today);


        date.setDate(
            date.getDate() + 1
        );


        return {

            value:
                formatDateISO(date),

            confidence: 0.99

        };

    }


    /*
        Dopodomani
    */

    if (
        /\bdopodomani\b/.test(
            simplified
        )
    ) {

        const date =
            new Date(today);


        date.setDate(
            date.getDate() + 2
        );


        return {

            value:
                formatDateISO(date),

            confidence: 0.98

        };

    }


    /*
        Giorni della settimana.
    */

    const weekdayResult =
        parseWeekdayDate(
            simplified
        );


    if (weekdayResult) {

        return weekdayResult;

    }


    /*
        Formato:
        02/09/2026
        2/9/26
        02-09-2026
        2.9.2026
    */

    let match =
        simplified.match(
            /\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/
        );


    if (match) {

        const day =
            Number(match[1]);


        const month =
            Number(match[2]);


        let year =
            match[3]
                ? Number(match[3])
                : today.getFullYear();


        if (year < 100) {

            year += 2000;

        }


        const date =
            createValidDate(
                year,
                month - 1,
                day
            );


        if (date) {

            return {

                value:
                    formatDateISO(date),

                confidence:
                    match[3]
                        ? 0.99
                        : 0.94

            };

        }

    }


    /*
        Formato:
        2 settembre
        2 settembre 2026
        2 set
    */

    match =
        simplified.match(
            /\b(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic)(?:\s+(\d{4}))?\b/
        );


    if (match) {

        const day =
            Number(match[1]);


        let monthName =
            match[2];


        monthName =
            PARSER_MONTH_ALIASES[
                monthName
            ] || monthName;


        const month =
            PARSER_MONTHS[
                monthName
            ];


        const year =
            match[3]
                ? Number(match[3])
                : today.getFullYear();


        const date =
            createValidDate(
                year,
                month,
                day
            );


        if (date) {

            return {

                value:
                    formatDateISO(date),

                confidence:
                    match[3]
                        ? 0.99
                        : 0.94

            };

        }

    }


    return null;

}


/**
 * Crea una data controllando che sia realmente valida.
 */
function createValidDate(
    year,
    month,
    day
) {

    const date =
        new Date(
            year,
            month,
            day
        );


    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day
    ) {

        return null;

    }


    return date;

}


/**
 * Riconosce:
 * lunedì
 * martedì
 * mercoledì
 * ecc.
 */
function parseWeekdayDate(
    text
) {

    const weekdays = {

        domenica: 0,
        lunedi: 1,
        martedi: 2,
        mercoledi: 3,
        giovedi: 4,
        venerdi: 5,
        sabato: 6

    };


    const today =
        new Date();


    for (
        const [
            name,
            targetDay
        ]
        of Object.entries(weekdays)
    ) {

        if (
            text.includes(name)
        ) {

            let difference =
                targetDay -
                today.getDay();


            if (difference <= 0) {

                difference += 7;

            }


            const date =
                new Date(today);


            date.setDate(
                date.getDate() +
                difference
            );


            return {

                value:
                    formatDateISO(date),

                confidence: 0.90

            };

        }

    }


    return null;

}


/* ============================================================
   PASSEGGERI
   ============================================================ */

function parsePassengers(text) {

    if (!text) {
        return null;
    }


    const simplified =
        parserSimplify(text);


    /*
        Esempi:
        2 pax
        3 passeggeri
        4 persone
        siamo in 3
        per 2
    */

    const patterns = [

        /\b(\d{1,2})\s*(?:pax|passeggeri|passegger[io]|persone)\b/,

        /\b(?:siamo|sono|saremo)\s+in\s+(\d{1,2})\b/,

        /\b(?:per|da)\s+(\d{1,2})\s+(?:persone|passeggeri)\b/,

        /\b(\d{1,2})\s*(?:posti|postazioni)\b/

    ];


    for (const pattern of patterns) {

        const match =
            simplified.match(
                pattern
            );


        if (match) {

            const number =
                Number(match[1]);


            if (
                number >= 1 &&
                number <= 50
            ) {

                return {

                    value:
                        String(number),

                    confidence: 0.96

                };

            }

        }

    }


    return null;

}


/* ============================================================
   NOME
   ============================================================ */

function parseName(text) {

    if (!text) {
        return null;
    }


    const lines =
        parserNormalizeText(text)
            .split("\n")
            .map(
                line =>
                    line.trim()
            )
            .filter(Boolean);


    const simplified =
        parserSimplify(text);


    /*
        Prima cerchiamo etichette esplicite.
    */

    const labelledPatterns = [

        /\b(?:nome|cliente)\s*[:=-]\s*([A-Za-zÀ-ÿ' -]{2,60})/i,

        /\b(?:passeggero|passeggera)\s*[:=-]\s*([A-Za-zÀ-ÿ' -]{2,60})/i,

        /\b(?:sig\.?|signor|signora)\s+([A-Za-zÀ-ÿ' -]{2,60})/i

    ];


    for (
        const pattern
        of labelledPatterns
    ) {

        const match =
            text.match(pattern);


        if (match) {

            const cleaned =
                cleanParsedName(
                    match[1]
                );


            if (cleaned) {

                const parts =
                    cleaned.split(" ");


                return {

                    firstName:
                        parts[0] || "",

                    lastName:
                        parts
                            .slice(1)
                            .join(" "),

                    confidence: 0.94

                };

            }

        }

    }


    /*
        Cerchiamo una riga che sembri
        chiaramente un nome e cognome.
    */

    for (const line of lines) {

        const clean =
            cleanParsedName(
                line
            );


        if (
            !clean ||
            clean.length < 3 ||
            clean.length > 60
        ) {

            continue;

        }


        /*
            Non consideriamo righe che contengono
            indirizzi, numeri, date o parole operative.
        */

        if (
            /\d/.test(clean)
        ) {

            continue;

        }


        const lineSimplified =
            parserSimplify(clean);


        const blockedWords = [

            "partenza",
            "destinazione",
            "da",
            "a",
            "alle",
            "ore",
            "oggi",
            "domani",
            "via",
            "viale",
            "piazza",
            "telefono",
            "tel",
            "cell",
            "passeggeri",
            "persone"

        ];


        if (
            blockedWords.some(
                word =>
                    lineSimplified
                        .split(" ")
                        .includes(word)
            )
        ) {

            continue;

        }


        const parts =
            clean.split(" ");


        if (
            parts.length >= 2 &&
            parts.length <= 4
        ) {

            return {

                firstName:
                    parts[0],

                lastName:
                    parts
                        .slice(1)
                        .join(" "),

                confidence: 0.68

            };

        }

    }


    return null;

}


function cleanParsedName(
    value
) {

    return String(value || "")
        .replace(
            /^[\s:,-]+/,
            ""
        )
        .replace(
            /[\s,.;:-]+$/,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


/* ============================================================
   PARTENZA / DESTINAZIONE
   ============================================================ */

function parseLocations(text) {

    if (!text) {

        return {

            departure: null,
            destination: null

        };

    }


    const result = {

        departure: null,
        destination: null

    };


    /*
        Formati molto comuni:

        Partenza: Lecce
        Destinazione: Brindisi

        Da Lecce a Brindisi

        Partenza Lecce -> Destinazione Brindisi

        Lecce -> Brindisi
    */


    const departurePatterns = [

        /\b(?:partenza|pickup|pick-up|ritiro|da)\s*[:=-]\s*(.+?)(?=\n|$|\bdestinazione\b|\bper\b|\ba\b)/i,

        /\b(?:partenza|pickup|pick-up|ritiro)\s+(.+?)(?=\n|$|\bdestinazione\b|\bper\b|\ba\b)/i

    ];


    const destinationPatterns = [

        /\b(?:destinazione|dropoff|drop-off|arrivo|per)\s*[:=-]\s*(.+?)(?=\n|$|\bpartenza\b|\bda\b)/i,

        /\b(?:destinazione|dropoff|drop-off|arrivo|per)\s+(.+?)(?=\n|$|\bpartenza\b|\bda\b)/i

    ];


    for (
        const pattern
        of departurePatterns
    ) {

        const match =
            text.match(pattern);


        if (match) {

            const value =
                cleanLocation(
                    match[1]
                );


            if (value) {

                result.departure = {

                    value,

                    confidence: 0.95

                };

                break;

            }

        }

    }


    for (
        const pattern
        of destinationPatterns
    ) {

        const match =
            text.match(pattern);


        if (match) {

            const value =
                cleanLocation(
                    match[1]
                );


            if (value) {

                result.destination = {

                    value,

                    confidence: 0.95

                };

                break;

            }

        }

    }


    /*
        Formato:
        Da X a Y
    */

    const fromToMatch =
        text.match(
            /\bda\s+(.+?)\s+\ba\s+(.+?)(?=\n|$)/i
        );


    if (
        fromToMatch &&
        !result.departure &&
        !result.destination
    ) {

        const departure =
            cleanLocation(
                fromToMatch[1]
            );


        const destination =
            cleanLocation(
                fromToMatch[2]
            );


        if (
            departure &&
            destination
        ) {

            result.departure = {

                value: departure,

                confidence: 0.93

            };


            result.destination = {

                value: destination,

                confidence: 0.93

            };

        }

    }


    /*
        Formato:
        X -> Y
        X → Y
        X - Y

        Il trattino viene utilizzato solo quando
        siamo abbastanza sicuri che separi due località.
    */

    if (
        !result.departure ||
        !result.destination
    ) {

        const arrowMatch =
            text.match(
                /(.+?)\s*(?:->|→|➜|⇒)\s*(.+?)(?=\n|$)/i
            );


        if (arrowMatch) {

            const departure =
                cleanLocation(
                    arrowMatch[1]
                );


            const destination =
                cleanLocation(
                    arrowMatch[2]
                );


            if (
                departure &&
                destination &&
                !containsOperationalWords(
                    departure
                ) &&
                !containsOperationalWords(
                    destination
                )
            ) {

                if (!result.departure) {

                    result.departure = {

                        value: departure,

                        confidence: 0.88

                    };

                }


                if (!result.destination) {

                    result.destination = {

                        value: destination,

                        confidence: 0.88

                    };

                }

            }

        }

    }


    return result;

}


/**
 * Pulisce una località.
 */
function cleanLocation(
    value
) {

    if (!value) {
        return "";
    }


    let cleaned =
        parserNormalizeText(
            value
        );


    cleaned =
        cleaned.replace(
            /^(?:-|:|,)+/,
            ""
        );


    cleaned =
        cleaned.replace(
            /(?:-|:|,)+$/,
            ""
        );


    /*
        Rimuoviamo eventuali informazioni
        chiaramente appartenenti ad altri campi.
    */

    cleaned =
        cleaned.replace(
            /\b(?:telefono|tel|cell)\b.*$/i,
            ""
        );


    cleaned =
        cleaned.replace(
            /\b(?:ore|alle)\s+\d{1,2}(?::\d{2})?.*$/i,
            ""
        );


    return cleaned.trim();

}


/**
 * Parole che indicano che una stringa
 * non è probabilmente una località.
 */
function containsOperationalWords(
    value
) {

    const simplified =
        parserSimplify(value);


    const words = [

        "telefono",
        "cellulare",
        "passeggeri",
        "persone",
        "cliente",
        "nome",
        "domani",
        "oggi"

    ];


    return words.some(
        word =>
            simplified.includes(word)
    );

}


/* ============================================================
   NOTE
   ============================================================ */

function parseNotes(
    text,
    alreadyDetected
) {

    if (!text) {
        return null;
    }


    const lines =
        parserNormalizeText(text)
            .split("\n")
            .map(
                line =>
                    line.trim()
            )
            .filter(Boolean);


    const noteLines = [];


    for (const line of lines) {

        const simplified =
            parserSimplify(line);


        /*
            Riconosciamo esplicitamente
            le note.
        */

        if (
            /^(nota|note|richiesta|richieste|info|informazioni|extra)\s*[:=-]/i
                .test(line)
        ) {

            const value =
                line
                    .replace(
                        /^(nota|note|richiesta|richieste|info|informazioni|extra)\s*[:=-]\s*/i,
                        ""
                    )
                    .trim();


            if (value) {

                noteLines.push(
                    value
                );

            }

            continue;

        }


        /*
            Parole tipiche che indicano
            una richiesta particolare.
        */

        if (
            simplified.includes(
                "seggiolino"
            ) ||
            simplified.includes(
                "bagaglio"
            ) ||
            simplified.includes(
                "valigia"
            ) ||
            simplified.includes(
                "animale"
            ) ||
            simplified.includes(
                "sedia a rotelle"
            ) ||
            simplified.includes(
                "attesa"
            )
        ) {

            /*
                Se la riga non è già stata
                identificata come altro campo,
                la consideriamo una possibile nota.
            */

            if (
                !lineLooksLikeDetectedField(
                    line,
                    alreadyDetected
                )
            ) {

                noteLines.push(
                    line
                );

            }

        }

    }


    if (!noteLines.length) {

        return null;

    }


    return {

        value:
            noteLines.join(" "),

        confidence: 0.82

    };

}


function lineLooksLikeDetectedField(
    line,
    detected
) {

    const simplified =
        parserSimplify(line);


    if (
        detected.phone &&
        /\d{7,}/.test(
            simplified
        )
    ) {

        return true;

    }


    if (
        detected.date &&
        /\d{1,2}[\/.-]\d{1,2}/.test(
            simplified
        )
    ) {

        return true;

    }


    if (
        detected.time &&
        /\d{1,2}[:.]\d{2}/.test(
            simplified
        )
    ) {

        return true;

    }


    return false;

}


/* ============================================================
   PARSER PRINCIPALE
   ============================================================ */

function parseReservationText(
    text
) {

    const result =
        createEmptyParseResult();


    result.rawText =
        parserNormalizeText(
            text
        );


    if (!result.rawText) {

        result.warnings.push(
            "Nessun testo da analizzare."
        );

        return result;

    }


    /*
        --------------------------------------------------------
        1. TELEFONO
        --------------------------------------------------------
    */

    const phoneResult =
        parsePhone(
            result.rawText
        );


    if (phoneResult) {

        result.phone =
            phoneResult.value;


        result.confidence.phone =
            phoneResult.confidence;


        result.detectedFields.push(
            "phone"
        );

    }


    /*
        --------------------------------------------------------
        2. DATA
        --------------------------------------------------------
    */

    const dateResult =
        parseDate(
            result.rawText
        );


    if (dateResult) {

        result.date =
            dateResult.value;


        result.confidence.date =
            dateResult.confidence;


        result.detectedFields.push(
            "date"
        );

    }


    /*
        --------------------------------------------------------
        3. ORA
        --------------------------------------------------------
    */

    const timeResult =
        parseTime(
            result.rawText
        );


    if (timeResult) {

        result.time =
            timeResult.value;


        result.confidence.time =
            timeResult.confidence;


        result.detectedFields.push(
            "time"
        );

    }


    /*
        --------------------------------------------------------
        4. PASSEGGERI
        --------------------------------------------------------
    */

    const passengersResult =
        parsePassengers(
            result.rawText
        );


    if (passengersResult) {

        result.passengers =
            passengersResult.value;


        result.confidence.passengers =
            passengersResult.confidence;


        result.detectedFields.push(
            "passengers"
        );

    }


    /*
        --------------------------------------------------------
        5. PARTENZA / DESTINAZIONE
        --------------------------------------------------------
    */

    const locationsResult =
        parseLocations(
            result.rawText
        );


    if (locationsResult.departure) {

        result.departure =
            locationsResult
                .departure
                .value;


        result.confidence.departure =
            locationsResult
                .departure
                .confidence;


        result.detectedFields.push(
            "departure"
        );

    }


    if (locationsResult.destination) {

        result.destination =
            locationsResult
                .destination
                .value;


        result.confidence.destination =
            locationsResult
                .destination
                .confidence;


        result.detectedFields.push(
            "destination"
        );

    }


    /*
        --------------------------------------------------------
        6. NOME
        --------------------------------------------------------
    */

    const nameResult =
        parseName(
            result.rawText
        );


    if (nameResult) {

        result.firstName =
            nameResult.firstName;


        result.lastName =
            nameResult.lastName;


        result.confidence.firstName =
            nameResult.confidence;


        result.confidence.lastName =
            nameResult.confidence;


        result.detectedFields.push(
            "name"
        );

    }


    /*
        --------------------------------------------------------
        7. NOTE
        --------------------------------------------------------
    */

    const notesResult =
        parseNotes(
            result.rawText,
            result
        );


    if (notesResult) {

        result.notes =
            notesResult.value;


        result.confidence.notes =
            notesResult.confidence;


        result.detectedFields.push(
            "notes"
        );

    }


    /*
        --------------------------------------------------------
        8. CONTROLLI DI SICUREZZA
        --------------------------------------------------------
    */

    validateParseResult(
        result
    );


    /*
        --------------------------------------------------------
        9. CONFIDENZA COMPLESSIVA
        --------------------------------------------------------
    */

    result.overallConfidence =
        calculateOverallConfidence(
            result
        );


    return result;

}


/* ============================================================
   VALIDAZIONE
   ============================================================ */

function validateParseResult(
    result
) {

    /*
        Se la data è nel passato, non la correggiamo
        automaticamente.

        Mostriamo invece un avviso.
    */

    if (
        result.date &&
        typeof isDateBeforeToday === "function" &&
        isDateBeforeToday(
            result.date
        )
    ) {

        result.warnings.push(
            "La data riconosciuta sembra essere nel passato."
        );

    }


    /*
        Telefono non valido.
    */

    if (
        result.phone &&
        typeof isValidPhone === "function" &&
        !isValidPhone(
            result.phone
        )
    ) {

        result.warnings.push(
            "Il numero di telefono riconosciuto potrebbe non essere valido."
        );

    }


    /*
        Partenza e destinazione uguali.
    */

    if (
        result.departure &&
        result.destination &&
        parserSimplify(
            result.departure
        ) ===
        parserSimplify(
            result.destination
        )
    ) {

        result.warnings.push(
            "Partenza e destinazione risultano uguali."
        );

    }


    /*
        Ora valida.
    */

    if (
        result.time &&
        typeof normalizeTime === "function"
    ) {

        const normalized =
            normalizeTime(
                result.time
            );


        if (!normalized) {

            result.warnings.push(
                "L'orario riconosciuto non è valido."
            );

        }

    }


    /*
        Numero passeggeri.
    */

    if (result.passengers) {

        const passengers =
            Number(
                result.passengers
            );


        if (
            !Number.isInteger(
                passengers
            ) ||
            passengers < 1 ||
            passengers > 50
        ) {

            result.warnings.push(
                "Il numero di passeggeri riconosciuto non sembra corretto."
            );

        }

    }

}


/* ============================================================
   CONFIDENZA
   ============================================================ */

function calculateOverallConfidence(
    result
) {

    const fields = [

        "firstName",
        "lastName",
        "phone",
        "departure",
        "destination",
        "date",
        "time",
        "passengers",
        "notes"

    ];


    const detected = fields.filter(
        field =>
            result[field]
    );


    if (!detected.length) {

        return 0;

    }


    const total =
        detected.reduce(
            (
                sum,
                field
            ) =>
                sum +
                (
                    result.confidence[field] ||
                    0
                ),
            0
        );


    return Math.round(
        (
            total /
            detected.length
        ) *
        100
    );

}


/* ============================================================
   SUGGERIMENTI
   ============================================================ */

/**
 * Restituisce i campi che sarebbe meglio
 * controllare manualmente.
 */
function getParserReviewFields(
    result
) {

    const fields = [];


    const confidence =
        result.confidence || {};


    if (
        result.firstName &&
        confidence.firstName < 0.80
    ) {

        fields.push(
            "firstName"
        );

    }


    if (
        result.lastName &&
        confidence.lastName < 0.80
    ) {

        fields.push(
            "lastName"
        );

    }


    if (
        result.departure &&
        confidence.departure < 0.85
    ) {

        fields.push(
            "departure"
        );

    }


    if (
        result.destination &&
        confidence.destination < 0.85
    ) {

        fields.push(
            "destination"
        );

    }


    if (
        result.date &&
        confidence.date < 0.90
    ) {

        fields.push(
            "date"
        );

    }


    if (
        result.time &&
        confidence.time < 0.90
    ) {

        fields.push(
            "time"
        );

    }


    if (
        result.passengers &&
        confidence.passengers < 0.90
    ) {

        fields.push(
            "passengers"
        );

    }


    return fields;

}


/* ============================================================
   TESTO DI RIEPILOGO
   ============================================================ */

function createParserSummary(
    result
) {

    const lines = [];


    if (
        result.firstName ||
        result.lastName
    ) {

        lines.push(
            "Cliente: " +
            [
                result.firstName,
                result.lastName
            ]
                .filter(Boolean)
                .join(" ")
        );

    }


    if (result.phone) {

        lines.push(
            "Telefono: " +
            result.phone
        );

    }


    if (result.departure) {

        lines.push(
            "Partenza: " +
            result.departure
        );

    }


    if (result.destination) {

        lines.push(
            "Destinazione: " +
            result.destination
        );

    }


    if (result.date) {

        const formattedDate =
            typeof formatLongDate === "function"
                ? formatLongDate(
                    result.date
                )
                : result.date;


        lines.push(
            "Data: " +
            formattedDate
        );

    }


    if (result.time) {

        lines.push(
            "Ora: " +
            result.time
        );

    }


    if (result.passengers) {

        lines.push(
            "Passeggeri: " +
            result.passengers
        );

    }


    if (result.notes) {

        lines.push(
            "Note: " +
            result.notes
        );

    }


    return lines.join(
        "\n"
    );

}


/* ============================================================
   PARSER VOCALE
   ============================================================ */

/**
 * Il riconoscimento vocale del browser restituisce
 * normalmente una stringa.

 * Questa funzione permette di passare direttamente
 * la trascrizione al parser principale.
 */
function parseVoiceTranscript(
    transcript
) {

    return parseReservationText(
        transcript
    );

}


/* ============================================================
   PARSER WHATSAPP
   ============================================================ */

/**
 * Analizza un messaggio WhatsApp copiato.
 *
 * Non tenta di collegarsi automaticamente a WhatsApp.
 * L'utente deve incollare il messaggio nell'app.
 */
function parseWhatsAppMessage(
    message
) {

    return parseReservationText(
        message
    );

}


/* ============================================================
   VALIDAZIONE PRIMA DEL SALVATAGGIO
   ============================================================ */

/**
 * Determina se una prenotazione può essere proposta
 * per la conferma.
 *
 * Non richiede che tutti i campi siano compilati,
 * perché nell'app tutti i campi sono opzionali.
 */
function validateParsedReservation(
    result
) {

    const errors = [];


    if (!result || typeof result !== "object") {

        errors.push(
            "Dati della prenotazione non validi."
        );


        return {

            valid: false,
            errors

        };

    }


    /*
        Non blocchiamo campi mancanti.
        Segnaliamo solamente eventuali errori reali.
    */

    if (
        result.date &&
        !createValidDateFromISO(
            result.date
        )
    ) {

        errors.push(
            "La data non è valida."
        );

    }


    if (
        result.time &&
        typeof normalizeTime === "function" &&
        !normalizeTime(
            result.time
        )
    ) {

        errors.push(
            "L'orario non è valido."
        );

    }


    if (
        result.phone &&
        typeof isValidPhone === "function" &&
        !isValidPhone(
            result.phone
        )
    ) {

        errors.push(
            "Il numero di telefono non è valido."
        );

    }


    return {

        valid:
            errors.length === 0,

        errors

    };

}


function createValidDateFromISO(
    value
) {

    if (
        typeof parseDateISO === "function"
    ) {

        return Boolean(
            parseDateISO(value)
        );

    }


    return /^\d{4}-\d{2}-\d{2}$/.test(
        value
    );

}


/* ============================================================
   CREAZIONE PRENOTAZIONE DAL RISULTATO
   ============================================================ */

/**
 * Converte il risultato del parser
 * in un oggetto compatibile con il sistema
 * delle prenotazioni.
 *
 * Il salvataggio vero e proprio viene effettuato
 * successivamente da app.js.
 */
function parsedResultToBooking(
    result
) {

    if (!result) {
        return null;
    }


    const booking = {

        firstName:
            cleanText(
                result.firstName
            ),

        lastName:
            cleanText(
                result.lastName
            ),

        phone:
            typeof normalizePhone === "function"
                ? normalizePhone(
                    result.phone
                )
                : cleanText(
                    result.phone
                ),

        departure:
            cleanText(
                result.departure
            ),

        destination:
            cleanText(
                result.destination
            ),

        date:
            cleanText(
                result.date
            ),

        time:
            typeof normalizeTime === "function"
                ? normalizeTime(
                    result.time
                )
                : cleanText(
                    result.time
                ),

        passengers:
            cleanText(
                result.passengers
            ),

        notes:
            cleanText(
                result.notes
            )

    };


    return booking;

}
```
