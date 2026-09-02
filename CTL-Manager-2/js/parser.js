(function () {
  "use strict";

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

  const labels = {
    name: [
      "nome e cognome",
      "nome cognome",
      "cliente",
      "passeggero",
      "passeggera",
      "nominativo",
      "intestato a"
    ],
    phone: [
      "telefono",
      "cellulare",
      "numero di telefono",
      "numero",
      "tel",
      "contatto"
    ],
    from: [
      "indirizzo di partenza",
      "luogo di partenza",
      "partenza",
      "ritiro",
      "pickup",
      "prelievo"
    ],
    to: [
      "indirizzo di arrivo",
      "luogo di arrivo",
      "destinazione",
      "arrivo",
      "dropoff",
      "drop off"
    ],
    notes: [
      "note extra",
      "nota extra",
      "note",
      "nota",
      "extra",
      "informazioni"
    ],
    passengers: [
      "numero passeggeri",
      "passeggeri",
      "passeggero",
      "persone",
      "posti",
      "clienti"
    ]
  };

  function clean(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/^[\s,;:.-]+|[\s,;:.-]+$/g, "")
      .trim();
  }

  function normalizeText(text) {
    return String(text || "")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getLabeled(text, list) {
    const escaped = list.map(item =>
      item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );

    const regex = new RegExp(
      `(?:^|[\\s,;])(?:${escaped.join("|")})\\s*(?:[:=\\-]|è|sono|sarebbe)?\\s+([^;|]+?)(?=\\s+(?:${allLabels()})(?:\\s|:|=)|[;|]|$)`,
      "i"
    );

    const match = text.match(regex);

    return match ? clean(match[1]) : "";
  }

  function allLabels() {
    return Object.values(labels)
      .flat()
      .map(label => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
  }

  function parsePhone(text) {
    const matches = text.match(
      /(?:\+39|0039)?[\s().-]*3\d{2}[\s().-]*\d{3,4}[\s().-]*\d{3,4}/g
    );

    if (!matches?.length) {
      return "";
    }

    return Utils.normalizePhone(matches[0]);
  }

  function parseTime(text) {
    const patterns = [
      /\b(?:alle|all'|ore|verso le|per le|h)\s*(\d{1,2})(?:[:.](\d{1,2}))?\b/i,
      /\b(\d{1,2})[:.](\d{2})\b/,
      /\b(\d{1,2})\s*(?:e|ed)\s*(\d{1,2})\b/i
    ];

    for (const regex of patterns) {
      const match = text.match(regex);

      if (!match) continue;

      let hour = Number(match[1]);
      let minute = Number(match[2] || 0);

      if (hour <= 23 && minute <= 59) {
        return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      }
    }

    return "";
  }

  function parseDate(text) {
    const lower = text.toLowerCase();

    if (/\boggi\b/.test(lower)) {
      return Utils.today();
    }

    if (/\bdomani\b/.test(lower)) {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return date.toISOString().slice(0, 10);
    }

    const dateMatch = lower.match(
      /\b(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?\b/
    );

    if (dateMatch) {
      let year = dateMatch[3]
        ? Number(dateMatch[3])
        : new Date().getFullYear();

      if (year < 100) year += 2000;

      return `${year}-${String(Number(dateMatch[2])).padStart(2, "0")}-${String(
        Number(dateMatch[1])
      ).padStart(2, "0")}`;
    }

    const monthMatch = lower.match(
      /\b(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)(?:\s+(\d{4}))?\b/
    );

    if (monthMatch) {
      const year = monthMatch[3]
        ? Number(monthMatch[3])
        : new Date().getFullYear();

      return `${year}-${String(MONTHS[monthMatch[2]]).padStart(2, "0")}-${String(
        Number(monthMatch[1])
      ).padStart(2, "0")}`;
    }

    for (const day of Object.keys(WEEKDAYS)) {
      if (new RegExp(`\\b${day}\\b`, "i").test(lower)) {
        const target = WEEKDAYS[day];
        const date = new Date();
        const current = date.getDay();

        let delta = target - current;

        if (delta <= 0) delta += 7;

        date.setDate(date.getDate() + delta);

        return date.toISOString().slice(0, 10);
      }
    }

    return "";
  }

  function parsePassengers(text) {
    const patterns = [
      /\b(\d{1,2})\s*(?:passeggeri|passegger[oi]|persone|posti|clienti)\b/i,
      /\b(?:passeggeri|passegger[oi]|persone|posti|clienti)\s*(?:sono|:|=|-)?\s*(\d{1,2})\b/i,
      /\b(?:in|con)\s+(\d{1,2})\s+(?:passeggeri|persone)\b/i
    ];

    for (const regex of patterns) {
      const match = text.match(regex);

      if (match) {
        return Number(match[1]);
      }
    }

    return "";
  }

  function parseName(text, phone) {
    const explicit = getLabeled(text, labels.name);

    if (explicit) {
      return explicit;
    }

    let cleanText = text;

    if (phone) {
      cleanText = cleanText.replace(
        /(?:\+39|0039)?[\s().-]*3\d{2}[\s().-]*\d{3,4}[\s().-]*\d{3,4}/g,
        " "
      );
    }

    const stop = new RegExp(
      `(?:\\b(?:${[
        "partenza",
        "ritiro",
        "pickup",
        "destinazione",
        "arrivo",
        "domani",
        "oggi",
        "alle",
        "ore",
        "telefono",
        "cellulare",
        "passeggeri",
        "persone",
        "note",
        "nota"
      ].join("|")})\\b)`,
      "i"
    );

    const candidate = cleanText.split(stop)[0];

    const match = candidate.match(
      /\b([A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ'’-]+(?:\s+[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ'’-]+){1,2})\b/
    );

    return match ? clean(match[1]) : "";
  }

  function parseRoute(text) {
    let from = getLabeled(text, labels.from);
    let to = getLabeled(text, labels.to);

    const explicitRoutePatterns = [
      /\b(?:da|partendo da|partenza da|ritiro da)\s+(.+?)\s+(?:a|verso|fino a|direzione)\s+(.+?)(?=\s+(?:oggi|domani|alle|ore|per le|con|telefono|cellulare|passeggeri|persone|note)\b|[.;]|$)/i,
      /\b(.+?)\s*(?:->|→|➜|⇒)\s*(.+?)(?=\s+(?:oggi|domani|alle|ore|per le|con|telefono|cellulare|passeggeri|persone|note)\b|[.;]|$)/i,
      /\bpartenza\s+(.+?)\s+destinazione\s+(.+?)(?=\s+(?:oggi|domani|alle|ore|con|telefono|passeggeri|persone|note)\b|[.;]|$)/i
    ];

    for (const regex of explicitRoutePatterns) {
      const match = text.match(regex);

      if (match) {
        from = from || clean(match[1]);
        to = to || clean(match[2]);
        break;
      }
    }

    return {
      from,
      to
    };
  }

  function parseNotes(text) {
    const explicit = getLabeled(text, labels.notes);

    if (explicit) {
      return explicit;
    }

    const noteMatch = text.match(
      /\b(?:con|senza)\s+(.+?)(?=\s+(?:domani|oggi|alle|ore|telefono|cellulare|partenza|destinazione)\b|$)/i
    );

    return noteMatch ? clean(noteMatch[1]) : "";
  }

  function parse(text) {
    text = normalizeText(text);

    const phone = parsePhone(text);
    const route = parseRoute(text);

    const result = {
      name: parseName(text, phone),
      phone,
      from: route.from,
      to: route.to,
      date: parseDate(text),
      time: parseTime(text),
      passengers: parsePassengers(text),
      notes: parseNotes(text)
    };

    return result;
  }

  window.CTLParser = {
    parse
  };
})();
