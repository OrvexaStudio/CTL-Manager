(function () {
  "use strict";

  function pad(number) {
    return String(number).padStart(2, "0");
  }

  function today() {
    const d = new Date();

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function normalizePhone(value = "") {
    let digits = String(value).replace(/\D/g, "");

    if (digits.startsWith("0039")) {
      digits = digits.slice(4);
    }

    if (digits.startsWith("39") && digits.length >= 11) {
      digits = digits.slice(2);
    }

    if (!digits) {
      return "";
    }

    return `+39${digits}`;
  }

  function prettyPhone(value = "") {
    const phone = normalizePhone(value);

    if (!phone) return "";

    const digits = phone.slice(3);

    if (digits.length === 10) {
      return `+39 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }

    return phone;
  }

  function formatDate(date) {
    if (!date) return "Data non impostata";

    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(new Date(`${date}T12:00:00`));
  }

  function formatLongDate(date) {
    if (!date) return "Data non impostata";

    return new Intl.DateTimeFormat("it-IT", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(new Date(`${date}T12:00:00`));
  }

  function compareBookings(a, b) {
    const aa = `${a.date || "9999-12-31"} ${a.time || "99:99"}`;
    const bb = `${b.date || "9999-12-31"} ${b.time || "99:99"}`;

    return aa.localeCompare(bb);
  }

  function nextBooking(bookings) {
    const now = new Date();

    const candidates = bookings
      .filter(item => item.date)
      .map(item => ({
        item,
        value: new Date(`${item.date}T${item.time || "23:59"}:00`)
      }))
      .filter(item => item.value >= now)
      .sort((a, b) => a.value - b.value);

    return candidates[0]?.item || null;
  }

  function initials(name = "") {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0].toUpperCase())
      .join("") || "CT";
  }

  function uid() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function stats(bookings) {
    const now = new Date();
    const currentDay = today();
    const month = now.getMonth();
    const year = now.getFullYear();

    return {
      day: bookings.filter(item => item.date === currentDay).length,
      month: bookings.filter(item => {
        if (!item.date) return false;
        const d = new Date(`${item.date}T12:00:00`);
        return d.getMonth() === month && d.getFullYear() === year;
      }).length,
      year: bookings.filter(item => {
        if (!item.date) return false;
        return new Date(`${item.date}T12:00:00`).getFullYear() === year;
      }).length
    };
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.Utils = {
    pad,
    today,
    normalizePhone,
    prettyPhone,
    formatDate,
    formatLongDate,
    compareBookings,
    nextBooking,
    initials,
    uid,
    stats,
    escapeHtml
  };
})();
