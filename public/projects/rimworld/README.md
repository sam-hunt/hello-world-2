## Generating leaflet tile layers for Rimworld renders

Leaflet tiles can be cut using [gdal2tiles-leaflet](https://github.com/commenthol/gdal2tiles-leaflet).
e.g.
```bash
sudo apt install python3-gdal
python3 gdal2tiles.py -l -p raster -z 0-6 -w none ~/rimworld-fox-68473-5514-4-10-14.png ~/dev/hello-world-2/public/rimworld/repeaters/
```

After this we can use cwepb to recursively convert the pngs into webps:
```bash
apt install webp
find . -name '*.png' -type f -exec bash -c 'cwebp -q 80 "$0" -o "${0%.png}.webp"' {} \;
find . -type f -name '*.png' -delete
```
We can edit the output webp quality via the `-q` flag into the nested `cwebp` command.
I've opted to set highest quality at the highest zoom level 6, while using 80% for lower zoom levels
This is achievable by navigating into each subdirectory before running the `find` commands above and varying the cwebp -q argument e.g.
```bash
cd 6
find . -name '*.png' -type f -exec bash -c 'cwebp -q 100 "$0" -o "${0%.png}.webp"' {} \;
find . -type f -name '*.png' -delete
cd 5
find . -name '*.png' -type f -exec bash -c 'cwebp -q 80 "$0" -o "${0%.png}.webp"' {} \;
find . -type f -name '*.png' -delete
# ...
```
