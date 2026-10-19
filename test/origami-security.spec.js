import { expect, test } from "@playwright/test";

const open = async (page, query) => {
  await page.goto(`/test/mock/index.html?${query}`);
  await page.evaluate(() => window.ready);
};
const card = (page, cls) => page.locator("origami-security").filter({ has: page.locator(`ha-card.${cls}`) });
const lastAction = (page) => page.evaluate(() => window.events.filter((e) => e.type === "hass-action").pop()?.detail.config.tap_action);

test("the summary shows the alarm, the summary line and the number of cameras", async ({ page }) => {
  await open(page, "fixture=summary");
  const summary = card(page, "summary");
  await expect(summary).toContainText("Alarm disarmed");
  await expect(summary).toContainText("Doors closed · gas clear");
  await expect(summary.locator(".mini .count")).toHaveText("5");
});

test("an open door turns the summary red", async ({ page }) => {
  await open(page, "fixture=summary&door=open");
  await expect(card(page, "summary").locator("ha-card")).toHaveAttribute("data-tone", "error");
});

test("tapping the summary opens the navigation path", async ({ page }) => {
  await open(page, "fixture=summary");
  await card(page, "summary").locator(".title").click();
  expect(await page.evaluate(() => location.hash)).toBe("#security");
});

test("the alarm shows its state and the periods it was armed today", async ({ page }) => {
  await open(page, "fixture=alarm");
  const alarm = card(page, "alarm");
  await expect(alarm).toContainText("Disarmed · link OK");
  await expect(alarm.locator(".seg.ok").first()).toBeAttached();
  await expect(alarm.locator(".track")).toHaveAttribute("title", /Armed: .*\(night\)/);
});

test("a triggered alarm is shown in red", async ({ page }) => {
  await open(page, "fixture=alarm&alarm=triggered");
  await expect(card(page, "alarm").locator("ha-card")).toHaveAttribute("data-tone", "error");
  await expect(card(page, "alarm")).toContainText("Triggered");
});

test("changing the alert mode asks for confirmation", async ({ page }) => {
  await open(page, "fixture=alerts");
  const alerts = card(page, "alerts");
  await expect(alerts.locator(".mode.active")).toContainText("Off");
  await alerts.locator(".mode", { hasText: "Home" }).click();
  const tap = await lastAction(page);
  expect(tap.perform_action).toBe("alarm_control_panel.alarm_arm_home");
  expect(tap.confirmation.text).toBe("Turn on the alerts in Home mode?");
});

test("tapping the current alert mode does nothing", async ({ page }) => {
  await open(page, "fixture=alerts");
  await card(page, "alerts").locator(".mode", { hasText: "Off" }).click();
  expect(await lastAction(page)).toBeUndefined();
});

test("turning the light and the siren on asks for confirmation", async ({ page }) => {
  await open(page, "fixture=camera");
  const camera = card(page, "camera");
  await expect(camera).toContainText("Street · live");
  await camera.locator(".btn.light").click();
  expect(await lastAction(page)).toMatchObject({ perform_action: "light.turn_on", confirmation: { text: "Turn on the light?" } });
  await camera.locator(".btn.siren").click();
  expect(await lastAction(page)).toMatchObject({ perform_action: "siren.turn_on", confirmation: { text: "Sound the siren?" } });
});

test("turning the siren off takes one tap", async ({ page }) => {
  await open(page, "fixture=camera&siren=on");
  await card(page, "camera").locator(".btn.siren").click();
  const tap = await lastAction(page);
  expect(tap.perform_action).toBe("siren.turn_off");
  expect(tap.confirmation).toBeUndefined();
});

test("snapshots load on screen and an offline camera shows as offline", async ({ page }) => {
  await open(page, "fixture=cameras");
  const cameras = card(page, "cameras");
  await expect(cameras.locator(".thumb").first().locator(".photo")).toHaveAttribute("src", /living\.svg\?token=demo&t=/);
  await expect(cameras.locator(".thumb", { hasText: "Hallway" })).toHaveClass(/off/);
  await expect(cameras).toContainText("5 cameras");
});

test("a camera can show the last image of an image entity, with its time", async ({ page }) => {
  await open(page, "fixture=outdoor");
  const entrance = card(page, "cameras").locator(".thumb", { hasText: "Entrance" });
  await expect(entrance.locator(".badge")).toContainText("Doorbell · ");
  await expect(entrance.locator(".photo")).toHaveAttribute("src", /entrance\.svg/);
});

test("an open door turns its row red", async ({ page }) => {
  await open(page, "fixture=rows&door=open");
  const row = card(page, "rows").locator(".row", { hasText: "Front door" });
  await expect(row).toHaveClass(/tint/);
  await expect(row).toContainText("Open · since");
  await expect(card(page, "rows").locator(".row", { hasText: "Garden gate" })).toContainText("Offline");
});

test("the log is in plain words, without the duplicates written after a restart", async ({ page }) => {
  await open(page, "fixture=events");
  const events = card(page, "events");
  await expect(events).toContainText("Front door opened");
  await expect(events).toContainText("Closed after 4 s");
  await expect(events).toContainText("Disarmed 1 s later");
  await expect(events.locator(".what", { hasText: "Doorbell rang" })).toHaveCount(1);
  await expect(events.locator(".what", { hasText: "Motion at the door" })).toHaveCount(1);
  await expect(events).not.toContainText("Camera alerts off");
});

test("the watch card lists offline devices and hides when there are none", async ({ page }) => {
  await open(page, "fixture=watch");
  await expect(card(page, "watch")).toContainText("Hallway camera");
  await expect(card(page, "watch").locator(".heading-count")).toHaveText("2");
  await open(page, "fixture=watch&watch=clear");
  await expect(page.locator("origami-security")).toBeHidden();
});

test("texts follow the language of Home Assistant", async ({ page }) => {
  await open(page, "fixture=events&lang=fr");
  await expect(card(page, "events")).toContainText("On a sonné");
  await open(page, "fixture=alarm&lang=fr");
  await expect(card(page, "alarm")).toContainText("Désarmée · liaison OK");
});

test("the log says when Home Assistant cannot read it", async ({ page }) => {
  await open(page, "fixture=events&error=Unauthorized");
  await expect(card(page, "events")).toContainText("Log unavailable.");
});
