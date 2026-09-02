(function () {
  "use strict";

  function requireOnboarding() {
    const data = CTLStorage.get();

    if (!data.driverName) {
      window.location.href = "login.html";
      return false;
    }

    return true;
  }

  function applyTheme() {
    const data = CTLStorage.get();
    const theme = data.theme || "system";
    const root = document.documentElement;

    if (theme === "dark") {
      root.dataset.theme = "dark";
      return;
    }

    if (theme === "light") {
      root.dataset.theme = "light";
      return;
    }

    const prefersDark = window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    root.dataset.theme = prefersDark ? "dark" : "light";
  }

  function refreshIcons() {
    /*
      Le pagine usano gli elementi SVG solo come markup statico.
      Questa funzione esiste per mantenere l'architettura pronta a eventuali
      icone aggiuntive senza dipendenze esterne.
    */
  }

  function bookingRow(booking, detailed = false) {
    const phone = booking.phone
      ? `<a href="tel:${Utils.escapeHtml(booking.phone)}">${Utils.escapeHtml(Utils.prettyPhone(booking.phone))}</a>`
      : `<span>Nessun telefono</span>`;

    return `
      <article class="booking-row">
        <div class="booking-time">
          ${Utils.escapeHtml(booking.time || "—")}
        </div>

        <div class="booking-route">
          <strong>${Utils.escapeHtml(booking.from || "Partenza non impostata")}</strong>
          <span>→ ${Utils.escapeHtml(booking.to || "Destinazione non impostata")}</span>
        </div>

        <div class="booking-client">
          <b>${Utils.escapeHtml(booking.name || "Cliente senza nome")}</b>
          ${phone}
          ${
            detailed && booking.passengers
              ? `<small>${Utils.escapeHtml(String(booking.passengers))} passeggeri</small>`
              : ""
          }
        </div>
      </article>
    `;
  }

  function findBlacklist(phone) {
    const normalized = Utils.normalizePhone(phone);

    if (!normalized) {
      return null;
    }

    const data = CTLStorage.get();

    return data.blacklist.find(
      item => Utils.normalizePhone(item.phone) === normalized
    ) || null;
  }

  function showBlacklistConfirm(blocked, onConfirm) {
    const existing = document.querySelector(".modal-backdrop");

    if (existing) {
      existing.remove();
    }

    const backdrop = document.createElement("div");

    backdrop.className = "modal-backdrop";

    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-icon">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round"
               stroke-linejoin="round">
            <path d="M10.3 3.2 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.2a2 2 0 0 0-3.4 0Z"/>
            <path d="M12 9v4"/>
            <path d="M12 17h.01"/>
          </svg>
        </div>

        <h3>Cliente in blacklist</h3>

        <p>
          Il numero <strong>${Utils.escapeHtml(Utils.prettyPhone(blocked.phone))}</strong>
          è presente nella blacklist.
        </p>

        ${
          blocked.name
            ? `<p><strong>Cliente:</strong> ${Utils.escapeHtml(blocked.name)}</p>`
            : ""
        }

        ${
          blocked.route
            ? `<p><strong>Tratta:</strong> ${Utils.escapeHtml(blocked.route)}</p>`
            : ""
        }

        <p>
          <strong>Motivazione:</strong> ${Utils.escapeHtml(blocked.reason)}
        </p>

        <p>
          Vuoi comunque confermare e aggiungere questa prenotazione?
        </p>

        <div class="modal-actions">
          <button class="btn btn-secondary" id="cancelBlacklist">
            Annulla
          </button>
          <button class="btn btn-danger" id="confirmBlacklist">
            Conferma prenotazione
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    document.getElementById("cancelBlacklist").onclick = () => {
      backdrop.remove();
    };

    document.getElementById("confirmBlacklist").onclick = () => {
      backdrop.remove();
      onConfirm();
    };

    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) {
        backdrop.remove();
      }
    });
  }

  function renderShell(active) {
    applyTheme();

    const app = document.getElementById("app");
    const todayLabel = new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "long"
    }).format(new Date());

    const pages = {
      home: {
        href: "home.html",
        label: "Home",
        icon: "⌂"
      },
      bookings: {
        href: "prenotazioni.html",
        label: "Corse",
        icon: "▦"
      },
      profile: {
        href: "profilo.html",
        label: "Profilo",
        icon: "○"
      }
    };

    app.innerHTML = `
      <div class="app-layout">
        <header class="topbar">
          <a class="topbar-brand" href="home.html">CTL <span>Manager</span></a>
          <span class="topbar-date">${todayLabel}</span>
        </header>

        <main class="app-main" id="pageContent"></main>

        <nav class="bottom-nav" aria-label="Navigazione principale">
          <a class="nav-item ${active === "home" ? "active" : ""}" href="home.html">
            <span style="font-size:20px;">⌂</span>
            <span>Home</span>
          </a>

          <a class="nav-item ${active === "bookings" ? "active" : ""}" href="prenotazioni.html">
            <span style="font-size:19px;">▦</span>
            <span>Corse</span>
          </a>

          <a class="nav-item nav-add" href="aggiungi-prenotazione.html" aria-label="Aggiungi prenotazione">
            <span style="font-size:29px; line-height:1;">+</span>
          </a>

          <a class="nav-item ${active === "profile" ? "active" : ""}" href="profilo.html">
            <span style="font-size:20px;">○</span>
            <span>Profilo</span>
          </a>

          <a class="nav-item" href="calendario.html">
            <span style="font-size:19px;">◫</span>
            <span>Calendario</span>
          </a>
        </nav>
      </div>
    `;
  }

  applyTheme();

  window.CTLApp = {
    requireOnboarding,
    applyTheme,
    refreshIcons,
    bookingRow,
    findBlacklist,
    showBlacklistConfirm,
    renderShell
  };
})();
