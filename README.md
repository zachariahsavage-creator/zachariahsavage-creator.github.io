# Zach Savage Photography

Static site for [www.zachsavagephotography.ca](https://www.zachsavagephotography.ca/) —
no build step, no dependencies. Deploys as-is from the repository root.

## Layout

```
index.html              Home (hero flow, bio, contact section)
full-gallery.html       Gallery page
home.html               Legacy URL → redirects to /
profile.html            Legacy URL → redirects to /
contact.html            Legacy URL → redirects to /#contact-heading
vercel.json             Redirects, cache and security headers
CNAME                   Custom domain
assets/
  css/styles.css
  js/onepage.js         Home flow, gallery grid, lightbox, contact form
  js/gallery-menu.js    Header pill menu
  data/                 full-gallery-aspects.json (source aspect ratios)
  images/
    site/               Backdrops and portrait
    shows/<show-slug>/  One folder per show, files named <show-slug>-NN.webp
```

## Working with images

Throughout `assets/js/onepage.js`, a photo is referred to by its **bare filename**
(`mico-hard-luck-01.webp`). That string is the identifier: it keys the aspect-ratio map
(`FULL_GALLERY_PATH_ASPECTS`), the alt-text map (`photoAltTextByPath`), gallery membership,
and the `data-asset-path` attributes in the HTML.

`getAssetUrl()` is the only place a filename becomes a URL. It derives the folder from the
show slug the filename starts with, falling back to `assets/images/site/`. To add a show:

1. Create `assets/images/shows/<slug>/` and add `<slug>-01.webp`, `<slug>-02.webp`, …
2. Add `<slug>` to `SHOW_IMAGE_FOLDERS` in `assets/js/onepage.js`.
3. Register the filenames in the gallery source list, `FULL_GALLERY_PATH_ASPECTS`, and the
   section title map.

Nothing else needs the directory path, so the folder layout can change without touching
those maps.

## Local preview

Serve from the repository root so `/assets/...` resolves:

```sh
python3 -m http.server 8000
```

## Hosting notes

`vercel.json` handles everything from the repo — there is no dashboard configuration to
match. The three legacy `.html` stubs are kept alongside the `vercel.json` redirects so
those URLs also work on hosts that ignore `vercel.json` (e.g. GitHub Pages, which this
repo previously used); on Vercel the edge redirect runs first and the stubs are never served.
