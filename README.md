# Pharloom United Web Map

This repository hosts the VitePress site for the Pharloom United community map. The landing page renders the large in-world map with hoverable regions that link to the lore sections further down the page.

## Working on the map

1. Run `npm install` and `npm run dev` to start VitePress locally.
2. Open `http://localhost:5173` (default) and scroll to the map.
3. Use the **Upload map image** button above the map to preview a new background image. The chosen image is only stored in your browser; to publish it for everyone replace `docs/public/Pharloom.png` with the desired asset.
4. Expand **“Map calibration & data tools”** under the map to adjust hitboxes. Each region exposes editable percentage-based coordinates so you can fine-tune alignment while looking at the image.
5. Click **Download JSON** from the calibration panel to export your adjustments. Replace the array in `docs/.vitepress/theme/data/mapData.js` with the exported JSON to commit the new configuration.

The calibration drawer accepts imports as either the plain region array or an object shaped like `{ "regions": [...] }`. This makes it easy to share presets between collaborators.

## Deploying

The site is a standard VitePress project:

```bash
npm run build
npm run serve # optional preview
```

Host the generated `docs/.vitepress/dist` folder with any static host (GitHub Pages, Azure Static Web Apps, etc.).
