// A made-up home for the tests and the README images: an alarm that arms itself at night, camera alerts, a street
// camera, five snapshots, doors, a gas detector and a log that has the duplicates Home Assistant writes after a restart.
import { createHass, mount } from "./mock-ha.js";

const MIN = 60000;
const now = Date.now();
const ago = (minutes) => now - minutes * MIN;
const midnight = (days = 0) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days); return d.getTime(); };
const local = (t) => {
  const d = new Date(t), p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
const img = (name) => `/test/mock/img/${name}.svg?token=demo`;

// The alarm arms itself at night, every night, and was armed and disarmed within a second an hour ago
const alarm = [];
for (let day = -3; day <= 0; day++) {
  alarm.push({ s: "armed_night", t: midnight(day) + 1000 }, { s: "disarmed", t: midnight(day) + 405 * MIN });
}
alarm.push({ s: "unavailable", t: ago(1200) }, { s: "disarmed", t: ago(1199) });
alarm.push({ s: "armed_night", t: ago(60) }, { s: "disarmed", t: ago(60) + 1000 });
const alarmLog = alarm.filter((e) => e.t <= now).sort((a, b) => a.t - b.t);

const doorbell = ago(20 * 60);
const log = [
  ...alarmLog.map((e) => ({ entity_id: "alarm_control_panel.house", state: e.s, when: e.t / 1000 })),
  { entity_id: "alarm_control_panel.camera_alerts", state: "disarmed", when: ago(3000) / 1000 },
  { entity_id: "alarm_control_panel.camera_alerts", state: "disarmed", when: ago(300) / 1000 },
  { entity_id: "binary_sensor.front_door", state: "on", when: ago(35) / 1000 },
  { entity_id: "binary_sensor.front_door", state: "off", when: (ago(35) + 4000) / 1000 },
  { entity_id: "binary_sensor.front_door", state: "on", when: ago(190) / 1000 },
  { entity_id: "binary_sensor.front_door", state: "off", when: (ago(190) + 55000) / 1000 },
  { entity_id: "binary_sensor.entrance_motion", state: "on", when: ago(230) / 1000 },
  { entity_id: "binary_sensor.entrance_motion", state: "off", when: ago(229.5) / 1000 },
  { entity_id: "binary_sensor.entrance_motion", state: "on", when: ago(229) / 1000 },
  { entity_id: "sensor.doorbell_last_event_type", state: "Doorbell ring", when: ago(3000) / 1000 },
  { entity_id: "sensor.doorbell_last_event", state: local(doorbell), when: (doorbell + 20000) / 1000 },
  { entity_id: "sensor.doorbell_last_event", state: local(doorbell), when: ago(600) / 1000 },
].sort((a, b) => a.when - b.when);

const history = () => {
  const before = alarmLog.filter((e) => e.t < midnight()).pop();
  const today = alarmLog.filter((e) => e.t >= midnight());
  return { "alarm_control_panel.house": [{ s: before?.s ?? "disarmed", lu: midnight() / 1000 }, ...today.map((e) => ({ s: e.s, lu: e.t / 1000 }))] };
};

const states = (params) => ({
  "alarm_control_panel.house": { state: params.get("alarm") ?? "disarmed", last_changed: new Date(ago(59)).toISOString() },
  "binary_sensor.house_link": "on",
  "alarm_control_panel.camera_alerts": "disarmed",
  "camera.street": { state: "idle", attributes: { entity_picture: img("street") } },
  "light.street_light": params.get("light") ?? "off",
  "siren.street_siren": params.get("siren") ?? "off",
  "binary_sensor.street_motion": "off",
  "camera.entrance": { state: "idle", attributes: { entity_picture: img("entrance") } },
  "image.entrance_last_ring": { state: new Date(doorbell).toISOString(), attributes: { entity_picture: img("entrance") } },
  "camera.garden": { state: "idle", attributes: { entity_picture: img("garden") } },
  "binary_sensor.garden_motion": params.get("motion") ?? "off",
  "camera.living_room": { state: "idle", attributes: { entity_picture: img("living") } },
  "camera.kitchen": { state: "idle", attributes: { entity_picture: img("kitchen") } },
  "camera.playroom": { state: "idle", attributes: { entity_picture: img("playroom") } },
  "camera.office": { state: "idle", attributes: { entity_picture: img("office") } },
  "camera.hallway": params.get("watch") === "clear" ? { state: "idle", attributes: { entity_picture: img("living") } } : "unavailable",
  "binary_sensor.front_door": { state: params.get("door") === "open" ? "on" : "off", last_changed: new Date(ago(35)).toISOString() },
  "binary_sensor.garage_door": { state: "off", last_changed: new Date(ago(700)).toISOString() },
  "binary_sensor.garden_gate": params.get("watch") === "clear" ? "off" : "unavailable",
  "binary_sensor.gas_detector": "off",
  "binary_sensor.entrance_motion": "off",
  "sensor.security_line": params.get("door") === "open" ? "Front door open · gas clear" : "Doors closed · gas clear",
  "sensor.cameras_online": "5",
  "sensor.doorbell_last_event": local(doorbell),
  "sensor.doorbell_last_event_type": "Doorbell ring",
});

const CARDS = {
  summary: { layout: "summary", entity: "alarm_control_panel.house", line: "sensor.security_line", camera: "camera.street",
             motion: "binary_sensor.street_motion", count: "sensor.cameras_online", navigation_path: "#security",
             alerts: ["binary_sensor.front_door", "binary_sensor.garage_door", "binary_sensor.gas_detector"] },
  alarm: { layout: "alarm", entity: "alarm_control_panel.house", connectivity: "binary_sensor.house_link" },
  alerts: { layout: "alerts", entity: "alarm_control_panel.camera_alerts", name: "Camera alerts" },
  camera: { layout: "camera", name: "Street", camera: "camera.street", light: "light.street_light", siren: "siren.street_siren",
            motion: "binary_sensor.street_motion" },
  outdoor: { layout: "cameras", columns: 2, cameras: [
    { entity: "camera.entrance", name: "Entrance", badge: "Doorbell", picture: "image.entrance_last_ring" },
    { entity: "camera.garden", name: "Garden", motion: "binary_sensor.garden_motion" }] },
  cameras: { layout: "cameras", columns: 3, aspect: "16:11", title: "Indoor", cameras: [
    { entity: "camera.living_room", name: "Living room" }, { entity: "camera.kitchen", name: "Kitchen" },
    { entity: "camera.playroom", name: "Playroom" }, { entity: "camera.office", name: "Office" },
    { entity: "camera.hallway", name: "Hallway" }] },
  rows: { layout: "rows", rows: [
    { entity: "binary_sensor.front_door", name: "Front door", icon: "mdi:door", states: { on: "Open", off: "Closed" },
      text: "{state} · since {since}", colors: { on: "error" } },
    { entity: "binary_sensor.garage_door", name: "Garage door", icon: "mdi:garage-variant", states: { on: "Open", off: "Closed" },
      text: "{state} · since {since}", colors: { on: "error" } },
    { entity: "binary_sensor.garden_gate", name: "Garden gate", icon: "mdi:gate", states: { on: "Open", off: "Closed" }, colors: { on: "error" } }] },
  gas: { layout: "rows", rows: [{ entity: "binary_sensor.gas_detector", name: "Gas", icon: "mdi:fire",
    states: { on: "Gas detected", off: "Nothing to report" }, colors: { on: "error" } }] },
  events: { layout: "events", max: 10, entities: {
    "binary_sensor.front_door": { kind: "opening", name: "Front door", icon: "mdi:door" },
    "alarm_control_panel.house": { kind: "alarm", name: "House alarm", details: { armed_night: "Armed on schedule" } },
    "alarm_control_panel.camera_alerts": { kind: "alarm", name: "Camera alerts", labels: {
      disarmed: ["Camera alerts off", "mdi:bell-off-outline", ""], armed_home: ["Camera alerts: Home", "mdi:bell-outline", "ok"] } },
    "binary_sensor.entrance_motion": { kind: "motion", text: "Motion at the door", detail: "Entrance camera" },
    "sensor.doorbell_last_event": { kind: "doorbell", type_entity: "sensor.doorbell_last_event_type", detail: "Entrance camera" },
    "binary_sensor.gas_detector": { kind: "gas", name: "Gas detector" } } },
  watch: { layout: "watch", entities: [
    { entity: "camera.hallway", name: "Hallway camera", icon: "mdi:video-off-outline" },
    { entity: "binary_sensor.garden_gate", name: "Garden gate sensor", icon: "mdi:link-variant-off" },
    { entity: "binary_sensor.house_link", name: "Alarm link", icon: "mdi:lan-disconnect", bad: ["off", "unavailable"], text: "down" }] },
};

const add = (key, hass, column) => mount("origami-security", { type: "custom:origami-security", ...CARDS[key] }, hass, column);

// A heading like the section headers of the Origami dashboard
const heading = (column, title, right = "") => {
  const el = document.createElement("div");
  el.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 12px 4px 0";
  el.innerHTML = `<span style="font-size: 21px; font-weight: 700">${title}</span><span style="font-size: 16px; font-weight: 700; color: var(--secondary-text-color)">${right}</span>`;
  column.append(el);
};

export async function show(name, params, column) {
  const hass = createHass({ states: states(params), language: params.get("lang") ?? "en", ws: {
    "history/history_during_period": history,
    "logbook/get_events": () => log,
  } });
  if (params.get("error")) hass.callWS = () => Promise.reject(new Error(params.get("error")));
  // The cards in a pop-up sheet like the Bubble Card pop-ups of the Origami dashboard
  if (name === "popup") {
    column.style.background = "color-mix(in srgb, var(--primary-background-color) 55%, #8a8780)";
    column.style.paddingTop = "48px";
    const sheet = document.createElement("div");
    sheet.style.cssText = "background: var(--primary-background-color); border-radius: 32px 32px 0 0; padding: 22px 16px 24px;"
      + "margin: 0 -16px -16px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.12)";
    sheet.innerHTML = `<div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px 4px">
      <span style="font-size: 28px; font-weight: 700">Security</span><ha-icon icon="mdi:close" style="--mdc-icon-size: 26px; opacity: 0.6"></ha-icon></div>`;
    column.append(sheet);
    await add("alarm", hass, sheet);
    await add("alerts", hass, sheet);
    heading(sheet, "Cameras", "5 of 6 online");
    await add("camera", hass, sheet);
    await add("outdoor", hass, sheet);
    await add("cameras", hass, sheet);
    heading(sheet, "Doors", "2 closed · 1 offline");
    await add("rows", hass, sheet);
    heading(sheet, "Detectors", "Clear");
    await add("gas", hass, sheet);
    heading(sheet, "Recent events");
    return add("events", hass, sheet);
  }
  if (name === "home") {
    heading(column, "Security");
    await add("summary", hass, column);
    const open = createHass({ states: states(new URLSearchParams("door=open")), language: params.get("lang") ?? "en" });
    return add("summary", open, column);
  }
  return add(name === "default" ? "summary" : name, hass, column);
}
