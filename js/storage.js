```javascript
/*
    ============================================================
    CTL MANAGER
    storage.js

    Gestione di tutti i dati salvati localmente.

    Nessun server.
    Nessuna API.
    Nessun database esterno.

    Tutti i dati vengono salvati nel localStorage del browser.
    ============================================================
*/


"use strict";


/* ============================================================
   CONFIGURAZIONE
   ============================================================ */

const CTL_STORAGE_KEY = "ctl_manager_data";

const CTL_STORAGE_VERSION = 1;


/* ============================================================
   STRUTTURA DATI PREDEFINITA
   ============================================================ */

function createDefaultStorageData() {

    return {

        version: CTL_STORAGE_VERSION,

        driver: {
            name: ""
        },

        onboarding: {
            loginCompleted: false,
            welcomeCompleted: false
        },

        settings: {
            theme: "system"
        },

        bookings: [],

        blacklist: []

    };
}


/* ============================================================
   LETTURA DATI
   ============================================================ */

function getStorageData() {

    try {

        const rawData = localStorage.getItem(
            CTL_STORAGE_KEY
        );

        if (!rawData) {

            const defaultData =
                createDefaultStorageData();

            saveStorageData(defaultData);

            return defaultData;
        }


        const parsedData = JSON.parse(rawData);


        if (
            !parsedData ||
            typeof parsedData !== "object"
        ) {

            const defaultData =
                createDefaultStorageData();

            saveStorageData(defaultData);

            return defaultData;
        }


        return normalizeStorageData(parsedData);

    } catch (error) {

        console.error(
            "CTL Manager - Errore lettura dati:",
            error
        );

        return createDefaultStorageData();
    }
}


/* ============================================================
   NORMALIZZAZIONE DATI
   ============================================================ */

function normalizeStorageData(data) {

    const defaultData =
        createDefaultStorageData();


    return {

        version:
            data.version ||
            defaultData.version,


        driver: {

            name:
                typeof data.driver?.name === "string"
                    ? data.driver.name
                    : ""

        },


        onboarding: {

            loginCompleted:
                Boolean(
                    data.onboarding?.loginCompleted
                ),

            welcomeCompleted:
                Boolean(
                    data.onboarding?.welcomeCompleted
                )

        },


        settings: {

            theme:
                isValidTheme(
                    data.settings?.theme
                )
                    ? data.settings.theme
                    : "system"

        },


        bookings:
            Array.isArray(data.bookings)
                ? data.bookings
                : [],


        blacklist:
            Array.isArray(data.blacklist)
                ? data.blacklist
                : []

    };
}


/* ============================================================
   SALVATAGGIO DATI
   ============================================================ */

function saveStorageData(data) {

    try {

        localStorage.setItem(
            CTL_STORAGE_KEY,
            JSON.stringify(data)
        );

        return true;

    } catch (error) {

        console.error(
            "CTL Manager - Errore salvataggio dati:",
            error
        );

        return false;
    }
}


/* ============================================================
   AGGIORNAMENTO PARZIALE
   ============================================================ */

function updateStorageData(updates) {

    const currentData =
        getStorageData();


    const newData = {

        ...currentData,

        ...updates

    };


    return saveStorageData(newData);
}


/* ============================================================
   DRIVER
   ============================================================ */

function getDriverName() {

    const data =
        getStorageData();

    return data.driver.name;
}


function setDriverName(name) {

    const data =
        getStorageData();


    data.driver.name =
        String(name || "").trim();


    data.onboarding.loginCompleted =
        data.driver.name.length > 0;


    return saveStorageData(data);
}


/* ============================================================
   ONBOARDING
   ============================================================ */

function isLoginCompleted() {

    const data =
        getStorageData();

    return data.onboarding.loginCompleted;
}


function isWelcomeCompleted() {

    const data =
        getStorageData();

    return data.onboarding.welcomeCompleted;
}


function completeWelcome() {

    const data =
        getStorageData();


    data.onboarding.welcomeCompleted =
        true;


    return saveStorageData(data);
}


/* ============================================================
   TEMA
   ============================================================ */

function isValidTheme(theme) {

    return [
        "light",
        "dark",
        "system"
    ].includes(theme);

}


function getTheme() {

    const data =
        getStorageData();

    return data.settings.theme;
}


function setTheme(theme) {

    if (!isValidTheme(theme)) {

        return false;
    }


    const data =
        getStorageData();


    data.settings.theme =
        theme;


    return saveStorageData(data);
}


/* ============================================================
   PRENOTAZIONI
   ============================================================ */

function getBookings() {

    const data =
        getStorageData();

    return [...data.bookings];
}


function getBookingById(id) {

    const bookings =
        getBookings();


    return bookings.find(
        booking =>
            String(booking.id) === String(id)
    ) || null;
}


function addBooking(booking) {

    const data =
        getStorageData();


    const newBooking = {

        ...booking,

        id:
            booking.id ||
            generateBookingId(),

        createdAt:
            booking.createdAt ||
            new Date().toISOString()

    };


    data.bookings.push(
        newBooking
    );


    return saveStorageData(data)
        ? newBooking
        : null;
}


function updateBooking(id, updates) {

    const data =
        getStorageData();


    const index =
        data.bookings.findIndex(
            booking =>
                String(booking.id) === String(id)
        );


    if (index === -1) {

        return false;
    }


    data.bookings[index] = {

        ...data.bookings[index],

        ...updates,

        updatedAt:
            new Date().toISOString()

    };


    return saveStorageData(data);
}


function deleteBooking(id) {

    const data =
        getStorageData();


    const initialLength =
        data.bookings.length;


    data.bookings =
        data.bookings.filter(
            booking =>
                String(booking.id) !== String(id)
        );


    if (
        data.bookings.length ===
        initialLength
    ) {

        return false;
    }


    return saveStorageData(data);
}


function deleteAllBookings() {

    const data =
        getStorageData();


    data.bookings = [];


    return saveStorageData(data);
}


/* ============================================================
   BLACKLIST
   ============================================================ */

function getBlacklist() {

    const data =
        getStorageData();

    return [...data.blacklist];
}


function getBlacklistEntryById(id) {

    const blacklist =
        getBlacklist();


    return blacklist.find(
        entry =>
            String(entry.id) === String(id)
    ) || null;
}


function addBlacklistEntry(entry) {

    const data =
        getStorageData();


    const newEntry = {

        ...entry,

        id:
            entry.id ||
            generateBlacklistId(),

        createdAt:
            entry.createdAt ||
            new Date().toISOString()

    };


    data.blacklist.push(
        newEntry
    );


    return saveStorageData(data)
        ? newEntry
        : null;
}


function updateBlacklistEntry(id, updates) {

    const data =
        getStorageData();


    const index =
        data.blacklist.findIndex(
            entry =>
                String(entry.id) === String(id)
        );


    if (index === -1) {

        return false;
    }


    data.blacklist[index] = {

        ...data.blacklist[index],

        ...updates,

        updatedAt:
            new Date().toISOString()

    };


    return saveStorageData(data);
}


function deleteBlacklistEntry(id) {

    const data =
        getStorageData();


    const initialLength =
        data.blacklist.length;


    data.blacklist =
        data.blacklist.filter(
            entry =>
                String(entry.id) !== String(id)
        );


    if (
        data.blacklist.length ===
        initialLength
    ) {

        return false;
    }


    return saveStorageData(data);
}


/* ============================================================
   IMPORT / EXPORT
   ============================================================ */

function exportStorageData() {

    const data =
        getStorageData();


    return JSON.stringify(
        data,
        null,
        4
    );
}


function importStorageData(jsonString) {

    try {

        const importedData =
            JSON.parse(jsonString);


        if (
            !importedData ||
            typeof importedData !== "object"
        ) {

            throw new Error(
                "Formato dati non valido."
            );
        }


        const normalizedData =
            normalizeStorageData(
                importedData
            );


        return saveStorageData(
            normalizedData
        );

    } catch (error) {

        console.error(
            "CTL Manager - Errore importazione:",
            error
        );

        return false;
    }
}


/* ============================================================
   RESET COMPLETO
   ============================================================ */

function resetApplicationData() {

    try {

        localStorage.removeItem(
            CTL_STORAGE_KEY
        );

        return true;

    } catch (error) {

        console.error(
            "CTL Manager - Errore reset:",
            error
        );

        return false;
    }
}


/* ============================================================
   ID PRENOTAZIONE
   ============================================================ */

function generateBookingId() {

    return (
        "booking-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );
}


/* ============================================================
   ID BLACKLIST
   ============================================================ */

function generateBlacklistId() {

    return (
        "blacklist-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );
}
```
