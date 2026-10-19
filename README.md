<img alt="The summary of Origami Security in light and dark mode, with all doors closed and with the front door open" src="https://raw.githubusercontent.com/BaQs/origami_security/main/images/hero.png">

Origami Security shows the security of a home on a dashboard, in the style of [Origami](https://github.com/hazymorning/origami): the alarm and the periods it was armed today, camera alerts, a live camera with its light and siren, camera snapshots, doors, detectors, the recent events in plain words and the devices that went offline. Each layout is a card, so you can put them in a pop-up and a summary on the home view.

## Installation

[![Open your Home Assistant instance and open this repository inside HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=BaQs&repository=origami_security&category=plugin)

Download Origami Security in HACS. If HACS asks you to add the repository, select **Add**. HACS adds the card to the dashboard resources. You need Home Assistant 2026.9 or newer.

<details>
<summary><b>Manual installation</b></summary>

<br>

Download `origami-security.js` from the [latest release](https://github.com/BaQs/origami_security/releases/latest) into `config/www/` and add `/local/origami-security.js?v=0.4.0` as a JavaScript module in **Settings** > **Dashboards** > **Resources**. Change the version after each update, otherwise your browser keeps using the old file.

</details>

## Usage

```yaml
type: custom:origami-security
layout: summary
entity: alarm_control_panel.house
line: sensor.security_line
camera: camera.street
navigation_path: "#security"
```

The summary shows the state of the alarm, a line of your choice and a snapshot of a camera, and it turns red when the alarm is triggered or one of the `alerts` entities is on. Tapping it opens `navigation_path`, for example a [Bubble Card](https://github.com/Clooos/Bubble-Card) pop-up with the other layouts.

<img alt="A pop-up with the alarm, the camera alerts, the cameras, the doors, the gas detector and the recent events, in light and dark mode" src="https://raw.githubusercontent.com/BaQs/origami_security/main/images/popup.png">

<details>
<summary><b>Layouts</b></summary>

<br>

| Layout | Shows |
| --- | --- |
| `summary` | The alarm, a line of text and a camera snapshot, for the home view |
| `alarm` | The state of an alarm panel and a bar of the periods it was armed today |
| `alerts` | Three buttons that switch an alarm panel between off, home and away |
| `camera` | A live camera with chips for its state and motion, and buttons for a light and a siren |
| `cameras` | Camera snapshots in a grid |
| `rows` | One row per entity, tinted when its state has a color |
| `events` | The log since yesterday, in plain words |
| `watch` | The devices that are offline. The card hides itself when there are none. |

</details>

<details>
<summary><b>Pop-up example</b></summary>

<br>

The pop-up in the screenshot, without its section headings:

```yaml
type: vertical-stack
cards:
  - type: custom:bubble-card
    card_type: pop-up
    hash: "#security"
    name: Security
  - type: custom:origami-security
    layout: alarm
    entity: alarm_control_panel.house
    connectivity: binary_sensor.house_link
  - type: custom:origami-security
    layout: alerts
    entity: alarm_control_panel.camera_alerts
    name: Camera alerts
  - type: custom:origami-security
    layout: camera
    name: Street
    camera: camera.street
    light: light.street_light
    siren: siren.street_siren
    motion: binary_sensor.street_motion
  - type: custom:origami-security
    layout: cameras
    columns: 3
    title: Indoor
    cameras:
      - entity: camera.living_room
        name: Living room
      - entity: camera.kitchen
        name: Kitchen
  - type: custom:origami-security
    layout: rows
    rows:
      - entity: binary_sensor.front_door
        name: Front door
        icon: mdi:door
        states:
          "on": Open
          "off": Closed
        text: "{state} · since {since}"
        colors:
          "on": error
  - type: custom:origami-security
    layout: events
    entities:
      binary_sensor.front_door:
        kind: opening
        name: Front door
      alarm_control_panel.house:
        kind: alarm
      binary_sensor.entrance_motion:
        kind: motion
        text: Motion at the door
  - type: custom:origami-security
    layout: watch
    entities:
      - entity: camera.hallway
        name: Hallway camera
```

</details>

<details>
<summary><b>Options</b></summary>

<br>

| Layout | Option | Description |
| --- | --- | --- |
| all | `layout` | One of the layouts above |
| `summary` | `entity` | The alarm panel |
| | `line` | An entity whose state is the second line, such as a template sensor |
| | `alerts` | Entities that turn the card red when they are on, such as doors and detectors |
| | `camera`, `motion` | The camera of the snapshot and a motion sensor for the dot on it |
| | `count` | An entity whose state is shown on the snapshot, such as the number of cameras online |
| | `navigation_path` | Opened on tap. Without it, a tap opens the alarm panel. |
| `alarm` | `entity`, `name` | The alarm panel and its name |
| | `connectivity` | A binary sensor that is on while the alarm panel is connected |
| `alerts` | `entity`, `name`, `icon` | The alarm panel the buttons switch |
| | `modes` | Your own buttons, each with `state`, `name`, `icon`, `service` and `confirm` |
| `camera` | `camera`, `name`, `aspect` | The camera, its name and its aspect ratio, `16:9` by default |
| | `light`, `siren`, `motion` | A light and a siren for the buttons, and a motion sensor for the chip |
| `cameras` | `cameras` | A list with `entity`, `name`, and optionally `badge`, `motion`, `aspect` and `picture` |
| | `columns`, `aspect`, `title` | The grid, the aspect ratio of the snapshots, `16:10` by default, and a title |
| `rows` | `rows` | A list with `entity`, `name`, `icon`, `states`, `text`, `text_entity`, `colors`, `right` and `more_info` |
| `events` | `entities`, `max` | The entities of the log, described below, and the number of events, 10 by default |
| `watch` | `entities`, `title` | A list with `entity`, `name`, `icon`, and `bad` and `text` for states other than offline |

`picture` shows an image entity instead of the camera snapshot, with its time in the badge. It helps with a doorbell that has no snapshot but keeps an image of the last ring. In `rows`, `text` and `right` take `{state}`, `{since}` and `{attr.name}`, and `colors` maps a state to `error`, `warning`, `ok` or any CSS color.

</details>

<details>
<summary><b>Events</b></summary>

<br>

Each entity of the `events` layout has a `kind`:

| Kind | Event |
| --- | --- |
| `opening` | An opening, and how long it stayed open |
| `alarm` | Arming, disarming and triggering. Arming and disarming within a minute make one event. |
| `motion` | Motion, at most one event every two minutes |
| `gas` | Gas detected |
| `doorbell` | A ring, from a sensor that holds the time of the last event. `type_entity` holds the type of that event, and `match` is the text a ring contains, `ring` by default. |

`name`, `icon`, `text` and `detail` change the words of an event, `labels` maps the states of an alarm to `[text, icon, tone]`, and `details` maps them to a detail line.

</details>

<details>
<summary><b>How it works</b></summary>

<br>

Buttons send their actions the way Bubble Card does, so Home Assistant shows its own confirmation dialog. Switching the alerts and turning on the light or the siren ask for confirmation, and turning the light or the siren off does not. The live camera is a picture-entity card underneath the chips and buttons. Snapshots are signed images that refresh every 10 seconds, and only while they are on screen. The log is read from the Home Assistant logbook, which writes the same state again after a restart, and those repeats are left out. The texts follow the language of Home Assistant, in English or French.

</details>

<sub>The screenshots use the Origami theme with made-up data.</sub>

<sub>AI is used as a tool in this project.</sub>
