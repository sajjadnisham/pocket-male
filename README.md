# Pocket Malé

Find everything in Malé city.

A situation-based Dhivehi phrasebook for Malé, Maldives, with an offline vector
map of Malé and Hulhumalé and Street View panoramas of the places the phrases
belong to.

Static site. No build step, no dependencies, no API keys.

## Contents

| File | What it is |
|---|---|
| `index.html` | The app. Self-contained: markup, CSS, JS, situation artwork and map geometry all inline. |
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

## Known limitations

- **The Dhivehi has not been reviewed by a native speaker.** Spelling, fili
  placement and the naturalness of longer sentences all need checking before
  this is used by anyone actually learning the language.
- "Listen" uses the Web Speech API. Effectively no device ships a Dhivehi
  (`dv-MV`) voice, so it reports that rather than reading Thaana aloud in the
  wrong language. Recorded audio is the real fix.
- Villimalé's coastline is absent from the baked geometry, so it does not appear
  on the overview map.
