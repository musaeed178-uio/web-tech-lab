# Web Technologies Lab

**Muhammad Umar Saeed · FA24-BCS-225 · CUI Wah**

Lab assignments for the Web Technologies course.

## Contents

| # | Folder | What it is | Live |
|---|--------|-----------|------|
| 01 | [`Lab 1/`](Lab%201/) | Lost & Found portal — report items, browse them, claim them, pretend to be an admin | [webtech-lab1-eosin.vercel.app](https://webtech-lab1-eosin.vercel.app) |
| 02 | [`Lab 2/`](Lab%202/) | Twelve HTML/CSS activities, all indexed on one [landing page](Lab%202/index.html) | [webtech-lab2.vercel.app](https://webtech-lab2.vercel.app) |
| 03 | [`Lab 3/`](Lab%203/) | Food Corner — a restaurant page with CSS demos hidden in it | [webtech-lab3.vercel.app](https://webtech-lab3.vercel.app) |

One Homepage to rule them all: **https://musaeed178-uio.github.io/web-tech-lab/**

## Running it locally

```bash
git clone https://github.com/musaeed178-uio/web-tech-lab.git
```

Open `index.html` in a browser and that's it — no `npm install`, no config,
no build step. Lab 1 stores its data in `localStorage`, so a fresh clone starts
with an empty item list; that's the app working as intended, not a bug.

## Deploying it yourself

Fork the repo, then pick your host:

- **Vercel** — import the repo and point a project at a lab folder. Every lab
  here has its own root directory configured, so pushing to GitHub updates all
  live deployments automatically. No clicking "redeploy" at 2 AM.
- **GitHub Pages** — Settings → Pages → deploy from `main`, folder `/(root)`.
  The hub goes live. `.nojekyll` is already in the repo.

## License

[AGPL-3.0](LICENSE) — fork it, remix it, experiment with it. Keep the license
file attached and everyone stays happy.

---

*This README contains no easter eggs.*
[None at all.](https://www.youtube.com/watch?v=dQw4w9WgXcQ)
