/*
 * =========================================================
 * CTL MANAGER
 * Storage & Data Layer
 * =========================================================
 *
 * Gestisce:
 * - Profilo autista
 * - Prenotazioni
 * - Blacklist
 * - Impostazioni
 * - Tema
 * - Import / Export
 * - Migrazione e normalizzazione dei dati
 *
 * Tutti i dati vengono salvati esclusivamente in localStorage.
 * =========================================================
 */

(function (window) {
    "use strict";

    const STORAGE_KEYS = Object.freeze({
        PROFILE: "ctl_manager_profile",
        RIDES: "ctl_manager_rides",
        BLACKLIST: "ctl_manager_blacklist",
        SETTINGS: "ctl_manager_settings",
        VERSION: "ctl_manager_data_version"
    });

    const DATA_VERSION = 1;

    const DEFAULT_PROFILE = Object.freeze({
        driverName: ""
    });

    const DEFAULT_SETTINGS = Object.freeze({
        theme: "system"
    });


    /* =====================================================
       GENERIC STORAGE HELPERS
       ===================================================== */

    function readJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);

            if (!raw) {
                return fallback;
            }

            const parsed = JSON.parse(raw);

            return parsed ?? fallback;
        } catch (error) {
            console.error(
                `CTL Manager: impossibile leggere "${key}".`,
                error
            );

            return fallback;
        }
    }


    function writeJSON(key, value) {
        try {
            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;
        } catch (error) {
            console.error(
                `CTL Manager: impossibile salvare "${key}".`,
                error
            );

            return false;
        }
    }


    function removeKey(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(
                `CTL Manager: impossibile eliminare "${key}".`,
                error
            );

            return false;
        }
    }


    function clone(value) {
        try {
            return JSON.parse(
                JSON.stringify(value)
            );
        } catch {
            return value;
        }
    }


    /* =====================================================
       ID GENERATOR
       ===================================================== */

    function generateId(prefix) {
        const safePrefix =
            typeof prefix === "string" && prefix.trim()
                ? prefix.trim()
                : "ctl";

        const timestamp = Date.now();

        const randomPart = Math.random()
            .toString(36)
            .slice(2, 10);

        return `${safePrefix}_${timestamp}_${randomPart}`;
    }


    /* =====================================================
       DATE HELPERS
       ===================================================== */

    function padNumber(value) {
        return String(value).padStart(2, "0");
    }


    function getTodayKey(date = new Date()) {
        return [
            date.getFullYear(),
            padNumber(date.getMonth() + 1),
            padNumber(date.getDate())
        ].join("-");
    }


    function getDateTimeValue(dateString, timeString) {
        if (!dateString) {
            return null;
        }

        const time =
            typeof timeString === "string" && timeString.trim()
                ? timeString.trim()
                : "00:00";

        const date = new Date(
            `${dateString}T${time}:00`
        );

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return date;
    }


    /* =====================================================
       PHONE NORMALIZATION
       ===================================================== */

    function normalizePhone(phone) {
        if (
            phone === null ||
            phone === undefined
        ) {
            return "";
        }

        let normalized = String(phone)
            .trim()
            .replace(/[^\d+]/g, "");

        if (!normalized) {
            return "";
        }

        /*
         * Rimuove eventuali + multipli o caratteri
         * non validi all'interno del numero.
         */
        if (normalized.startsWith("+")) {
            normalized =
                "+" +
                normalized
                    .slice(1)
                    .replace(/\+/g, "");
        } else {
            normalized =
                normalized.replace(/\+/g, "");
        }

        /*
         * Normalizzazione italiana:
         *
         * +39 3331234567
         * 39 3331234567
         * 3331234567
         *
         * vengono ricondotti allo stesso valore.
         */
        if (normalized.startsWith("+39")) {
            normalized = normalized.slice(3);
        } else if (
            normalized.startsWith("39") &&
            normalized.length >= 12
        ) {
            normalized = normalized.slice(2);
        }

        /*
         * Rimuove eventuali zeri iniziali rimasti
         * soltanto quando non fanno parte di un
         * numero telefonico plausibile.
         */
        normalized = normalized.replace(/^00+/, "");

        return normalized;
    }


    function phonesMatch(firstPhone, secondPhone) {
        const first = normalizePhone(firstPhone);
        const second = normalizePhone(secondPhone);

        if (!first || !second) {
            return false;
        }

        return first === second;
    }


    /* =====================================================
       PROFILE
       ===================================================== */

    function sanitizeProfile(profile) {
        if (
            !profile ||
            typeof profile !== "object"
        ) {
            return clone(DEFAULT_PROFILE);
        }

        return {
            driverName:
                typeof profile.driverName === "string"
                    ? profile.driverName.trim()
                    : ""
        };
    }


    function getProfile() {
        return sanitizeProfile(
            readJSON(
                STORAGE_KEYS.PROFILE,
                DEFAULT_PROFILE
            )
        );
    }


    function saveProfile(profile) {
        const sanitized =
            sanitizeProfile(profile);

        return writeJSON(
            STORAGE_KEYS.PROFILE,
            sanitized
        );
    }


    function hasCompletedLogin() {
        const profile = getProfile();

        return Boolean(
            profile.driverName.trim()
        );
    }


    function clearProfile() {
        return removeKey(
            STORAGE_KEYS.PROFILE
        );
    }


    /* =====================================================
       RIDE NORMALIZATION
       ===================================================== */

    function sanitizeRide(ride) {
        if (
            !ride ||
            typeof ride !== "object"
        ) {
            return null;
        }

        const normalized = {
            id:
                typeof ride.id === "string" &&
                ride.id.trim()
                    ? ride.id.trim()
                    : generateId("ride"),

            firstName:
                typeof ride.firstName === "string"
                    ? ride.firstName.trim()
                    : "",

            lastName:
                typeof ride.lastName === "string"
                    ? ride.lastName.trim()
                    : "",

            phone:
                normalizePhone(ride.phone),

            phoneDisplay:
                typeof ride.phoneDisplay === "string"
                    ? ride.phoneDisplay.trim()
                    : "",

            departure:
                typeof ride.departure === "string"
                    ? ride.departure.trim()
                    : "",

            arrival:
                typeof ride.arrival === "string"
                    ? ride.arrival.trim()
                    : "",

            date:
                typeof ride.date === "string"
                    ? ride.date.trim()
                    : "",

            time:
                typeof ride.time === "string"
                    ? ride.time.trim()
                    : "",

            passengers:
                Number.isFinite(
                    Number(ride.passengers)
                )
                    ? Math.max(
                        0,
                        Math.floor(
                            Number(ride.passengers)
                        )
                    )
                    : 0,

            notes:
                typeof ride.notes === "string"
                    ? ride.notes.trim()
                    : "",

            createdAt:
                typeof ride.createdAt === "string"
                    ? ride.createdAt
                    : new Date().toISOString(),

            updatedAt:
                typeof ride.updatedAt === "string"
                    ? ride.updatedAt
                    : new Date().toISOString()
        };

        return normalized;
    }


    function getRides() {
        const stored =
            readJSON(
                STORAGE_KEYS.RIDES,
                []
            );

        if (!Array.isArray(stored)) {
            return [];
        }

        return stored
            .map(sanitizeRide)
            .filter(Boolean);
    }


    function saveRides(rides) {
        if (!Array.isArray(rides)) {
            return false;
        }

        const sanitized = rides
            .map(sanitizeRide)
            .filter(Boolean);

        return writeJSON(
            STORAGE_KEYS.RIDES,
            sanitized
        );
    }


    function getRideById(id) {
        if (!id) {
            return null;
        }

        const rides = getRides();

        return (
            rides.find(
                ride => ride.id === id
            ) || null
        );
    }


    function createRide(data = {}) {
        const now =
            new Date().toISOString();

        return sanitizeRide({
            ...data,
            id: generateId("ride"),
            createdAt: now,
            updatedAt: now
        });
    }


    function addRide(data = {}) {
        const ride =
            createRide(data);

        if (!ride) {
            return null;
        }

        const rides =
            getRides();

        rides.push(ride);

        const saved =
            saveRides(rides);

        if (!saved) {
            return null;
        }

        return ride;
    }


    function updateRide(id, changes = {}) {
        if (!id) {
            return null;
        }

        const rides =
            getRides();

        const index =
            rides.findIndex(
                ride => ride.id === id
            );

        if (index === -1) {
            return null;
        }

        const updated =
            sanitizeRide({
                ...rides[index],
                ...changes,
                id,
                updatedAt:
                    new Date().toISOString()
            });

        rides[index] = updated;

        if (!saveRides(rides)) {
            return null;
        }

        return updated;
    }


    function deleteRide(id) {
        if (!id) {
            return false;
        }

        const rides =
            getRides();

        const filtered =
            rides.filter(
                ride => ride.id !== id
            );

        if (
            filtered.length ===
            rides.length
        ) {
            return false;
        }

        return saveRides(filtered);
    }


    function clearRides() {
        return saveRides([]);
    }


    /* =====================================================
       RIDE DATE / SORTING
       ===================================================== */

    function getRideDateTime(ride) {
        if (!ride) {
            return null;
        }

        return getDateTimeValue(
            ride.date,
            ride.time
        );
    }


    function compareRides(first, second) {
        const firstDate =
            getRideDateTime(first);

        const secondDate =
            getRideDateTime(second);

        if (
            firstDate &&
            secondDate
        ) {
            return (
                firstDate.getTime() -
                secondDate.getTime()
            );
        }

        if (firstDate) {
            return -1;
        }

        if (secondDate) {
            return 1;
        }

        return (
            String(first.id)
                .localeCompare(
                    String(second.id)
                )
        );
    }


    function getSortedRides(rides = getRides()) {
        return [...rides]
            .sort(compareRides);
    }


    function getRidesForDate(dateKey) {
        if (!dateKey) {
            return [];
        }

        return getSortedRides(
            getRides().filter(
                ride =>
                    ride.date === dateKey
            )
        );
    }


    function getTodayRides() {
        return getRidesForDate(
            getTodayKey()
        );
    }


    /* =====================================================
       RIDE COUNTERS
       ===================================================== */

    function getRidesCountForDate(
        dateKey
    ) {
        return getRidesForDate(
            dateKey
        ).length;
    }


    function getRidesCountForMonth(
        year,
        month
    ) {
        const targetYear =
            Number(year);

        const targetMonth =
            Number(month);

        if (
            !Number.isInteger(targetYear) ||
            !Number.isInteger(targetMonth)
        ) {
            return 0;
        }

        return getRides()
            .filter(ride => {
                if (!ride.date) {
                    return false;
                }

                const parts =
                    ride.date.split("-");

                if (parts.length !== 3) {
                    return false;
                }

                return (
                    Number(parts[0]) ===
                        targetYear &&
                    Number(parts[1]) ===
                        targetMonth
                );
            })
            .length;
    }


    function getRidesCountForYear(
        year
    ) {
        const targetYear =
            Number(year);

        if (
            !Number.isInteger(targetYear)
        ) {
            return 0;
        }

        return getRides()
            .filter(ride => {
                if (!ride.date) {
                    return false;
                }

                return (
                    Number(
                        ride.date.slice(0, 4)
                    ) === targetYear
                );
            })
            .length;
    }


    function getTodayCount() {
        return getRidesCountForDate(
            getTodayKey()
        );
    }


    function getCurrentMonthCount() {
        const now = new Date();

        return getRidesCountForMonth(
            now.getFullYear(),
            now.getMonth() + 1
        );
    }


    function getCurrentYearCount() {
        return getRidesCountForYear(
            new Date().getFullYear()
        );
    }


    /* =====================================================
       NEXT RIDE
       ===================================================== */

    function getNextRide() {
        const now =
            new Date();

        const rides =
            getSortedRides();

        for (const ride of rides) {
            const rideDate =
                getRideDateTime(ride);

            if (!rideDate) {
                continue;
            }

            if (
                rideDate.getTime() >=
                now.getTime()
            ) {
                return ride;
            }
        }

        return null;
    }


    /* =====================================================
       BLACKLIST NORMALIZATION
       ===================================================== */

    function sanitizeBlacklistEntry(entry) {
        if (
            !entry ||
            typeof entry !== "object"
        ) {
            return null;
        }

        return {
            id:
                typeof entry.id === "string" &&
                entry.id.trim()
                    ? entry.id.trim()
                    : generateId("blacklist"),

            firstName:
                typeof entry.firstName === "string"
                    ? entry.firstName.trim()
                    : "",

            lastName:
                typeof entry.lastName === "string"
                    ? entry.lastName.trim()
                    : "",

            phone:
                normalizePhone(entry.phone),

            phoneDisplay:
                typeof entry.phoneDisplay === "string"
                    ? entry.phoneDisplay.trim()
                    : "",

            route:
                typeof entry.route === "string"
                    ? entry.route.trim()
                    : "",

            reason:
                typeof entry.reason === "string"
                    ? entry.reason.trim()
                    : "",

            createdAt:
                typeof entry.createdAt === "string"
                    ? entry.createdAt
                    : new Date().toISOString()
        };
    }


    function getBlacklist() {
        const stored =
            readJSON(
                STORAGE_KEYS.BLACKLIST,
                []
            );

        if (!Array.isArray(stored)) {
            return [];
        }

        return stored
            .map(sanitizeBlacklistEntry)
            .filter(Boolean);
    }


    function saveBlacklist(entries) {
        if (!Array.isArray(entries)) {
            return false;
        }

        const sanitized =
            entries
                .map(
                    sanitizeBlacklistEntry
                )
                .filter(Boolean);

        return writeJSON(
            STORAGE_KEYS.BLACKLIST,
            sanitized
        );
    }


    function addBlacklistEntry(data = {}) {
        const phone =
            normalizePhone(data.phone);

        const reason =
            typeof data.reason === "string"
                ? data.reason.trim()
                : "";

        /*
         * Questi due controlli sono fondamentali:
         * telefono e motivazione sono gli unici
         * campi obbligatori della blacklist.
         */
        if (!phone || !reason) {
            return null;
        }

        const existing =
            findBlacklistByPhone(phone);

        if (existing) {
            return existing;
        }

        const entry =
            sanitizeBlacklistEntry({
                ...data,
                id: generateId("blacklist"),
                phone,
                reason,
                createdAt:
                    new Date().toISOString()
            });

        const blacklist =
            getBlacklist();

        blacklist.push(entry);

        if (!saveBlacklist(blacklist)) {
            return null;
        }

        return entry;
    }


    function deleteBlacklistEntry(id) {
        if (!id) {
            return false;
        }

        const blacklist =
            getBlacklist();

        const filtered =
            blacklist.filter(
                entry =>
                    entry.id !== id
            );

        if (
            filtered.length ===
            blacklist.length
        ) {
            return false;
        }

        return saveBlacklist(
            filtered
        );
    }


    function findBlacklistByPhone(phone) {
        const normalized =
            normalizePhone(phone);

        if (!normalized) {
            return null;
        }

        return (
            getBlacklist().find(
                entry =>
                    phonesMatch(
                        entry.phone,
                        normalized
                    )
            ) || null
        );
    }


    function isPhoneBlacklisted(phone) {
        return Boolean(
            findBlacklistByPhone(phone)
        );
    }


    /* =====================================================
       SETTINGS
       ===================================================== */

    function sanitizeSettings(settings) {
        if (
            !settings ||
            typeof settings !== "object"
        ) {
            return clone(
                DEFAULT_SETTINGS
            );
        }

        const validThemes = [
            "light",
            "dark",
            "system"
        ];

        const theme =
            validThemes.includes(
                settings.theme
            )
                ? settings.theme
                : DEFAULT_SETTINGS.theme;

        return {
            theme
        };
    }


    function getSettings() {
        return sanitizeSettings(
            readJSON(
                STORAGE_KEYS.SETTINGS,
                DEFAULT_SETTINGS
            )
        );
    }


    function saveSettings(settings) {
        const sanitized =
            sanitizeSettings(settings);

        return writeJSON(
            STORAGE_KEYS.SETTINGS,
            sanitized
        );
    }


    function getTheme() {
        return getSettings().theme;
    }


    function setTheme(theme) {
        return saveSettings({
            ...getSettings(),
            theme
        });
    }


    /* =====================================================
       DATABASE RESET
       ===================================================== */

    function resetAllData() {
        const keys = [
            STORAGE_KEYS.PROFILE,
            STORAGE_KEYS.RIDES,
            STORAGE_KEYS.BLACKLIST,
            STORAGE_KEYS.SETTINGS,
            STORAGE_KEYS.VERSION
        ];

        let success = true;

        for (const key of keys) {
            if (!removeKey(key)) {
                success = false;
            }
        }

        return success;
    }


    /* =====================================================
       EXPORT
       ===================================================== */

    function exportData() {
        return {
            app: "CTL Manager",

            version: DATA_VERSION,

            exportedAt:
                new Date().toISOString(),

            profile:
                getProfile(),

            rides:
                getRides(),

            blacklist:
                getBlacklist(),

            settings:
                getSettings()
        };
    }


    /* =====================================================
       IMPORT
       ===================================================== */

    function validateImportedData(data) {
        if (
            !data ||
            typeof data !== "object"
        ) {
            return {
                valid: false,
                reason:
                    "Il file non contiene dati validi."
            };
        }

        if (
            data.app &&
            data.app !== "CTL Manager"
        ) {
            return {
                valid: false,
                reason:
                    "Il file non appartiene a CTL Manager."
            };
        }

        if (
            data.rides !== undefined &&
            !Array.isArray(data.rides)
        ) {
            return {
                valid: false,
                reason:
                    "La sezione prenotazioni non è valida."
            };
        }

        if (
            data.blacklist !== undefined &&
            !Array.isArray(data.blacklist)
        ) {
            return {
                valid: false,
                reason:
                    "La sezione blacklist non è valida."
            };
        }

        if (
            data.profile !== undefined &&
            (
                !data.profile ||
                typeof data.profile !== "object"
            )
        ) {
            return {
                valid: false,
                reason:
                    "La sezione profilo non è valida."
            };
        }

        return {
            valid: true,
            reason: ""
        };
    }


    function importData(data) {
        const validation =
            validateImportedData(data);

        if (!validation.valid) {
            return {
                success: false,
                imported: {
                    profile: 0,
                    rides: 0,
                    blacklist: 0,
                    settings: 0
                },
                reason: validation.reason
            };
        }

        let importedProfile = 0;
        let importedRides = 0;
        let importedBlacklist = 0;
        let importedSettings = 0;

        /*
         * Il profilo viene sostituito soltanto
         * se realmente presente nel backup.
         */
        if (data.profile) {
            const profile =
                sanitizeProfile(
                    data.profile
                );

            if (
                saveProfile(profile)
            ) {
                importedProfile = 1;
            }
        }

        /*
         * Le prenotazioni vengono importate
         * eliminando eventuali duplicati per ID.
         */
        if (Array.isArray(data.rides)) {
            const existing =
                getRides();

            const imported =
                data.rides
                    .map(sanitizeRide)
                    .filter(Boolean);

            const map =
                new Map();

            existing.forEach(
                ride => {
                    map.set(
                        ride.id,
                        ride
                    );
                }
            );

            imported.forEach(
                ride => {
                    map.set(
                        ride.id,
                        ride
                    );
                }
            );

            if (
                saveRides(
                    Array.from(
                        map.values()
                    )
                )
            ) {
                importedRides =
                    imported.length;
            }
        }

        /*
         * Stessa logica per la blacklist.
         */
        if (
            Array.isArray(
                data.blacklist
            )
        ) {
            const existing =
                getBlacklist();

            const map =
                new Map();

            existing.forEach(
                entry => {
                    map.set(
                        entry.id,
                        entry
                    );
                }
            );

            data.blacklist
                .map(
                    sanitizeBlacklistEntry
                )
                .filter(Boolean)
                .forEach(
                    entry => {
                        map.set(
                            entry.id,
                            entry
                        );
                    }
                );

            if (
                saveBlacklist(
                    Array.from(
                        map.values()
                    )
                )
            ) {
                importedBlacklist =
                    data.blacklist.length;
            }
        }

        if (data.settings) {
            const settings =
                sanitizeSettings(
                    data.settings
                );

            if (
                saveSettings(settings)
            ) {
                importedSettings = 1;
            }
        }

        writeJSON(
            STORAGE_KEYS.VERSION,
            DATA_VERSION
        );

        return {
            success: true,
            imported: {
                profile:
                    importedProfile,

                rides:
                    importedRides,

                blacklist:
                    importedBlacklist,

                settings:
                    importedSettings
            },
            reason: ""
        };
    }


    /* =====================================================
       INITIALIZATION
       ===================================================== */

    function initializeStorage() {
        const currentVersion =
            readJSON(
                STORAGE_KEYS.VERSION,
                0
            );

        /*
         * Qui potremo aggiungere future
         * migrazioni senza perdere i dati
         * quando aggiorneremo CTL Manager.
         */
        if (
            Number(currentVersion) <
            DATA_VERSION
        ) {
            writeJSON(
                STORAGE_KEYS.VERSION,
                DATA_VERSION
            );
        }

        /*
         * Crea le strutture mancanti.
         */
        if (
            localStorage.getItem(
                STORAGE_KEYS.RIDES
            ) === null
        ) {
            saveRides([]);
        }

        if (
            localStorage.getItem(
                STORAGE_KEYS.BLACKLIST
            ) === null
        ) {
            saveBlacklist([]);
        }

        if (
            localStorage.getItem(
                STORAGE_KEYS.SETTINGS
            ) === null
        ) {
            saveSettings(
                DEFAULT_SETTINGS
            );
        }

        if (
            localStorage.getItem(
                STORAGE_KEYS.PROFILE
            ) === null
        ) {
            saveProfile(
                DEFAULT_PROFILE
            );
        }
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.CTLStorage = Object.freeze({
        STORAGE_KEYS,
        DATA_VERSION,

        initializeStorage,

        generateId,

        getTodayKey,
        getDateTimeValue,

        normalizePhone,
        phonesMatch,

        getProfile,
        saveProfile,
        hasCompletedLogin,
        clearProfile,

        getRides,
        saveRides,
        getRideById,
        createRide,
        addRide,
        updateRide,
        deleteRide,
        clearRides,

        getRideDateTime,
        compareRides,
        getSortedRides,
        getRidesForDate,
        getTodayRides,

        getRidesCountForDate,
        getRidesCountForMonth,
        getRidesCountForYear,
        getTodayCount,
        getCurrentMonthCount,
        getCurrentYearCount,

        getNextRide,

        getBlacklist,
        saveBlacklist,
        addBlacklistEntry,
        deleteBlacklistEntry,
        findBlacklistByPhone,
        isPhoneBlacklisted,

        getSettings,
        saveSettings,
        getTheme,
        setTheme,

        resetAllData,

        exportData,
        validateImportedData,
        importData
    });


    /* =====================================================
       STARTUP
       ===================================================== */

    initializeStorage();

})(window);
