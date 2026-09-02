```javascript
/*
    ============================================================
    CTL MANAGER
    app.js

    Controller principale dell'applicazione.

    Gestisce:
    - avvio dell'app
    - routing tra le pagine HTML
    - login / onboarding
    - tema chiaro / scuro / sistema
    - navigazione
    - home
    - prenotazioni
    - calendario
    - aggiunta prenotazione
    - blacklist
    - import / export
    - notifiche
    - modali
    ============================================================
*/

"use strict";


/* ============================================================
   CONFIGURAZIONE
   ============================================================ */

const CTL_PAGES = {

    index: "../index.html",

    login: "login.html",

    welcome: "welcome.html",

    home: "home.html",

    bookings: "prenotazioni.html",

    calendar: "calendario.html",

    addBooking: "aggiungi-prenotazione.html",

    profile: "profilo.html"

};


/* ============================================================
   AVVIO
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);


function initializeApp() {

    /*
        Applica subito il tema.
    */

    applyStoredTheme();


    /*
        Controlla la pagina corrente.
    */

    const page =
        getCurrentPage();


    /*
        index.html serve solamente
        come punto di ingresso.
    */

    if (page === "index") {

        handleIndexPage();

        return;

    }


    /*
        Controlla che l'utente abbia completato
        correttamente l'onboarding.
    */

    handleOnboardingGuard(
        page
    );


    /*
        Inizializza la pagina.
    */

    initializeCurrentPage(
        page
    );

}


/* ============================================================
   PAGINA CORRENTE
   ============================================================ */

function getCurrentPage() {

    const pathname =
        window.location.pathname
            .toLowerCase();


    if (
        pathname.endsWith("/") ||
        pathname.endsWith("index.html")
    ) {

        return "index";

    }


    if (
        pathname.endsWith(
            "/login.html"
        )
    ) {

        return "login";

    }


    if (
        pathname.endsWith(
            "/welcome.html"
        )
    ) {

        return "welcome";

    }


    if (
        pathname.endsWith(
            "/home.html"
        )
    ) {

        return "home";

    }


    if (
        pathname.endsWith(
            "/prenotazioni.html"
        )
    ) {

        return "bookings";

    }


    if (
        pathname.endsWith(
            "/calendario.html"
        )
    ) {

        return "calendar";

    }


    if (
        pathname.endsWith(
            "/aggiungi-prenotazione.html"
        )
    ) {

        return "addBooking";

    }


    if (
        pathname.endsWith(
            "/profilo.html"
        )
    ) {

        return "profile";

    }


    return "unknown";

}


/* ============================================================
   INDEX
   ============================================================ */

function handleIndexPage() {

    const data =
        getStorageData();


    /*
        Primo accesso:
        nessun nome -> login.
    */

    if (
        !data.onboarding.loginCompleted ||
        !data.driver.name
    ) {

        redirectTo(
            "login"
        );

        return;

    }


    /*
        Nome presente ma introduzione
        non ancora completata.
    */

    if (
        !data.onboarding.welcomeCompleted
    ) {

        redirectTo(
            "welcome"
        );

        return;

    }


    /*
        Onboarding completato.
    */

    redirectTo(
        "home"
    );

}


/* ============================================================
   PROTEZIONE ONBOARDING
   ============================================================ */

function handleOnboardingGuard(
    page
) {

    const data =
        getStorageData();


    /*
        Login:
        deve essere accessibile solamente
        se il login non è ancora completato.
    */

    if (page === "login") {

        if (
            data.onboarding.loginCompleted &&
            data.driver.name
        ) {

            if (
                !data.onboarding.welcomeCompleted
            ) {

                redirectTo(
                    "welcome"
                );

            } else {

                redirectTo(
                    "home"
                );

            }

        }

        return;

    }


    /*
        Tutte le altre pagine richiedono
        il nome dell'autista.
    */

    if (
        !data.onboarding.loginCompleted ||
        !data.driver.name
    ) {

        redirectTo(
            "login"
        );

        return;

    }


    /*
        La pagina welcome deve essere
        completata prima di accedere all'app.
    */

    if (
        page !== "welcome" &&
        !data.onboarding.welcomeCompleted
    ) {

        redirectTo(
            "welcome"
        );

    }

}


/* ============================================================
   INIZIALIZZAZIONE PAGINA
   ============================================================ */

function initializeCurrentPage(
    page
) {

    switch (page) {

        case "login":

            initializeLoginPage();

            break;


        case "welcome":

            initializeWelcomePage();

            break;


        case "home":

            initializeHomePage();

            break;


        case "bookings":

            initializeBookingsPage();

            break;


        case "calendar":

            initializeCalendarPage();

            break;


        case "addBooking":

            initializeAddBookingPage();

            break;


        case "profile":

            initializeProfilePage();

            break;

    }


    /*
        La barra di navigazione
        viene inizializzata su tutte
        le pagine dell'app.
    */

    initializeNavigation();

}


/* ============================================================
   LOGIN
   ============================================================ */

function initializeLoginPage() {

    const form =
        getElement(
            "login-form"
        );


    const input =
        getElement(
            "driver-name"
        );


    const error =
        getElement(
            "login-error"
        );


    if (!form) {
        return;
    }


    /*
        Se esiste già un nome,
        lo mostriamo nel campo.
    */

    if (input) {

        const currentName =
            getDriverName();


        if (currentName) {

            input.value =
                currentName;

        }

    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const name =
                cleanText(
                    input?.value
                );


            if (!name) {

                if (error) {

                    error.textContent =
                        "Inserisci il tuo nome per continuare.";

                }


                input?.focus();

                return;

            }


            if (name.length < 2) {

                if (error) {

                    error.textContent =
                        "Il nome deve contenere almeno 2 caratteri.";

                }


                input?.focus();

                return;

            }


            if (error) {

                error.textContent =
                    "";

            }


            const saved =
                setDriverName(
                    name
                );


            if (!saved) {

                if (error) {

                    error.textContent =
                        "Impossibile salvare i dati. Controlla lo spazio disponibile nel browser.";

                }

                return;

            }


            redirectTo(
                "welcome"
            );

        }
    );

}


/* ============================================================
   WELCOME
   ============================================================ */

function initializeWelcomePage() {

    const name =
        getDriverName();


    /*
        Inserisce il nome dell'autista
        se la pagina contiene l'elemento.
    */

    setTextIfExists(
        "welcome-driver-name",
        formatName(name)
    );


    setTextIfExists(
        "driver-name",
        formatName(name)
    );


    /*
        Pulsanti continua.
    */

    const buttons =
        document.querySelectorAll(
            "[data-action='complete-welcome']"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                completeWelcomeAndContinue
            );

        }
    );


    /*
        Supporto anche per un ID standard.
    */

    const continueButton =
        getElement(
            "welcome-continue"
        );


    if (continueButton) {

        continueButton.addEventListener(
            "click",
            completeWelcomeAndContinue
        );

    }

}


function completeWelcomeAndContinue() {

    const saved =
        completeWelcome();


    if (!saved) {

        showToast(
            "Impossibile salvare la configurazione.",
            "error"
        );

        return;

    }


    redirectTo(
        "home"
    );

}


/* ============================================================
   HOME
   ============================================================ */

function initializeHomePage() {

    updateHomeGreeting();

    renderHomeStats();

    renderNextBooking();

    renderTodayBookings();

    initializeHomeButtons();

}


function updateHomeGreeting() {

    const name =
        getDriverName();


    const greeting =
        getPersonalGreeting(
            name
        );


    setTextIfExists(
        "home-greeting",
        greeting
    );


    setTextIfExists(
        "greeting",
        greeting
    );


    setTextIfExists(
        "home-driver-name",
        formatName(name)
    );

}


/* ============================================================
   STATISTICHE HOME
   ============================================================ */

function renderHomeStats() {

    const bookings =
        getBookings();


    const todayBookings =
        getTodayBookings(
            bookings
        );


    setTextIfExists(
        "today-bookings-count",
        String(
            todayBookings.length
        )
    );


    setTextIfExists(
        "home-today-count",
        String(
            todayBookings.length
        )
    );


    setTextIfExists(
        "daily-bookings-count",
        String(
            todayBookings.length
        )
    );

}


/* ============================================================
   PROSSIMA CORSA
   ============================================================ */

function renderNextBooking() {

    const bookings =
        getBookings();


    const now =
        new Date();


    const today =
        getTodayISO();


    const futureBookings =
        bookings
            .filter(
                booking =>
                    booking.date &&
                    booking.date >= today
            )
            .filter(
                booking => {

                    if (
                        booking.date >
                        today
                    ) {

                        return true;

                    }


                    if (!booking.time) {

                        return true;

                    }


                    const minutes =
                        timeToMinutes(
                            booking.time
                        );


                    const currentMinutes =
                        now.getHours() * 60 +
                        now.getMinutes();


                    return (
                        minutes === null ||
                        minutes >= currentMinutes
                    );

                }
            );


    const sorted =
        sortBookings(
            futureBookings
        );


    const nextBooking =
        sorted[0] || null;


    renderBookingCard(
        nextBooking
    );

}


/* ============================================================
   CARD PRENOTAZIONE
   ============================================================ */

function renderBookingCard(
    booking
) {

    const container =
        getElement(
            "next-booking"
        );


    if (!container) {
        return;
    }


    if (!booking) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✓</div>
                <h3>Nessuna corsa imminente</h3>
                <p>
                    Non ci sono altre corse programmate.
                </p>
            </div>
        `;

        return;

    }


    const customerName =
        [
            booking.firstName,
            booking.lastName
        ]
            .filter(Boolean)
            .join(" ");


    const phone =
        booking.phone
            ? formatPhone(
                booking.phone
            )
            : "";


    const callButton =
        phone
            ? `
                <a
                    class="btn btn-secondary"
                    href="tel:${escapeHtml(phone)}"
                >
                    Chiama cliente
                </a>
            `
            : "";


    container.innerHTML = `

        <div class="booking-card-content">

            <div class="booking-card-header">

                <div>

                    <span class="booking-label">
                        PROSSIMA CORSA
                    </span>

                    <h3>
                        ${
                            escapeHtml(
                                customerName ||
                                "Cliente"
                            )
                        }
                    </h3>

                </div>

                <strong class="booking-time">
                    ${
                        escapeHtml(
                            booking.time ||
                            "--:--"
                        )
                    }
                </strong>

            </div>


            <div class="booking-route">

                <div class="route-point">

                    <span class="route-dot"></span>

                    <div>

                        <small>
                            Partenza
                        </small>

                        <strong>
                            ${
                                escapeHtml(
                                    booking.departure ||
                                    "Non specificata"
                                )
                            }
                        </strong>

                    </div>

                </div>


                <div class="route-line"></div>


                <div class="route-point">

                    <span class="route-dot"></span>

                    <div>

                        <small>
                            Destinazione
                        </small>

                        <strong>
                            ${
                                escapeHtml(
                                    booking.destination ||
                                    "Non specificata"
                                )
                            }
                        </strong>

                    </div>

                </div>

            </div>


            <div class="booking-card-footer">

                <span>
                    ${
                        booking.date
                            ? escapeHtml(
                                formatLongDate(
                                    booking.date
                                )
                            )
                            : "Data non specificata"
                    }
                </span>

                ${callButton}

            </div>

        </div>
    `;

}


/* ============================================================
   CORSE DI OGGI
   ============================================================ */

function renderTodayBookings() {

    const container =
        getElement(
            "today-bookings-list"
        );


    if (!container) {
        return;
    }


    const bookings =
        sortBookings(
            getTodayBookings(
                getBookings()
            )
        );


    if (!bookings.length) {

        container.innerHTML = `
            <div class="empty-state compact">
                <h3>Nessuna corsa oggi</h3>
                <p>
                    Puoi aggiungere una nuova prenotazione
                    usando il pulsante +.
                </p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        bookings
            .map(
                booking =>
                    createCompactBookingHTML(
                        booking
                    )
            )
            .join("");

}


function createCompactBookingHTML(
    booking
) {

    const customerName =
        [
            booking.firstName,
            booking.lastName
        ]
            .filter(Boolean)
            .join(" ");


    return `

        <article
            class="compact-booking"
            data-booking-id="${escapeHtml(
                booking.id
            )}"
        >

            <div class="compact-booking-time">

                ${
                    escapeHtml(
                        booking.time ||
                        "--:--"
                    )
                }

            </div>


            <div class="compact-booking-info">

                <strong>
                    ${
                        escapeHtml(
                            customerName ||
                            "Cliente"
                        )
                    }
                </strong>

                <span>
                    ${
                        escapeHtml(
                            booking.departure ||
                            "Partenza non specificata"
                        )
                    }
                </span>

                <span>
                    →
                    ${
                        escapeHtml(
                            booking.destination ||
                            "Destinazione non specificata"
                        )
                    }
                </span>

            </div>

        </article>

    `;

}


/* ============================================================
   PULSANTI HOME
   ============================================================ */

function initializeHomeButtons() {

    const addButtons =
        document.querySelectorAll(
            "[data-action='add-booking']"
        );


    addButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => redirectTo(
                    "addBooking"
                )
            );

        }
    );


    const explicitAddButton =
        getElement(
            "add-booking-button"
        );


    if (explicitAddButton) {

        explicitAddButton.addEventListener(
            "click",
            () => redirectTo(
                "addBooking"
            )
        );

    }

}


/* ============================================================
   PRENOTAZIONI
   ============================================================ */

function initializeBookingsPage() {

    initializeBookingFilters();

    renderBookingsPage();

    initializeBookingPageActions();

}


/**
 * Imposta gli eventi dei filtri.
 */
function initializeBookingFilters() {

    const searchInput =
        getElement(
            "booking-search"
        );


    const dateFilter =
        getElement(
            "booking-date-filter"
        );


    const clearButton =
        getElement(
            "clear-booking-filters"
        );


    const render =
        debounce(
            renderBookingsPage,
            150
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            render
        );

    }


    if (dateFilter) {

        dateFilter.addEventListener(
            "change",
            render
        );

    }


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                if (searchInput) {

                    searchInput.value =
                        "";

                }


                if (dateFilter) {

                    dateFilter.value =
                        "";

                }


                renderBookingsPage();

            }
        );

    }

}


/* ============================================================
   RENDER PRENOTAZIONI
   ============================================================ */

function renderBookingsPage() {

    const container =
        getElement(
            "bookings-list"
        );


    if (!container) {
        return;
    }


    let bookings =
        getBookings();


    const searchInput =
        getElement(
            "booking-search"
        );


    const dateFilter =
        getElement(
            "booking-date-filter"
        );


    const search =
        parserSimplify(
            searchInput?.value || ""
        );


    const date =
        dateFilter?.value || "";


    /*
        Filtro ricerca.
    */

    if (search) {

        bookings =
            bookings.filter(
                booking =>
                    bookingMatchesSearch(
                        booking,
                        search
                    )
            );

    }


    /*
        Filtro data.
    */

    if (date) {

        bookings =
            bookings.filter(
                booking =>
                    booking.date === date
            );

    }


    bookings =
        sortBookings(
            bookings
        );


    renderGroupedBookings(
        container,
        bookings
    );


    setTextIfExists(
        "bookings-result-count",
        String(
            bookings.length
        )
    );

}


function bookingMatchesSearch(
    booking,
    search
) {

    const values = [

        booking.firstName,
        booking.lastName,
        booking.phone,
        booking.departure,
        booking.destination,
        booking.date,
        booking.time,
        booking.notes

    ];


    return values.some(
        value =>
            parserSimplify(
                value || ""
            ).includes(
                search
            )
    );

}


/* ============================================================
   PRENOTAZIONI RAGGRUPPATE
   ============================================================ */

function renderGroupedBookings(
    container,
    bookings
) {

    if (!bookings.length) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>Nessuna prenotazione trovata</h3>
                <p>
                    Prova a modificare i filtri
                    oppure aggiungi una nuova corsa.
                </p>
            </div>
        `;

        return;

    }


    const groups =
        groupBy(
            bookings,
            booking =>
                booking.date ||
                "no-date"
        );


    const dates =
        Object.keys(
            groups
        ).sort();


    container.innerHTML =
        dates
            .map(
                date => {

                    const group =
                        groups[date];


                    return `

                        <section
                            class="booking-day-group"
                        >

                            <header
                                class="booking-day-header"
                            >

                                <div>

                                    <span>
                                        ${
                                            date === "no-date"
                                                ? "Senza data"
                                                : escapeHtml(
                                                    getWeekdayName(
                                                        date,
                                                        false
                                                    )
                                                )
                                        }
                                    </span>

                                    <h3>
                                        ${
                                            date === "no-date"
                                                ? "Data non specificata"
                                                : escapeHtml(
                                                    formatLongDate(
                                                        date
                                                    )
                                                )
                                        }
                                    </h3>

                                </div>

                                <strong>
                                    ${group.length}
                                </strong>

                            </header>


                            <div
                                class="booking-day-list"
                            >

                                ${
                                    group
                                        .map(
                                            booking =>
                                                createFullBookingHTML(
                                                    booking
                                                )
                                        )
                                        .join("")
                                }

                            </div>

                        </section>

                    `;

                }
            )
            .join("");


    initializeBookingCardActions();

}


/* ============================================================
   CARD COMPLETA PRENOTAZIONE
   ============================================================ */

function createFullBookingHTML(
    booking
) {

    const name =
        [
            booking.firstName,
            booking.lastName
        ]
            .filter(Boolean)
            .join(" ");


    const phone =
        booking.phone
            ? formatPhone(
                booking.phone
            )
            : "";


    return `

        <article
            class="full-booking-card"
            data-booking-id="${escapeHtml(
                booking.id
            )}"
        >

            <div class="full-booking-main">

                <div class="full-booking-time">

                    ${
                        escapeHtml(
                            booking.time ||
                            "--:--"
                        )
                    }

                </div>


                <div class="full-booking-details">

                    <h3>
                        ${
                            escapeHtml(
                                name ||
                                "Cliente"
                            )
                        }
                    </h3>


                    ${
                        phone
                            ? `
                                <span>
                                    ${escapeHtml(phone)}
                                </span>
                            `
                            : ""
                    }


                    <div class="full-booking-route">

                        <span>
                            <strong>Da:</strong>
                            ${
                                escapeHtml(
                                    booking.departure ||
                                    "Non specificata"
                                )
                            }
                        </span>

                        <span>
                            <strong>A:</strong>
                            ${
                                escapeHtml(
                                    booking.destination ||
                                    "Non specificata"
                                )
                            }
                        </span>

                    </div>


                    ${
                        booking.passengers
                            ? `
                                <span>
                                    Passeggeri:
                                    ${escapeHtml(
                                        booking.passengers
                                    )}
                                </span>
                            `
                            : ""
                    }


                    ${
                        booking.notes
                            ? `
                                <p>
                                    ${escapeHtml(
                                        booking.notes
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>

            </div>


            <div class="full-booking-actions">

                ${
                    phone
                        ? `
                            <a
                                class="icon-button"
                                href="tel:${escapeHtml(phone)}"
                                title="Chiama cliente"
                                aria-label="Chiama cliente"
                            >
                                ☎
                            </a>
                        `
                        : ""
                }


                <button
                    type="button"
                    class="icon-button danger"
                    data-action="delete-booking"
                    data-booking-id="${escapeHtml(
                        booking.id
                    )}"
                    title="Elimina prenotazione"
                    aria-label="Elimina prenotazione"
                >
                    ×
                </button>

            </div>

        </article>

    `;

}


/* ============================================================
   AZIONI PRENOTAZIONI
   ============================================================ */

function initializeBookingPageActions() {

    const addButton =
        getElement(
            "add-booking-button"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            () => redirectTo(
                "addBooking"
            )
        );

    }


    const calendarButton =
        getElement(
            "calendar-button"
        );


    if (calendarButton) {

        calendarButton.addEventListener(
            "click",
            () => redirectTo(
                "calendar"
            )
        );

    }


    initializeBookingCardActions();

}


function initializeBookingCardActions() {

    const deleteButtons =
        document.querySelectorAll(
            "[data-action='delete-booking']"
        );


    deleteButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const id =
                        this.dataset.bookingId;


                    confirmDeleteBooking(
                        id
                    );

                }
            );

        }
    );

}


function confirmDeleteBooking(
    id
) {

    const booking =
        getBookingById(
            id
        );


    if (!booking) {

        showToast(
            "Prenotazione non trovata.",
            "error"
        );

        return;

    }


    const name =
        [
            booking.firstName,
            booking.lastName
        ]
            .filter(Boolean)
            .join(" ");


    showConfirmModal(
        "Eliminare la prenotazione?",
        `
            Stai per eliminare
            <strong>
                ${escapeHtml(
                    name ||
                    "questa prenotazione"
                )}
            </strong>.
            <br><br>
            L'operazione non può essere annullata.
        `,
        function () {

            const deleted =
                deleteBooking(
                    id
                );


            if (!deleted) {

                showToast(
                    "Impossibile eliminare la prenotazione.",
                    "error"
                );

                return;

            }


            showToast(
                "Prenotazione eliminata.",
                "success"
            );


            renderBookingsPage();

        }
    );

}


/* ============================================================
   CALENDARIO
   ============================================================ */

function initializeCalendarPage() {

    const container =
        getElement(
            "calendar-grid"
        );


    if (!container) {
        return;
    }


    let currentDate =
        new Date();


    /*
        Permette ai pulsanti della pagina
        di cambiare mese.
    */

    const previousButton =
        getElement(
            "calendar-previous"
        );


    const nextButton =
        getElement(
            "calendar-next"
        );


    function render() {

        renderCalendar(
            currentDate
        );

    }


    if (previousButton) {

        previousButton.addEventListener(
            "click",
            function () {

                currentDate.setMonth(
                    currentDate.getMonth() - 1
                );


                render();

            }
        );

    }


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            function () {

                currentDate.setMonth(
                    currentDate.getMonth() + 1
                );


                render();

            }
        );

    }


    render();

}


function renderCalendar(
    currentDate
) {

    const container =
        getElement(
            "calendar-grid"
        );


    if (!container) {
        return;
    }


    const year =
        currentDate.getFullYear();


    const month =
        currentDate.getMonth();


    const monthTitle =
        new Intl.DateTimeFormat(
            "it-IT",
            {
                month: "long",
                year: "numeric"
            }
        ).format(
            currentDate
        );


    setTextIfExists(
        "calendar-month-title",
        capitalize(
            monthTitle
        )
    );


    const bookings =
        getBookings();


    const bookingCountByDate =
        {};


    bookings.forEach(
        booking => {

            if (!booking.date) {
                return;
            }


            bookingCountByDate[
                booking.date
            ] =
                (
                    bookingCountByDate[
                        booking.date
                    ] ||
                    0
                ) + 1;

        }
    );


    /*
        Primo giorno del mese.
    */

    const firstDay =
        new Date(
            year,
            month,
            1
        );


    /*
        JS:
        domenica = 0

        Convertiamo in:
        lunedì = 0
    */

    const startDay =
        (
            firstDay.getDay() +
            6
        ) % 7;


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const previousMonthDays =
        new Date(
            year,
            month,
            0
        ).getDate();


    const cells = [];


    /*
        Giorni del mese precedente.
    */

    for (
        let i = startDay - 1;
        i >= 0;
        i--
    ) {

        const day =
            previousMonthDays - i;


        cells.push(
            createCalendarDayHTML(
                new Date(
                    year,
                    month - 1,
                    day
                ),
                true,
                bookingCountByDate
            )
        );

    }


    /*
        Giorni del mese corrente.
    */

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        cells.push(
            createCalendarDayHTML(
                new Date(
                    year,
                    month,
                    day
                ),
                false,
                bookingCountByDate
            )
        );

    }


    /*
        Completiamo l'ultima settimana.
    */

    let nextDay = 1;


    while (
        cells.length % 7 !== 0
    ) {

        cells.push(
            createCalendarDayHTML(
                new Date(
                    year,
                    month + 1,
                    nextDay
                ),
                true,
                bookingCountByDate
            )
        );


        nextDay++;

    }


    container.innerHTML =
        cells.join("");


    /*
        Click sui giorni con prenotazioni.
    */

    container
        .querySelectorAll(
            "[data-calendar-date]"
        )
        .forEach(
            cell => {

                cell.addEventListener(
                    "click",
                    function () {

                        const date =
                            this.dataset.calendarDate;


                        if (!date) {
                            return;
                        }


                        redirectTo(
                            "bookings",
                            {
                                date
                            }
                        );

                    }
                );

            }
        );

}


function createCalendarDayHTML(
    date,
    isOutsideMonth,
    bookingCountByDate
) {

    const isoDate =
        formatDateISO(
            date
        );


    const count =
        bookingCountByDate[
            isoDate
        ] || 0;


    const todayClass =
        isoDate === getTodayISO()
            ? " is-today"
            : "";


    const outsideClass =
        isOutsideMonth
            ? " is-outside"
            : "";


    return `

        <button
            type="button"
            class="calendar-day${todayClass}${outsideClass}"
            data-calendar-date="${escapeHtml(
                isoDate
            )}"
        >

            <span class="calendar-day-number">
                ${date.getDate()}
            </span>


            ${
                count > 0
                    ? `
                        <span class="calendar-day-count">
                            ${count}
                        </span>
                    `
                    : ""
            }

        </button>

    `;

}


/* ============================================================
   AGGIUNTA PRENOTAZIONE
   ============================================================ */

function initializeAddBookingPage() {

    initializeManualBookingForm();

    initializeParserInterface();

    initializeVoiceRecognition();

}


/* ============================================================
   FORM MANUALE
   ============================================================ */

function initializeManualBookingForm() {

    const form =
        getElement(
            "booking-form"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const booking =
                readBookingForm(
                    form
                );


            processNewBooking(
                booking
            );

        }
    );

}


function readBookingForm(
    form
) {

    const getValue =
        name => {

            const field =
                form.elements[name];


            return cleanText(
                field?.value
            );

        };


    const booking = {

        firstName:
            getValue(
                "firstName"
            ),

        lastName:
            getValue(
                "lastName"
            ),

        phone:
            normalizePhone(
                getValue(
                    "phone"
                )
            ),

        departure:
            getValue(
                "departure"
            ),

        destination:
            getValue(
                "destination"
            ),

        date:
            getValue(
                "date"
            ),

        time:
            normalizeTime(
                getValue(
                    "time"
                )
            ),

        passengers:
            getValue(
                "passengers"
            ),

        notes:
            getValue(
                "notes"
            )

    };


    return booking;

}


/* ============================================================
   CONTROLLO BLACKLIST
   ============================================================ */

function processNewBooking(
    booking
) {

    const validation =
        validateBookingBeforeSave(
            booking
        );


    if (!validation.valid) {

        showToast(
            validation.errors[0],
            "error"
        );

        return;

    }


    /*
        Controlliamo la blacklist prima
        di salvare.
    */

    const blacklist =
        getBlacklist();


    const blacklistedCustomer =
        findBlacklistedCustomer(
            booking.phone,
            blacklist
        );


    if (blacklistedCustomer) {

        showBlacklistWarning(
            booking,
            blacklistedCustomer
        );

        return;

    }


    saveNewBooking(
        booking
    );

}


function validateBookingBeforeSave(
    booking
) {

    const errors = [];


    if (
        booking.phone &&
        !isValidPhone(
            booking.phone
        )
    ) {

        errors.push(
            "Il numero di telefono inserito non è valido."
        );

    }


    if (
        booking.date &&
        !parseDateISO(
            booking.date
        )
    ) {

        errors.push(
            "La data inserita non è valida."
        );

    }


    if (
        booking.time &&
        !normalizeTime(
            booking.time
        )
    ) {

        errors.push(
            "L'orario inserito non è valido."
        );

    }


    if (
        booking.passengers &&
        (
            Number(booking.passengers) < 1 ||
            Number(booking.passengers) > 50
        )
    ) {

        errors.push(
            "Il numero di passeggeri non è valido."
        );

    }


    return {

        valid:
            errors.length === 0,

        errors

    };

}


/* ============================================================
   AVVISO BLACKLIST
   ============================================================ */

function showBlacklistWarning(
    booking,
    blacklistEntry
) {

    const name =
        [
            blacklistEntry.firstName,
            blacklistEntry.lastName
        ]
            .filter(Boolean)
            .join(" ");


    const reason =
        blacklistEntry.reason ||
        "Nessuna motivazione specificata";


    showConfirmModal(
        "Cliente presente nella blacklist",
        `
            <div class="blacklist-warning">

                <p>
                    <strong>
                        Attenzione:
                    </strong>
                    il numero di telefono inserito
                    appartiene a un cliente presente
                    nella blacklist.
                </p>

                ${
                    name
                        ? `
                            <p>
                                <strong>Cliente:</strong>
                                ${escapeHtml(name)}
                            </p>
                        `
                        : ""
                }

                <p>
                    <strong>Motivo:</strong>
                    ${escapeHtml(reason)}
                </p>

                <p>
                    Vuoi aggiungere comunque
                    questa prenotazione?
                </p>

            </div>
        `,
        function () {

            saveNewBooking(
                booking
            );

        },
        "Aggiungi comunque",
        "Annulla"
    );

}


/* ============================================================
   SALVATAGGIO PRENOTAZIONE
   ============================================================ */

function saveNewBooking(
    booking
) {

    const saved =
        addBooking(
            booking
        );


    if (!saved) {

        showToast(
            "Impossibile salvare la prenotazione.",
            "error"
        );

        return;

    }


    showToast(
        "Prenotazione aggiunta.",
        "success"
    );


    /*
        Torniamo alla pagina prenotazioni
        dopo un breve intervallo.
    */

    setTimeout(
        () => {

            redirectTo(
                "bookings"
            );

        },
        500
    );

}


/* ============================================================
   PARSER WHATSAPP
   ============================================================ */

function initializeParserInterface() {

    const textArea =
        getElement(
            "whatsapp-message"
        );


    const parseButton =
        getElement(
            "parse-whatsapp"
        );


    if (
        textArea &&
        parseButton
    ) {

        parseButton.addEventListener(
            "click",
            function () {

                const text =
                    textArea.value.trim();


                if (!text) {

                    showToast(
                        "Incolla prima il messaggio WhatsApp.",
                        "error"
                    );

                    return;

                }


                const result =
                    parseWhatsAppMessage(
                        text
                    );


                showParserPreview(
                    result
                );

            }
        );

    }


    /*
        Pulsante generico per analizzare
        qualsiasi testo.
    */

    const genericButton =
        getElement(
            "parse-message"
        );


    const genericText =
        getElement(
            "message-input"
        );


    if (
        genericButton &&
        genericText
    ) {

        genericButton.addEventListener(
            "click",
            function () {

                const result =
                    parseReservationText(
                        genericText.value
                    );


                showParserPreview(
                    result
                );

            }
        );

    }

}


/* ============================================================
   ANTEPRIMA PARSER
   ============================================================ */

function showParserPreview(
    result
) {

    const container =
        getElement(
            "parser-preview"
        );


    if (!container) {

        /*
            Se la pagina non possiede
            un contenitore dedicato,
            mostriamo comunque un messaggio.
        */

        if (
            result.detectedFields.length
        ) {

            showToast(
                "Informazioni riconosciute. Controllale prima di salvarle.",
                "success"
            );

        } else {

            showToast(
                "Non sono riuscito a riconoscere informazioni sufficienti.",
                "error"
            );

        }


        return;

    }


    const reviewFields =
        getParserReviewFields(
            result
        );


    container.innerHTML = `

        <div class="parser-result">

            <div class="parser-result-header">

                <div>

                    <span>
                        ANTEPRIMA
                    </span>

                    <h3>
                        Dati riconosciuti
                    </h3>

                </div>


                <strong>
                    ${result.overallConfidence}%
                </strong>

            </div>


            <div class="parser-fields">

                ${createParserFieldHTML(
                    "Nome",
                    [
                        result.firstName,
                        result.lastName
                    ]
                        .filter(Boolean)
                        .join(" "),
                    result.confidence.firstName
                )}


                ${createParserFieldHTML(
                    "Telefono",
                    result.phone,
                    result.confidence.phone
                )}


                ${createParserFieldHTML(
                    "Partenza",
                    result.departure,
                    result.confidence.departure
                )}


                ${createParserFieldHTML(
                    "Destinazione",
                    result.destination,
                    result.confidence.destination
                )}


                ${createParserFieldHTML(
                    "Data",
                    result.date
                        ? formatLongDate(
                            result.date
                        )
                        : "",
                    result.confidence.date
                )}


                ${createParserFieldHTML(
                    "Ora",
                    result.time,
                    result.confidence.time
                )}


                ${createParserFieldHTML(
                    "Passeggeri",
                    result.passengers,
                    result.confidence.passengers
                )}


                ${createParserFieldHTML(
                    "Note",
                    result.notes,
                    result.confidence.notes
                )}

            </div>


            ${
                result.warnings.length
                    ? `
                        <div class="parser-warnings">

                            <strong>
                                Controlla:
                            </strong>

                            <ul>
                                ${
                                    result.warnings
                                        .map(
                                            warning =>
                                                `
                                                    <li>
                                                        ${escapeHtml(
                                                            warning
                                                        )}
                                                    </li>
                                                `
                                        )
                                        .join("")
                                }
                            </ul>

                        </div>
                    `
                    : ""
            }


            ${
                reviewFields.length
                    ? `
                        <p class="parser-review-message">
                            Alcuni dati hanno una confidenza
                            bassa. Verificali manualmente
                            prima di confermare.
                        </p>
                    `
                    : ""
            }


            <div class="parser-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="parser-edit-button"
                >
                    Modifica
                </button>


                <button
                    type="button"
                    class="btn btn-primary"
                    id="parser-confirm-button"
                >
                    Conferma prenotazione
                </button>

            </div>

        </div>

    `;


    const confirmButton =
        getElement(
            "parser-confirm-button"
        );


    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            function () {

                const booking =
                    parsedResultToBooking(
                        result
                    );


                processNewBooking(
                    booking
                );

            }
        );

    }


    const editButton =
        getElement(
            "parser-edit-button"
        );


    if (editButton) {

        editButton.addEventListener(
            "click",
            function () {

                fillBookingFormFromParser(
                    result
                );

            }
        );

    }

}


function createParserFieldHTML(
    label,
    value,
    confidence
) {

    if (!value) {

        return `
            <div class="parser-field empty">
                <span>
                    ${escapeHtml(label)}
                </span>

                <strong>
                    Non riconosciuto
                </strong>
            </div>
        `;

    }


    const percentage =
        Math.round(
            (confidence || 0) * 100
        );


    return `

        <div class="parser-field">

            <span>
                ${escapeHtml(label)}
            </span>

            <strong>
                ${escapeHtml(value)}
            </strong>

            <small>
                Confidenza ${percentage}%
            </small>

        </div>

    `;

}


/* ============================================================
   RIEMPIMENTO FORM DA PARSER
   ============================================================ */

function fillBookingFormFromParser(
    result
) {

    const fields = {

        firstName:
            result.firstName,

        lastName:
            result.lastName,

        phone:
            result.phone,

        departure:
            result.departure,

        destination:
            result.destination,

        date:
            result.date,

        time:
            result.time,

        passengers:
            result.passengers,

        notes:
            result.notes

    };


    Object.entries(
        fields
    ).forEach(
        (
            [
                name,
                value
            ]
        ) => {

            const field =
                document.querySelector(
                    `[name="${name}"]`
                );


            if (
                field &&
                value
            ) {

                field.value =
                    value;

            }

        }
    );


    showToast(
        "Dati trasferiti nel modulo. Controllali prima di salvare.",
        "success"
    );


    const form =
        getElement(
            "booking-form"
        );


    if (form) {

        scrollToElement(
            form
        );

    }

}


/* ============================================================
   RICONOSCIMENTO VOCALE
   ============================================================ */

function initializeVoiceRecognition() {

    const voiceButton =
        getElement(
            "voice-input-button"
        );


    const transcriptField =
        getElement(
            "voice-transcript"
        );


    if (!voiceButton) {
        return;
    }


    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        voiceButton.disabled =
            true;


        voiceButton.title =
            "Il riconoscimento vocale non è supportato da questo browser.";


        return;

    }


    const recognition =
        new SpeechRecognition();


    recognition.lang =
        "it-IT";


    recognition.continuous =
        false;


    recognition.interimResults =
        true;


    recognition.maxAlternatives =
        3;


    let finalTranscript =
        "";


    recognition.onstart =
        function () {

            voiceButton.classList.add(
                "is-recording"
            );


            voiceButton.setAttribute(
                "aria-pressed",
                "true"
            );


            showToast(
                "Sto ascoltando...",
                "info"
            );

        };


    recognition.onresult =
        function (event) {

            let interimTranscript =
                "";


            finalTranscript =
                "";


            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                const transcript =
                    event.results[i][0].transcript;


                if (
                    event.results[i].isFinal
                ) {

                    finalTranscript +=
                        transcript;

                } else {

                    interimTranscript +=
                        transcript;

                }

            }


            const combined =
                (
                    finalTranscript +
                    " " +
                    interimTranscript
                ).trim();


            if (transcriptField) {

                transcriptField.value =
                    combined;

            }

        };


    recognition.onerror =
        function (event) {

            console.error(
                "Speech recognition error:",
                event.error
            );


            if (
                event.error ===
                "not-allowed"
            ) {

                showToast(
                    "Il browser non ha autorizzato il microfono.",
                    "error"
                );

            } else {

                showToast(
                    "Non è stato possibile riconoscere la voce.",
                    "error"
                );

            }

        };


    recognition.onend =
        function () {

            voiceButton.classList.remove(
                "is-recording"
            );


            voiceButton.setAttribute(
                "aria-pressed",
                "false"
            );


            if (finalTranscript.trim()) {

                const result =
                    parseVoiceTranscript(
                        finalTranscript
                    );


                showParserPreview(
                    result
                );

            }

        };


    voiceButton.addEventListener(
        "click",
        function () {

            try {

                finalTranscript =
                    "";


                recognition.start();

            } catch (error) {

                console.error(
                    "Impossibile avviare il microfono:",
                    error
                );

            }

        }
    );

}


/* ============================================================
   PROFILO
   ============================================================ */

function initializeProfilePage() {

    loadProfileData();

    initializeProfileForm();

    initializeThemeControls();

    initializeImportExport();

    initializeBlacklist();

    initializeResetButton();

    renderProfileCounters();

}


/* ============================================================
   DATI PROFILO
   ============================================================ */

function loadProfileData() {

    const name =
        getDriverName();


    const fields =
        document.querySelectorAll(
            "[data-driver-name]"
        );


    fields.forEach(
        field => {

            if (
                "value" in field
            ) {

                field.value =
                    name;

            } else {

                field.textContent =
                    name;

            }

        }
    );


    setTextIfExists(
        "profile-driver-name",
        formatName(name)
    );

}


function initializeProfileForm() {

    const form =
        getElement(
            "profile-form"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const input =
                form.elements.driverName ||
                getElement(
                    "profile-driver-name-input"
                );


            const name =
                cleanText(
                    input?.value
                );


            if (!name) {

                showToast(
                    "Inserisci un nome valido.",
                    "error"
                );

                return;

            }


            if (
                !setDriverName(
                    name
                )
            ) {

                showToast(
                    "Impossibile salvare il nome.",
                    "error"
                );

                return;

            }


            showToast(
                "Profilo aggiornato.",
                "success"
            );


            loadProfileData();

        }
    );

}


/* ============================================================
   TEMA
   ============================================================ */

function initializeThemeControls() {

    const controls =
        document.querySelectorAll(
            "[data-theme]"
        );


    const currentTheme =
        getTheme();


    controls.forEach(
        control => {

            const theme =
                control.dataset.theme;


            if (
                theme === currentTheme
            ) {

                control.classList.add(
                    "active"
                );

            }


            control.addEventListener(
                "click",
                function () {

                    const selectedTheme =
                        this.dataset.theme;


                    if (
                        !setTheme(
                            selectedTheme
                        )
                    ) {

                        return;

                    }


                    applyStoredTheme();


                    controls.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    this.classList.add(
                        "active"
                    );


                    showToast(
                        "Tema aggiornato.",
                        "success"
                    );

                }
            );

        }
    );

}


function applyStoredTheme() {

    const theme =
        typeof getTheme === "function"
            ? getTheme()
            : "system";


    const root =
        document.documentElement;


    root.removeAttribute(
        "data-theme"
    );


    if (theme === "light") {

        root.setAttribute(
            "data-theme",
            "light"
        );

        return;

    }


    if (theme === "dark") {

        root.setAttribute(
            "data-theme",
            "dark"
        );

        return;

    }


    /*
        Tema sistema.
    */

    const prefersDark =
        window.matchMedia &&
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;


    root.setAttribute(
        "data-theme",
        prefersDark
            ? "dark"
            : "light"
    );

}


/* ============================================================
   IMPORT / EXPORT
   ============================================================ */

function initializeImportExport() {

    const exportButton =
        getElement(
            "export-data"
        );


    if (exportButton) {

        exportButton.addEventListener(
            "click",
            function () {

                const json =
                    exportStorageData();


                const date =
                    getTodayISO();


                downloadFile(
                    json,
                    `ctl-manager-backup-${date}.json`,
                    "application/json"
                );


                showToast(
                    "Backup esportato.",
                    "success"
                );

            }
        );

    }


    const importInput =
        getElement(
            "import-data"
        );


    if (importInput) {

        importInput.addEventListener(
            "change",
            async function () {

                const file =
                    this.files?.[0];


                if (!file) {
                    return;
                }


                try {

                    const content =
                        await readTextFile(
                            file
                        );


                    const imported =
                        importStorageData(
                            content
                        );


                    if (!imported) {

                        showToast(
                            "File di backup non valido.",
                            "error"
                        );

                        return;

                    }


                    showToast(
                        "Backup importato. Ricarico l'app...",
                        "success"
                    );


                    setTimeout(
                        () => {

                            window.location.reload();

                        },
                        700
                    );

                } catch (error) {

                    console.error(
                        error
                    );


                    showToast(
                        "Impossibile leggere il file.",
                        "error"
                    );

                }

            }
        );

    }

}


/* ============================================================
   BLACKLIST
   ============================================================ */

function initializeBlacklist() {

    renderBlacklist();


    const form =
        getElement(
            "blacklist-form"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const getValue =
                name =>
                    cleanText(
                        form.elements[name]?.value
                    );


            const firstName =
                getValue(
                    "firstName"
                );


            const lastName =
                getValue(
                    "lastName"
                );


            const phone =
                normalizePhone(
                    getValue(
                        "phone"
                    )
                );


            const route =
                getValue(
                    "route"
                );


            const reason =
                getValue(
                    "reason"
                );


            /*
                Telefono e motivo sono obbligatori.
            */

            if (!phone) {

                showToast(
                    "Il numero di telefono è obbligatorio.",
                    "error"
                );

                return;

            }


            if (
                !isValidPhone(
                    phone
                )
            ) {

                showToast(
                    "Inserisci un numero di telefono valido.",
                    "error"
                );

                return;

            }


            if (!reason) {

                showToast(
                    "Il motivo della blacklist è obbligatorio.",
                    "error"
                );

                return;

            }


            /*
                Evitiamo duplicati.
            */

            const existing =
                getBlacklist()
                    .find(
                        entry =>
                            phonesMatch(
                                entry.phone,
                                phone
                            )
                    );


            if (existing) {

                showToast(
                    "Questo numero è già presente nella blacklist.",
                    "error"
                );

                return;

            }


            const entry = {

                firstName,

                lastName,

                phone,

                route,

                reason

            };


            const saved =
                addBlacklistEntry(
                    entry
                );


            if (!saved) {

                showToast(
                    "Impossibile aggiungere il cliente alla blacklist.",
                    "error"
                );

                return;

            }


            form.reset();


            showToast(
                "Cliente aggiunto alla blacklist.",
                "success"
            );


            renderBlacklist();

        }
    );

}


function renderBlacklist() {

    const container =
        getElement(
            "blacklist-list"
        );


    if (!container) {
        return;
    }


    const entries =
        getBlacklist();


    if (!entries.length) {

        container.innerHTML = `
            <div class="empty-state compact">
                <h3>Blacklist vuota</h3>
                <p>
                    Nessun cliente bloccato.
                </p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        entries
            .map(
                entry => {

                    const name =
                        [
                            entry.firstName,
                            entry.lastName
                        ]
                            .filter(Boolean)
                            .join(" ");


                    return `

                        <article
                            class="blacklist-card"
                            data-blacklist-id="${escapeHtml(
                                entry.id
                            )}"
                        >

                            <div>

                                <h3>
                                    ${
                                        escapeHtml(
                                            name ||
                                            "Cliente"
                                        )
                                    }
                                </h3>


                                <span>
                                    ${
                                        escapeHtml(
                                            entry.phone
                                        )
                                    }
                                </span>


                                ${
                                    entry.route
                                        ? `
                                            <p>
                                                ${escapeHtml(
                                                    entry.route
                                                )}
                                            </p>
                                        `
                                        : ""
                                }


                                <p>
                                    <strong>
                                        Motivo:
                                    </strong>
                                    ${
                                        escapeHtml(
                                            entry.reason
                                        )
                                    }
                                </p>

                            </div>


                            <button
                                type="button"
                                class="icon-button danger"
                                data-action="delete-blacklist"
                                data-blacklist-id="${escapeHtml(
                                    entry.id
                                )}"
                                aria-label="Rimuovi dalla blacklist"
                            >
                                ×
                            </button>

                        </article>

                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-action='delete-blacklist']"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        const id =
                            this.dataset.blacklistId;


                        showConfirmModal(
                            "Rimuovere dalla blacklist?",
                            `
                                Il cliente potrà nuovamente
                                essere aggiunto alle prenotazioni
                                senza il relativo avviso.
                            `,
                            function () {

                                deleteBlacklistEntry(
                                    id
                                );


                                renderBlacklist();


                                showToast(
                                    "Cliente rimosso dalla blacklist.",
                                    "success"
                                );

                            }
                        );

                    }
                );

            }
        );

}


/* ============================================================
   CONTATORI
   ============================================================ */

function renderProfileCounters() {

    const bookings =
        getBookings();


    const today =
        new Date();


    const currentYear =
        today.getFullYear();


    const currentMonth =
        today.getMonth();


    const dailyCount =
        bookings.filter(
            booking =>
                booking.date ===
                getTodayISO()
        ).length;


    const monthlyCount =
        bookings.filter(
            booking => {

                const date =
                    parseDateISO(
                        booking.date
                    );


                return (
                    date &&
                    date.getFullYear() ===
                        currentYear &&
                    date.getMonth() ===
                        currentMonth
                );

            }
        ).length;


    const annualCount =
        bookings.filter(
            booking => {

                const date =
                    parseDateISO(
                        booking.date
                    );


                return (
                    date &&
                    date.getFullYear() ===
                        currentYear
                );

            }
        ).length;


    setTextIfExists(
        "counter-day",
        String(
            dailyCount
        )
    );


    setTextIfExists(
        "counter-month",
        String(
            monthlyCount
        )
    );


    setTextIfExists(
        "counter-year",
        String(
            annualCount
        )
    );

}


/* ============================================================
   RESET APP
   ============================================================ */

function initializeResetButton() {

    const button =
        getElement(
            "reset-app"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            showConfirmModal(
                "Resettare CTL Manager?",
                `
                    <strong>Attenzione.</strong>

                    <br><br>

                    Verranno eliminati:
                    <ul>
                        <li>prenotazioni</li>
                        <li>blacklist</li>
                        <li>nome autista</li>
                        <li>impostazioni</li>
                        <li>configurazione iniziale</li>
                    </ul>

                    Questa operazione non può essere annullata.
                `,
                function () {

                    resetApplicationData();


                    window.location.href =
                        "../index.html";

                },
                "Reset completo",
                "Annulla"
            );

        }
    );

}


/* ============================================================
   NAVIGAZIONE
   ============================================================ */

function initializeNavigation() {

    const navigation =
        document.querySelector(
            ".bottom-navigation"
        );


    if (!navigation) {
        return;
    }


    const currentPage =
        getCurrentPage();


    navigation
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(
            item => {

                const page =
                    item.dataset.page;


                if (
                    page === currentPage
                ) {

                    item.classList.add(
                        "active"
                    );

                }


                item.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        const targetPage =
                            this.dataset.page;


                        if (!targetPage) {
                            return;
                        }


                        redirectTo(
                            targetPage
                        );

                    }
                );

            }
        );

}


/* ============================================================
   REDIRECT
   ============================================================ */

function redirectTo(
    page,
    query = {}
) {

    let target;


    switch (page) {

        case "index":

            target =
                "../index.html";

            break;


        case "login":

            target =
                "login.html";

            break;


        case "welcome":

            target =
                "welcome.html";

            break;


        case "home":

            target =
                "home.html";

            break;


        case "bookings":

            target =
                "prenotazioni.html";

            break;


        case "calendar":

            target =
                "calendario.html";

            break;


        case "addBooking":

            target =
                "aggiungi-prenotazione.html";

            break;


        case "profile":

            target =
                "profilo.html";

            break;


        default:

            target =
                "../index.html";

    }


    const params =
        new URLSearchParams();


    Object.entries(
        query
    ).forEach(
        (
            [
                key,
                value
            ]
        ) => {

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {

                params.set(
                    key,
                    value
                );

            }

        }
    );


    const queryString =
        params.toString();


    if (queryString) {

        target +=
            "?" +
            queryString;

    }


    window.location.href =
        target;

}


/* ============================================================
   QUERY STRING
   ============================================================ */

function getQueryParameter(
    name
) {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get(
        name
    );

}


/* ============================================================
   TOAST
   ============================================================ */

function showToast(
    message,
    type = "info",
    duration = 3500
) {

    let container =
        getElement(
            "toast-container"
        );


    /*
        Se il contenitore non esiste,
        lo creiamo.
    */

    if (!container) {

        container =
            document.createElement(
                "div"
            );


        container.id =
            "toast-container";


        container.className =
            "toast-container";


        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast toast-${type}`;


    toast.setAttribute(
        "role",
        "status"
    );


    toast.innerHTML =
        escapeHtml(
            message
        );


    container.appendChild(
        toast
    );


    requestAnimationFrame(
        () => {

            toast.classList.add(
                "visible"
            );

        }
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "visible"
            );


            setTimeout(
                () => {

                    toast.remove();

                },
                250
            );

        },
        duration
    );

}


/* ============================================================
   MODALE CONFERMA
   ============================================================ */

function showConfirmModal(
    title,
    message,
    onConfirm,
    confirmLabel = "Conferma",
    cancelLabel = "Annulla"
) {

    const container =
        getElement(
            "modal-container"
        );


    if (!container) {

        /*
            Fallback se il contenitore non esiste.
        */

        if (
            window.confirm(
                `${title}\n\n${stripHtml(message)}`
            )
        ) {

            onConfirm?.();

        }


        return;

    }


    container.innerHTML = `

        <div
            class="modal-overlay"
            data-modal-close
        >

            <div
                class="modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                tabindex="-1"
            >

                <button
                    type="button"
                    class="modal-close"
                    data-modal-close
                    aria-label="Chiudi"
                >
                    ×
                </button>


                <div class="modal-content">

                    <h2 id="modal-title">
                        ${escapeHtml(title)}
                    </h2>

                    <div class="modal-message">
                        ${message}
                    </div>

                </div>


                <div class="modal-actions">

                    <button
                        type="button"
                        class="btn btn-secondary"
                        data-modal-cancel
                    >
                        ${escapeHtml(
                            cancelLabel
                        )}
                    </button>


                    <button
                        type="button"
                        class="btn btn-primary"
                        data-modal-confirm
                    >
                        ${escapeHtml(
                            confirmLabel
                        )}
                    </button>

                </div>

            </div>

        </div>

    `;


    const overlay =
        container.querySelector(
            ".modal-overlay"
        );


    const modal =
        container.querySelector(
            ".modal-card"
        );


    const confirmButton =
        container.querySelector(
            "[data-modal-confirm]"
        );


    const cancelButton =
        container.querySelector(
            "[data-modal-cancel]"
        );


    function closeModal() {

        container.innerHTML =
            "";

    }


    confirmButton?.addEventListener(
        "click",
        function () {

            closeModal();

            onConfirm?.();

        }
    );


    cancelButton?.addEventListener(
        "click",
        closeModal
    );


    container
        .querySelectorAll(
            "[data-modal-close]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target ===
                            overlay ||
                            event.currentTarget !==
                            overlay
                        ) {

                            closeModal();

                        }

                    }
                );

            }
        );


    document.addEventListener(
        "keydown",
        function escapeHandler(event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeModal();


                document.removeEventListener(
                    "keydown",
                    escapeHandler
                );

            }

        }
    );


    setTimeout(
        () => {

            modal?.focus();

        },
        0
    );

}


/* ============================================================
   UTILITY MODALE
   ============================================================ */

function stripHtml(
    html
) {

    const temporary =
        document.createElement(
            "div"
        );


    temporary.innerHTML =
        html;


    return temporary.textContent ||
        temporary.innerText ||
        "";

}


/* ============================================================
   TESTO
   ============================================================ */

function setTextIfExists(
    id,
    value
) {

    const element =
        getElement(
            id
        );


    if (element) {

        element.textContent =
            value ?? "";

    }

}


/* ============================================================
   CAMBIO TEMA AUTOMATICO
   ============================================================ */

if (
    window.matchMedia
) {

    const mediaQuery =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        );


    mediaQuery.addEventListener?.(
        "change",
        function () {

            const theme =
                getTheme();


            if (
                theme === "system"
            ) {

                applyStoredTheme();

            }

        }
    );

}


/* ============================================================
   AGGIORNAMENTO AUTOMATICO HOME
   ============================================================ */

/*
    Se l'app rimane aperta per molto tempo,
    aggiorniamo il saluto e la corsa successiva.
*/

setInterval(
    function () {

        if (
            getCurrentPage() ===
            "home"
        ) {

            updateHomeGreeting();

            renderHomeStats();

            renderNextBooking();

            renderTodayBookings();

        }

    },
    60000
);
```
