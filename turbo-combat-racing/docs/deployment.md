# Deployment

The game is a static site: `index.html` at the root plus `css/`, `js/` and `assets/`. Any static host works.

## GitHub Pages

1. Push the folder to a repository (for example `piyushsingh114/turbo-combat-racing`).
2. Repository Settings > Pages > Source: `main` branch, `/ (root)`.
3. The game is live at `https://piyushsingh114.github.io/turbo-combat-racing/`.

## Netlify

- Drag and drop the project folder onto https://app.netlify.com/drop, or
- Connect the GitHub repository. Build command: leave empty. Publish directory: `.`

## itch.io

1. Zip the **contents** of the folder so `index.html` sits at the top level of the zip (not inside a subfolder).
2. On itch.io create a new project, set Kind of project to **HTML**, upload the zip and tick "This file will be played in the browser".
3. Set the viewport to 1000 x 800 or enable the fullscreen button.

## Notes

- All paths are relative, so the game works under a sub-path (as on GitHub Pages).
- No external requests are made, so it also works offline.
