/*
 * =========================================================
 * CTL MANAGER
 * Smart Input Parser
 * =========================================================
 */

(function (window) {
    "use strict";

    const Utils = window.CTLUtils || {};

    const cleanText =
        Utils.cleanText ||
        (value => String(value ?? "").trim());

    const normalizeTime =
        Utils.normalizeTime ||
        (value => value || "");

    const capitalizeWords =
        Utils.capitalizeWords ||
        (value => value || "");

    /*
     * =====================================================
     * COSTANTI
     * =====================================================
     */

    const MONTHS = {
        gennaio: 1,
        febbraio: 2,
        marzo: 3,
        aprile: 4,
        maggio: 5,
        giugno: 6,
        luglio: 7,
        agosto: 8,
        settembre: 9,
        ottobre: 10,
        novembre: 11,
        dicembre: 12
    };

    const WEEKDAYS = {
        domenica: 0,
        lunedi: 1,
        lunedì: 1,
        martedi: 2,
        martedì: 2,
        mercoledi: 3,
        mercoledì: 3,
        giovedi: 4,
        giovedì: 4,
        venerdi: 5,
        venerdì: 5,
        sabato: 6
    };

    const SPOKEN_NUMBERS = {
        zero: 0,
        uno: 1,
        una: 1,
        due: 2,
        tre: 3,
        quattro: 4,
        cinque: 5,
        sei: 6,
        sette: 7,
        otto: 8,
        nove: 9,
        dieci: 10,
        undici: 11,
        dodici: 12,
        tredici: 13,
        quattordici: 14,
        quindici: 15,
        sedici: 16,
        diciassette: 17,
        diciotto: 18,
        diciannove: 19,
        venti: 20
    };


    /* =====================================================
       UTILITY INTERNE
       ===================================================== */

    function normalizeForSearch(value) {
        return cleanText(value)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[.,;!?()[\]{}]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }


    function escapeRegExp(value) {
        return String(value)
            .replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );
    }


    function getToday() {
        const date = new Date();

        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate()
        };
    }


    function pad(value) {
        return String(value)
            .padStart(2, "0");
    }


    function buildDate(
        year,
        month,
        day
    ) {
        const date = new Date(
            year,
            month - 1,
            day
        );

        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            return "";
        }

        return [
            year,
            pad(month),
            pad(day)
        ].join("-");
    }


    function normalizePhone(phone) {
        if (!phone) {
            return "";
        }

        let value = String(phone)
            .replace(/[^\d+]/g, "");

        if (
            value.startsWith("0039")
        ) {
            value =
                "+" +
                value.slice(2);
        }

        if (
            value.startsWith("39") &&
            value.length >= 11
        ) {
            value =
                "+" +
                value;
        }

        return value;
    }


    function findPhone(text) {
        const matches =
            String(text).match(
                /(?:\+39|0039|39)?[\s./-]*3\d(?:[\s./-]*\d){8,9}/g
            );

        if (!matches) {
            return "";
        }

        /*
         * Prendiamo il primo numero sufficientemente
         * plausibile.
         */
        for (const match of matches) {
            const digits =
                match.replace(/\D/g, "");

            let national = digits;

            if (
                national.startsWith("0039")
            ) {
                national =
                    national.slice(4);
            } else if (
                national.startsWith("39") &&
                national.length > 10
            ) {
                national =
                    national.slice(2);
            }

            if (
                /^3\d{8,9}$/.test(
                    national
                )
            ) {
                return national;
            }
        }

        return "";
    }


    /* =====================================================
       DATA
       ===================================================== */

    function parseDateFromText(text) {
        const source =
            normalizeForSearch(text);

        const today =
            getToday();

        /*
         * Oggi
         */
        if (
            /\boggi\b/.test(source)
        ) {
            return buildDate(
                today.year,
                today.month,
                today.day
            );
        }

        /*
         * Domani
         */
        if (
            /\bdomani\b/.test(source)
        ) {
            const date = new Date(
                today.year,
                today.month - 1,
                today.day + 1
            );

            return buildDate(
                date.getFullYear(),
                date.getMonth() + 1,
                date.getDate()
            );
        }

        /*
         * Dopodomani
         */
        if (
            /\bdopodomani\b/.test(source)
        ) {
            const date = new Date(
                today.year,
                today.month - 1,
                today.day + 2
            );

            return buildDate(
                date.getFullYear(),
                date.getMonth() + 1,
                date.getDate()
            );
        }

        /*
         * DD/MM/YYYY
         */
        let match =
            source.match(
                /\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/
            );

        if (match) {
            let day =
                Number(match[1]);

            let month =
                Number(match[2]);

            let year =
                Number(match[3]);

            if (year < 100) {
                year += 2000;
            }

            return buildDate(
                year,
                month,
                day
            );
        }

        /*
         * DD/MM senza anno
         */
        match =
            source.match(
                /\b(\d{1,2})[\/.-](\d{1,2})\b/
            );

        if (match) {
            const day =
                Number(match[1]);

            const month =
                Number(match[2]);

            let year =
                today.year;

            /*
             * Se la data è già passata,
             * assumiamo l'anno successivo.
             */
            const candidate =
                new Date(
                    year,
                    month - 1,
                    day
                );

            if (
                candidate <
                new Date(
                    today.year,
                    today.month - 1,
                    today.day
                )
            ) {
                year++;
            }

            return buildDate(
                year,
                month,
                day
            );
        }

        /*
         * "15 settembre"
         */
        for (const [
            monthName,
            monthNumber
        ] of Object.entries(MONTHS)) {
            const pattern =
                new RegExp(
                    `\\b(\\d{1,2})\\s+${escapeRegExp(monthName)}\\b`,
                    "i"
                );

            match =
                source.match(pattern);

            if (match) {
                const day =
                    Number(match[1]);

                let year =
                    today.year;

                const candidate =
                    new Date(
                        year,
                        monthNumber - 1,
                        day
                    );

                if (
                    candidate <
                    new Date(
                        today.year,
                        today.month - 1,
                        today.day
                    )
                ) {
                    year++;
                }

                return buildDate(
                    year,
                    monthNumber,
                    day
                );
            }
        }

        /*
         * Giorni della settimana:
         * "lunedì", "venerdì", ecc.
         */
        for (const [
            dayName,
            dayNumber
        ] of Object.entries(WEEKDAYS)) {
            const pattern =
                new RegExp(
                    `\\b${escapeRegExp(dayName)}\\b`,
                    "i"
                );

            if (
                pattern.test(source)
            ) {
                const todayDate =
                    new Date(
                        today.year,
                        today.month - 1,
                        today.day
                    );

                const currentDay =
                    todayDate.getDay();

                let difference =
                    dayNumber -
                    currentDay;

                if (difference <= 0) {
                    difference += 7;
                }

                const date =
                    new Date(
                        todayDate
                    );

                date.setDate(
                    date.getDate() +
                    difference
                );

                return buildDate(
                    date.getFullYear(),
                    date.getMonth() + 1,
                    date.getDate()
                );
            }
        }

        return "";
    }


    /* =====================================================
       ORARIO
       ===================================================== */

    function parseTimeFromText(text) {
        const source =
            normalizeForSearch(text);

        /*
         * 14:30 / 14.30
         */
        let match =
            source.match(
                /\b([01]?\d|2[0-3])[:.](\d{2})\b/
            );

        if (match) {
            return normalizeTime(
                `${match[1]}:${match[2]}`
            );
        }

        /*
         * "alle 14"
         */
        match =
            source.match(
                /\b(?:alle|ore|h)\s*(\d{1,2})\b/
            );

        if (match) {
            const hour =
                Number(match[1]);

            if (
                hour >= 0 &&
                hour <= 23
            ) {
                return (
                    pad(hour) +
                    ":00"
                );
            }
        }

        /*
         * "alle 14 e 30"
         */
        match =
            source.match(
                /\b(?:alle|ore|h)\s*(\d{1,2})\s*(?:e|:)\s*(\d{1,2})\b/
            );

        if (match) {
            return normalizeTime(
                `${match[1]}:${match[2]}`
            );
        }

        /*
         * "14 e 30"
         */
        match =
            source.match(
                /\b([01]?\d|2[0-3])\s+e\s+(\d{1,2})\b/
            );

        if (match) {
            return normalizeTime(
                `${match[1]}:${match[2]}`
            );
        }

        /*
         * Espressioni:
         * mezzogiorno
         * mezzanotte
         */
        if (
            /\bmezzogiorno\b/.test(source)
        ) {
            return "12:00";
        }

        if (
            /\bmezzanotte\b/.test(source)
        ) {
            return "00:00";
        }

        /*
         * "le 8"
         */
        match =
            source.match(
                /\b(?:le|per le)\s*(\d{1,2})\b/
            );

        if (match) {
            const hour =
                Number(match[1]);

            if (
                hour >= 0 &&
                hour <= 23
            ) {
                return pad(hour) + ":00";
            }
        }

        return "";
    }


    /* =====================================================
       PASSEGGERI
       ===================================================== */

    function parsePassengersFromText(text) {
        const source =
            normalizeForSearch(text);

        /*
         * "4 persone"
         */
        let match =
            source.match(
                /\b(\d{1,2})\s*(?:persone|persona|passeggeri|passeggero)\b/
            );

        if (match) {
            return Number(match[1]);
        }

        /*
         * "siamo in 4"
         */
        match =
            source.match(
                /\b(?:siamo|siamo in|per)\s+(\d{1,2})\b/
            );

        if (match) {
            return Number(match[1]);
        }

        /*
         * Numeri scritti in lettere.
         */
        for (const [
            word,
            number
        ] of Object.entries(
            SPOKEN_NUMBERS
        )) {
            const pattern =
                new RegExp(
                    `\\b${escapeRegExp(word)}\\s*(?:persone|persona|passeggeri|passeggero)\\b`
                );

            if (
                pattern.test(source)
            ) {
                return number;
            }
        }

        return null;
    }


    /* =====================================================
       NOMI
       ===================================================== */

    function parseNameFromText(text) {
        const source =
            cleanText(text);

        /*
         * "Mario Rossi"
         * "cliente Mario Rossi"
         * "per Mario Rossi"
         */
        const match =
            source.match(
                /\b(?:cliente|per|nome)\s+([A-Za-zÀ-ÖØ-öø-ÿ'’-]+)(?:\s+([A-Za-zÀ-ÖØ-öø-ÿ'’-]+))?\b/i
            );

        if (!match) {
            return {
                firstName: "",
                lastName: ""
            };
        }

        const firstName =
            capitalizeWords(
                match[1]
            );

        const lastName =
            match[2]
                ? capitalizeWords(match[2])
                : "";

        return {
            firstName,
            lastName
        };
    }


    /* =====================================================
       INDIRIZZI
       ===================================================== */

    function extractAfterKeyword(
        source,
        keywords
    ) {
        const normalized =
            normalizeForSearch(source);

        for (const keyword of keywords) {
            const pattern =
                new RegExp(
                    `\\b${escapeRegExp(keyword)}\\b\\s+(.+?)(?=\\s+\\b(?:a|ad|verso|da|partenza|arrivo|alle|ore|il|domani|oggi|per)\\b|$)`,
                    "i"
                );

            const match =
                normalized.match(pattern);

            if (
                match &&
                match[1]
            ) {
                return cleanText(
                    match[1]
                );
            }
        }

        return "";
    }


    function parseAddressesFromText(text) {
        const source =
            cleanText(text);

        const normalized =
            normalizeForSearch(source);

        let departure = "";
        let arrival = "";

        /*
         * Pattern esplicito:
         * "da X a Y"
         */
        let match =
            normalized.match(
                /\bda\s+(.+?)\s+\ba\s+(.+?)(?=\s+\b(?:il|alle|ore|oggi|domani|con|per)\b|$)/i
            );

        if (match) {
            departure =
                cleanText(match[1]);

            arrival =
                cleanText(match[2]);
        }

        /*
         * "partenza X arrivo Y"
         */
        if (!departure) {
            match =
                normalized.match(
                    /\bpartenza\s+(.+?)\s+\barrivo\s+(.+?)(?=\s+\b(?:il|alle|ore|oggi|domani|con|per)\b|$)/i
                );

            if (match) {
                departure =
                    cleanText(match[1]);

                arrival =
                    cleanText(match[2]);
            }
        }

        /*
         * "da X verso Y"
         */
        if (!departure) {
            match =
                normalized.match(
                    /\bda\s+(.+?)\s+\b(?:verso|ad|a)\s+(.+?)(?=\s+\b(?:il|alle|ore|oggi|domani|con|per)\b|$)/i
                );

            if (match) {
                departure =
                    cleanText(match[1]);

                arrival =
                    cleanText(match[2]);
            }
        }

        /*
         * "X -> Y"
         */
        if (!departure) {
            match =
                source.match(
                    /(.+?)\s*(?:->|→|=>)\s*(.+?)(?=\s+\b(?:il|alle|ore|oggi|domani|con|per)\b|$)/i
                );

            if (match) {
                departure =
                    cleanText(match[1]);

                arrival =
                    cleanText(match[2]);
            }
        }

        /*
         * "da: X a: Y"
         */
        if (!departure) {
            match =
                source.match(
                    /\bda\s*:\s*(.+?)\s+\ba\s*:\s*(.+?)(?=\s+\b(?:il|alle|ore|oggi|domani|con|per)\b|$)/i
                );

            if (match) {
                departure =
                    cleanText(match[1]);

                arrival =
                    cleanText(match[2]);
            }
        }

        /*
         * Rimuoviamo eventuali etichette residue.
         */
        departure =
            removeTrailingRideData(
                departure
            );

        arrival =
            removeTrailingRideData(
                arrival
            );

        return {
            departure,
            arrival
        };
    }


    function removeTrailingRideData(
        value
    ) {
        return cleanText(
            String(value ?? "")
                .replace(
                    /\s+\b(?:alle|ore)\s+\d{1,2}(?::|\.)?\d{0,2}\b.*$/i,
                    ""
                )
                .replace(
                    /\s+\b(?:oggi|domani|dopodomani)\b.*$/i,
                    ""
                )
        );
    }


    /* =====================================================
       NOTE
       ===================================================== */

    function parseNotesFromText(text) {
        const source =
            cleanText(text);

        const normalized =
            normalizeForSearch(source);

        const patterns = [
            /\bnote?\s*[:\-]\s*(.+)$/i,
            /\bcon\s+(.+)$/i,
            /\bsegnala(?:re)?\s+(.+)$/i
        ];

        for (const pattern of patterns) {
            const match =
                normalized.match(pattern);

            if (
                match &&
                match[1]
            ) {
                return cleanText(
                    match[1]
                );
            }
        }

        return "";
    }


    /* =====================================================
       PARSER PRINCIPALE
       ===================================================== */

    function parseRideText(text) {
        const source =
            cleanText(text);

        if (!source) {
            return createEmptyResult();
        }

        const date =
            parseDateFromText(source);

        const time =
            parseTimeFromText(source);

        const phone =
            findPhone(source);

        const passengers =
            parsePassengersFromText(
                source
            );

        const name =
            parseNameFromText(source);

        const addresses =
            parseAddressesFromText(
                source
            );

        const notes =
            parseNotesFromText(source);

        const result = {
            firstName:
                name.firstName || "",

            lastName:
                name.lastName || "",

            phone:
                phone || "",

            departure:
                addresses.departure || "",

            arrival:
                addresses.arrival || "",

            date:
                date || "",

            time:
                time || "",

            passengers:
                passengers || "",

            notes:
                notes || "",

            confidence: {
                firstName:
                    name.firstName
                        ? "medium"
                        : "none",

                lastName:
                    name.lastName
                        ? "medium"
                        : "none",

                phone:
                    phone
                        ? "high"
                        : "none",

                departure:
                    addresses.departure
                        ? "medium"
                        : "none",

                arrival:
                    addresses.arrival
                        ? "medium"
                        : "none",

                date:
                    date
                        ? "high"
                        : "none",

                time:
                    time
                        ? "high"
                        : "none",

                passengers:
                    passengers
                        ? "high"
                        : "none",

                notes:
                    notes
                        ? "low"
                        : "none"
            },

            source
        };

        return result;
    }


    function createEmptyResult() {
        return {
            firstName: "",
            lastName: "",
            phone: "",
            departure: "",
            arrival: "",
            date: "",
            time: "",
            passengers: "",
            notes: "",

            confidence: {
                firstName: "none",
                lastName: "none",
                phone: "none",
                departure: "none",
                arrival: "none",
                date: "none",
                time: "none",
                passengers: "none",
                notes: "none"
            },

            source: ""
        };
    }


    /* =====================================================
       PARSER DA MESSAGGI WHATSAPP
       ===================================================== */

    function parseWhatsAppMessage(message) {
        return parseRideText(
            message
        );
    }


    /* =====================================================
       PARSER DA TESTO VOCALE
       ===================================================== */

    function parseVoiceText(transcript) {
        return parseRideText(
            transcript
        );
    }


    /* =====================================================
       MERGE INTELLIGENTE
       ===================================================== */

    function mergeParsedData(
        currentData,
        parsedData
    ) {
        const current =
            currentData || {};

        const parsed =
            parsedData || {};

        const fields = [
            "firstName",
            "lastName",
            "phone",
            "departure",
            "arrival",
            "date",
            "time",
            "passengers",
            "notes"
        ];

        const result = {
            ...current
        };

        for (const field of fields) {
            const value =
                cleanText(
                    parsed[field]
                );

            if (!value) {
                continue;
            }

            /*
             * Non sovrascriviamo un dato già
             * presente con un valore poco affidabile.
             */
            const confidence =
                parsed.confidence?.[
                    field
                ];

            if (
                result[field] &&
                confidence === "low"
            ) {
                continue;
            }

            result[field] =
                value;
        }

        return result;
    }


    /* =====================================================
       ANALISI RAPIDA
       ===================================================== */

    function analyze(text) {
        const result =
            parseRideText(text);

        const detectedFields =
            Object.keys(
                result.confidence
            ).filter(field => {
                return (
                    result.confidence[field] !==
                    "none"
                );
            });

        return {
            ...result,
            detectedFields,
            hasUsefulData:
                detectedFields.length > 0
        };
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.CTLParser = Object.freeze({
        parseRideText,
        parseWhatsAppMessage,
        parseVoiceText,
        mergeParsedData,
        analyze,

        parseDateFromText,
        parseTimeFromText,
        parsePassengersFromText,
        parseNameFromText,
        parseAddressesFromText,
        parseNotesFromText,

        findPhone,

        createEmptyResult
    });

})(window);
