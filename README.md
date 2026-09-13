# Pocket Malé

Find everything in Malé city.

A situation-based Dhivehi phrasebook for Malé, Maldives, with an offline vector
map of Malé and Hulhumalé and Street View panoramas of the places the phrases
belong to.

Static site. No build step, no dependencies, no API keys.

## Contents

| File | What it is |
|---|---|
| `index.html` | The phrasebook app: situations, search, saved lines, map, Street View, ChatGPT. |
| `world.html` | **Pocket Malé World** — a 3D night-time Local Market you can walk through and talk in. |
| `data.js` | Situations, phrases and Street View locations, shared by both pages. |
| `about.html` | The marketing landing page. |
| `manifest.json`, `icon.svg` | Web app manifest, so it installs to a phone home screen. |

## Run locally

    python -m http.server 8123

Then open <http://localhost:8123>.

## The map

The map is **not** fetched at runtime. Coastline and road geometry came from the
OpenStreetMap [Overpass API](https://overpass-api.de/), projected
equirectangular about 4.21°N, simplified with Ramer–Douglas–Peucker and baked
into `index.html` as SVG path data (~6 KB). It therefore renders with no network
and under any Content-Security-Policy.

1 map unit = 10.803 m.

Map data © OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright).

## The panoramas

Malé has no continuous Street View car coverage. The six locations are
user-contributed 360° photospheres, each pinned by its own panorama ID rather
than letting a lat/lng snap to whatever is nearest. They load in an iframe from
Google's keyless `maps/embed` endpoint, so no API key is needed — but a host
whose CSP blocks `frame-src` will block them. Each panel carries a direct
"Open in Google Maps" link for that case.

Imagery © Google and its contributors.

## Pocket Malé World (3D)

`world.html` builds the harbour-road Local Market procedurally in three.js
(r128, loaded from cdnjs): fish and fruit stalls, a tea shop, a corner shop, a
pharmacy, a taxi stand, the ferry terminal, a mosque and dhonis on the water.

- **Walk:** left thumb on phones, WASD on a keyboard. **Look:** drag. **Talk:** tap a stall.
- **Learn words:** tap the fish, coconuts, bananas, tea, boats, the mosque.
- **Guided mode** runs five practice goals; **Free mode** lets you talk to anyone.
- **Places** jumps to any stall; every stop links to its real Street View panorama.
- Progress (stars, words, goal) is kept in `localStorage`.
- Speaking is not supported: no browser recognises Dhivehi speech, so answers are tapped.

## ChatGPT inside a situation

Each situation has a search field that filters its own lines instantly, and an
**Ask ChatGPT** button for anything that isn't there.

This is a static site with no server, so there is **no shared API key** — one
committed here would be readable by anyone. Each user adds their own OpenAI key
in *Settings*; it is stored in that browser's `localStorage` and sent only to
`api.openai.com`. Model defaults to `gpt-4o-mini` and can be changed.

Answers are labelled **AI · unverified** and can be saved separately from the
curated phrases.

One quirk worth knowing if you debug this: OpenAI's error responses on
`/v1/chat/completions` carry no CORS header, so in a browser a rejected key
looks like a network failure. The app probes `/v1/models` (which does send the
header) to report the real reason.

## Known limitations

- **The Dhivehi has not been reviewed by a native speaker.** Spelling, fili
  placement and the naturalness of longer sentences all need checking before
  this is used by anyone actually learning the language.
- "Listen" uses the Web Speech API. Effectively no device ships a Dhivehi
  (`dv-MV`) voice, so it reports that rather than reading Thaana aloud in the
  wrong language. Recorded audio is the real fix.
- ChatGPT's Dhivehi is unreviewed too, and is labelled as such in the app.
- Villimalé's coastline is absent from the baked geometry, so it does not appear
  on the overview map.
