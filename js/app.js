/*
    ============================================================
    CTL MANAGER
    app.js

    Controller principale dell'applicazione.

    Gestisce:
    - onboarding
    - login
    - welcome
    - home
    - prenotazioni
    - calendario
    - nuova prenotazione
    - inserimento vocale
    - inserimento WhatsApp
    - blacklist
    - profilo
    - tema
    - import/export
    - reset

    I dati vengono gestiti da storage.js.
    ============================================================
*/

"use strict";


/* ============================================================
   CONFIGURAZIONE
   ============================================================ */

const CTL_LEGACY_PROFILE_KEY =
    "ctl_manager_profile";


const CTL_APP_VERSION =
    "1.0.0";


let currentPreviewBooking = null;

let recognitionInstance = null;

let recognitionTimer = null;

let recognitionStartedAt = null;

let calendarCurrentDate = new Date();

let calendarSelectedDate = null;


/* ============================================================
   AVVIO
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);


function initializeApp() {

    try {

        applySavedTheme();

        const page =
            getCurrentPage();


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

            case "prenotazioni":
                initializeBookingsPage();
                break;

            case "calendario":
                initializeCalendarPage();
                break;

            case "aggiungi-prenotazione":
                initializeAddBookingPage();
                break;

            case "profilo":
                initializeProfilePage();
                break;

            default:
                break;

        }


        hideLoader();


    } catch (error) {

        console.error(
            "CTL Manager - Errore inizializzazione:",
            error
        );

        hideLoader();

    }

}


/* ============================================================
   RILEVAMENTO PAGINA
   ============================================================ */

function getCurrentPage() {

    const pathname =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    if (
        pathname === "" ||
        pathname === "index.html"
    ) {

        return "index";

    }


    return pathname
        .replace(".html", "");

}


/* ============================================================
   LOADER
   ============================================================ */

function hideLoader() {

    const loader =
        document.querySelector(
            ".app-loader"
        );


    if (!loader) {
        return;
    }


    window.setTimeout(
        () => {

            loader.classList.add(
                "hidden"
            );

        },
        80
    );

}


/* ============================================================
   TEMA
   ============================================================ */

function applySavedTheme() {

    if (
        typeof getTheme !== "function"
    ) {

        return;

    }


    const theme =
        getTheme();


    document.documentElement
        .setAttribute(
            "data-theme",
            theme
        );


    const metaTheme =
        document.querySelector(
            'meta[name="theme-color"]'
        );


    if (metaTheme) {

        metaTheme.setAttribute(
            "content",
            theme === "dark"
                ? "#0e1721"
                : "#f5f1ea"
        );

    }

}


function changeTheme(theme) {

    if (
        typeof setTheme !== "function" ||
        !isValidTheme(theme)
    ) {

        return;

    }


    setTheme(theme);

    applySavedTheme();

}


/* ============================================================
   PROTEZIONE PAGINE
   ============================================================ */

function isAuthenticated() {

    if (
        typeof isLoginCompleted === "function"
    ) {

        return isLoginCompleted();

    }


    return Boolean(
        getDriverName()
    );

}


function isOnboardingCompleted() {

    if (
        typeof isWelcomeCompleted === "function"
    ) {

        return isWelcomeCompleted();

    }


    return false;

}


function requireAuthentication() {

    if (!isAuthenticated()) {

        window.location.replace(
            "login.html"
        );

        return false;

    }


    if (!isOnboardingCompleted()) {

        window.location.replace(
            "welcome.html"
        );

        return false;

    }


    return true;

}


/* ============================================================
   LOGIN
   ============================================================ */

function initializeLoginPage() {

    if (isAuthenticated()) {

        if (isOnboardingCompleted()) {

            window.location.replace(
                "home.html"
            );

        } else {

            window.location.replace(
                "welcome.html"
            );

        }

        return;

    }


    const form =
        getElement("login-form");


    const input =
        getElement("driver-name");


    const error =
        getElement("login-error");


    if (!form || !input) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const name =
                cleanText(
                    input.value
                );


            if (!name) {

                showFormError(
                    error,
                    "Inserisci il nome dell'autista."
                );

                input.focus();

                return;

            }


            if (name.length < 2) {

                showFormError(
                    error,
                    "Il nome inserito è troppo breve."
                );

                input.focus();

                return;

            }


            if (
                typeof setDriverName === "function"
            ) {

                setDriverName(name);

            }


            /*
                Compatibilità con index.html.
                index.html utilizza questo vecchio riferimento
                per decidere se mostrare login o home.
            */

            try {

                localStorage.setItem(
                    CTL_LEGACY_PROFILE_KEY,
                    JSON.stringify({
                        driverName: name
                    })
                );

            } catch (error) {

                console.warn(
                    "CTL Manager - impossibile creare il riferimento legacy:",
                    error
                );

            }


            window.location.replace(
                "welcome.html"
            );

        }
    );


    input.addEventListener(
        "input",
        function () {

            hideFormError(error);

        }
    );

}


/* ============================================================
   WELCOME
   ============================================================ */

function initializeWelcomePage() {

    if (!isAuthenticated()) {

        window.location.replace(
            "login.html"
        );

        return;

    }


    if (isOnboardingCompleted()) {

        window.location.replace(
            "home.html"
        );

        return;

    }


    const button =
        getElement(
            "welcome-continue"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            if (
                typeof completeWelcome === "function"
            ) {

                completeWelcome();

            }


            window.location.replace(
                "home.html"
            );

        }
    );

}


/* ============================================================
   HOME
   ============================================================ */

function initializeHomePage() {

    if (!requireAuthentication()) {
        return;
    }


    renderHome();

}


function renderHome() {

    const driverName =
        getDriverName();


    const driverInitial =
        getInitials(
            driverName
        );


    const headerInitial =
        getElement(
            "header-driver-initial"
        );


    if (headerInitial) {

        headerInitial.textContent =
            driverInitial || "-";

    }


    const homeDriverName =
        getElement(
            "home-driver-name"
        );


    if (homeDriverName) {

        homeDriverName.textContent =
            driverName || "Autista";

    }


    const greeting =
        getElement(
            "home-greeting-label"
        );


    if (greeting) {

        greeting.textContent =
            getDynamicGreeting();

    }


    const currentDate =
        getElement(
            "home-current-date"
        );


    if (currentDate) {

        currentDate.textContent =
            formatLongDate(
                getTodayISO()
            );

    }


    renderNextRide();

    renderTodayBookings();

}


/* ============================================================
   PROSSIMA CORSA
   ============================================================ */

function renderNextRide() {

    const bookings =
        getBookings();


    const now =
        new Date();


    const upcoming =
        bookings
            .filter(
                booking =>
                    getBookingStatus(
                        booking
                    ) === "scheduled"
            )
            .filter(
                booking =>
                    hasFutureDateTime(
                        booking,
                        now
                    )
            )
            .sort(
                compareBookingDateTime
            );


    const nextRide =
        upcoming[0] || null;


    const card =
        getElement(
            "next-ride-card"
        );


    const content =
        getElement(
            "next-ride-content"
        );


    const empty =
        getElement(
            "next-ride-empty"
        );


    if (nextRide) {

        if (content) {
            content.hidden = false;
        }

        if (empty) {
            empty.hidden = true;
        }


        setText(
            "next-ride-date",
            formatBookingDate(
                nextRide.date
            )
        );


        setText(
            "next-ride-time",
            nextRide.time
                ? formatTime(
                    nextRide.time
                )
                : "Orario non specificato"
        );


        setText(
            "next-ride-departure",
            nextRide.departure ||
                "Partenza non specificata"
        );


        setText(
            "next-ride-destination",
            nextRide.destination ||
                "Destinazione non specificata"
        );


        setText(
            "next-ride-client-name",
            getBookingClientName(
                nextRide
            )
        );


        setText(
            "next-ride-client-initial",
            getInitials(
                getBookingClientName(
                    nextRide
                )
            ) || "?"
        );


        setText(
            "next-ride-passengers",
            formatPassengers(
                nextRide.passengers
            )
        );


        const callButton =
            getElement(
                "next-ride-call"
            );


        if (callButton) {

            if (
                nextRide.phone &&
                isValidPhone(
                    nextRide.phone
                )
            ) {

                callButton.hidden = false;

                callButton.href =
                    getTelLink(
                        nextRide.phone
                    );

            } else {

                callButton.hidden = true;

                callButton.removeAttribute(
                    "href"
                );

            }

        }


        if (card) {

            card.dataset.bookingId =
                nextRide.id || "";

        }

    } else {

        if (content) {
            content.hidden = true;
        }

        if (empty) {
            empty.hidden = false;
        }

        if (card) {
            card.removeAttribute(
                "data-booking-id"
            );
        }

    }

}


/* ============================================================
   CORSE DI OGGI
   ============================================================ */

function renderTodayBookings() {

    const todayBookings =
        getBookings()
            .filter(
                booking =>
                    booking.date ===
                    getTodayISO()
            )
            .sort(
                compareBookingDateTime
            );


    setText(
        "today-rides-count",
        String(
            todayBookings.length
        )
    );


    const completedCount =
        todayBookings.filter(
            booking =>
                getBookingStatus(
                    booking
                ) === "completed"
        ).length;


    setText(
        "today-completed-count",
        String(
            completedCount
        )
    );


    const container =
        getElement(
            "today-rides-list"
        );


    const empty =
        getElement(
            "today-rides-empty"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!todayBookings.length) {

        if (empty) {
            empty.hidden = false;
        }

        return;

    }


    if (empty) {
        empty.hidden = true;
    }


    todayBookings.forEach(
        booking => {

            container.appendChild(
                createBookingListItem(
                    booking
                )
            );

        }
    );

}


/* ============================================================
   PRENOTAZIONI
   ============================================================ */

function initializeBookingsPage() {

    if (!requireAuthentication()) {
        return;
    }


    setupBookingFilters();

    renderBookingsPage();

}


function setupBookingFilters() {

    const search =
        getElement(
            "booking-search"
        );


    const dateFilter =
        getElement(
            "booking-date-filter"
        );


    const statusFilter =
        getElement(
            "booking-status-filter"
        );


    const resetButton =
        getElement(
            "reset-booking-filters"
        );


    const clearButton =
        getElement(
            "clear-booking-search"
        );


    const clearEmpty =
        getElement(
            "clear-search-empty"
        );


    if (search) {

        search.addEventListener(
            "input",
            function () {

                if (clearButton) {

                    clearButton.hidden =
                        !search.value;

                }

                renderBookingsPage();

            }
        );

    }


    if (dateFilter) {

        dateFilter.addEventListener(
            "change",
            renderBookingsPage
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            renderBookingsPage
        );

    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            function () {

                if (search) {
                    search.value = "";
                }

                if (dateFilter) {
                    dateFilter.value = "all";
                }

                if (statusFilter) {
                    statusFilter.value = "all";
                }

                if (clearButton) {
                    clearButton.hidden = true;
                }

                renderBookingsPage();

            }
        );

    }


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                if (search) {
                    search.value = "";
                }

                clearButton.hidden = true;

                renderBookingsPage();

            }
        );

    }


    if (clearEmpty) {

        clearEmpty.addEventListener(
            "click",
            function () {

                if (search) {
                    search.value = "";
                }

                if (clearButton) {
                    clearButton.hidden = true;
                }

                renderBookingsPage();

            }
        );

    }

}


function renderBookingsPage() {

    const bookings =
        getBookings()
            .sort(
                compareBookingDateTime
            );


    const searchInput =
        getElement(
            "booking-search"
        );


    const dateFilter =
        getElement(
            "booking-date-filter"
        );


    const statusFilter =
        getElement(
            "booking-status-filter"
        );


    const search =
        cleanText(
            searchInput
                ? searchInput.value
                : ""
        ).toLowerCase();


    const dateMode =
        dateFilter
            ? dateFilter.value
            : "all";


    const statusMode =
        statusFilter
            ? statusFilter.value
            : "all";


    let filtered =
        bookings.filter(
            booking =>
                bookingMatchesStatus(
                    booking,
                    statusMode
                )
        );


    filtered =
        filtered.filter(
            booking =>
                bookingMatchesDate(
                    booking,
                    dateMode
                )
        );


    if (search) {

        filtered =
            filtered.filter(
                booking =>
                    bookingMatchesSearch(
                        booking,
                        search
                    )
            );

    }


    setText(
        "booking-results-count",
        String(
            filtered.length
        )
    );


    updateActiveFilterLabel(
        search,
        dateMode,
        statusMode
    );


    const container =
        getElement(
            "bookings-container"
        );


    const empty =
        getElement(
            "bookings-empty"
        );


    const searchEmpty =
        getElement(
            "bookings-search-empty"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!filtered.length) {

        if (search) {

            if (searchEmpty) {
                searchEmpty.hidden = false;
            }

            if (empty) {
                empty.hidden = true;
            }

        } else {

            if (empty) {
                empty.hidden = false;
            }

            if (searchEmpty) {
                searchEmpty.hidden = true;
            }

        }

        return;

    }


    if (empty) {
        empty.hidden = true;
    }

    if (searchEmpty) {
        searchEmpty.hidden = true;
    }


    const groups =
        groupBookingsByDate(
            filtered
        );


    Object.keys(groups)
        .sort(
            compareDateStrings
        )
        .forEach(
            date => {

                container.appendChild(
                    createBookingDayGroup(
                        date,
                        groups[date]
                    )
                );

            }
        );

}


function updateActiveFilterLabel(
    search,
    dateMode,
    statusMode
) {

    const element =
        getElement(
            "booking-active-filter-label"
        );


    if (!element) {
        return;
    }


    const labels = [];


    const dateLabels = {

        today: "Oggi",

        tomorrow: "Domani",

        week: "Questa settimana",

        future: "Prossime corse",

        past: "Corse passate"

    };


    const statusLabels = {

        scheduled: "Programmate",

        completed: "Completate",

        cancelled: "Annullate"

    };


    if (
        dateMode !== "all" &&
        dateLabels[dateMode]
    ) {

        labels.push(
            dateLabels[dateMode]
        );

    }


    if (
        statusMode !== "all" &&
        statusLabels[statusMode]
    ) {

        labels.push(
            statusLabels[statusMode]
        );

    }


    if (search) {

        labels.push(
            'Ricerca: "' +
            search +
            '"'
        );

    }


    if (!labels.length) {

        element.hidden = true;

        return;

    }


    element.hidden = false;

    element.textContent =
        labels.join(
            " · "
        );

}


/* ============================================================
   GRUPPI PRENOTAZIONI
   ============================================================ */

function groupBookingsByDate(
    bookings
) {

    const groups = {};


    bookings.forEach(
        booking => {

            const date =
                booking.date ||
                "no-date";


            if (!groups[date]) {
                groups[date] = [];
            }


            groups[date].push(
                booking
            );

        }
    );


    Object.values(groups)
        .forEach(
            group =>
                group.sort(
                    compareBookingDateTime
                )
        );


    return groups;

}


function createBookingDayGroup(
    date,
    bookings
) {

    const group =
        createElement(
            "div",
            "booking-day-group"
        );


    const header =
        createElement(
            "div",
            "booking-day-header"
        );


    const title =
        createElement(
            "div",
            "booking-day-title"
        );


    const heading =
        createElement(
            "h3"
        );


    heading.textContent =
        formatBookingDate(
            date
        );


    const count =
        createElement(
            "span",
            "booking-day-count"
        );


    count.textContent =
        bookings.length +
        " " +
        (
            bookings.length === 1
                ? "corsa"
                : "corse"
        );


    title.appendChild(
        heading
    );

    title.appendChild(
        count
    );


    header.appendChild(
        title
    );


    const list =
        createElement(
            "div",
            "bookings-day-list"
        );


    bookings.forEach(
        booking => {

            list.appendChild(
                createBookingCard(
                    booking
                )
            );

        }
    );


    group.appendChild(
        header
    );

    group.appendChild(
        list
    );


    return group;

}


/* ============================================================
   CARD PRENOTAZIONE
   ============================================================ */

function createBookingCard(
    booking
) {

    const card =
        createElement(
            "article",
            "booking-card"
        );


    card.dataset.bookingId =
        booking.id || "";


    const top =
        createElement(
            "div",
            "booking-card-top"
        );


    const time =
        createElement(
            "div",
            "booking-card-time"
        );


    time.textContent =
        booking.time
            ? formatTime(
                booking.time
            )
            : "--:--";


    const client =
        createElement(
            "div",
            "booking-card-client"
        );


    client.textContent =
        getBookingClientName(
            booking
        );


    const status =
        createElement(
            "span",
            "booking-status"
        );


    status.textContent =
        getStatusLabel(
            getBookingStatus(
                booking
            )
        );


    top.appendChild(
        time
    );

    top.appendChild(
        client
    );

    top.appendChild(
        status
    );


    const route =
        createElement(
            "div",
            "booking-card-route"
        );


    const departure =
        createElement(
            "div"
        );


    departure.textContent =
        booking.departure ||
        "Partenza non specificata";


    const arrow =
        createElement(
            "span"
        );


    arrow.textContent =
        "→";


    const destination =
        createElement(
            "div"
        );


    destination.textContent =
        booking.destination ||
        "Destinazione non specificata";


    route.appendChild(
        departure
    );

    route.appendChild(
        arrow
    );

    route.appendChild(
        destination
    );


    const details =
        createElement(
            "div",
            "booking-card-details"
        );


    const passenger =
        createElement(
            "span"
        );


    passenger.textContent =
        formatPassengers(
            booking.passengers
        );


    details.appendChild(
        passenger
    );


    if (booking.phone) {

        const phone =
            createElement(
                "a"
            );


        phone.href =
            getTelLink(
                booking.phone
            );


        phone.textContent =
            formatPhone(
                booking.phone
            );


        phone.addEventListener(
            "click",
            event =>
                event.stopPropagation()
        );


        details.appendChild(
            phone
        );

    }


    if (booking.notes) {

        const notes =
            createElement(
                "span"
            );


        notes.textContent =
            truncateText(
                booking.notes,
                100
            );


        details.appendChild(
            notes
        );

    }


    const actions =
        createElement(
            "div",
            "booking-card-actions"
        );


    if (booking.phone) {

        const call =
            createElement(
                "a",
                "btn btn-small btn-secondary"
            );


        call.href =
            getTelLink(
                booking.phone
            );


        call.textContent =
            "Chiama";


        actions.appendChild(
            call
        );

    }


    const complete =
        createElement(
            "button",
            "btn btn-small btn-secondary"
        );


    complete.type =
        "button";


    if (
        getBookingStatus(
            booking
        ) === "completed"
    ) {

        complete.textContent =
            "Ripristina";

    } else {

        complete.textContent =
            "Completa";

    }


    complete.addEventListener(
        "click",
        function () {

            const status =
                getBookingStatus(
                    booking
                );


            updateBooking(
                booking.id,
                {
                    status:
                        status === "completed"
                            ? "scheduled"
                            : "completed"
                }
            );


            renderBookingsPage();

        }
    );


    actions.appendChild(
        complete
    );


    const deleteButton =
        createElement(
            "button",
            "btn btn-small btn-danger-outline"
        );


    deleteButton.type =
        "button";


    deleteButton.textContent =
        "Elimina";


    deleteButton.addEventListener(
        "click",
        function () {

            const confirmed =
                window.confirm(
                    "Vuoi eliminare definitivamente questa prenotazione?"
                );


            if (!confirmed) {
                return;
            }


            deleteBooking(
                booking.id
            );


            renderBookingsPage();

        }
    );


    actions.appendChild(
        deleteButton
    );


    card.appendChild(
        top
    );

    card.appendChild(
        route
    );

    card.appendChild(
        details
    );

    card.appendChild(
        actions
    );


    return card;

}


function createBookingListItem(
    booking
) {

    const item =
        createElement(
            "article",
            "today-ride-item"
        );


    const time =
        createElement(
            "div",
            "today-ride-time"
        );


    time.textContent =
        booking.time
            ? formatTime(
                booking.time
            )
            : "--:--";


    const content =
        createElement(
            "div",
            "today-ride-content"
        );


    const client =
        createElement(
            "strong"
        );


    client.textContent =
        getBookingClientName(
            booking
        );


    const route =
        createElement(
            "span"
        );


    route.textContent =
        (
            booking.departure ||
            "Partenza non specificata"
        ) +
        " → " +
        (
            booking.destination ||
            "Destinazione non specificata"
        );


    content.appendChild(
        client
    );

    content.appendChild(
        route
    );


    item.appendChild(
        time
    );

    item.appendChild(
        content
    );


    if (booking.phone) {

        const call =
            createElement(
                "a",
                "today-ride-call"
            );


        call.href =
            getTelLink(
                booking.phone
            );


        call.textContent =
            "Chiama";


        item.appendChild(
            call
        );

    }


    return item;

}


/* ============================================================
   CALENDARIO
   ============================================================ */

function initializeCalendarPage() {

    if (!requireAuthentication()) {
        return;
    }


    calendarCurrentDate =
        new Date();


    calendarSelectedDate =
        getTodayISO();


    const previous =
        getElement(
            "calendar-prev"
        );


    const next =
        getElement(
            "calendar-next"
        );


    const today =
        getElement(
            "calendar-today"
        );


    if (previous) {

        previous.addEventListener(
            "click",
            function () {

                calendarCurrentDate =
                    new Date(
                        calendarCurrentDate
                            .getFullYear(),
                        calendarCurrentDate
                            .getMonth() - 1,
                        1
                    );

                renderCalendar();

            }
        );

    }


    if (next) {

        next.addEventListener(
            "click",
            function () {

                calendarCurrentDate =
                    new Date(
                        calendarCurrentDate
                            .getFullYear(),
                        calendarCurrentDate
                            .getMonth() + 1,
                        1
                    );

                renderCalendar();

            }
        );

    }


    if (today) {

        today.addEventListener(
            "click",
            function () {

                calendarCurrentDate =
                    new Date();


                calendarSelectedDate =
                    getTodayISO();


                renderCalendar();

            }
        );

    }


    renderCalendar();

}


function renderCalendar() {

    const grid =
        getElement(
            "calendar-grid"
        );


    if (!grid) {
        return;
    }


    const year =
        calendarCurrentDate
            .getFullYear();


    const month =
        calendarCurrentDate
            .getMonth();


    const title =
        getElement(
            "calendar-month-title"
        );


    if (title) {

        const monthName =
            getMonthNameFromNumber(
                month
            );


        title.textContent =
            monthName +
            " " +
            year;

    }


    grid.innerHTML = "";


    /*
        JS getDay():
        domenica = 0
        lunedì = 1

        Per il calendario partiamo da lunedì.
    */

    const firstDay =
        new Date(
            year,
            month,
            1
        );


    let offset =
        firstDay.getDay() - 1;


    if (offset < 0) {
        offset = 6;
    }


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const bookings =
        getBookings();


    for (
        let index = 0;
        index < offset;
        index++
    ) {

        const empty =
            createElement(
                "div",
                "calendar-day empty"
            );


        grid.appendChild(
            empty
        );

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            formatDateISO(
                new Date(
                    year,
                    month,
                    day
                )
            );


        const dayBookings =
            bookings.filter(
                booking =>
                    booking.date === date
            );


        const cell =
            createElement(
                "button",
                "calendar-day"
            );


        cell.type =
            "button";


        cell.dataset.date =
            date;


        if (
            date === getTodayISO()
        ) {

            cell.classList.add(
                "today"
            );

        }


        if (
            date === calendarSelectedDate
        ) {

            cell.classList.add(
                "selected"
            );

        }


        const number =
            createElement(
                "span",
                "calendar-day-number"
            );


        number.textContent =
            String(day);


        cell.appendChild(
            number
        );


        if (dayBookings.length) {

            const count =
                createElement(
                    "span",
                    "calendar-count"
                );


            count.textContent =
                String(
                    dayBookings.length
                );


            cell.appendChild(
                count
            );


            const preview =
                createElement(
                    "span",
                    "calendar-booking-preview"
                );


            preview.textContent =
                getBookingClientName(
                    dayBookings[0]
                );


            cell.appendChild(
                preview
            );

        }


        cell.addEventListener(
            "click",
            function () {

                calendarSelectedDate =
                    date;

                renderCalendar();

            }
        );


        grid.appendChild(
            cell
        );

    }


    renderCalendarSummary(
        bookings
    );


    renderSelectedCalendarDay(
        bookings
    );

}


function renderCalendarSummary(
    bookings
) {

    const year =
        calendarCurrentDate
            .getFullYear();


    const month =
        calendarCurrentDate
            .getMonth();


    const monthBookings =
        bookings.filter(
            booking => {

                if (!booking.date) {
                    return false;
                }


                const parsed =
                    parseDateISO(
                        booking.date
                    );


                return parsed &&
                    parsed.getFullYear() === year &&
                    parsed.getMonth() === month;

            }
        );


    const element =
        getElement(
            "calendar-month-rides"
        );


    if (element) {

        element.textContent =
            String(
                monthBookings.length
            );

    }


}


function renderSelectedCalendarDay(
    bookings
) {

    const selected =
        calendarSelectedDate ||
        getTodayISO();


    const dayBookings =
        bookings
            .filter(
                booking =>
                    booking.date === selected
            )
            .sort(
                compareBookingDateTime
            );


    setText(
        "calendar-selected-date",
        formatBookingDate(
            selected
        )
    );


    const container =
        getElement(
            "calendar-day-rides"
        );


    const empty =
        getElement(
            "calendar-day-empty"
        );


    const nextRide =
        getElement(
            "calendar-next-ride"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!dayBookings.length) {

        if (empty) {
            empty.hidden = false;
        }

        if (nextRide) {
            nextRide.hidden = true;
        }

        return;

    }


    if (empty) {
        empty.hidden = true;
    }


    if (nextRide) {

        nextRide.hidden = false;

        nextRide.textContent =
            dayBookings[0].time
                ? formatTime(
                    dayBookings[0].time
                )
                : "--:--";

    }


    dayBookings.forEach(
        booking => {

            container.appendChild(
                createBookingListItem(
                    booking
                )
            );

        }
    );

}


/* ============================================================
   NUOVA PRENOTAZIONE
   ============================================================ */

function initializeAddBookingPage() {

    if (!requireAuthentication()) {
        return;
    }


    initializeBookingMethodSelector();

    initializeManualBookingForm();

    initializePassengerSelector();

    initializeBookingCounters();

    initializeVoiceInput();

    initializeWhatsAppInput();

    initializePreviewActions();

}


/* ============================================================
   SELETTORE METODO
   ============================================================ */

function initializeBookingMethodSelector() {

    const buttons =
        document.querySelectorAll(
            "[data-input-method]"
        );


    const panels =
        document.querySelectorAll(
            "[data-panel]"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const method =
                        button.dataset.inputMethod;


                    buttons.forEach(
                        item => {

                            const active =
                                item.dataset.inputMethod ===
                                method;


                            item.classList.toggle(
                                "active",
                                active
                            );


                            item.setAttribute(
                                "aria-selected",
                                active
                                    ? "true"
                                    : "false"
                            );

                        }
                    );


                    panels.forEach(
                        panel => {

                            const active =
                                panel.dataset.panel ===
                                method;


                            panel.classList.toggle(
                                "active",
                                active
                            );


                            panel.hidden =
                                !active;

                        }
                    );

                }
            );

        }
    );

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
                readBookingForm();


            const validation =
                validateBookingObject(
                    booking
                );


            if (!validation.valid) {

                showFormError(
                    getElement(
                        "booking-form-error"
                    ),
                    validation.errors.join(
                        " "
                    )
                );

                return;

            }


            hideFormError(
                getElement(
                    "booking-form-error"
                )
            );


            openBookingPreview(
                booking
            );

        }
    );

}


function readBookingForm() {

    return {

        firstName:
            cleanText(
                valueOf(
                    "booking-first-name"
                )
            ),

        lastName:
            cleanText(
                valueOf(
                    "booking-last-name"
                )
            ),

        phone:
            normalizePhone(
                valueOf(
                    "booking-phone"
                )
            ),

        departure:
            cleanText(
                valueOf(
                    "booking-departure"
                )
            ),

        destination:
            cleanText(
                valueOf(
                    "booking-destination"
                )
            ),

        date:
            cleanText(
                valueOf(
                    "booking-date"
                )
            ),

        time:
            normalizeTime(
                valueOf(
                    "booking-time"
                )
            ),

        passengers:
            normalizePassengers(
                valueOf(
                    "booking-passengers"
                )
            ),

        notes:
            cleanText(
                valueOf(
                    "booking-notes"
                )
            ),

        status:
            "scheduled"

    };

}


/* ============================================================
   PASSEGGERI
   ============================================================ */

function initializePassengerSelector() {

    const minus =
        getElement(
            "passengers-minus"
        );


    const plus =
        getElement(
            "passengers-plus"
        );


    const hidden =
        getElement(
            "booking-passengers"
        );


    const visible =
        getElement(
            "passengers-value"
        );


    function updatePassengers(
        value
    ) {

        let count =
            Number(
                value
            );


        if (!Number.isFinite(count)) {
            count = 1;
        }


        count =
            Math.max(
                1,
                Math.min(
                    99,
                    Math.round(
                        count
                    )
                )
            );


        if (hidden) {
            hidden.value =
                String(count);
        }


        if (visible) {

            const strong =
                visible.querySelector(
                    "strong"
                );


            const label =
                visible.querySelector(
                    "span"
                );


            if (strong) {
                strong.textContent =
                    String(count);
            }


            if (label) {

                label.textContent =
                    count === 1
                        ? "passeggero"
                        : "passeggeri";

            }

        }

    }


    if (minus) {

        minus.addEventListener(
            "click",
            function () {

                updatePassengers(
                    Number(
                        hidden
                            ? hidden.value
                            : 1
                    ) - 1
                );

            }
        );

    }


    if (plus) {

        plus.addEventListener(
            "click",
            function () {

                updatePassengers(
                    Number(
                        hidden
                            ? hidden.value
                            : 1
                    ) + 1
                );

            }
        );

    }


    updatePassengers(
        hidden
            ? hidden.value || 1
            : 1
    );

}


/* ============================================================
   CONTATORI TESTO
   ============================================================ */

function initializeBookingCounters() {

    const notes =
        getElement(
            "booking-notes"
        );


    const notesCount =
        getElement(
            "booking-notes-count"
        );


    if (notes && notesCount) {

        const update =
            function () {

                notesCount.textContent =
                    String(
                        notes.value.length
                    );

            };


        notes.addEventListener(
            "input",
            update
        );


        update();

    }


    const whatsapp =
        getElement(
            "whatsapp-message"
        );


    const whatsappCount =
        getElement(
            "whatsapp-message-count"
        );


    if (whatsapp && whatsappCount) {

        const update =
            function () {

                whatsappCount.textContent =
                    String(
                        whatsapp.value.length
                    );

            };


        whatsapp.addEventListener(
            "input",
            update
        );


        update();

    }

}


/* ============================================================
   WHATSAPP
   ============================================================ */

function initializeWhatsAppInput() {

    const processButton =
        getElement(
            "whatsapp-process-button"
        );


    const clearButton =
        getElement(
            "whatsapp-clear-button"
        );


    const textarea =
        getElement(
            "whatsapp-message"
        );


    const error =
        getElement(
            "whatsapp-parse-error"
        );


    if (processButton) {

        processButton.addEventListener(
            "click",
            function () {

                const text =
                    textarea
                        ? textarea.value.trim()
                        : "";


                if (!text) {

                    showFormError(
                        error,
                        "Incolla prima il messaggio WhatsApp."
                    );

                    return;

                }


                let result;


                try {

                    result =
                        parseWhatsAppMessage(
                            text
                        );

                } catch (parseError) {

                    console.error(
                        parseError
                    );


                    showFormError(
                        error,
                        "Non è stato possibile analizzare il messaggio."
                    );

                    return;

                }


                if (!result) {

                    showFormError(
                        error,
                        "Non sono riuscito a riconoscere i dati della corsa."
                    );

                    return;

                }


                const validation =
                    validateParsedReservation(
                        result
                    );


                if (!validation.valid) {

                    showFormError(
                        error,
                        validation.errors.join(
                            " "
                        )
                    );

                    return;

                }


                hideFormError(
                    error
                );


                const booking =
                    parsedResultToBooking(
                        result
                    );


                if (!booking) {

                    showFormError(
                        error,
                        "Dati non validi."
                    );

                    return;

                }


                if (!booking.passengers) {
                    booking.passengers = "1";
                }


                openBookingPreview(
                    booking
                );

            }
        );

    }


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                if (textarea) {
                    textarea.value = "";
                }


                const count =
                    getElement(
                        "whatsapp-message-count"
                    );


                if (count) {
                    count.textContent = "0";
                }


                hideFormError(
                    error
                );

            }
        );

    }

}


/* ============================================================
   VOCE
   ============================================================ */

function initializeVoiceInput() {

    const startButton =
        getElement(
            "voice-start-button"
        );


    const stopButton =
        getElement(
            "voice-stop-button"
        );


    const processButton =
        getElement(
            "voice-process-button"
        );


    const transcript =
        getElement(
            "voice-transcript"
        );


    const transcriptContainer =
        getElement(
            "voice-transcript-container"
        );


    const status =
        getElement(
            "voice-status"
        );


    const timer =
        getElement(
            "voice-timer"
        );


    if (!startButton) {
        return;
    }


    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        startButton.disabled =
            true;


        if (status) {

            status.textContent =
                "Il riconoscimento vocale non è supportato da questo browser. Puoi utilizzare l'inserimento manuale o WhatsApp.";

        }


        return;

    }


    recognitionInstance =
        new SpeechRecognition();


    recognitionInstance.lang =
        "it-IT";


    recognitionInstance.continuous =
        false;


    recognitionInstance.interimResults =
        true;


    recognitionInstance.maxAlternatives =
        1;


    recognitionInstance.onstart =
        function () {

            startButton.classList.add(
                "recording"
            );


            startButton.disabled =
                true;


            if (stopButton) {
                stopButton.hidden = false;
            }


            if (status) {

                status.textContent =
                    "Sto ascoltando...";

            }


            if (timer) {
                timer.hidden = false;
            }


            startRecognitionTimer();

        };


    recognitionInstance.onresult =
        function (event) {

            let finalText = "";

            let interimText = "";


            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                const result =
                    event.results[i];


                const text =
                    result[0].transcript;


                if (result.isFinal) {

                    finalText +=
                        text + " ";

                } else {

                    interimText +=
                        text + " ";

                }

            }


            const combined =
                cleanText(
                    finalText ||
                    interimText
                );


            if (transcript) {

                transcript.textContent =
                    combined;

            }


            if (
                transcriptContainer &&
                combined
            ) {

                transcriptContainer.hidden =
                    false;

            }

        };


    recognitionInstance.onerror =
        function (event) {

            stopRecognitionTimer();


            startButton.disabled =
                false;


            startButton.classList.remove(
                "recording"
            );


            if (stopButton) {
                stopButton.hidden = true;
            }


            if (timer) {
                timer.hidden = true;
            }


            if (status) {

                const messages = {

                    "not-allowed":
                        "Il browser non ha autorizzato l'accesso al microfono.",

                    "no-speech":
                        "Non ho rilevato alcuna voce.",

                    "audio-capture":
                        "Il microfono non è disponibile.",

                    "network":
                        "Il riconoscimento vocale richiede una connessione disponibile.",

                    "aborted":
                        "Registrazione interrotta."

                };


                status.textContent =
                    messages[event.error] ||
                    "Si è verificato un errore durante il riconoscimento vocale.";

            }

        };


    recognitionInstance.onend =
        function () {

            stopRecognitionTimer();


            startButton.disabled =
                false;


            startButton.classList.remove(
                "recording"
            );


            if (stopButton) {
                stopButton.hidden = true;
            }


            if (timer) {
                timer.hidden = true;
            }


            if (
                status &&
                transcript &&
                transcript.textContent.trim()
            ) {

                status.textContent =
                    "Controlla il testo riconosciuto e analizza la prenotazione.";

            }

        };


    startButton.addEventListener(
        "click",
        function () {

            try {

                if (transcript) {
                    transcript.textContent = "";
                }


                if (transcriptContainer) {
                    transcriptContainer.hidden = true;
                }


                recognitionInstance.start();

            } catch (error) {

                console.warn(
                    "CTL Manager - Avvio voce:",
                    error
                );

            }

        }
    );


    if (stopButton) {

        stopButton.addEventListener(
            "click",
            function () {

                try {

                    recognitionInstance.stop();

                } catch (error) {

                    console.warn(
                        error
                    );

                }

            }
        );

    }


    if (processButton) {

        processButton.addEventListener(
            "click",
            function () {

                const text =
                    transcript
                        ? transcript.textContent.trim()
                        : "";


                if (!text) {

                    if (status) {

                        status.textContent =
                            "Non c'è ancora un testo da analizzare.";

                    }

                    return;

                }


                try {

                    const result =
                        parseVoiceTranscript(
                            text
                        );


                    const validation =
                        validateParsedReservation(
                            result
                        );


                    if (!validation.valid) {

                        if (status) {

                            status.textContent =
                                validation.errors.join(
                                    " "
                                );

                        }

                        return;

                    }


                    const booking =
                        parsedResultToBooking(
                            result
                        );


                    if (!booking) {

                        if (status) {

                            status.textContent =
                                "Non sono riuscito a creare la prenotazione.";

                        }

                        return;

                    }


                    if (!booking.passengers) {
                        booking.passengers = "1";
                    }


                    openBookingPreview(
                        booking
                    );

                } catch (error) {

                    console.error(
                        error
                    );


                    if (status) {

                        status.textContent =
                            "Non è stato possibile analizzare la registrazione.";

                    }

                }

            }
        );

    }

}


function startRecognitionTimer() {

    recognitionStartedAt =
        Date.now();


    updateRecognitionTimer();


    recognitionTimer =
        window.setInterval(
            updateRecognitionTimer,
            1000
        );

}


function updateRecognitionTimer() {

    const timer =
        getElement(
            "voice-timer"
        );


    if (!timer || !recognitionStartedAt) {
        return;
    }


    const elapsed =
        Math.floor(
            (
                Date.now() -
                recognitionStartedAt
            ) / 1000
        );


    const minutes =
        String(
            Math.floor(
                elapsed / 60
            )
        ).padStart(
            2,
            "0"
        );


    const seconds =
        String(
            elapsed % 60
        ).padStart(
            2,
            "0"
        );


    timer.textContent =
        minutes +
        ":" +
        seconds;

}


function stopRecognitionTimer() {

    if (recognitionTimer) {

        window.clearInterval(
            recognitionTimer
        );

        recognitionTimer =
            null;

    }


    recognitionStartedAt =
        null;

}


/* ============================================================
   ANTEPRIMA
   ============================================================ */

function openBookingPreview(
    booking
) {

    currentPreviewBooking =
        normalizeBookingObject(
            booking
        );


    const panel =
        getElement(
            "booking-preview-panel"
        );


    if (!panel) {
        return;
    }


    renderBookingPreview(
        currentPreviewBooking
    );


    panel.hidden =
        false;


    const manual =
        getElement(
            "manual-input-panel"
        );


    const voice =
        getElement(
            "voice-input-panel"
        );


    const whatsapp =
        getElement(
            "whatsapp-input-panel"
        );


    /*
        Nascondiamo temporaneamente le modalità di inserimento
        mentre l'utente verifica i dati.
    */

    if (manual) {
        manual.hidden = true;
    }

    if (voice) {
        voice.hidden = true;
    }

    if (whatsapp) {
        whatsapp.hidden = true;
    }


    panel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


function renderBookingPreview(
    booking
) {

    const client =
        getBookingClientName(
            booking
        );


    setText(
        "preview-client",
        client || "Non specificato"
    );


    setText(
        "preview-departure",
        booking.departure ||
            "Non specificata"
    );


    setText(
        "preview-destination",
        booking.destination ||
            "Non specificata"
    );


    setText(
        "preview-date",
        booking.date
            ? formatBookingDate(
                booking.date
            )
            : "Non specificata"
    );


    setText(
        "preview-time",
        booking.time
            ? formatTime(
                booking.time
            )
            : "Non specificata"
    );


    setText(
        "preview-passengers",
        formatPassengers(
            booking.passengers
        )
    );


    const phoneRow =
        getElement(
            "preview-phone-row"
        );


    const phone =
        getElement(
            "preview-phone"
        );


    if (
        phoneRow &&
        phone
    ) {

        if (booking.phone) {

            phoneRow.hidden =
                false;


            phone.textContent =
                formatPhone(
                    booking.phone
                );


            phone.href =
                getTelLink(
                    booking.phone
                );

        } else {

            phoneRow.hidden =
                true;

        }

    }


    const notesRow =
        getElement(
            "preview-notes-row"
        );


    const notes =
        getElement(
            "preview-notes"
        );


    if (notesRow && notes) {

        if (booking.notes) {

            notesRow.hidden =
                false;


            notes.textContent =
                booking.notes;

        } else {

            notesRow.hidden =
                true;

        }

    }


    renderBlacklistWarning(
        booking
    );

}


function renderBlacklistWarning(
    booking
) {

    const warning =
        getElement(
            "blacklist-warning"
        );


    const text =
        getElement(
            "blacklist-warning-text"
        );


    if (!warning || !text) {
        return;
    }


    const match =
        findBlacklistedBooking(
            booking
        );


    if (!match) {

        warning.hidden =
            true;

        return;

    }


    warning.hidden =
        false;


    const customer =
        getBookingClientName(
            booking
        );


    const reason =
        match.reason ||
        "Motivo non specificato";


    text.textContent =
        (
            customer !== "Cliente"
                ? customer + " è "
                : "Il cliente è "
        ) +
        "presente nella blacklist." +
        " Motivo: " +
        reason;

}


function initializePreviewActions() {

    const editButton =
        getElement(
            "preview-edit-button"
        );


    const confirmButton =
        getElement(
            "preview-confirm-button"
        );


    const addAnother =
        getElement(
            "add-another-booking"
        );


    if (editButton) {

        editButton.addEventListener(
            "click",
            function () {

                closeBookingPreview();

            }
        );

    }


    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            confirmCurrentBooking
        );

    }


    if (addAnother) {

        addAnother.addEventListener(
            "click",
            resetBookingForm
        );

    }

}


function closeBookingPreview() {

    const panel =
        getElement(
            "booking-preview-panel"
        );


    if (panel) {
        panel.hidden = true;
    }


    const manual =
        getElement(
            "manual-input-panel"
        );


    const voice =
        getElement(
            "voice-input-panel"
        );


    const whatsapp =
        getElement(
            "whatsapp-input-panel"
        );


    /*
        Riportiamo visibile la modalità manuale.
        L'utente può comunque scegliere nuovamente
        voce o WhatsApp.
    */

    if (manual) {
        manual.hidden = false;
    }

    if (voice) {
        voice.hidden = true;
    }

    if (whatsapp) {
        whatsapp.hidden = true;
    }


    const methodButtons =
        document.querySelectorAll(
            "[data-input-method]"
        );


    methodButtons.forEach(
        button => {

            const active =
                button.dataset.inputMethod ===
                "manual";


            button.classList.toggle(
                "active",
                active
            );


            button.setAttribute(
                "aria-selected",
                active
                    ? "true"
                    : "false"
            );

        }
    );


    const panels =
        document.querySelectorAll(
            "[data-panel]"
        );


    panels.forEach(
        panelItem => {

            const active =
                panelItem.dataset.panel ===
                "manual";


            panelItem.classList.toggle(
                "active",
                active
            );


            panelItem.hidden =
                !active;

        }
    );


    currentPreviewBooking =
        null;

}


function confirmCurrentBooking() {

    if (!currentPreviewBooking) {
        return;
    }


    const booking =
        normalizeBookingObject(
            currentPreviewBooking
        );


    const validation =
        validateBookingObject(
            booking
        );


    if (!validation.valid) {

        window.alert(
            validation.errors.join(
                " "
            )
        );

        return;

    }


    const blacklistMatch =
        findBlacklistedBooking(
            booking
        );


    if (blacklistMatch) {

        const customer =
            getBookingClientName(
                booking
            );


        const confirmation =
            window.confirm(
                "ATTENZIONE\n\n" +
                (
                    customer !== "Cliente"
                        ? customer
                        : "Questo cliente"
                ) +
                " è presente nella blacklist.\n\n" +
                "Motivo: " +
                (
                    blacklistMatch.reason ||
                    "non specificato"
                ) +
                "\n\n" +
                "Vuoi confermare comunque la prenotazione?"
            );


        if (!confirmation) {
            return;
        }

    }


    const saved =
        addBooking(
            booking
        );


    if (!saved) {

        window.alert(
            "Non è stato possibile salvare la prenotazione."
        );

        return;

    }


    showBookingSuccess(
        saved
    );

}


function showBookingSuccess(
    booking
) {

    const preview =
        getElement(
            "booking-preview-panel"
        );


    const success =
        getElement(
            "booking-success-panel"
        );


    if (preview) {
        preview.hidden = true;
    }


    if (success) {
        success.hidden = false;
    }


    const message =
        getElement(
            "booking-success-message"
        );


    if (message) {

        const client =
            getBookingClientName(
                booking
            );


        const date =
            booking.date
                ? formatBookingDate(
                    booking.date
                )
                : "data non specificata";


        const time =
            booking.time
                ? formatTime(
                    booking.time
                )
                : "orario non specificato";


        message.textContent =
            client +
            " · " +
            date +
            " · " +
            time;

    }


    currentPreviewBooking =
        null;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* ============================================================
   RESET FORM
   ============================================================ */

function resetBookingForm() {

    const form =
        getElement(
            "booking-form"
        );


    if (form) {
        form.reset();
    }


    const passengers =
        getElement(
            "booking-passengers"
        );


    if (passengers) {
        passengers.value = "1";
    }


    const passengerValue =
        getElement(
            "passengers-value"
        );


    if (passengerValue) {

        const strong =
            passengerValue.querySelector(
                "strong"
            );


        const label =
            passengerValue.querySelector(
                "span"
            );


        if (strong) {
            strong.textContent = "1";
        }


        if (label) {
            label.textContent =
                "passeggero";
        }

    }


    const notesCount =
        getElement(
            "booking-notes-count"
        );


    if (notesCount) {
        notesCount.textContent = "0";
    }


    const whatsapp =
        getElement(
            "whatsapp-message"
        );


    if (whatsapp) {
        whatsapp.value = "";
    }


    const whatsappCount =
        getElement(
            "whatsapp-message-count"
        );


    if (whatsappCount) {
        whatsappCount.textContent = "0";
    }


    const transcript =
        getElement(
            "voice-transcript"
        );


    if (transcript) {
        transcript.textContent = "";
    }


    const transcriptContainer =
        getElement(
            "voice-transcript-container"
        );


    if (transcriptContainer) {
        transcriptContainer.hidden = true;
    }


    const preview =
        getElement(
            "booking-preview-panel"
        );


    const success =
        getElement(
            "booking-success-panel"
        );


    if (preview) {
        preview.hidden = true;
    }


    if (success) {
        success.hidden = true;
    }


    hideFormError(
        getElement(
            "booking-form-error"
        )
    );


    hideFormError(
        getElement(
            "whatsapp-parse-error"
        )
    );


    closeBookingPreview();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* ============================================================
   PROFILO
   ============================================================ */

function initializeProfilePage() {

    if (!requireAuthentication()) {
        return;
    }


    renderProfile();

    initializeProfileName();

    initializeThemeControls();

    initializeImportExport();

    initializeBlacklist();

    initializeReset();

}


function renderProfile() {

    const driverName =
        getDriverName();


    const initials =
        getInitials(
            driverName
        );


    setText(
        "profile-driver-name",
        driverName || "Autista"
    );


    setText(
        "profile-driver-initial",
        initials || "-"
    );


    setText(
        "header-driver-initial",
        initials || "-"
    );


    const bookings =
        getBookings();


    const total =
        bookings.length;


    const today =
        bookings.filter(
            booking =>
                booking.date ===
                getTodayISO()
        ).length;


    const year =
        new Date()
            .getFullYear();


    const yearCount =
        bookings.filter(
            booking => {

                const date =
                    parseDateISO(
                        booking.date
                    );


                return date &&
                    date.getFullYear() ===
                    year;

            }
        ).length;


    const month =
        new Date()
            .getMonth();


    const monthCount =
        bookings.filter(
            booking => {

                const date =
                    parseDateISO(
                        booking.date
                    );


                return date &&
                    date.getFullYear() ===
                    year &&
                    date.getMonth() ===
                    month;

            }
        ).length;


    setText(
        "profile-total-count",
        String(total)
    );


    setText(
        "profile-day-count",
        String(today)
    );


    setText(
        "profile-month-count",
        String(monthCount)
    );


    setText(
        "profile-year-count",
        String(yearCount)
    );


    renderBlacklist();

}


function initializeProfileName() {

    const input =
        getElement(
            "profile-driver-name-input"
        );


    const saveButton =
        getElement(
            "save-profile-name"
        );


    if (!input) {
        return;
    }


    input.value =
        getDriverName();


    function save() {

        const name =
            cleanText(
                input.value
            );


        if (!name) {

            window.alert(
                "Inserisci un nome valido."
            );

            input.focus();

            return;

        }


        setDriverName(
            name
        );


        /*
            Manteniamo sincronizzato il riferimento
            utilizzato da index.html.
        */

        try {

            localStorage.setItem(
                CTL_LEGACY_PROFILE_KEY,
                JSON.stringify({
                    driverName: name
                })
            );

        } catch (error) {

            console.warn(
                error
            );

        }


        renderProfile();

        window.alert(
            "Nome autista aggiornato."
        );

    }


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            save
        );

    }


    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                save();

            }

        }
    );

}


function initializeThemeControls() {

    const theme =
        getTheme();


    const controls = {

        light:
            getElement(
                "theme-light"
            ),

        dark:
            getElement(
                "theme-dark"
            ),

        system:
            getElement(
                "theme-system"
            )

    };


    Object.keys(controls)
        .forEach(
            key => {

                const input =
                    controls[key];


                if (!input) {
                    return;
                }


                input.checked =
                    theme === key;


                input.addEventListener(
                    "change",
                    function () {

                        if (
                            input.checked
                        ) {

                            changeTheme(
                                key
                            );

                        }

                    }
                );

            }
        );

}


/* ============================================================
   IMPORT / EXPORT
   ============================================================ */

function initializeImportExport() {

    const exportButton =
        getElement(
            "export-data-button"
        );


    const importButton =
        getElement(
            "import-data-button"
        );


    const fileInput =
        getElement(
            "import-data-file"
        );


    if (exportButton) {

        exportButton.addEventListener(
            "click",
            function () {

                const json =
                    exportStorageData();


                const filename =
                    "ctl-manager-backup-" +
                    getTodayISO() +
                    ".json";


                downloadFile(
                    filename,
                    json,
                    "application/json"
                );

            }
        );

    }


    if (importButton && fileInput) {

        importButton.addEventListener(
            "click",
            function () {

                fileInput.value = "";

                fileInput.click();

            }
        );


        fileInput.addEventListener(
            "change",
            function () {

                const file =
                    fileInput.files &&
                    fileInput.files[0];


                if (!file) {
                    return;
                }


                const reader =
                    new FileReader();


                reader.onload =
                    function (event) {

                        const content =
                            event.target.result;


                        const confirmed =
                            window.confirm(
                                "Importando un backup verranno sostituiti i dati attuali. Vuoi continuare?"
                            );


                        if (!confirmed) {
                            return;
                        }


                        const success =
                            importStorageData(
                                content
                            );


                        if (!success) {

                            window.alert(
                                "Il file non è valido o non è stato possibile importarlo."
                            );

                            return;

                        }


                        applySavedTheme();

                        renderProfile();


                        window.alert(
                            "Backup importato correttamente."
                        );

                    };


                reader.onerror =
                    function () {

                        window.alert(
                            "Errore durante la lettura del file."
                        );

                    };


                reader.readAsText(
                    file
                );

            }
        );

    }

}


/* ============================================================
   BLACKLIST
   ============================================================ */

function initializeBlacklist() {

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


            const phone =
                normalizePhone(
                    valueOf(
                        "blacklist-phone"
                    )
                );


            const reason =
                cleanText(
                    valueOf(
                        "blacklist-reason"
                    )
                );


            const error =
                getElement(
                    "blacklist-form-error"
                );


            if (!phone) {

                showFormError(
                    error,
                    "Il numero di telefono è obbligatorio."
                );

                return;

            }


            if (
                !isValidPhone(
                    phone
                )
            ) {

                showFormError(
                    error,
                    "Inserisci un numero di telefono valido."
                );

                return;

            }


            if (!reason) {

                showFormError(
                    error,
                    "Il motivo del blocco è obbligatorio."
                );

                return;

            }


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

                showFormError(
                    error,
                    "Questo numero è già presente nella blacklist."
                );

                return;

            }


            const name =
                cleanText(
                    valueOf(
                        "blacklist-name"
                    )
                );


            const route =
                cleanText(
                    valueOf(
                        "blacklist-route"
                    )
                );


            const saved =
                addBlacklistEntry({

                    name,
                    phone,
                    route,
                    reason

                });


            if (!saved) {

                showFormError(
                    error,
                    "Non è stato possibile salvare il contatto."
                );

                return;

            }


            form.reset();

            hideFormError(
                error
            );


            renderBlacklist();

        }
    );


    renderBlacklist();

}


function renderBlacklist() {

    const list =
        getElement(
            "blacklist-list"
        );


    const empty =
        getElement(
            "blacklist-empty"
        );


    const count =
        getElement(
            "blacklist-count"
        );


    if (!list) {
        return;
    }


    const entries =
        getBlacklist()
            .sort(
                function (a, b) {

                    return String(
                        a.name || ""
                    ).localeCompare(
                        String(
                            b.name || ""
                        ),
                        "it"
                    );

                }
            );


    list.innerHTML = "";


    if (count) {

        count.textContent =
            String(
                entries.length
            );

    }


    if (!entries.length) {

        if (empty) {
            empty.hidden = false;
        }

        return;

    }


    if (empty) {
        empty.hidden = true;
    }


    entries.forEach(
        entry => {

            list.appendChild(
                createBlacklistItem(
                    entry
                )
            );

        }
    );

}


function createBlacklistItem(
    entry
) {

    const item =
        createElement(
            "article",
            "blacklist-item"
        );


    item.dataset.id =
        entry.id || "";


    const header =
        createElement(
            "div",
            "blacklist-item-header"
        );


    const name =
        createElement(
            "strong",
            "blacklist-name"
        );


    name.textContent =
        entry.name ||
        "Cliente senza nome";


    const phone =
        createElement(
            "a",
            "blacklist-phone"
        );


    phone.href =
        getTelLink(
            entry.phone
        );


    phone.textContent =
        formatPhone(
            entry.phone
        );


    header.appendChild(
        name
    );


    header.appendChild(
        phone
    );


    const reason =
        createElement(
            "p",
            "blacklist-reason"
        );


    reason.textContent =
        entry.reason ||
        "Motivo non specificato";


    item.appendChild(
        header
    );


    if (entry.route) {

        const route =
            createElement(
                "p",
                "blacklist-route"
            );


        route.textContent =
            entry.route;


        item.appendChild(
            route
        );

    }


    item.appendChild(
        reason
    );


    const actions =
        createElement(
            "div",
            "blacklist-item-actions"
        );


    const removeButton =
        createElement(
            "button",
            "btn btn-small btn-danger-outline"
        );


    removeButton.type =
        "button";


    removeButton.textContent =
        "Rimuovi";


    removeButton.addEventListener(
        "click",
        function () {

            const confirmed =
                window.confirm(
                    "Vuoi rimuovere questo cliente dalla blacklist?"
                );


            if (!confirmed) {
                return;
            }


            deleteBlacklistEntry(
                entry.id
            );


            renderBlacklist();

        }
    );


    actions.appendChild(
        removeButton
    );


    item.appendChild(
        actions
    );


    return item;

}


/* ============================================================
   RESET APP
   ============================================================ */

function initializeReset() {

    const button =
        getElement(
            "reset-app-button"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            const firstConfirm =
                window.confirm(
                    "Vuoi davvero reimpostare CTL Manager?"
                );


            if (!firstConfirm) {
                return;
            }


            const secondConfirm =
                window.confirm(
                    "Questa operazione cancellerà prenotazioni, profilo, impostazioni e blacklist. Continuare?"
                );


            if (!secondConfirm) {
                return;
            }


            resetApplicationData();


            try {

                localStorage.removeItem(
                    CTL_LEGACY_PROFILE_KEY
                );

            } catch (error) {

                console.warn(
                    error
                );

            }


            window.location.replace(
                "login.html"
            );

        }
    );

}


/* ============================================================
   VALIDAZIONE PRENOTAZIONE
   ============================================================ */

function validateBookingObject(
    booking
) {

    const errors = [];


    if (!booking) {

        errors.push(
            "I dati della prenotazione non sono validi."
        );


        return {
            valid: false,
            errors
        };

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
        booking.phone &&
        !isValidPhone(
            booking.phone
        )
    ) {

        errors.push(
            "Il numero di telefono non è valido."
        );

    }


    if (
        booking.passengers &&
        (
            Number(
                booking.passengers
            ) < 1 ||
            Number(
                booking.passengers
            ) > 99
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
   BLACKLIST MATCHING
   ============================================================ */

function findBlacklistedBooking(
    booking
) {

    const blacklist =
        getBlacklist();


    if (!blacklist.length) {
        return null;
    }


    return blacklist.find(
        entry => {

            if (
                booking.phone &&
                entry.phone &&
                phonesMatch(
                    booking.phone,
                    entry.phone
                )
            ) {

                return true;

            }


            /*
                Se non c'è il telefono non blocchiamo
                sulla base del solo nome.
                Questo evita falsi positivi.
            */

            return false;

        }
    ) || null;

}


/* ============================================================
   NORMALIZZAZIONE PRENOTAZIONE
   ============================================================ */

function normalizeBookingObject(
    booking
) {

    return {

        firstName:
            cleanText(
                booking.firstName
            ),

        lastName:
            cleanText(
                booking.lastName
            ),

        phone:
            normalizePhone(
                booking.phone
            ),

        departure:
            cleanText(
                booking.departure
            ),

        destination:
            cleanText(
                booking.destination
            ),

        date:
            cleanText(
                booking.date
            ),

        time:
            normalizeTime(
                booking.time
            ),

        passengers:
            normalizePassengers(
                booking.passengers
            ),

        notes:
            cleanText(
                booking.notes
            ),

        status:
            booking.status ||
            "scheduled"

    };

}


function normalizePassengers(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "1";

    }


    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return "1";

    }


    return String(
        Math.max(
            1,
            Math.min(
                99,
                Math.round(
                    number
                )
            )
        )
    );

}


/* ============================================================
   STATI
   ============================================================ */

function getBookingStatus(
    booking
) {

    const status =
        String(
            booking?.status ||
            "scheduled"
        ).toLowerCase();


    if (
        status === "completed" ||
        status === "cancelled"
    ) {

        return status;

    }


    return "scheduled";

}


function getStatusLabel(
    status
) {

    const labels = {

        scheduled:
            "Programmata",

        completed:
            "Completata",

        cancelled:
            "Annullata"

    };


    return labels[status] ||
        "Programmata";

}


/* ============================================================
   FILTRI PRENOTAZIONI
   ============================================================ */

function bookingMatchesStatus(
    booking,
    status
) {

    if (
        !status ||
        status === "all"
    ) {

        return true;

    }


    return getBookingStatus(
        booking
    ) === status;

}


function bookingMatchesDate(
    booking,
    mode
) {

    if (
        !mode ||
        mode === "all"
    ) {

        return true;

    }


    if (!booking.date) {

        return mode === "past";

    }


    const today =
        getTodayISO();


    if (mode === "today") {

        return booking.date ===
            today;

    }


    if (mode === "tomorrow") {

        const tomorrow =
            formatDateISO(
                addDaysToDate(
                    new Date(),
                    1
                )
            );


        return booking.date ===
            tomorrow;

    }


    if (mode === "week") {

        const date =
            parseDateISO(
                booking.date
            );


        if (!date) {
            return false;
        }


        const now =
            new Date();


        const day =
            now.getDay();


        const mondayOffset =
            day === 0
                ? -6
                : 1 - day;


        const start =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );


        start.setDate(
            start.getDate() +
            mondayOffset
        );


        const end =
            new Date(
                start
            );


        end.setDate(
            end.getDate() + 6
        );


        return date >= start &&
            date <= end;

    }


    if (mode === "future") {

        return compareBookingToNow(
            booking
        ) >= 0;

    }


    if (mode === "past") {

        return compareBookingToNow(
            booking
        ) < 0;

    }


    return true;

}


function bookingMatchesSearch(
    booking,
    search
) {

    const values = [

        booking.firstName,

        booking.lastName,

        getBookingClientName(
            booking
        ),

        booking.phone,

        booking.departure,

        booking.destination,

        booking.notes

    ];


    return values
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(
            search
        );

}


/* ============================================================
   ORDINAMENTO
   ============================================================ */

function compareBookingDateTime(
    a,
    b
) {

    const aValue =
        getBookingTimestamp(
            a
        );


    const bValue =
        getBookingTimestamp(
            b
        );


    return aValue - bValue;

}


function compareDateStrings(
    a,
    b
) {

    if (a === "no-date") {
        return 1;
    }


    if (b === "no-date") {
        return -1;
    }


    return String(a)
        .localeCompare(
            String(b)
        );

}


function getBookingTimestamp(
    booking
) {

    if (!booking.date) {

        return Number.MAX_SAFE_INTEGER;

    }


    const date =
        parseDateISO(
            booking.date
        );


    if (!date) {

        return Number.MAX_SAFE_INTEGER;

    }


    if (booking.time) {

        const time =
            normalizeTime(
                booking.time
            );


        if (time) {

            const parts =
                time.split(
                    ":"
                );


            date.setHours(
                Number(
                    parts[0]
                ),
                Number(
                    parts[1]
                ),
                0,
                0
            );

        }

    }


    return date.getTime();

}


function compareBookingToNow(
    booking
) {

    const timestamp =
        getBookingTimestamp(
            booking
        );


    if (
        timestamp ===
        Number.MAX_SAFE_INTEGER
    ) {

        return 0;

    }


    return timestamp -
        Date.now();

}


function hasFutureDateTime(
    booking,
    now
) {

    const timestamp =
        getBookingTimestamp(
            booking
        );


    if (
        timestamp ===
        Number.MAX_SAFE_INTEGER
    ) {

        return false;

    }


    return timestamp >=
        now.getTime();

}


/* ============================================================
   FORMATTATORI
   ============================================================ */

function getBookingClientName(
    booking
) {

    const first =
        cleanText(
            booking?.firstName
        );


    const last =
        cleanText(
            booking?.lastName
        );


    const full =
        (
            first +
            " " +
            last
        ).trim();


    return full ||
        "Cliente";

}


function formatPassengers(
    value
) {

    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        ) ||
        number <= 0
    ) {

        return "1 passeggero";

    }


    return String(
        number
    ) +
    (
        number === 1
            ? " passeggero"
            : " passeggeri"
    );

}


function formatBookingDate(
    date
) {

    if (!date) {

        return "Data non specificata";

    }


    const parsed =
        parseDateISO(
            date
        );


    if (!parsed) {

        return "Data non specificata";

    }


    return formatLongDate(
        date
    );

}


function getMonthNameFromNumber(
    month
) {

    const months = [

        "Gennaio",

        "Febbraio",

        "Marzo",

        "Aprile",

        "Maggio",

        "Giugno",

        "Luglio",

        "Agosto",

        "Settembre",

        "Ottobre",

        "Novembre",

        "Dicembre"

    ];


    return months[
        month
    ] || "";

}


/* ============================================================
   UTILITÀ DOM
   ============================================================ */

function setText(
    id,
    value
) {

    const element =
        getElement(
            id
        );


    if (element) {

        element.textContent =
            value === null ||
            value === undefined
                ? ""
                : String(value);

    }

}


function valueOf(
    id
) {

    const element =
        getElement(
            id
        );


    return element
        ? element.value
        : "";

}


function showFormError(
    element,
    message
) {

    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.hidden =
        false;

}


function hideFormError(
    element
) {

    if (!element) {
        return;
    }


    element.textContent =
        "";


    element.hidden =
        true;

}


/* ============================================================
   DATE HELPER
   ============================================================ */

function addDaysToDate(
    date,
    days
) {

    const result =
        new Date(
            date
        );


    result.setDate(
        result.getDate() +
        days
    );


    return result;

}


/* ============================================================
   ESPOSIZIONE DEBUG
   ============================================================ */

window.CTLManager = {

    version:
        CTL_APP_VERSION,

    refresh:
        function () {

            const page =
                getCurrentPage();


            if (page === "home") {
                renderHome();
            }

            if (page === "prenotazioni") {
                renderBookingsPage();
            }

            if (page === "calendario") {
                renderCalendar();
            }

            if (page === "profilo") {
                renderProfile();
            }

        }

};
