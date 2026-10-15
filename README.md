# AFM Warsaw — website preview

A **static snapshot** of the AFM Warsaw Christian Centre website and its admin panel,
for sharing a live link. Generated from the real project; not hand-written.

## Publish it on GitHub Pages

1. Create a new, empty repository on GitHub (public).
2. Upload everything in this folder to it — including the hidden `.nojekyll` file.
   (On github.com: **Add file → Upload files**, then drag the contents in.)
3. In the repository: **Settings → Pages**.
4. Under **Source**, choose **Deploy from a branch**; pick branch `main` and folder `/ (root)`. Save.
5. Wait a minute, then open: `https://<your-username>.github.io/<repository-name>/`

With git instead:

```bash
cd preview-site
git init && git add -A && git commit -m "AFM Warsaw website preview"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

## What is here

- `index.html` — the home page. English at the root, Polish under `pl/`.
- `admin/` — the admin panel screens, as static snapshots.
- `404.html` — GitHub Pages serves this automatically for unknown URLs.

## What works, and what does not

Working: every page, both languages, light/dark mode, the photo gallery and its lightbox,
tabs, the mobile menu, and all the layout and design.

Not working, because GitHub Pages serves static files only — no PHP and no database:

- **Forms do not submit.** They show a note explaining this instead.
- **The admin panel is read-only.** Nothing saves; it is a snapshot, not a working login.
- **Content cannot change.** On the real site, staff edit everything from the admin panel.

All content here is **sample content** for demonstration, not the church's real information.

## Re-generating

From the main project, with Apache and MySQL running:

```bash
php tools/seed-demo.php      # builds the demo database
php tools/export-static.php  # rewrites this folder
```

The live site and its database are not touched by either script.