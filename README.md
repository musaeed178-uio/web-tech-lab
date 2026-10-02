# 🎓 Web Technologies Lab

*Or: how I learned to stop worrying and love the `<div>`.*

**Muhammad Umar Saeed · FA24-BCS-225 · CUI Wah**

Three labs. One repo. Zero frameworks, zero build steps, zero excuses — just HTML,
CSS and JavaScript doing what they've always done, except this time on purpose.

## Contents

| # | Folder | What it is | Live |
|---|--------|-----------|------|
| 01 | [`Lab 1/`](Lab%201/) | Lost & Found portal — report, browse, claim, impersonate an admin | [webtech-lab1-eosin.vercel.app](https://webtech-lab1-eosin.vercel.app) |
| 02 | [`Lab 2/`](Lab%202/) | Twelve HTML/CSS activities (twelve labours, but with more CSS), indexed by its own [landing page](Lab%202/index.html) | [webtech-lab2.vercel.app](https://webtech-lab2.vercel.app) |
| 03 | [`Lab 3/`](Lab%203/) | Food Corner — a restaurant site with a CSS checklist hiding in plain sight | [webtech-lab3.vercel.app](https://webtech-lab3.vercel.app) |

The one ring that binds them: **https://musaeed178-uio.github.io/web-tech-lab/**

## Run it. Right now. I dare you.

```bash
git clone https://github.com/musaeed178-uio/web-tech-lab.git
cd web-tech-lab
```

Open `index.html` in a browser. That's the entire setup — there is no step 3.
If you came here expecting `npm install` to break, you came to the wrong repo.

> Lab 1 stores its data in `localStorage`, so a fresh clone starts empty.
> That's not a bug; that's your browser being honest with you.

## Deploy your own

Fork → push → pick your poison:

- **Vercel** — import the repo, point a project at a lab folder, ship it.
  Every project here is already wired to its own root directory, so deploys
  only touch their own lab. Pushing to GitHub updates all of them automatically —
  because manual deploys are a hobby, not a workflow.
- **GitHub Pages** — Settings → Pages → deploy from `main`, folder `/(root)`.
  The hub goes live. `.nojekyll` is already included, like a seatbelt.

## The fine print

Licensed under [AGPL-3.0](LICENSE): fork it, remix it, ship it — just keep the
license attached. And no, you cannot sue me over the pizza prices.

---

*P.S. — There are no easter eggs in this README.*
[Promise.](https://www.youtube.com/watch?v=dQw4w9WgXcQ)
