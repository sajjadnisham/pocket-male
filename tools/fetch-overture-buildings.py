"""Download building footprints around Malé and Hulhumalé from Overture Maps.

    python tools/fetch-overture-buildings.py

Overture's building theme combines OpenStreetMap with machine-traced footprints
(Microsoft, Google Open Buildings, Esri) and includes heights and floor counts
where known, under ODbL / CDLA-Permissive. build-city-data.js uses these where
OpenStreetMap has no building, instead of inventing filler blocks.

Writes tools/overture-buildings.json: [[levels or 0, height_dm or 0, source, lon,lat, lon,lat, ...], ...]
"""
import json, sys, urllib.request
from pathlib import Path
import duckdb

OUT = Path(__file__).resolve().parent / 'overture-buildings.json'
BBOX = dict(xmin=73.40, xmax=73.60, ymin=4.13, ymax=4.32)


def latest_release():
    with urllib.request.urlopen('https://stac.overturemaps.org/catalog.json', timeout=60) as r:
        cat = json.load(r)
    links = [l for l in cat.get('links', []) if l.get('rel') == 'child']
    latest = [l for l in links if l.get('latest')] or links
    return sorted(l['href'].rstrip('/').split('/')[-2] for l in latest)[-1]


def main():
    release = sys.argv[1] if len(sys.argv) > 1 else latest_release()
    print('Overture release', release, flush=True)
    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs; INSTALL spatial; LOAD spatial; SET s3_region='us-west-2';")
    rows = con.execute(f"""
      SELECT coalesce(num_floors, 0), coalesce(height, 0), sources[1].dataset, ST_AsText(geometry)
      FROM read_parquet('s3://overturemaps-us-west-2/release/{release}/theme=buildings/type=building/*', hive_partitioning=1)
      WHERE bbox.xmin BETWEEN {BBOX['xmin']} AND {BBOX['xmax']} AND bbox.ymin BETWEEN {BBOX['ymin']} AND {BBOX['ymax']}
    """).fetchall()
    out, src = [], {}
    for floors, height, source, wkt in rows:
        if not wkt.startswith('POLYGON'): continue
        ring = wkt[wkt.index('((') + 2: wkt.index(')')]
        coords = []
        for pair in ring.split(','):
            lon, lat = pair.strip().split(' ')[:2]
            coords += [round(float(lon), 7), round(float(lat), 7)]
        out.append([int(floors or 0), int(round(float(height or 0) * 10)), source or ''] + coords)
        src[source] = src.get(source, 0) + 1
    OUT.write_text(json.dumps({'release': release, 'license': 'ODbL / CDLA-Permissive-2.0 — © Overture Maps Foundation, OpenStreetMap contributors, Microsoft, Google, Esri', 'buildings': out}, separators=(',', ':')), encoding='utf-8')
    print(len(out), 'buildings ·', src, '· with floors', sum(1 for b in out if b[0]), '· with height', sum(1 for b in out if b[1]))


if __name__ == '__main__':
    main()
