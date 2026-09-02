(function () {
  "use strict";

  const KEY = "ctlManager";

  const defaults = {
    driverName: "",
    introSeen: false,
    theme: "system",
    bookings: [],
    blacklist: []
  };

  function normalize(data) {
    const safe = data && typeof data === "object" ? data : {};

    return {
      ...defaults,
      ...safe,
      bookings: Array.isArray(safe.bookings) ? safe.bookings : [],
      blacklist: Array.isArray(safe.blacklist) ? safe.blacklist : []
    };
  }

  window.CTLStorage = {
    get() {
      try {
        return normalize(JSON.parse(localStorage.getItem(KEY) || "{}"));
      } catch {
        return normalize({});
      }
    },

    save(data) {
      const safe = normalize(data);
      localStorage.setItem(KEY, JSON.stringify(safe));
      return safe;
    },

    clear() {
      localStorage.removeItem(KEY);
    }
  };
})();
