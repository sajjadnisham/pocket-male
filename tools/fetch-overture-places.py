"""Download businesses around Malé and Hulhumalé from Overture Maps Places.

    python tools/fetch-overture-places.py

Overture Maps (https://overturemaps.org) publishes an open places dataset built
from Meta and Microsoft business listings, among others, under the Community
Data License Agreement – Permissive 2.0, which allows reuse with attribution.
It is the lawful route to the business data that exists on Facebook pages —
scraping Facebook or Instagram directly isn't allowed by their terms.

Writes tools/overture-places.json, which build-city-data.js merges with
OpenStreetMap (OSM wins where both list the same place).
"""
import json, sys, urllib.request
from pathlib import Path
import duckdb

OUT = Path(__file__).resolve().parent / 'overture-places.json'
BBOX = dict(xmin=73.40, xmax=73.60, ymin=4.13, ymax=4.32)


def latest_release():
    with urllib.request.urlopen('https://stac.overturemaps.org/catalog.json', timeout=60) as r:
        cat = json.load(r)
    links = [l for l in cat.get('links', []) if l.get('rel') == 'child']
    latest = [l for l in links if l.get('latest')] or links
    rel = [l['href'].rstrip('/').split('/')[-2] for l in latest]
    if not rel:
        raise SystemExit('could not read the Overture release list')
    return sorted(rel)[-1]


def main():
    release = sys.argv[1] if len(sys.argv) > 1 else latest_release()
    print('Overture release', release, flush=True)
    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs; INSTALL spatial; LOAD spatial; SET s3_region='us-west-2';")
    q = f"""
      SELECT id, names.primary AS name, categories.primary AS category, categories.alternate AS alternate,
             confidence, ST_X(geometry) AS lon, ST_Y(geometry) AS lat,
             addresses[1].freeform AS address, websites[1] AS website, socials[1] AS social,
             sources[1].dataset AS source
      FROM read_parquet('s3://overturemaps-us-west-2/release/{release}/theme=places/type=place/*', hive_partitioning=1)
      WHERE bbox.xmin BETWEEN {BBOX['xmin']} AND {BBOX['xmax']} AND bbox.ymin BETWEEN {BBOX['ymin']} AND {BBOX['ymax']}
        AND confidence >= 0.5
    """
    rows = con.execute(q).fetchall()
    cols = ['id', 'name', 'category', 'alternate', 'confidence', 'lon', 'lat', 'address', 'website', 'social', 'source']
    places = [dict(zip(cols, r)) for r in rows]
    for p in places:
        p['confidence'] = round(float(p['confidence']), 3)
        p['lon'] = round(p['lon'], 7); p['lat'] = round(p['lat'], 7)
        p['alternate'] = list(p['alternate'] or [])
    OUT.write_text(json.dumps({'release': release, 'license': 'CDLA-Permissive-2.0 — © Overture Maps Foundation and contributors',
                               'bbox': BBOX, 'places': places}, ensure_ascii=False, indent=0), encoding='utf-8')
    cats = {}
    for p in places: cats[p['category']] = cats.get(p['category'], 0) + 1
    print(len(places), 'places written to', OUT.name)
    print(sorted(cats.items(), key=lambda x: -x[1])[:40])


if __name__ == '__main__':
    main()
