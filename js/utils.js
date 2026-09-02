/*
 * =========================================================
 * CTL MANAGER
 * Utility Functions
 * =========================================================
 */

(function (window) {
    "use strict";


    /* =====================================================
       STRINGHE
       ===================================================== */

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


    function capitalize(value) {
        const text = cleanText(value);

        if (!text) {
            return "";
        }

        return (
            text.charAt(0).toUpperCase() +
            text.slice(1)
        );
    }


    function capitalizeWords(value) {
        const text = cleanText(value);

        if (!text) {
            return "";
        }

        return text
            .split(" ")
            .map(word => {
                if (!word) {
                    return "";
                }

                return (
                    word.charAt(0).toUpperCase() +
                    word.slice(1).toLowerCase()
                );
            })
            .join(" ");
    }


    /* =====================================================
       HTML SECURITY
       ===================================================== */

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       DATE
       ===================================================== */

    function parseDate(dateString) {
        if (!dateString) {
            return null;
        }

        const parts =
            String(dateString).split("-");

        if (parts.length !== 3) {
            return null;
        }

        const year = Number(parts[0]);
        const month = Number(parts[1]);
        const day = Number(parts[2]);

        if (
            !Number.isInteger(year) ||
            !Number.isInteger(month) ||
            !Number.isInteger(day)
        ) {
            return null;
        }

        const date =
            new Date(
                year,
                month - 1,
                day
            );

        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            return null;
        }

        return date;
    }


    function formatDate(
        dateString,
        options = {}
    ) {
        const date =
            parseDate(dateString);

        if (!date) {
            return "";
        }

        const defaultOptions = {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        };

        return new Intl.DateTimeFormat(
            "it-IT",
            {
                ...defaultOptions,
                ...options
            }
        ).format(date);
    }


    function formatLongDate(dateString) {
        return formatDate(
            dateString,
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }


    function formatShortDate(dateString) {
        return formatDate(
            dateString,
            {
                day: "numeric",
                month: "short"
            }
        );
    }


    function getDayName(dateString) {
        return formatDate(
            dateString,
            {
                weekday: "long"
            }
        );
    }


    function getMonthName(
        month,
        locale = "it-IT"
    ) {
        const monthNumber =
            Number(month);

        if (
            !Number.isInteger(monthNumber) ||
            monthNumber < 1 ||
            monthNumber > 12
        ) {
            return "";
        }

        const date =
            new Date(
                2000,
                monthNumber - 1,
                1
            );

        return new Intl.DateTimeFormat(
            locale,
            {
                month: "long"
            }
        ).format(date);
    }


    function getTodayDateString() {
        const now = new Date();

        return [
            now.getFullYear(),
            String(
                now.getMonth() + 1
            ).padStart(2, "0"),
            String(
                now.getDate()
            ).padStart(2, "0")
        ].join("-");
    }


    function isToday(dateString) {
        return (
            dateString ===
            getTodayDateString()
        );
    }


    function isSameDate(
        firstDate,
        secondDate
    ) {
        return (
            cleanText(firstDate) ===
            cleanText(secondDate)
        );
    }


    /* =====================================================
       ORARI
       ===================================================== */

    function normalizeTime(time) {
        if (!time) {
            return "";
        }

        const value =
            cleanText(time);

        /*
         * Formato HH:MM
         */
        const standard =
            value.match(
                /^(\d{1,2})[:.](\d{1,2})$/
            );

        if (standard) {
            const hours =
                Number(standard[1]);

            const minutes =
                Number(standard[2]);

            if (
                hours >= 0 &&
                hours <= 23 &&
                minutes >= 0 &&
                minutes <= 59
            ) {
                return (
                    String(hours)
                        .padStart(2, "0") +
                    ":" +
                    String(minutes)
                        .padStart(2, "0")
                );
            }
        }

        /*
         * Formato HH
         */
        const onlyHours =
            value.match(
                /^(\d{1,2})$/
            );

        if (onlyHours) {
            const hours =
                Number(onlyHours[1]);

            if (
                hours >= 0 &&
                hours <= 23
            ) {
                return (
                    String(hours)
                        .padStart(2, "0") +
                    ":00"
                );
            }
        }

        return "";
    }


    function formatTime(time) {
        const normalized =
            normalizeTime(time);

        return normalized || "--:--";
    }


    function timeToMinutes(time) {
        const normalized =
            normalizeTime(time);

        if (!normalized) {
            return null;
        }

        const parts =
            normalized.split(":");

        return (
            Number(parts[0]) * 60 +
            Number(parts[1])
        );
    }


    function compareTimes(
        firstTime,
        secondTime
    ) {
        const first =
            timeToMinutes(firstTime);

        const second =
            timeToMinutes(secondTime);

        if (first === null && second === null) {
            return 0;
        }

        if (first === null) {
            return 1;
        }

        if (second === null) {
            return -1;
        }

        return first - second;
    }


    /* =====================================================
       TELEFONO
       ===================================================== */

    function formatPhone(phone) {
        const value =
            cleanText(phone);

        if (!value) {
            return "";
        }

        /*
         * Manteniamo il numero leggibile
         * senza modificarne il valore.
         */
        return value;
    }


    function getTelLink(phone) {
        if (!phone) {
            return "";
        }

        const normalized =
            String(phone)
                .replace(/[^\d+]/g, "");

        if (!normalized) {
            return "";
        }

        return `tel:${normalized}`;
    }


    /* =====================================================
       SALUTO
       ===================================================== */

    function getGreeting(
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


    /* =====================================================
       PLURALE
       ===================================================== */

    function pluralize(
        count,
        singular,
        plural
    ) {
        return Number(count) === 1
            ? singular
            : plural;
    }


    /* =====================================================
       CORSE
       ===================================================== */

    function getRideLabel(count) {
        return pluralize(
            count,
            "corsa",
            "corse"
        );
    }


    function getPassengerLabel(count) {
        return pluralize(
            count,
            "passeggero",
            "passeggeri"
        );
    }


    /* =====================================================
       NOME CLIENTE
       ===================================================== */

    function getFullName(
        firstName,
        lastName
    ) {
        return [
            cleanText(firstName),
            cleanText(lastName)
        ]
            .filter(Boolean)
            .join(" ");
    }


    function getInitials(
        firstName,
        lastName
    ) {
        const first =
            cleanText(firstName);

        const last =
            cleanText(lastName);

        const initials = [];

        if (first) {
            initials.push(
                first.charAt(0)
            );
        }

        if (last) {
            initials.push(
                last.charAt(0)
            );
        }

        if (!initials.length) {
            return "?";
        }

        return initials
            .join("")
            .toUpperCase();
    }


    /* =====================================================
       INDIRIZZI
       ===================================================== */

    function shortenAddress(
        address,
        maxLength = 45
    ) {
        const text =
            cleanText(address);

        if (
            text.length <= maxLength
        ) {
            return text;
        }

        return (
            text.slice(
                0,
                Math.max(
                    0,
                    maxLength - 3
                )
            ).trim() +
            "..."
        );
    }


    /* =====================================================
       DEBOUNCE
       ===================================================== */

    function debounce(
        callback,
        delay = 250
    ) {
        let timer = null;

        return function (...args) {
            clearTimeout(timer);

            timer = setTimeout(
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


    /* =====================================================
       THROTTLE
       ===================================================== */

    function throttle(
        callback,
        delay = 200
    ) {
        let lastExecution = 0;

        return function (...args) {
            const now =
                Date.now();

            if (
                now - lastExecution >=
                delay
            ) {
                lastExecution = now;

                callback.apply(
                    this,
                    args
                );
            }
        };
    }


    /* =====================================================
       DOM
       ===================================================== */

    function $(selector, parent = document) {
        return parent.querySelector(
            selector
        );
    }


    function $$(selector, parent = document) {
        return Array.from(
            parent.querySelectorAll(
                selector
            )
        );
    }


    function createElement(
        tag,
        options = {}
    ) {
        const element =
            document.createElement(tag);

        if (options.className) {
            element.className =
                options.className;
        }

        if (options.id) {
            element.id =
                options.id;
        }

        if (
            options.text !== undefined
        ) {
            element.textContent =
                options.text;
        }

        if (options.html !== undefined) {
            element.innerHTML =
                options.html;
        }

        if (options.attributes) {
            Object.entries(
                options.attributes
            ).forEach(
                ([name, value]) => {
                    element.setAttribute(
                        name,
                        value
                    );
                }
            );
        }

        return element;
    }


    /* =====================================================
       STORAGE EVENT
       ===================================================== */

    function onStorageChange(
        callback
    ) {
        if (
            typeof callback !==
            "function"
        ) {
            return () => {};
        }

        const handler = event => {
            callback(event);
        };

        window.addEventListener(
            "storage",
            handler
        );

        return () => {
            window.removeEventListener(
                "storage",
                handler
            );
        };
    }


    /* =====================================================
       CLIPBOARD
       ===================================================== */

    async function copyToClipboard(text) {
        const value =
            String(text ?? "");

        if (!value) {
            return false;
        }

        try {
            await navigator.clipboard.writeText(
                value
            );

            return true;
        } catch {
            /*
             * Fallback per browser che non
             * consentono navigator.clipboard.
             */
            try {
                const textarea =
                    document.createElement(
                        "textarea"
                    );

                textarea.value =
                    value;

                textarea.style.position =
                    "fixed";

                textarea.style.opacity =
                    "0";

                document.body.appendChild(
                    textarea
                );

                textarea.focus();
                textarea.select();

                const success =
                    document.execCommand(
                        "copy"
                    );

                textarea.remove();

                return success;
            } catch {
                return false;
            }
        }
    }


    /* =====================================================
       FILE DOWNLOAD
       ===================================================== */

    function downloadFile(
        content,
        filename,
        type = "application/json"
    ) {
        const blob =
            new Blob(
                [content],
                { type }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement(
                "a"
            );

        link.href = url;
        link.download =
            filename;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        setTimeout(
            () => {
                URL.revokeObjectURL(
                    url
                );
            },
            1000
        );
    }


    /* =====================================================
       EXPORT JSON
       ===================================================== */

    function downloadJSON(
        data,
        filename = "ctl-manager-backup.json"
    ) {
        const json =
            JSON.stringify(
                data,
                null,
                2
            );

        downloadFile(
            json,
            filename,
            "application/json"
        );
    }


    /* =====================================================
       ARRAY HELPERS
       ===================================================== */

    function uniqueBy(
        array,
        keyFunction
    ) {
        const seen =
            new Set();

        return array.filter(item => {
            const key =
                keyFunction(item);

            if (seen.has(key)) {
                return false;
            }

            seen.add(key);

            return true;
        });
    }


    /* =====================================================
       SAFE NUMBER
       ===================================================== */

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


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.CTLUtils = Object.freeze({
        cleanText,
        capitalize,
        capitalizeWords,
        escapeHTML,

        parseDate,
        formatDate,
        formatLongDate,
        formatShortDate,
        getDayName,
        getMonthName,
        getTodayDateString,
        isToday,
        isSameDate,

        normalizeTime,
        formatTime,
        timeToMinutes,
        compareTimes,

        formatPhone,
        getTelLink,

        getGreeting,

        pluralize,
        getRideLabel,
        getPassengerLabel,

        getFullName,
        getInitials,

        shortenAddress,

        debounce,
        throttle,

        $,
        $$,
        createElement,

        onStorageChange,

        copyToClipboard,

        downloadFile,
        downloadJSON,

        uniqueBy,
        safeNumber
    });

})(window);
