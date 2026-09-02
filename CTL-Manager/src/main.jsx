import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Home, CalendarDays, UserRound, Plus, Phone, Moon, Sun, Monitor,
  Search, SlidersHorizontal, Mic, MicOff, MessageSquareText, Download,
  Upload, Trash2, X, Check, ChevronRight, CarFront, ShieldAlert,
  BarChart3, Edit3, Save, ArrowLeft, Info
} from "lucide-react";
import "./styles.css";

const STORAGE_KEY = "ctl-manager-v1";

const emptyState = {
  driverName: "",
  onboarded: false,
  theme: "system",
  bookings: [],
  blacklist: []
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptyState, ...JSON.parse(raw) } : emptyState;
  } catch {
    return emptyState;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePhone(value = "") {
  let s = String(value).replace(/[^\d+]/g, "");
  if (s.startsWith("0039")) s = "+39" + s.slice(4);
  if (s.startsWith("+39")) return "+39" + s.slice(3).replace(/\D/g, "");
  const digits = s.replace(/\D/g, "");
  if (digits.startsWith("39") && digits.length >= 11) return "+39" + digits.slice(2);
  if (digits.length >= 9) return "+39" + digits;
  return digits;
}

function displayPhone(value = "") {
  return normalizePhone(value);
}

function dateKey(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "Data non impostata";
  const d = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric"
  }).format(d);
}

function formatShortDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit", month: "2-digit", year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

function sortBookings(a, b) {
  return `${a.date || "9999-99-99"}T${a.time || "99:99"}`
    .localeCompare(`${b.date || "9999-99-99"}T${b.time || "99:99"}`);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Buonanotte";
  if (hour < 12) return "Buongiorno";
  if (hour < 18) return "Buon pomeriggio";
  return "Buonasera";
}

function parseDate(text) {
  const normalized = text.toLowerCase();
  if (/\bdomani\b/.test(normalized)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  if (/\boggi\b/.test(normalized)) return todayKey();

  let m = normalized.match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/);
  if (!m) m = normalized.match(/\b(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)(?:\s+(\d{4}))?\b/);
  if (!m) return "";
  const months = {
    gennaio:1,febbraio:2,marzo:3,aprile:4,maggio:5,giugno:6,luglio:7,
    agosto:8,settembre:9,ottobre:10,novembre:11,dicembre:12
  };
  if (m[2] && months[m[2]]) {
    const y = m[3] ? Number(m[3]) : new Date().getFullYear();
    return `${y}-${String(months[m[2]]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`;
  }
  const day = Number(m[1]), month = Number(m[2]);
  let year = m[3] ? Number(m[3]) : new Date().getFullYear();
  if (year < 100) year += 2000;
  return `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

function parseTime(text) {
  const patterns = [
    /\b(?:alle|ore|h)\s*(\d{1,2})(?:[:.](\d{2}))?\b/i,
    /\b(\d{1,2})[:.](\d{2})\b/,
    /\b(\d{1,2})\s*(?:e|:)\s*(\d{2})\b/i
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const h = Number(m[1]), min = Number(m[2] || 0);
      if (h <= 23 && min <= 59) return `${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}`;
    }
  }
  return "";
}

function parsePhone(text) {
  const matches = text.match(/(?:\+39|0039)?[\s.-]?(?:3\d{2})[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g);
  return matches?.[0] ? normalizePhone(matches[0]) : "";
}

function parsePassengers(text) {
  const m = text.match(/\b(\d{1,2})\s*(?:passeggeri|passenger|persone|posti)\b/i)
    || text.match(/\b(?:passeggeri|persone|posti)\s*[:\-]?\s*(\d{1,2})\b/i);
  return m ? Number(m[1]) : "";
}

function cleanAddress(s) {
  return s
    .replace(/\s+/g, " ")
    .replace(/[.,;]+$/, "")
    .trim();
}

function parseBookingText(text) {
  const raw = text.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").trim();
  const lower = raw.toLowerCase();
  const result = {
    name: "", phone: parsePhone(raw), from: "", to: "",
    date: parseDate(raw), time: parseTime(raw),
    passengers: parsePassengers(raw), notes: ""
  };

  const lineValue = (labels) => {
    const re = new RegExp(`(?:${labels.join("|")})\\s*[:=-]\\s*([^\\n]+)`, "i");
    const m = raw.match(re);
    return m ? cleanAddress(m[1]) : "";
  };

  result.name = lineValue(["nome e cognome", "nome", "cliente", "passeggero"]);
  result.from = lineValue(["partenza", "ritiro", "pickup", "da"]);
  result.to = lineValue(["arrivo", "destinazione", "destinazione finale", "a"]);
  result.notes = lineValue(["note", "nota", "extra", "informazioni"]);

  if (!result.from || !result.to) {
    const arrow = raw.match(/(.+?)\s*(?:->|→|>\s*|[-–—]\s+)\s*(.+)/);
    if (arrow) {
      const left = arrow[1].replace(/^(?:da|partenza)\s+/i, "");
      const right = arrow[2].replace(/^(?:a|arrivo|destinazione)\s+/i, "");
      if (!result.from) result.from = cleanAddress(left);
      if (!result.to) result.to = cleanAddress(right);
    }
  }

  if (!result.name) {
    const nameMatch = raw.match(/(?:cliente|passeggero)\s+([A-Za-zÀ-ÖØ-öø-ÿ'’-]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ'’-]+){1,2})/i);
    if (nameMatch) result.name = nameMatch[1].trim();
  }

  // Common WhatsApp prose: "Mario Rossi, 333..., da X a Y, domani alle 15"
  if (!result.from || !result.to) {
    const route = lower.match(/\b(?:da|partenza)\s+(.+?)\s+\b(?:a|arrivo|fino a|verso)\s+(.+?)(?=,|\.|\s+(?:domani|oggi|alle|ore)\b|$)/i);
    if (route) {
      if (!result.from) result.from = cleanAddress(route[1]);
      if (!result.to) result.to = cleanAddress(route[2]);
    }
  }

  if (!result.name && !result.phone) {
    const firstLine = raw.split("\n")[0];
    if (/^[A-Za-zÀ-ÖØ-öø-ÿ'’-]+\s+[A-Za-zÀ-ÖØ-öø-ÿ'’-]+(?:\s|,|$)/.test(firstLine)) {
      result.name = firstLine.split(/[,:]/)[0].trim();
    }
  }

  return result;
}

function isBlacklisted(phone, blacklist) {
  const p = normalizePhone(phone);
  if (!p) return null;
  return blacklist.find(x => normalizePhone(x.phone) === p) || null;
}

function App() {
  const [state, setState] = useState(loadState);
  const [page, setPage] = useState(() => location.hash.replace("#/", "") || "home");

  useEffect(() => saveState(state), [state]);
  useEffect(() => {
    const handler = () => setPage(location.hash.replace("#/", "") || "home");
    addEventListener("hashchange", handler);
    return () => removeEventListener("hashchange", handler);
  }, []);

  const navigate = (p) => {
    location.hash = `/${p}`;
  };

  const update = (patch) => setState(s => ({ ...s, ...patch }));

  useEffect(() => {
    if (!state.theme) return;
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  if (!state.driverName) {
    return <Onboarding state={state} update={update} />;
  }

  if (!state.onboarded) {
    return <Welcome onContinue={() => update({ onboarded: true })} />;
  }

  return (
    <div className="app-shell">
      <main className="page-content">
        {page === "home" && <HomePage state={state} navigate={navigate} />}
        {page === "bookings" && <BookingsPage state={state} update={update} navigate={navigate} />}
        {page === "calendar" && <CalendarPage state={state} navigate={navigate} />}
        {page === "add" && <AddBookingPage state={state} update={update} navigate={navigate} />}
        {page === "profile" && <ProfilePage state={state} update={update} />}
      </main>
      <BottomNav page={page} navigate={navigate} />
    </div>
  );
}

function Onboarding({ state, update }) {
  const [name, setName] = useState("");
  return (
    <div className="onboarding">
      <div className="brand-mark"><CarFront size={32}/></div>
      <div className="eyebrow">COOPERATIVA TAXI LECCE</div>
      <h1>CTL Manager</h1>
      <p>La tua gestione corse, semplice, locale e sempre a portata di mano.</p>
      <label className="field-label">Nome autista</label>
      <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Es. Marco Rossi" />
      <button className="primary full" disabled={!name.trim()} onClick={() => update({ driverName: name.trim() })}>
        Continua <ChevronRight size={18}/>
      </button>
      <small>I dati restano sul dispositivo e non vengono inviati a server.</small>
    </div>
  );
}

function Welcome({ onContinue }) {
  return (
    <div className="onboarding">
      <div className="brand-mark"><Info size={32}/></div>
      <div className="eyebrow">BENVENUTO IN CTL MANAGER</div>
      <h1>Tutto sotto controllo.</h1>
      <p>Gestisci prenotazioni, prossime corse, calendario, statistiche e clienti bloccati da un'unica app.</p>
      <div className="feature-list">
        <div><Check/> Inserimento manuale, vocale e da testo WhatsApp</div>
        <div><Check/> Controllo automatico della blacklist</div>
        <div><Check/> Dati locali, senza API e senza server</div>
        <div><Check/> Importazione ed esportazione per i backup</div>
      </div>
      <button className="primary full" onClick={onContinue}>Continua <ChevronRight size={18}/></button>
    </div>
  );
}

function BottomNav({ page, navigate }) {
  const items = [
    ["home", "Home", Home],
    ["bookings", "Prenotazioni", CalendarDays]
  ];
  return (
    <nav className="bottom-nav">
      {items.map(([key, label, Icon]) => (
        <button key={key} className={page === key ? "active" : ""} onClick={() => navigate(key)}>
          <Icon size={21}/><span>{label}</span>
        </button>
      ))}
      <button className="add-fab" onClick={() => navigate("add")} aria-label="Aggiungi prenotazione"><Plus size={27}/></button>
      <button className={page === "profile" ? "active" : ""} onClick={() => navigate("profile")}>
        <UserRound size={21}/><span>Profilo</span>
      </button>
    </nav>
  );
}

function HomePage({ state, navigate }) {
  const today = todayKey();
  const todayBookings = state.bookings.filter(b => b.date === today).sort(sortBookings);
  const now = new Date();
  const upcoming = todayBookings.find(b => b.time && new Date(`${b.date}T${b.time}`) >= now) || todayBookings[0];

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">CTL MANAGER</div>
          <h2>{greeting()}, {state.driverName.split(" ")[0]}.</h2>
        </div>
        <div className="avatar">{state.driverName.slice(0,1).toUpperCase()}</div>
      </header>

      <section className="hero-card">
        <div className="section-kicker">PROSSIMA CORSA</div>
        {upcoming ? (
          <>
            <div className="time-big">{upcoming.time || "—"}</div>
            <div className="route">
              <div><span>Partenza</span><strong>{upcoming.from || "Non indicata"}</strong></div>
              <div className="route-line"/>
              <div><span>Destinazione</span><strong>{upcoming.to || "Non indicata"}</strong></div>
            </div>
            {upcoming.phone && (
              <a className="primary call-btn" href={`tel:${normalizePhone(upcoming.phone)}`}><Phone size={18}/> Chiama cliente</a>
            )}
          </>
        ) : (
          <div className="empty-state">
            <CarFront size={28}/>
            <strong>Nessuna corsa in programma oggi</strong>
            <span>Puoi aggiungerne una con il pulsante +.</span>
          </div>
        )}
      </section>

      <section className="section-head">
        <div><span className="section-kicker">OGGI</span><h3>{todayBookings.length} {todayBookings.length === 1 ? "corsa" : "corse"}</h3></div>
        <button className="ghost" onClick={() => navigate("bookings")}>Vedi tutte <ChevronRight size={16}/></button>
      </section>

      <div className="booking-list compact">
        {todayBookings.map(b => <BookingRow key={b.id} booking={b}/>)}
      </div>

      <button className="primary add-large" onClick={() => navigate("add")}><Plus size={19}/> Aggiungi prenotazione</button>
    </>
  );
}

function BookingRow({ booking }) {
  return (
    <div className="booking-row">
      <div className="booking-time">{booking.time || "—"}</div>
      <div className="booking-route">
        <strong>{booking.from || "Partenza non indicata"}</strong>
        <span>{booking.to || "Destinazione non indicata"}</span>
      </div>
      {booking.phone && <a className="icon-btn" href={`tel:${normalizePhone(booking.phone)}`}><Phone size={17}/></a>}
    </div>
  );
}

function BookingsPage({ state, update, navigate }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = state.bookings
    .filter(b => {
      const q = query.toLowerCase();
      const matches = !q || [b.name,b.phone,b.from,b.to,b.notes].join(" ").toLowerCase().includes(q);
      const matchesFilter = filter === "all" || b.date === filter;
      return matches && matchesFilter;
    })
    .sort(sortBookings);

  const groups = useMemo(() => {
    return filtered.reduce((acc, b) => {
      const k = b.date || "senza-data";
      (acc[k] ||= []).push(b);
      return acc;
    }, {});
  }, [filtered]);

  const remove = (id) => update({ bookings: state.bookings.filter(b => b.id !== id) });

  return (
    <>
      <PageHeader title="Prenotazioni" subtitle={`${state.bookings.length} corse programmate`} />
      <div className="toolbar">
        <div className="searchbox"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cerca cliente, indirizzo, telefono..." /></div>
        <button className="secondary" onClick={() => navigate("calendar")}><CalendarDays size={17}/> Calendario</button>
      </div>
      <div className="filter-row">
        <button className={filter === "all" ? "chip active" : "chip"} onClick={() => setFilter("all")}><SlidersHorizontal size={14}/> Tutte</button>
        <button className={filter === todayKey() ? "chip active" : "chip"} onClick={() => setFilter(todayKey())}>Oggi</button>
        <button className="chip" onClick={() => setFilter(new Date(Date.now()+86400000).toISOString().slice(0,10))}>Domani</button>
      </div>
      {Object.keys(groups).length === 0 ? <div className="empty-panel">Nessuna prenotazione trovata.</div> : Object.entries(groups).map(([date, list]) => (
        <section className="day-group" key={date}>
          <div className="day-title">{date === "senza-data" ? "Senza data" : formatDate(date)}</div>
          {list.map(b => (
            <div className="booking-card" key={b.id}>
              <div className="card-time">{b.time || "—"}</div>
              <div className="card-main">
                <strong>{b.name || "Cliente non indicato"}</strong>
                <span>{b.from || "Partenza non indicata"} → {b.to || "Destinazione non indicata"}</span>
                {b.phone && <small>{displayPhone(b.phone)}</small>}
                {b.passengers && <small>{b.passengers} passeggeri</small>}
                {b.notes && <small>Note: {b.notes}</small>}
              </div>
              <button className="danger icon-btn" onClick={() => remove(b.id)} title="Elimina"><Trash2 size={17}/></button>
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

function CalendarPage({ state, navigate }) {
  const [cursor, setCursor] = useState(new Date());
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const start = (first.getDay() + 6) % 7;
  const counts = {};
  state.bookings.forEach(b => { if (b.date) counts[b.date] = (counts[b.date] || 0) + 1; });

  const cells = [];
  for (let i=0;i<start;i++) cells.push(<div className="cal-cell muted" key={`e${i}`}/>);
  for (let d=1;d<=days;d++) {
    const key = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    cells.push(
      <div className={`cal-cell ${key === todayKey() ? "today" : ""}`} key={key}>
        <span>{d}</span>
        {counts[key] ? <b>{counts[key]}</b> : null}
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Calendario" back={() => navigate("bookings")} />
      <div className="calendar-head">
        <button className="icon-btn" onClick={() => setCursor(new Date(year, month-1, 1))}>‹</button>
        <strong>{new Intl.DateTimeFormat("it-IT",{month:"long",year:"numeric"}).format(cursor)}</strong>
        <button className="icon-btn" onClick={() => setCursor(new Date(year, month+1, 1))}>›</button>
      </div>
      <div className="calendar">
        {["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].map(x => <div className="cal-week" key={x}>{x}</div>)}
        {cells}
      </div>
      <p className="hint"><Info size={15}/> Il numero dentro il giorno indica quante corse sono programmate.</p>
    </>
  );
}

function AddBookingPage({ state, update, navigate }) {
  const blank = { name:"", phone:"", from:"", to:"", date:todayKey(), time:"", passengers:"", notes:"" };
  const [form, setForm] = useState(blank);
  const [mode, setMode] = useState("manual");
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [warning, setWarning] = useState(null);

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const applyParsed = () => {
    const parsed = parseBookingText(text);
    setForm(f => ({...f, ...Object.fromEntries(Object.entries(parsed).filter(([,v]) => v !== "" && v != null))}));
  };

  const save = () => {
    const normalized = {...form, phone: normalizePhone(form.phone), id: uid(), createdAt: new Date().toISOString()};
    const blocked = isBlacklisted(normalized.phone, state.blacklist);
    if (blocked) {
      setWarning({booking: normalized, blocked});
      return;
    }
    update({bookings:[...state.bookings, normalized].sort(sortBookings)});
    navigate("bookings");
  };

  const confirmBlocked = () => {
    update({bookings:[...state.bookings, warning.booking].sort(sortBookings)});
    setWarning(null);
    navigate("bookings");
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La dettatura vocale non è supportata da questo browser. Puoi incollare il testo o usare il form manuale.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "it-IT";
    rec.continuous = false;
    rec.interimResults = false;
    setListening(true);
    rec.onresult = e => {
      const spoken = e.results[0][0].transcript;
      setText(spoken);
      const parsed = parseBookingText(spoken);
      setForm(f => ({...f, ...Object.fromEntries(Object.entries(parsed).filter(([,v]) => v !== "" && v != null))}));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <>
      <PageHeader title="Aggiungi prenotazione" back={() => navigate("home")} />
      <div className="mode-tabs">
        <button className={mode==="manual"?"active":""} onClick={()=>setMode("manual")}>Manuale</button>
        <button className={mode==="voice"?"active":""} onClick={()=>setMode("voice")}><Mic size={16}/> Voce</button>
        <button className={mode==="whatsapp"?"active":""} onClick={()=>setMode("whatsapp")}><MessageSquareText size={16}/> WhatsApp</button>
      </div>

      {mode !== "manual" && (
        <section className="input-tool">
          {mode === "voice" ? (
            <>
              <p>Parla naturalmente. Puoi dire cliente, telefono, partenza, destinazione, data, ora, passeggeri e note anche in ordine diverso.</p>
              <button className={listening ? "recording primary" : "primary"} onClick={startVoice}>
                {listening ? <><MicOff/> Ascolto in corso...</> : <><Mic/> Inizia dettatura</>}
              </button>
            </>
          ) : (
            <>
              <p>Copia il messaggio dalla chat WhatsApp e incollalo qui. Il parser cerca etichette, frasi naturali, date, orari, numeri e tratte in combinazioni diverse.</p>
              <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={"Esempio:\nMario Rossi 3331234567\nDomani alle 15:30\nDa Piazza Mazzini a Stazione Lecce\n2 passeggeri\nSeggiolino per bambino"} />
              <button className="secondary" disabled={!text.trim()} onClick={applyParsed}><Check size={17}/> Interpreta messaggio</button>
            </>
          )}
        </section>
      )}

      <div className="form-grid">
        <Field label="Nome e cognome"><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Non obbligatorio"/></Field>
        <Field label="Numero di telefono"><input inputMode="tel" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+39 333 1234567"/></Field>
        <Field label="Indirizzo di partenza"><input value={form.from} onChange={e=>set("from",e.target.value)} placeholder="Non obbligatorio"/></Field>
        <Field label="Indirizzo di arrivo"><input value={form.to} onChange={e=>set("to",e.target.value)} placeholder="Non obbligatorio"/></Field>
        <Field label="Data"><input type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></Field>
        <Field label="Ora"><input type="time" value={form.time} onChange={e=>set("time",e.target.value)}/></Field>
        <Field label="Numero passeggeri"><input type="number" min="1" max="99" value={form.passengers} onChange={e=>set("passengers",e.target.value)} placeholder="Non obbligatorio"/></Field>
        <Field label="Note extra" full><textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Seggiolino, bagagli, richieste particolari..."/></Field>
      </div>

      <button className="primary full save-booking" onClick={save}><Save size={18}/> Salva prenotazione</button>

      {warning && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="warning-icon"><ShieldAlert/></div>
            <h3>Cliente in blacklist</h3>
            <p>Il numero <strong>{displayPhone(warning.booking.phone)}</strong> corrisponde a un cliente bloccato.</p>
            <div className="blacklist-reason"><strong>Motivazione:</strong> {warning.blocked.reason}</div>
            <p>Vuoi comunque confermare e aggiungere questa prenotazione?</p>
            <div className="modal-actions">
              <button className="secondary" onClick={()=>setWarning(null)}>Annulla</button>
              <button className="primary" onClick={confirmBlocked}>Conferma prenotazione</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({label, children, full}) {
  return <label className={`field ${full ? "full-field" : ""}`}><span>{label}</span>{children}</label>;
}

function ProfilePage({ state, update }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.driverName);
  const [black, setBlack] = useState({name:"",phone:"",route:"",reason:""});
  const [showBlackForm, setShowBlackForm] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      day: state.bookings.filter(b => b.date === todayKey()).length,
      month: state.bookings.filter(b => b.date?.startsWith(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`)).length,
      year: state.bookings.filter(b => b.date?.startsWith(`${now.getFullYear()}-`)).length
    };
  }, [state.bookings]);

  const saveName = () => { update({driverName:name.trim() || state.driverName}); setEditing(false); };

  const addBlacklist = () => {
    if (!black.phone || !black.reason) return;
    update({blacklist:[...state.blacklist,{...black,id:uid(),phone:normalizePhone(black.phone)}]});
    setBlack({name:"",phone:"",route:"",reason:""});
    setShowBlackForm(false);
  };

  const removeBlack = id => update({blacklist:state.blacklist.filter(x=>x.id!==id)});

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state,null,2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ctl-manager-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported.bookings) || !Array.isArray(imported.blacklist)) throw new Error();
        update({...state,...imported});
        alert("Backup importato correttamente.");
      } catch { alert("File non valido. Usa un backup JSON esportato da CTL Manager."); }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <PageHeader title="Profilo" subtitle="Impostazioni e dati locali" />
      <section className="profile-card">
        <div className="profile-icon"><UserRound/></div>
        <div className="profile-info">
          <span>AUTISTA</span>
          {editing ? <input value={name} onChange={e=>setName(e.target.value)} /> : <h3>{state.driverName}</h3>}
        </div>
        {editing ? <button className="icon-btn" onClick={saveName}><Save/></button> : <button className="icon-btn" onClick={()=>setEditing(true)}><Edit3/></button>}
      </section>

      <section className="section-head"><div><span className="section-kicker">STATISTICHE</span><h3>Corse</h3></div></section>
      <div className="stats-grid">
        <Stat label="Oggi" value={stats.day}/><Stat label="Questo mese" value={stats.month}/><Stat label="Quest'anno" value={stats.year}/>
      </div>

      <section className="settings-section">
        <div className="section-head"><div><span className="section-kicker">APP</span><h3>Tema</h3></div></div>
        <div className="theme-picker">
          {[["light","Chiaro",Sun],["dark","Scuro",Moon],["system","Sistema",Monitor]].map(([key,label,Icon]) =>
            <button className={state.theme===key?"selected":""} key={key} onClick={()=>update({theme:key})}><Icon size={18}/>{label}</button>
          )}
        </div>
      </section>

      <section className="settings-section">
        <div className="section-head"><div><span className="section-kicker">DATI</span><h3>Backup locale</h3></div></div>
        <div className="data-actions">
          <button className="secondary" onClick={exportData}><Download size={17}/> Esporta dati</button>
          <label className="secondary"><Upload size={17}/> Importa dati<input type="file" accept="application/json,.json" onChange={importData} hidden/></label>
        </div>
      </section>

      <section className="settings-section">
        <div className="section-head">
          <div><span className="section-kicker">SICUREZZA</span><h3>Blacklist</h3></div>
          <button className="secondary" onClick={()=>setShowBlackForm(!showBlackForm)}><Plus size={16}/> Aggiungi</button>
        </div>
        <p className="hint">Il controllo usa il numero di telefono normalizzato, quindi riconosce sia +39 sia il numero senza prefisso.</p>
        {showBlackForm && (
          <div className="blacklist-form">
            <Field label="Nome e cognome"><input value={black.name} onChange={e=>setBlack({...black,name:e.target.value})}/></Field>
            <Field label="Numero di telefono *"><input value={black.phone} onChange={e=>setBlack({...black,phone:e.target.value})}/></Field>
            <Field label="Tratta"><input value={black.route} onChange={e=>setBlack({...black,route:e.target.value})}/></Field>
            <Field label="Motivazione *" full><textarea value={black.reason} onChange={e=>setBlack({...black,reason:e.target.value})}/></Field>
            <button className="primary full" disabled={!black.phone || !black.reason} onClick={addBlacklist}><Save size={17}/> Inserisci in blacklist</button>
          </div>
        )}
        {state.blacklist.length === 0 ? <div className="empty-panel">Nessun cliente in blacklist.</div> : state.blacklist.map(x => (
          <div className="black-item" key={x.id}>
            <ShieldAlert size={18}/>
            <div><strong>{x.name || "Cliente senza nome"}</strong><span>{displayPhone(x.phone)} · {x.reason}</span>{x.route && <small>{x.route}</small>}</div>
            <button className="danger icon-btn" onClick={()=>removeBlack(x.id)}><Trash2 size={16}/></button>
          </div>
        ))}
      </section>
    </>
  );
}

function Stat({label,value}) {
  return <div className="stat"><BarChart3 size={18}/><strong>{value}</strong><span>{label}</span></div>;
}

function PageHeader({title, subtitle, back}) {
  return (
    <header className="page-header">
      {back && <button className="icon-btn" onClick={back}><ArrowLeft/></button>}
      <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
    </header>
  );
}

createRoot(document.getElementById("root")).render(<App />);
