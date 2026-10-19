/*
 * Origami Security: security cards for Home Assistant in the Origami style. One card per layout, for a dashboard or a
 * pop-up: alarm, alerts, camera, cameras, rows, events, watch and summary. See the README for the options.
 *
 * type: custom:origami-security
 * layout: alarm
 * entity: alarm_control_panel.house
 */
const ORIGAMI_SECURITY_VERSION = "0.4.1";

const OS_OFF = ["unavailable", "unknown"];
const OS_LAYOUTS = ["alarm", "alerts", "camera", "cameras", "rows", "events", "watch", "summary"];

const OS_TEXT = {
  en: {
    alarm: "Alarm", offline: "Offline", linkOk: " · link OK", linkDown: " · link down", armedAt: "Armed: ", notArmed: "Not armed today",
    now: "now", alerts: "Alerts", off: "Off", homeMode: "Home", awayMode: "Away", modeState: "{name} mode",
    confirmOff: "Turn off the alerts?", confirmHome: "Turn on the alerts in Home mode?", confirmAway: "Turn on the alerts in Away mode?",
    camera: "Camera", live: "live", light: "Light", siren: "Siren", confirmLight: "Turn on the light?", confirmSiren: "Sound the siren?",
    motion: "Motion", clear: "Clear", noImage: "No image", cameras: "{n} cameras", loading: "Loading…", logUnavailable: "Log unavailable.",
    nothing: "Nothing since yesterday.", today: "Today", yesterday: "Yesterday", opened: "{name} opened", closedAfter: "Closed after {d}",
    stillOpen: "Still open", motionAt: "Motion · {name}", gas: "Gas detected", doorbell: "Doorbell rang", nightEnd: "End of night mode",
    later: "{what} {d} later", watch: "To check", offlineShort: "offline", check: "to check", at: " at ", colon: ": ",
    states: { disarmed: "Disarmed", armed_night: "Night", armed_home: "Home", armed_away: "Armed", armed_vacation: "Vacation",
              armed_custom_bypass: "Armed", triggered: "Triggered", pending: "Pending", arming: "Arming…", disarming: "Disarming…" },
    modes: { armed_night: "night", armed_home: "home", armed_away: "away", armed_vacation: "vacation", armed_custom_bypass: "custom" },
    titles: { disarmed: "Alarm disarmed", armed_night: "Alarm armed · night", armed_home: "Alarm armed · home", armed_away: "Alarm armed",
              armed_vacation: "Alarm armed · vacation", triggered: "Alarm triggered", offline: "Alarm offline" },
    events: { armed_night: "Alarm armed (night)", armed_home: "Alarm armed (home)", armed_away: "Alarm armed (away)",
              armed_vacation: "Alarm armed (vacation)", disarmed: "Alarm disarmed", triggered: "Alarm triggered" },
  },
  fr: {
    alarm: "Alarme", offline: "Hors ligne", linkOk: " · liaison OK", linkDown: " · liaison coupée", armedAt: "Armée : ",
    notArmed: "Pas armée aujourd'hui", now: "maintenant", alerts: "Alertes", off: "Coupées", homeMode: "Maison", awayMode: "Absence",
    modeState: "Mode {name}", confirmOff: "Couper les alertes ?", confirmHome: "Activer les alertes en mode Maison ?",
    confirmAway: "Activer les alertes en mode Absence ?", camera: "Caméra", live: "en direct", light: "Projecteur", siren: "Sirène",
    confirmLight: "Allumer le projecteur ?", confirmSiren: "Faire sonner la sirène ?", motion: "Mouvement", clear: "Calme",
    noImage: "Pas d'image", cameras: "{n} caméras", loading: "Chargement…", logUnavailable: "Journal indisponible.",
    nothing: "Rien depuis hier.", today: "Aujourd'hui", yesterday: "Hier", opened: "Ouverture · {name}", closedAfter: "Fermeture après {d}",
    stillOpen: "Toujours ouvert", motionAt: "Mouvement · {name}", gas: "Gaz détecté", doorbell: "On a sonné", nightEnd: "Fin du mode nuit",
    later: "{what} {d} plus tard", watch: "À surveiller", offlineShort: "hors ligne", check: "à vérifier", at: " à ", colon: " : ",
    states: { disarmed: "Désarmée", armed_night: "Nuit", armed_home: "Présence", armed_away: "Armée", armed_vacation: "Vacances",
              armed_custom_bypass: "Armée", triggered: "Déclenchée", pending: "En attente", arming: "Activation…", disarming: "Désactivation…" },
    modes: { armed_night: "nuit", armed_home: "présence", armed_away: "absence", armed_vacation: "vacances", armed_custom_bypass: "partielle" },
    titles: { disarmed: "Alarme désarmée", armed_night: "Alarme armée · nuit", armed_home: "Alarme armée · présence", armed_away: "Alarme armée",
              armed_vacation: "Alarme armée · vacances", triggered: "Alarme déclenchée", offline: "Alarme hors ligne" },
    events: { armed_night: "Alarme armée (nuit)", armed_home: "Alarme armée (présence)", armed_away: "Alarme armée (absence)",
              armed_vacation: "Alarme armée (vacances)", disarmed: "Alarme désarmée", triggered: "Alarme déclenchée" },
  },
};
const OS_EVENT_ICONS = {
  armed_night: ["mdi:shield-moon-outline", "ok"], armed_home: ["mdi:shield-home-outline", "ok"], armed_away: ["mdi:shield-lock-outline", "ok"],
  armed_vacation: ["mdi:shield-lock-outline", "ok"], disarmed: ["mdi:shield-outline", ""], triggered: ["mdi:shield-alert-outline", "error"],
};

function osEsc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function osFill(text, values) { return String(text).replace(/\{(\w+)\}/g, (_, k) => values[k] ?? ""); }
function osMidnight(days = 0) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days); return d; }
function osTime(d, loc) { return d.toLocaleTimeString(loc, { hour: "numeric", minute: "2-digit" }); }
function osDuration(s) {
  s = Math.max(0, Math.round(s));
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  return `${Math.floor(s / 3600)} h ${String(Math.round((s % 3600) / 60)).padStart(2, "0")}`;
}
function osTone(state) {
  if (state === "triggered") return "error";
  if (state === "pending" || state === "arming") return "warning";
  if (String(state).startsWith("armed")) return "ok";
  return OS_OFF.includes(state) ? "off" : "";
}
function osAlarmIcon(state, tone, idle) {
  if (tone === "error") return "mdi:shield-alert-outline";
  if (tone === "ok") return state === "armed_night" ? "mdi:shield-moon-outline" : "mdi:shield-check-outline";
  return tone === "off" ? "mdi:shield-off-outline" : idle;
}

const OrigamiSecurityBase = typeof HTMLElement !== "undefined" ? HTMLElement : class {};

class OrigamiSecurity extends OrigamiSecurityBase {
  setConfig(config) {
    if (!OS_LAYOUTS.includes(config?.layout)) throw new Error("origami-security: layout must be one of " + OS_LAYOUTS.join(", "));
    this._config = config;
    this._built = false;
    this._pictures = [];
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
  }

  getCardSize() { return 3; }
  getGridOptions() { return { columns: 12, rows: "auto" }; }

  set hass(hass) {
    const old = this._hass;
    this._hass = hass;
    try {
      if (!this._built) this._build();
      for (const el of this._pictures) el.hass = hass;
      this["_update_" + this._config.layout](old);
    } catch (e) {
      this._built = false;
      this.shadowRoot.innerHTML = `<ha-card style="padding:16px;color:var(--error-color,#c00)">origami-security v${ORIGAMI_SECURITY_VERSION}: ${osEsc(e?.message ?? e)}</ha-card>`;
    }
  }

  connectedCallback() {
    // The alarm history and the log are read again every 5 minutes while the card is on screen
    clearInterval(this._timer);
    this._timer = setInterval(() => { if (this._hass && this._built) this["_update_" + this._config.layout](null, true); }, 300000);
  }

  // Bubble Card rebuilds a pop-up's content when it opens, so a detached card starts over when it comes back
  disconnectedCallback() { clearInterval(this._timer); clearInterval(this._refresh); this._observer?.disconnect(); this._built = false; }

  _loc() { return this._hass?.locale?.language ?? this._hass?.language ?? "en"; }
  _t() { return OS_TEXT[String(this._loc()).slice(0, 2)] ?? OS_TEXT.en; }
  _q(sel) { return this.shadowRoot.querySelector(sel); }

  _build() {
    this._pictures = [];
    this._historyKey = undefined;
    this._events = null;
    this.shadowRoot.innerHTML = `<style>${ORIGAMI_SECURITY_CSS}</style>${this["_create_" + this._config.layout]()}`;
    this.shadowRoot.querySelector("ha-card").title = `origami-security v${ORIGAMI_SECURITY_VERSION}`;
    this._built = true;
    this["_wire_" + this._config.layout]?.();
  }

  // Actions go through hass-action like Bubble Card does, so Home Assistant shows its own confirmation dialog
  _call(service, entity, confirmation) {
    const tap = { action: "perform-action", perform_action: service, target: { entity_id: entity } };
    if (confirmation) tap.confirmation = { text: confirmation };
    const ev = new Event("hass-action", { bubbles: true, composed: true });
    ev.detail = { config: { entity, entity_id: entity, tap_action: tap }, action: "tap" };
    this.dispatchEvent(ev);
  }

  _moreInfo(entityId) {
    if (entityId) this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId } }));
  }

  _navigate(path) {
    history.pushState(null, "", path);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }

  _since(st) {
    const d = new Date(st?.last_changed ?? Date.now()), loc = this._loc();
    return d >= osMidnight() ? osTime(d, loc) : d.toLocaleDateString(loc, { day: "numeric", month: "numeric" }) + this._t().at + osTime(d, loc);
  }

  _template(text, st, label) {
    return String(text).replace(/\{(state|since|attr\.[\w]+)\}/g, (_, k) =>
      k === "state" ? label : k === "since" ? this._since(st) : st?.attributes?.[k.slice(5)] ?? "");
  }

  // Watches a part of the card, so images are only fetched while it is on screen
  _whenVisible(el, every, fetch) {
    this._visible = false;
    this._observer = new IntersectionObserver((entries) => {
      const seen = entries.some((x) => x.isIntersecting);
      if (seen && !this._visible) { this._visible = true; fetch(true); } else if (!seen) this._visible = false;
    });
    this._observer.observe(el);
    clearInterval(this._refresh);
    this._refresh = setInterval(() => { if (this._visible) fetch(); }, every);
  }

  // Sets a new signed picture URL, unless the previous one is still loading (some cameras take more than 10 s)
  _setPicture(box, img, url, key, force) {
    if (box.dataset.since && Date.now() - Number(box.dataset.since) < 45000) return;
    const wanted = `${url}${url.includes("?") ? "&" : "?"}t=${encodeURIComponent(key)}`;
    if (force || img.getAttribute("src") !== wanted) { box.dataset.since = String(Date.now()); img.setAttribute("src", wanted); }
  }

  _watchImage(box, img) {
    img.addEventListener("load", () => { box.classList.remove("loading", "failed"); delete box.dataset.since; });
    img.addEventListener("error", () => { box.classList.add("failed"); box.classList.remove("loading"); delete box.dataset.since; });
  }

  // --- summary -----------------------------------------------------------------------------------------------

  _create_summary() {
    return `<ha-card class="summary"><div class="sq big"><ha-icon></ha-icon></div>
      <div class="txt"><span class="title"></span><span class="state"></span></div>
      ${this._config.camera ? `<div class="mini loading"><img class="photo" alt="" decoding="async"><ha-icon icon="mdi:cctv"></ha-icon><i class="dot"></i><span class="count"></span></div>` : ""}</ha-card>`;
  }

  _wire_summary() {
    const c = this._config, card = this._q("ha-card");
    card.addEventListener("click", () => (c.navigation_path ? this._navigate(c.navigation_path) : this._moreInfo(c.entity)));
    const mini = this._q(".mini");
    if (!mini) return;
    this._watchImage(mini, mini.querySelector(".photo"));
    this._whenVisible(card, 30000, (force) => this._miniPicture(force));
  }

  _miniPicture(force) {
    const c = this._config, mini = this._q(".mini"), st = this._hass?.states?.[c.camera];
    if (!mini || !st) return;
    const img = mini.querySelector(".photo");
    const url = !OS_OFF.includes(st.state) ? st.attributes?.entity_picture : null;
    if (!url) { img.removeAttribute("src"); mini.classList.add("loading"); return; }
    this._setPicture(mini, img, url, Math.floor(Date.now() / 30000), force);
  }

  _update_summary() {
    const c = this._config, S = this._hass.states, t = this._t(), s = S[c.entity]?.state ?? "unavailable";
    const alert = (c.alerts ?? []).some((e) => S[e]?.state === "on");
    const tone = s === "triggered" || alert ? "error" : osTone(s);
    const card = this._q(".summary");
    if (card.dataset.tone !== tone) card.dataset.tone = tone;
    const title = t.titles[s] ?? (OS_OFF.includes(s) ? t.titles.offline : t.alarm + t.colon + (t.states[s] ?? s));
    if (this._q(".title").textContent !== title) this._q(".title").textContent = title;
    const line = c.line ? S[c.line]?.state ?? "" : "";
    if (this._q(".state").textContent !== line) this._q(".state").textContent = line;
    const icon = osAlarmIcon(s, tone, "mdi:shield-home-outline"), el = this._q(".sq ha-icon");
    if (el.getAttribute("icon") !== icon) el.setAttribute("icon", icon);
    const count = this._q(".mini .count");
    if (count) {
      const n = c.count ? S[c.count]?.state : null;
      const text = n != null && !OS_OFF.includes(n) ? String(n) : "";
      if (count.textContent !== text) count.textContent = text;
    }
    const dot = this._q(".mini .dot");
    if (dot) dot.className = "dot" + (c.motion && S[c.motion]?.state === "on" ? " alert" : "");
    if (this._visible) this._miniPicture();
  }

  // --- alarm: state and a bar of today's armed periods, read from the history -------------------------------

  _create_alarm() {
    return `<ha-card class="panel raised alarm"><div class="head"><div class="sq big"><ha-icon></ha-icon></div>
      <div class="txt"><span class="title"></span><span class="state"></span></div></div>
      <div class="bar"><div class="track"></div><div class="scale"></div></div></ha-card>`;
  }

  _wire_alarm() {
    const loc = this._loc();
    this._q(".title").textContent = this._config.name ?? this._t().alarm;
    this._q(".scale").innerHTML = [0, 6, 12, 18, 0].map((h) => `<span>${osEsc(new Date(2020, 0, 1, h).toLocaleTimeString(loc, { hour: "numeric" }))}</span>`).join("");
    this._q("ha-card").addEventListener("click", () => this._moreInfo(this._config.entity));
  }

  _update_alarm(old, timer) {
    const c = this._config, t = this._t(), st = this._hass.states[c.entity], s = st?.state ?? "unavailable";
    const link = c.connectivity ? this._hass.states[c.connectivity]?.state : null;
    const card = this._q(".alarm"), tone = osTone(s);
    if (card.dataset.tone !== tone) card.dataset.tone = tone;
    const text = (t.states[s] ?? t.offline) + (link ? (link === "on" ? t.linkOk : t.linkDown) : "");
    if (this._q(".state").textContent !== text) this._q(".state").textContent = text;
    const icon = osAlarmIcon(s, tone, "mdi:shield-outline"), el = this._q(".head ha-icon");
    if (el.getAttribute("icon") !== icon) el.setAttribute("icon", icon);
    const key = st?.last_changed ?? "";
    if (timer || key !== this._historyKey) {
      this._historyKey = key;
      this._readHistory();
    }
  }

  async _readHistory() {
    const c = this._config;
    try {
      const r = await this._hass.callWS({
        type: "history/history_during_period", start_time: osMidnight().toISOString(), end_time: new Date().toISOString(),
        entity_ids: [c.entity], minimal_response: true, no_attributes: true,
      });
      this._history = (r?.[c.entity] ?? []).map((p) => ({ s: p.s ?? p.state, t: p.lc ?? p.lu ? 1000 * (p.lc ?? p.lu) : Date.parse(p.last_changed) }));
    } catch (e) {
      this._history = null;
    }
    this._paintBar();
  }

  _paintBar() {
    const t = this._t(), loc = this._loc(), m0 = osMidnight().getTime(), day = 864e5, now = Date.now(), pts = this._history ?? [];
    // Armed in green, triggered in red, pending in orange; periods shorter than a minute are left out
    const segs = [];
    pts.forEach((p, i) => {
      const from = Math.max(p.t, m0), to = i + 1 < pts.length ? pts[i + 1].t : now, tone = osTone(p.s);
      if (["ok", "error", "warning"].includes(tone) && to - from >= 60000) segs.push({ from, to, tone, s: p.s, open: i + 1 === pts.length });
    });
    const track = this._q(".track");
    track.innerHTML = segs.map((g) =>
      `<i class="seg ${g.tone}" style="left:${((g.from - m0) / day * 100).toFixed(2)}%;width:${((g.to - g.from) / day * 100).toFixed(2)}%"></i>`).join("")
      + `<i class="now" style="left:${((now - m0) / day * 100).toFixed(2)}%"></i>`;
    const armed = segs.filter((g) => g.tone === "ok").map((g) =>
      `${osTime(new Date(g.from), loc)} → ${g.open ? t.now : osTime(new Date(g.to), loc)}${t.modes[g.s] ? ` (${t.modes[g.s]})` : ""}`);
    track.title = armed.length ? t.armedAt + armed.join(", ") : t.notArmed;
  }

  // --- alerts: a segmented control for an alarm panel, such as the alerts of a camera system ----------------

  _modes() {
    const t = this._t();
    return this._config.modes ?? [
      { state: "disarmed", name: t.off, icon: "mdi:bell-off-outline", service: "alarm_control_panel.alarm_disarm", confirm: t.confirmOff },
      { state: "armed_home", name: t.homeMode, icon: "mdi:home-outline", service: "alarm_control_panel.alarm_arm_home", confirm: t.confirmHome },
      { state: "armed_away", name: t.awayMode, icon: "mdi:location-exit", service: "alarm_control_panel.alarm_arm_away", confirm: t.confirmAway },
    ];
  }

  _create_alerts() {
    return `<ha-card class="panel muted alerts"><div class="head"><div class="sq"><ha-icon icon="${osEsc(this._config.icon ?? "mdi:video-outline")}"></ha-icon></div>
      <div class="txt"><span class="title m">${osEsc(this._config.name ?? this._t().alerts)}</span><span class="state"></span></div></div>
      <div class="modes">${this._modes().map((m, i) => `<button class="mode" data-i="${i}"><ha-icon icon="${osEsc(m.icon)}"></ha-icon><span>${osEsc(m.name)}</span></button>`).join("")}</div></ha-card>`;
  }

  _wire_alerts() {
    this._q(".head").addEventListener("click", () => this._moreInfo(this._config.entity));
    for (const b of this.shadowRoot.querySelectorAll(".mode")) {
      b.addEventListener("click", () => {
        const m = this._modes()[Number(b.dataset.i)];
        if (this._hass.states[this._config.entity]?.state !== m.state) this._call(m.service, this._config.entity, m.confirm);
      });
    }
  }

  _update_alerts() {
    const t = this._t(), s = this._hass.states[this._config.entity]?.state ?? "unavailable", modes = this._modes();
    const m = modes.find((x) => x.state === s);
    const text = m ? (m.state === "disarmed" ? m.name : osFill(t.modeState, { name: m.name })) : OS_OFF.includes(s) ? t.offline : s;
    if (this._q(".state").textContent !== text) this._q(".state").textContent = text;
    this.shadowRoot.querySelectorAll(".mode").forEach((b, i) => b.classList.toggle("active", modes[i].state === s));
  }

  // --- camera: a live picture-entity card with chips and a light and a siren on top --------------------------

  _create_camera() {
    const c = this._config, t = this._t();
    return `<ha-card class="camera"><div class="frame"><div class="video"></div>
      <span class="chip start"><i class="dot"></i><span class="label"></span></span><span class="chip end"></span>
      <div class="actions">
        ${c.light ? `<button class="btn light"><ha-icon icon="mdi:lightbulb-outline"></ha-icon><span>${osEsc(t.light)}</span></button>` : ""}
        ${c.siren ? `<button class="btn siren"><ha-icon icon="mdi:bell-outline"></ha-icon><span>${osEsc(t.siren)}</span></button>` : ""}
      </div></div></ha-card>`;
  }

  async _wire_camera() {
    const c = this._config, t = this._t();
    // Turning on asks for confirmation, turning off does not, so the siren stops with one tap
    this._q(".light")?.addEventListener("click", () => {
      const on = this._hass.states[c.light]?.state === "on";
      this._call(on ? "light.turn_off" : "light.turn_on", c.light, on ? null : t.confirmLight);
    });
    this._q(".siren")?.addEventListener("click", () => {
      const on = this._hass.states[c.siren]?.state === "on";
      this._call(on ? "siren.turn_off" : "siren.turn_on", c.siren, on ? null : t.confirmSiren);
    });
    const helpers = await window.loadCardHelpers?.();
    if (!helpers) return;
    const el = helpers.createCardElement({ type: "picture-entity", entity: c.camera, camera_view: "live", show_name: false,
      show_state: false, aspect_ratio: c.aspect ?? "16:9", tap_action: { action: "more-info" } });
    el.hass = this._hass;
    this._q(".video").prepend(el);
    this._pictures.push(el);
  }

  _update_camera() {
    const c = this._config, t = this._t(), S = this._hass.states;
    const online = !OS_OFF.includes(S[c.camera]?.state ?? "unavailable");
    const label = `${c.name ?? t.camera} · ${online ? t.live : t.offlineShort}`;
    if (this._q(".chip.start .label").textContent !== label) this._q(".chip.start .label").textContent = label;
    this._q(".chip.start .dot").className = "dot" + (online ? "" : " off");
    const motion = c.motion ? S[c.motion]?.state : null, end = this._q(".chip.end");
    const text = motion === "on" ? t.motion : motion && !OS_OFF.includes(motion) ? t.clear : "";
    if (end.textContent !== text) end.textContent = text;
    end.hidden = !text;
    end.classList.toggle("alert", motion === "on");
    this._q(".light")?.classList.toggle("on", S[c.light]?.state === "on");
    this._q(".siren")?.classList.toggle("on", S[c.siren]?.state === "on");
  }

  // --- cameras: snapshots refreshed every 10 s while on screen; a failed snapshot shows "No image" ----------

  _create_cameras() {
    const c = this._config, t = this._t(), cols = Number(c.columns) || 2;
    const ratio = (k) => String(k.aspect ?? c.aspect ?? "16:10").replace(":", " / ");
    const head = c.title ? `<div class="subhead"><span>${osEsc(c.title)}</span><span class="count"></span></div>` : "";
    return `<ha-card class="cameras ${cols >= 3 ? "small" : ""}">${head}<div class="grid" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">
      ${(c.cameras ?? []).map((k, i) => `<div class="thumb loading" data-i="${i}"><div class="pic" style="aspect-ratio:${ratio(k)}">
        <img class="photo" alt="" decoding="async">
        <div class="cover"><ha-icon icon="mdi:video-off-outline"></ha-icon><span class="no-image">${osEsc(t.noImage)}</span></div>
        <span class="badge"></span></div>
        <span class="name">${osEsc(k.name)}</span></div>`).join("")}</div></ha-card>`;
  }

  _wire_cameras() {
    this.shadowRoot.querySelectorAll(".thumb").forEach((v) => {
      this._watchImage(v, v.querySelector(".photo"));
      v.addEventListener("click", () => this._moreInfo(this._config.cameras[Number(v.dataset.i)].entity));
    });
    this._whenVisible(this._q(".grid"), 10000, (force) => this._thumbnails(force));
  }

  // Cameras get a new snapshot every 10 s; an image entity (picture) only when its state, the time of the image, changes
  _thumbnails(force) {
    const c = this._config, S = this._hass?.states ?? {}, slot = Math.floor(Date.now() / 10000);
    this.shadowRoot.querySelectorAll(".thumb").forEach((v) => {
      const k = c.cameras[Number(v.dataset.i)], src = k.picture ?? k.entity, st = S[src];
      const url = !OS_OFF.includes(S[k.entity]?.state ?? "unavailable") ? st?.attributes?.entity_picture : null;
      const img = v.querySelector(".photo");
      if (!url) { img.removeAttribute("src"); return; }
      this._setPicture(v, img, url, src.startsWith("image.") ? st.state : slot, force);
    });
  }

  _update_cameras() {
    const c = this._config, t = this._t(), S = this._hass.states, loc = this._loc();
    this.shadowRoot.querySelectorAll(".thumb").forEach((v) => {
      const k = c.cameras[Number(v.dataset.i)];
      v.classList.toggle("off", OS_OFF.includes(S[k.entity]?.state ?? "unavailable"));
      const motion = k.motion ? S[k.motion]?.state : null;
      let badge = k.badge ?? (motion === "on" ? t.motion : motion && !OS_OFF.includes(motion) ? t.clear : "");
      const when = k.picture ? new Date(S[k.picture]?.state) : null;
      if (when && !isNaN(when)) {
        badge += (badge ? " · " : "") + (when >= osMidnight() ? "" : when.toLocaleDateString(loc, { day: "numeric", month: "numeric" }) + " ") + osTime(when, loc);
      }
      const b = v.querySelector(".badge");
      if (b.textContent !== badge) b.textContent = badge;
      b.classList.toggle("alert", motion === "on" && !k.badge);
    });
    const count = this._q(".subhead .count");
    if (count) count.textContent = osFill(t.cameras, { n: (c.cameras ?? []).length });
    if (this._visible) this._thumbnails();
  }

  // --- rows: one row per entity, tinted in the color of its state ----------------------------------------------

  _create_rows() {
    return `<ha-card class="rows">${(this._config.rows ?? []).map((r, i) => `<div class="row" data-i="${i}">
      <div class="sq"><ha-icon icon="${osEsc(r.icon ?? "mdi:help-circle-outline")}"></ha-icon></div>
      <div class="txt"><span class="row-name">${osEsc(r.name)}</span><span class="state"></span></div><span class="aside"></span></div>`).join("")}</ha-card>`;
  }

  _wire_rows() {
    this.shadowRoot.querySelectorAll(".row").forEach((el) => {
      const r = this._config.rows[Number(el.dataset.i)];
      el.addEventListener("click", () => this._moreInfo(r.more_info ?? r.entity));
    });
  }

  _update_rows() {
    const S = this._hass.states, t = this._t();
    this.shadowRoot.querySelectorAll(".row").forEach((el) => {
      const r = this._config.rows[Number(el.dataset.i)], st = S[r.entity], s = st?.state ?? "unavailable";
      const off = OS_OFF.includes(s);
      const label = r.text_entity ? S[r.text_entity]?.state ?? "" : r.states?.[s] ?? (this._hass.formatEntityState ? this._hass.formatEntityState(st) : s);
      const text = off ? t.offline : r.text ? this._template(r.text, st, label) : label;
      const state = el.querySelector(".state");
      if (state.textContent !== text) state.textContent = text;
      const aside = r.right && !off ? this._template(r.right, st, label) : "";
      if (el.querySelector(".aside").textContent !== aside) el.querySelector(".aside").textContent = aside;
      const tone = off ? null : r.colors?.[s];
      el.classList.toggle("off", off);
      el.classList.toggle("tint", !!tone);
      if (tone) el.style.setProperty("--os-c", `var(--os-${tone}, ${tone})`); else el.style.removeProperty("--os-c");
    });
  }

  // --- events: the Home Assistant log since yesterday, in plain words --------------------------------------------

  _create_events() { return `<ha-card class="events"><div class="list"><div class="message">${osEsc(this._t().loading)}</div></div></ha-card>`; }

  _update_events(old, timer) {
    const ids = Object.keys(this._config.entities ?? {});
    const changed = !old || ids.some((id) => old.states[id]?.last_changed !== this._hass.states[id]?.last_changed);
    if (!timer && !changed && this._events) return;
    clearTimeout(this._pending);
    this._pending = setTimeout(() => this._readLog(), this._events ? 1500 : 0);
  }

  async _readLog() {
    const ents = this._config.entities ?? {}, ids = Object.keys(ents);
    const types = ids.map((id) => ents[id].type_entity).filter(Boolean);
    let r;
    try {
      // Three days back to know the state each entity started from; only yesterday and today are shown
      r = await this._hass.callWS({ type: "logbook/get_events", start_time: osMidnight(-3).toISOString(),
        end_time: new Date().toISOString(), entity_ids: [...ids, ...types] });
    } catch (e) {
      this._q(".list").innerHTML = `<div class="message">${osEsc(this._t().logUnavailable)}</div>`;
      return;
    }
    this._events = this._readEvents(r ?? []);
    this._paintLog();
  }

  _readEvents(list) {
    const t = this._t(), ents = this._config.entities ?? {}, out = [], from = osMidnight(-1).getTime();
    const byEntity = {};
    for (const e of list) (byEntity[e.entity_id] ??= []).push({ s: e.state, t: 1000 * e.when });
    for (const [id, spec] of Object.entries(ents)) {
      const items = byEntity[id] ?? [], name = spec.name ?? this._hass.states[id]?.attributes?.friendly_name ?? id;
      if (spec.kind === "doorbell") {
        // A "last event time" sensor: its value is the real time, and Home Assistant writes it again after a restart
        const kinds = (byEntity[spec.type_entity] ?? []).filter((x) => !OS_OFF.includes(x.s)).sort((a, b) => a.t - b.t), seen = new Set();
        const match = new RegExp(spec.match ?? "ring", "i");
        for (const e of items) {
          const time = Date.parse(String(e.s).replace(" ", "T"));
          if (!time || seen.has(e.s) || time < from) continue;
          seen.add(e.s);
          const last = kinds.filter((x) => x.t <= time + 10000).pop();
          const kind = spec.type_entity ? (last ? last.s : kinds.length ? null : this._hass.states[spec.type_entity]?.state) : "ring";
          if (kind && match.test(kind)) out.push({ t: time, id, what: spec.text ?? t.doorbell, detail: spec.detail ?? name, icon: "mdi:bell-ring-outline", tone: "" });
        }
        continue;
      }
      items.forEach((e, i) => {
        const before = i ? items[i - 1].s : undefined;
        if (OS_OFF.includes(e.s) || OS_OFF.includes(before)) return;
        // Home Assistant logs the same state again after a restart
        if (e.s === before) return;
        const next = items[i + 1];
        if (spec.kind === "opening" && e.s === "on") {
          const closed = items.slice(i + 1).find((x) => x.s === "off");
          out.push({ t: e.t, id, what: spec.text ?? osFill(t.opened, { name }), icon: spec.icon ?? "mdi:door-open", tone: "",
            detail: closed ? osFill(t.closedAfter, { d: osDuration((closed.t - e.t) / 1000) }) : t.stillOpen });
        } else if (spec.kind === "motion" && e.s === "on") {
          const last = out.filter((x) => x.id === id).pop();
          if (last && e.t - last.t < 120000) return;
          out.push({ t: e.t, id, what: spec.text ?? osFill(t.motionAt, { name }), detail: spec.detail ?? name, icon: "mdi:motion-sensor", tone: "" });
        } else if (spec.kind === "gas" && e.s === "on") {
          out.push({ t: e.t, id, what: spec.text ?? t.gas, detail: spec.detail ?? name, icon: "mdi:fire-alert", tone: "error" });
        } else if (spec.kind === "alarm" && !(i && items[i - 1].merged === e)) {
          const [icon, tone] = OS_EVENT_ICONS[e.s] ?? ["mdi:shield-outline", ""];
          const [what, ownIcon, ownTone] = spec.labels?.[e.s] ?? [t.events[e.s] ?? name + t.colon + e.s, icon, tone];
          let detail = e.s === "disarmed" && before === "armed_night" ? t.nightEnd : spec.details?.[e.s] ?? name;
          // Armed and disarmed again within a minute: one event
          if (next && !OS_OFF.includes(next.s) && next.t - e.t < 60000) {
            detail = osFill(t.later, { what: t.states[next.s] ?? next.s, d: osDuration((next.t - e.t) / 1000) });
            e.merged = next;
          }
          out.push({ t: e.t, id, what, detail, icon: ownIcon ?? icon, tone: ownTone ?? tone });
        }
      });
    }
    return out.filter((x) => x.t >= from).sort((a, b) => b.t - a.t).slice(0, this._config.max ?? 10);
  }

  _paintLog() {
    const t = this._t(), loc = this._loc(), today = osMidnight().getTime(), events = this._events ?? [];
    if (!events.length) {
      this._q(".list").innerHTML = `<div class="message">${osEsc(t.nothing)}</div>`;
      return;
    }
    let html = "", day = null;
    for (const e of events) {
      const label = e.t >= today ? t.today : t.yesterday;
      if (label !== day) { html += `<span class="day">${osEsc(label)}</span>`; day = label; }
      html += `<div class="item" data-id="${osEsc(e.id)}"><div class="sq sm ${e.tone}"><ha-icon icon="${osEsc(e.icon)}"></ha-icon></div>
        <div class="txt"><span class="what">${osEsc(e.what)}</span><span class="detail">${osEsc(e.detail)}</span></div>
        <span class="time">${osEsc(osTime(new Date(e.t), loc))}</span></div>`;
    }
    const list = this._q(".list");
    if (list.innerHTML !== html) {
      list.innerHTML = html;
      list.querySelectorAll(".item").forEach((el) => el.addEventListener("click", () => this._moreInfo(el.dataset.id)));
    }
  }

  // --- watch: devices that are offline or in a bad state; the card hides itself when there are none ------------

  _create_watch() {
    return `<ha-card class="watch"><div class="heading"><span class="heading-title">${osEsc(this._config.title ?? this._t().watch)}</span>
      <span class="heading-count"></span></div><div class="list"></div></ha-card>`;
  }

  _update_watch() {
    const S = this._hass.states, t = this._t();
    const found = (this._config.entities ?? []).filter((x) => (x.bad ?? OS_OFF).includes(S[x.entity]?.state ?? "unavailable"));
    const display = found.length ? "" : "none";
    if (this.style.display !== display) this.style.display = display;
    const html = found.map((x) => `<div class="item" data-id="${osEsc(x.entity)}"><div class="sq sm"><ha-icon icon="${osEsc(x.icon ?? "mdi:alert-outline")}"></ha-icon></div>
      <div class="txt"><span class="what">${osEsc(x.name ?? S[x.entity]?.attributes?.friendly_name ?? x.entity)}</span></div>
      <span class="time">${osEsc(OS_OFF.includes(S[x.entity]?.state ?? "unavailable") ? t.offlineShort : x.text ?? t.check)}</span></div>`).join("");
    const list = this._q(".list");
    if (list.innerHTML !== html) {
      list.innerHTML = html;
      list.querySelectorAll(".item").forEach((el) => el.addEventListener("click", () => this._moreInfo(el.dataset.id)));
    }
    this._q(".heading-count").textContent = found.length ? String(found.length) : "";
  }
}

const ORIGAMI_SECURITY_CSS = `
  :host { display: block;
    --os-fill: var(--fill-subtle, #eae8e4); --os-card: var(--ha-card-background, #ffffff);
    --os-text: var(--primary-text-color, #4a4640); --os-muted: var(--secondary-text-color, #77726a);
    --os-dark: var(--toggle-on, #5e5a54); --os-on-dark: var(--text-color-active, #ffffff);
    --os-ok: var(--ok-color, #758671); --os-warning: var(--warning-color, #b27c43); --os-error: var(--error-color, #a75050);
    --os-off: var(--disabled-color, #bdbdbd); --os-lamp: var(--lamp-color, var(--amber-color, #e6c68a));
    --os-shadow: var(--card-elevation-flat, 0 6px 18px rgba(74, 70, 64, 0.08));
    --os-r: var(--ha-card-border-radius, 22px); --os-ri: var(--radius-inner, 17px); }
  ha-card { background: none; box-shadow: none; border: 0; border-radius: 0; color: var(--os-text); }
  button { font: inherit; }
  .panel { border-radius: var(--os-r); padding: 16px; display: flex; flex-direction: column; gap: 14px; box-sizing: border-box; }
  .raised { background: var(--os-card); box-shadow: var(--os-shadow); cursor: pointer; }
  .muted { background: var(--os-fill); padding: 12px; gap: 12px; }
  .head { display: flex; align-items: center; gap: 14px; cursor: pointer; }
  .muted .head { padding: 0 4px; }
  .sq { width: 48px; height: 48px; flex: none; border-radius: var(--os-ri); background: var(--os-card);
    box-shadow: var(--tile-chip-shadow, none); display: flex; align-items: center; justify-content: center;
    --mdc-icon-size: 22px; color: var(--os-text); }
  .sq.big { width: 60px; height: 60px; --mdc-icon-size: 28px; background: var(--os-fill); box-shadow: none; }
  [data-tone="ok"] .sq.big { background: color-mix(in srgb, var(--os-ok) 22%, var(--os-card)); color: var(--os-ok); }
  [data-tone="error"] .sq.big { background: color-mix(in srgb, var(--os-error) 22%, var(--os-card)); color: var(--os-error); }
  [data-tone="warning"] .sq.big { background: color-mix(in srgb, var(--os-warning) 22%, var(--os-card)); color: var(--os-warning); }
  .txt { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .title { font-size: var(--ha-font-size-l, 20px); font-weight: var(--ha-font-weight-bold, 700); }
  .title.m { font-size: var(--ha-font-size-m, 16px); }
  .state { font-size: var(--ha-font-size-s, 14px); font-weight: 600; color: var(--os-muted);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .alarm[data-tone="ok"] .state { color: var(--os-ok); }
  .alarm[data-tone="error"] .state, .summary[data-tone="error"] .state { color: var(--os-error); }
  .alarm[data-tone="warning"] .state { color: var(--os-warning); }
  .track { position: relative; height: 10px; border-radius: 999px; background: var(--os-fill); overflow: hidden; }
  .seg { position: absolute; top: 0; bottom: 0; min-width: 3px; background: var(--os-ok); }
  .seg.error { background: var(--os-error); }
  .seg.warning { background: var(--os-warning); }
  .now { position: absolute; top: 0; bottom: 0; width: 3px; margin-left: -1px; background: var(--os-dark); }
  .scale { display: flex; justify-content: space-between; margin-top: 6px; font-size: 12px; font-weight: 600; color: var(--os-muted); }

  .modes { height: 52px; box-sizing: border-box; border-radius: 18px; background: var(--os-card); padding: 5px;
    display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; }
  .mode { border: 0; margin: 0; padding: 0; background: none; cursor: pointer; border-radius: 14px; color: var(--os-text);
    display: flex; align-items: center; justify-content: center; gap: 7px; font-size: 15px; font-weight: 700;
    --mdc-icon-size: 18px; min-width: 0; -webkit-tap-highlight-color: transparent; }
  .mode span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mode.active { background: var(--os-dark); color: var(--os-on-dark); cursor: default; }

  .frame { position: relative; border-radius: 28px; overflow: hidden; background: var(--os-fill); box-shadow: var(--os-shadow); min-height: 120px; }
  .video { line-height: 0; }
  .chip { position: absolute; top: 14px; z-index: 2; height: 34px; box-sizing: border-box; border-radius: 999px;
    background: rgba(30, 28, 25, 0.42); padding: 0 14px; display: flex; align-items: center; gap: 8px;
    font-size: 14px; font-weight: 700; color: #ffffff; pointer-events: none; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
  .chip.start { left: 14px; padding-left: 10px; }
  .chip.end { right: 14px; }
  .chip[hidden] { display: none; }
  .chip.alert, .badge.alert { background: color-mix(in srgb, var(--os-warning) 85%, transparent); }
  .dot { width: 9px; height: 9px; border-radius: 999px; background: var(--os-ok); }
  .dot.off { background: var(--os-off); }
  .actions { position: absolute; left: 14px; right: 14px; bottom: 14px; z-index: 2; display: flex; gap: 10px; }
  .btn { flex: 1 1 0; height: 48px; border: 0; margin: 0; cursor: pointer; border-radius: 16px; background: rgba(255, 255, 255, 0.88);
    color: #4a4640; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; font-weight: 700;
    --mdc-icon-size: 20px; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); -webkit-tap-highlight-color: transparent; }
  .btn.light.on { background: var(--os-lamp); color: var(--on-amber, #2f2d2a); }
  .btn.siren.on { background: var(--os-error); color: #ffffff; }

  .subhead { display: flex; align-items: center; justify-content: space-between; padding: 6px 4px 10px;
    font-size: 16px; font-weight: 700; color: var(--os-muted); }
  .subhead .count { font-size: 14px; font-weight: 600; }
  .grid { display: grid; gap: 12px; }
  .small .grid { gap: 10px; }
  .thumb { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
  .pic { position: relative; border-radius: 22px; overflow: hidden; background: var(--os-fill); line-height: 0; cursor: pointer; }
  .small .pic { border-radius: 18px; }
  .photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .thumb.loading .photo, .thumb.failed .photo, .thumb.off .photo { visibility: hidden; }
  .cover { display: none; position: absolute; inset: 0; z-index: 1; flex-direction: column; gap: 4px; align-items: center;
    justify-content: center; background: var(--os-fill); color: var(--os-muted); --mdc-icon-size: 22px; line-height: 1; }
  .thumb.off .cover, .thumb.failed .cover { display: flex; }
  .no-image { display: none; font-size: 12px; font-weight: 600; }
  .thumb.failed:not(.off) .no-image { display: block; }
  .thumb.failed:not(.off) .cover ha-icon { display: none; }
  .badge { position: absolute; left: 10px; bottom: 10px; z-index: 2; height: 26px; max-width: calc(100% - 20px); box-sizing: border-box;
    border-radius: 999px; background: rgba(30, 28, 25, 0.42); padding: 0 10px; display: flex; align-items: center; font-size: 12px;
    font-weight: 700; color: #ffffff; pointer-events: none; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .badge:empty, .thumb.off .badge { display: none; }
  .name { font-size: 15px; font-weight: 700; padding: 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
  .small .name { font-size: 13px; }
  .thumb.off .name { color: var(--os-muted); }

  .rows { display: flex; flex-direction: column; gap: 10px; }
  .row { height: 68px; box-sizing: border-box; border-radius: 24px; background: var(--os-fill); padding: 10px 16px 10px 10px;
    display: flex; align-items: center; gap: 14px; cursor: pointer; }
  .row-name { font-size: 17px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row.off .row-name { opacity: 0.55; }
  .row.tint { background: color-mix(in srgb, var(--os-c) 18%, var(--os-fill)); }
  .row.tint .state, .row.tint .sq { color: var(--os-c); }
  .aside { font-size: 15px; font-weight: 700; color: var(--os-muted); white-space: nowrap; }

  .events .list, .watch .list { border-radius: 26px; background: var(--os-fill); padding: 8px; display: flex; flex-direction: column; }
  .day { font-size: 13px; font-weight: 700; color: var(--os-muted); padding: 8px 10px 2px; }
  .item { display: flex; align-items: center; gap: 12px; padding: 7px 8px; cursor: pointer; }
  .sq.sm { width: 40px; height: 40px; border-radius: 13px; --mdc-icon-size: 19px; }
  .sq.sm.ok { background: color-mix(in srgb, var(--os-ok) 22%, var(--os-card)); color: var(--os-ok); }
  .sq.sm.error { background: color-mix(in srgb, var(--os-error) 22%, var(--os-card)); color: var(--os-error); }
  .what { font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .detail { font-size: 13px; font-weight: 600; color: var(--os-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .time { font-size: 14px; font-weight: 700; color: var(--os-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .message { padding: 14px 10px; font-size: 14px; font-weight: 600; color: var(--os-muted); }
  .heading { display: flex; align-items: center; justify-content: space-between; padding: var(--ha-space-6, 24px) 4px var(--ha-space-2, 8px) 0; }
  .heading-title { font-size: var(--ha-font-size-l, 20px); font-weight: var(--ha-font-weight-bold, 700); }
  .heading-count { font-size: var(--ha-font-size-m, 16px); font-weight: 700; color: var(--os-muted); }

  ha-card.summary { display: flex; align-items: center; gap: 14px; height: 92px; box-sizing: border-box; padding: 14px;
    border-radius: 30px; background: var(--os-card); box-shadow: var(--os-shadow); cursor: pointer; }
  .summary .sq.big { width: 56px; height: 56px; border-radius: 18px; --mdc-icon-size: 26px; }
  .summary .title { font-size: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .summary .state { font-size: 14px; font-weight: 500; }
  .mini { position: relative; flex: none; box-sizing: border-box; padding: 0; width: 56px; height: 56px; border-radius: 18px; overflow: hidden;
    background: var(--os-fill); display: flex; align-items: center; justify-content: center; color: var(--os-muted); --mdc-icon-size: 24px; }
  .mini .photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .mini.loading .photo { visibility: hidden; }
  .mini:not(.loading) ha-icon { display: none; }
  .mini .dot { position: absolute; right: 6px; top: 6px; width: 10px; height: 10px; box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.85); }
  .mini .dot.alert { background: var(--os-warning); }
  .mini.loading .dot { display: none; }
  .mini .count { position: absolute; left: 5px; bottom: 5px; min-width: 22px; height: 20px; box-sizing: border-box; padding: 0 6px;
    border-radius: 999px; background: rgba(30, 28, 25, 0.55); color: #fff; font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; }
  .mini .count:empty { display: none; }
`;

if (typeof customElements !== "undefined" && !customElements.get("origami-security")) {
  customElements.define("origami-security", OrigamiSecurity);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "origami-security", name: "Origami Security", description: "Alarm, cameras, doors, detectors and recent events" });
}
