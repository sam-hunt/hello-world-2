# hello-world-2
A small introductory static site hosted up at [samhunt.dev](https://samhunt.dev)
Replaces an older template-based site built with Hugo

Hosts a number of toy projects/pages:
1. A pure javascript path finder over a css grid, working up to A* (why!)
2. A slice of covers from my book collection for people interested in borrowing
2. A leaflet display of Rimworld colony renders


## Generating leaflet tile layers for Rimworld renders

Leaflet tiles can be cut using [gdal2tiles-leaflet](https://github.com/commenthol/gdal2tiles-leaflet).
e.g.
```bash
sudo apt install python3-gdal
python3 gdal2tiles.py -l -p raster -z 0-6 -w none rimworld-fox-68473-5514-4-10-14.png ../hello-world-2/public/rimworld/repeaters/
```

After this we can use cwepb (`apt install webp`) to recursively convert the pngs into webps:
```bash
find . -name '*.png' -type f -exec bash -c 'cwebp -q 80 "$0" -o "${0%.png}.webp"' {} \;
find . -type f -name '*.png' -delete
```
We can edit the output webp quality via the `-q` flag into the nested `cwebp` command.
I've opted to set highest quality at the highest zoom level 6, while using 80% for lower zoom levels